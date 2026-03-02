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
      return NextResponse.json({ error: "Unauthorized to generate link" }, { status: 403 });
    }

    // Create token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const { error: inviteError } = await supabase
      .from("workspace_invitations")
      .insert({
        workspace_id: id,
        invited_email: "link-invite", // special identifier for link invites
        invited_by: user.id,
        role: 'member', // Default to member for links
        token,
        expires_at: expiresAt.toISOString()
      });

    if (inviteError) {
      throw inviteError;
    }

    return NextResponse.json({ success: true, token });

  } catch (error: any) {
    console.error("Invite link error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
