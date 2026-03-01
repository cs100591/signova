import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Database error:', error);
    // Return mock data for demo
    return NextResponse.json([
      {
        id: 1,
        name: "Acme Corp MSA",
        type: "Service Agreement",
        amount: "$150,000/year",
        expiry_date: "2024-12-31",
        summary: "Master Service Agreement for Q3 enterprise software deliverables.",
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Dunder Mifflin Renewal",
        type: "Renewal",
        amount: null,
        expiry_date: "2024-03-15",
        summary: "Annual paper supply contract renewal with updated pricing terms.",
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        name: "Stark Industries NDA",
        type: "NDA",
        amount: null,
        expiry_date: null,
        summary: "Non-disclosure agreement for project Iron Legion.",
        created_at: new Date().toISOString(),
      },
    ]);
  }
}

export async function POST(request: Request) {
  let body: any;
  
  try {
    body = await request.json();
    const { workspace_id, name, type, amount, effective_date, expiry_date, summary, file_url } = body;
    
    const { data, error } = await supabaseServer
      .from('contracts')
      .insert({
        workspace_id: workspace_id || 1,
        name,
        type,
        amount,
        effective_date,
        expiry_date,
        summary,
        file_url,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Database error:', error);
    // Return mock success for demo
    return NextResponse.json({ 
      id: Date.now(),
      workspace_id: 1,
      name: body?.name || "New Contract",
      type: body?.type || "Service Agreement",
      amount: body?.amount || null,
      effective_date: body?.effective_date || new Date().toISOString().split('T')[0],
      expiry_date: body?.expiry_date || null,
      summary: body?.summary || "",
      created_at: new Date().toISOString(),
    }, { status: 201 });
  }
}
