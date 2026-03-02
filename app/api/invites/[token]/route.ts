import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET(
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
      .select(`
        *,
        workspaces (name),
        profiles:invited_by (full_name, email)
      `)
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

    // If it's an email invite (not a link-invite), verify email
    if (invite.invited_email !== "link-invite" && invite.invited_email !== user.email) {
      return NextResponse.json({ error: "This invitation was sent to a different email address." }, { status: 403 });
    }

    return NextResponse.json({
      workspace_name: invite.workspaces?.name,
      workspace_id: invite.workspace_id,
      inviter_name: invite.profiles?.full_name,
      inviter_email: invite.profiles?.email,
      role: invite.role,
    });

  } catch (error: any) {
    console.error("Invite GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
