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

    // Get workspaces where user is owner or member
    const { data: workspaces, error } = await supabase
      .from("workspaces")
      .select(`
        id,
        name,
        plan,
        created_at,
        workspace_members (
          user_id,
          role
        )
      `)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Workspaces query error:", error);
      // Return default personal workspace if table doesn't exist yet
      return NextResponse.json([
        {
          id: "personal",
          name: "Personal",
          plan: "free",
          memberCount: 1,
          contractCount: 0,
          isOwner: true,
        },
      ]);
    }

    // Get contract counts per workspace
    const workspaceIds = workspaces?.map((w: any) => w.id) || [];
    
    // Get contract counts
    const contractCounts: Record<string, number> = {};
    if (workspaceIds.length > 0) {
      const { data: contracts } = await supabase
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
      plan: w.plan || "free",
      memberCount: (w.workspace_members || []).length,
      contractCount: contractCounts[w.id] || 0,
      isOwner: (w.workspace_members || []).some(
        (m: any) => m.user_id === user.id && m.role === "owner"
      ),
    }));

    return NextResponse.json(formatted);
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

    // Create workspace
    const { data: workspace, error: createError } = await supabase
      .from("workspaces")
      .insert({ name: name.trim(), owner_id: user.id, plan: "free" })
      .select()
      .single();

    if (createError) {
      console.error("Create workspace error:", createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Add owner as member
    await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
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
