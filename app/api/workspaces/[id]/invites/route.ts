import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
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

    const { error: inviteError } = await supabase
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

    // NOTE: In production, send email using Resend here

    return NextResponse.json({ success: true, message: "Invitation sent" });

  } catch (error: any) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
