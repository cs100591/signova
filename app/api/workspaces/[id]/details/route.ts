import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is a member of this workspace
    const { data: membership, error: memError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .single();

    if (memError || !membership) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    // 1. Fetch Workspace Details
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", id)
      .single();

    // 2. Fetch Members with Profiles
    const { data: membersData } = await supabase
      .from("workspace_members")
      .select(`
        id,
        user_id,
        role,
        joined_at,
        profiles (
          full_name,
          email
        )
      `)
      .eq("workspace_id", id);
      
    const members = (membersData || []).map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      name: m.profiles?.full_name || 'Unknown User',
      email: m.profiles?.email || 'Unknown Email',
    }));

    // 3. Fetch Pending Invitations
    const { data: invitations } = await supabase
      .from("workspace_invitations")
      .select("*")
      .eq("workspace_id", id)
      .is("accepted_at", null);

    // 4. Fetch Contracts
    const { data: contracts } = await supabase
      .from("contracts")
      .select("id, name, type, created_at, user_id, profiles(full_name)")
      .eq("workspace_id", id)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      workspace,
      userRole: membership.role,
      members,
      invitations: invitations || [],
      contracts: (contracts || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        created_at: c.created_at,
        uploaded_by: c.profiles?.full_name || (c.user_id === user.id ? 'You' : 'Unknown'),
        is_owner: c.user_id === user.id
      }))
    });

  } catch (error: any) {
    console.error("Workspace details error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
