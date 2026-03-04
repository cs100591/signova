import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

// GET /api/contract-analyses?contractId=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contractId = searchParams.get("contractId");
  if (!contractId) {
    return NextResponse.json({ error: "contractId required" }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data } = await supabase
      .from("contract_analyses")
      .select("id, acknowledged_findings, selected_party, party_a_name, party_b_name, risk_score, risk_level, narrative, breakdown")
      .eq("contract_id", contractId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json(data ?? null);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/contract-analyses — update acknowledged_findings
export async function PATCH(request: Request) {
  try {
    const { id, acknowledged_findings } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("contract_analyses")
      .update({ acknowledged_findings })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
