import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Helper to create Supabase server client
async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

// GET /api/workspaces - list workspaces for current user
export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client to bypass RLS — user may be a member but not owner
    const { createClient } = await import("@supabase/supabase-js");
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get workspace IDs where user is a member (any role)
    const { data: memberships } = await adminSupabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id);

    const memberWorkspaceIds = (memberships || []).map((m: any) => m.workspace_id);

    // Fetch those workspaces
    let workspaces: any[] = [];
    let error: any = null;
    if (memberWorkspaceIds.length > 0) {
      const result = await adminSupabase
        .from("workspaces")
        .select(`
          id,
          name,
          created_at,
          owner_id,
          workspace_members (
            user_id
          )
        `)
        .in("id", memberWorkspaceIds)
        .order("created_at", { ascending: true });
      workspaces = result.data || [];
      error = result.error;
    }

    // Fetch personal contract count
    const { count: personalCount } = await adminSupabase
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("workspace_id", null);

    if (error) {
      console.error("Workspaces query error:", error);
      // Return default personal workspace if table doesn't exist yet
      return NextResponse.json([
        {
          id: "personal",
          name: "Personal Space",
          plan: "free",
          memberCount: 1,
          contractCount: personalCount || 0,
          isOwner: true,
        },
      ]);
    }

    // Get contract counts per workspace
    const workspaceIds = workspaces?.map((w: any) => w.id) || [];
    
    const contractCounts: Record<string, number> = {};
    if (workspaceIds.length > 0) {
      const { data: contracts } = await adminSupabase
        .from("contracts")
        .select("workspace_id")
        .in("workspace_id", workspaceIds);
      
      (contracts || []).forEach((c: any) => {
        contractCounts[c.workspace_id] = (contractCounts[c.workspace_id] || 0) + 1;
      });
    }

    const formatted = (workspaces || []).map((w: any) => ({
      id: w.id,
      name: w.name,
      plan: "free",
      memberCount: (w.workspace_members || []).length,
      contractCount: contractCounts[w.id] || 0,
      isOwner: w.owner_id === user.id,
    }));

    // Prepend Personal Space
    return NextResponse.json([
      {
        id: "personal",
        name: "Personal Space",
        plan: "free",
        memberCount: 1,
        contractCount: personalCount || 0,
        isOwner: true,
      },
      ...formatted
    ]);
  } catch (error: any) {
    console.error("Workspaces GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/workspaces - create a new workspace
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
    }

    // Create workspace with owner_id for RLS policy
    const { data: workspace, error: createError } = await supabase
      .from("workspaces")
      .insert({ 
        name: name.trim(),
        owner_id: user.id  // Required by RLS policy
      })
      .select()
      .single();

    if (createError) {
      console.error("Create workspace error:", createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Add owner as member (role column added after migrations run)
    await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner',
    });

    return NextResponse.json({
      id: workspace.id,
      name: workspace.name,
      plan: workspace.plan,
      memberCount: 1,
      contractCount: 0,
      isOwner: true,
    });
  } catch (error: any) {
    console.error("Workspaces POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
