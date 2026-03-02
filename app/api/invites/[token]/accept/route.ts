import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch invitation
    const { data: invite, error: inviteError } = await supabase
      .from("workspace_invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invalid or expired invitation link." }, { status: 404 });
    }

    if (invite.accepted_at) {
      return NextResponse.json({ error: "This invitation has already been accepted." }, { status: 400 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "This invitation has expired." }, { status: 400 });
    }

    // If it's an email invite (not a link-invite), verify email matches
    if (invite.invited_email !== "link-invite" && invite.invited_email !== user.email) {
      return NextResponse.json({ error: "This invitation was sent to a different email address." }, { status: 403 });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", invite.workspace_id)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      // Mark as accepted and return success if already a member
      await supabase
        .from("workspace_invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("token", token);
      
      return NextResponse.json({ success: true, workspace_id: invite.workspace_id });
    }

    // Add member
    const { error: insertError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: invite.role,
        invited_by: invite.invited_by
      });

    if (insertError) {
      throw insertError;
    }

    // Mark as accepted
    await supabase
      .from("workspace_invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("token", token);

    return NextResponse.json({ success: true, workspace_id: invite.workspace_id });

  } catch (error: any) {
    console.error("Invite accept error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
