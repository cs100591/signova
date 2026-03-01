import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Contracts GET] DB error:', error);
      return NextResponse.json({ error: 'Failed to fetch contracts', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('[Contracts GET] Server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, amount, currency, effective_date, expiry_date, summary, file_url, party_a, party_b, governing_law, workspace_id } = body;

    if (!type) {
      return NextResponse.json({ error: 'Missing required field: type' }, { status: 400 });
    }

    const contractName = name || 'Untitled Contract';
    const contractSummary = summary || '';

    // ── Attempt 1: Full insert (all columns) ───────────────────────────────
    const fullInsert: Record<string, any> = {
      user_id: user.id,
      // support both 'title' (original schema) and 'name' (migration adds this)
      title: contractName,
      name: contractName,
      type,
      summary: contractSummary,
      status: 'active',
      effective_date: effective_date || null,
      expiry_date: expiry_date || null,
      file_url: file_url || null,
      workspace_id: workspace_id || null,
      currency: currency || 'USD',
      party_a: party_a || null,
      party_b: party_b || null,
      governing_law: governing_law || null,
    };

    // Parse amount safely
    if (amount !== undefined && amount !== null && amount !== '') {
      const cleaned = String(amount).replace(/[^\d.]/g, '');
      const parsed = cleaned ? parseFloat(cleaned) : null;
      if (parsed !== null && !isNaN(parsed)) {
        fullInsert.amount = parsed;
        fullInsert.contract_value = parsed; // schema uses contract_value
      }
    }

    let { data, error } = await supabase
      .from('contracts')
      .insert(fullInsert)
      .select()
      .single();

    // ── Attempt 2: Drop columns that commonly don't exist ─────────────────
    if (error && (error.code === '42703' || error.code === '23502' || (error.message || '').includes('column'))) {
      console.warn('[Contracts POST] Full insert failed, retrying without optional columns:', error.message);

      // Figure out which column caused the error and remove it
      const errMsg = error.message.toLowerCase();
      const attempt2: Record<string, any> = {
        user_id: user.id,
        type,
        summary: contractSummary,
        effective_date: effective_date || null,
        expiry_date: expiry_date || null,
        file_url: file_url || null,
      };

      // Only include columns that are NOT mentioned in the error
      if (!errMsg.includes('title'))         attempt2.title = contractName;
      if (!errMsg.includes("'name'") && !errMsg.includes('"name"')) attempt2.name = contractName;
      if (!errMsg.includes('status'))        attempt2.status = 'active';
      if (!errMsg.includes('workspace_id'))  attempt2.workspace_id = workspace_id || null;
      if (!errMsg.includes('currency'))      attempt2.currency = currency || 'USD';
      if (!errMsg.includes('party_a'))       attempt2.party_a = party_a || null;
      if (!errMsg.includes('party_b'))       attempt2.party_b = party_b || null;
      if (!errMsg.includes('governing_law')) attempt2.governing_law = governing_law || null;
      if (!errMsg.includes('amount') && !errMsg.includes('contract_value')) {
        if (fullInsert.amount !== undefined) attempt2.amount = fullInsert.amount;
        if (fullInsert.contract_value !== undefined) attempt2.contract_value = fullInsert.contract_value;
      }

      const { data: d2, error: e2 } = await supabase
        .from('contracts')
        .insert(attempt2)
        .select()
        .single();
      data = d2;
      error = e2;
    }

    // ── Attempt 3: Absolute minimum ───────────────────────────────────────
    if (error && (error.code === '42703' || error.code === '23502' || (error.message || '').includes('column'))) {
      console.warn('[Contracts POST] Attempt 2 failed, trying minimal insert:', error.message);

      const minimal: Record<string, any> = {
        user_id: user.id,
        type,
        summary: contractSummary ? `${contractSummary}\n\nContract: ${contractName}` : `Contract: ${contractName}`,
        effective_date: effective_date || null,
        expiry_date: expiry_date || null,
        file_url: file_url || null,
      };

      const { data: d3, error: e3 } = await supabase
        .from('contracts')
        .insert(minimal)
        .select()
        .single();
      data = d3;
      error = e3;
    }

    if (error) {
      console.error('[Contracts POST] All attempts failed:', error);
      let userMessage = 'Failed to save contract';
      if (error.code === '42703') {
        userMessage = 'Database schema mismatch. Please run the SQL migration in Supabase Dashboard.';
      } else if (error.code === '23502') {
        userMessage = 'A required database field is missing a value. Please run the SQL migration.';
      } else if (error.code === '42501') {
        userMessage = 'Permission denied. Please check Row Level Security policies in Supabase.';
      }
      return NextResponse.json({
        error: userMessage,
        details: error.message,
        code: error.code,
        hint: 'Run the SQL migration in Supabase Dashboard → SQL Editor',
      }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('[Contracts POST] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
