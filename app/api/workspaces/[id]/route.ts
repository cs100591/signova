import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function DELETE(
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

    // Verify owner
    const { data: workspace, error: getError } = await supabase
      .from("workspaces")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (getError || !workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (workspace.owner_id !== user.id) {
      return NextResponse.json({ error: "Only the workspace owner can delete it" }, { status: 403 });
    }

    // Parse options
    const body = await request.json().catch(() => ({}));
    const { contractAction } = body;

    // Handle contracts
    if (contractAction === "move") {
      await supabase
        .from("contracts")
        .update({ workspace_id: null })
        .eq("workspace_id", id);
    } else {
      await supabase
        .from("contracts")
        .delete()
        .eq("workspace_id", id);
    }

    // Delete workspace (cascade will handle members and invitations)
    const { error: deleteError } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Workspace delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
