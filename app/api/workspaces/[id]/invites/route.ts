import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { Resend } from "resend";
import { workspaceInvitationTemplate } from "@/lib/emailTemplates.js";
import crypto from "crypto";

export async function POST(
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

    // Must be admin or owner
    const { data: membership, error: memError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .single();

    if (memError || !membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json({ error: "Unauthorized to invite" }, { status: 403 });
    }

    const { email, role } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Create token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Use service role to bypass RLS for insertion since we already verified permissions above
    const { createClient } = await import('@supabase/supabase-js');
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: inviteError } = await adminSupabase
      .from("workspace_invitations")
      .insert({
        workspace_id: id,
        invited_email: email,
        invited_by: user.id,
        role: role || 'member',
        token,
        expires_at: expiresAt.toISOString()
      });

    if (inviteError) {
      if (inviteError.code === '23505') { // unique violation
        return NextResponse.json({ error: "An invitation with this token or email already exists" }, { status: 400 });
      }
      throw inviteError;
    }

    // Send invitation email via Resend
    try {
      // Fetch inviter profile and workspace name for the email
      const [profileRes, workspaceRes] = await Promise.all([
        adminSupabase.from("profiles").select("full_name").eq("id", user.id).single(),
        adminSupabase.from("workspaces").select("name").eq("id", id).single(),
      ]);

      const inviterName = profileRes.data?.full_name || user.email || "A teammate";
      const workspaceName = workspaceRes.data?.name || "a workspace";
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.signova.me"}/invite/${token}`;

      const { subject, html } = workspaceInvitationTemplate({
        inviterName,
        workspaceName,
        role: role || "Member",
        inviteUrl,
      });

      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error: emailError } = await resend.emails.send({
          from: "Signova <noreply@signova.me>",
          to: email,
          subject,
          html,
        });
        if (emailError) {
          console.error("[Invite] Email send failed:", emailError);
          // Invitation is saved — don't fail the request, just log
        }
      } else {
        console.log("[Invite] RESEND_API_KEY not set, skipping email to:", email);
      }
    } catch (emailErr) {
      console.error("[Invite] Email send error:", emailErr);
      // Invitation record is already created — don't fail the whole request
    }

    return NextResponse.json({ success: true, message: "Invitation sent" });

  } catch (error: any) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
