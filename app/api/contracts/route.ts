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
    const { name, type, amount, currency, effective_date, expiry_date, summary, file_url, party_a, party_b, governing_law } = body;

    if (!type) {
      return NextResponse.json({ error: 'Missing required field: type' }, { status: 400 });
    }

    const contractName = name || 'Untitled Contract';
    const contractSummary = summary || '';

    // Build insert with only columns that exist in database
    // Based on original schema: name, type, party_a, party_b, amount, currency, 
    // effective_date, expiry_date, summary, file_url, governing_law, status
    const insertData: Record<string, any> = {
      user_id: user.id,
      name: contractName,
      type,
      summary: contractSummary,
      status: 'active',
      effective_date: effective_date || null,
      expiry_date: expiry_date || null,
      file_url: file_url || null,
      currency: currency || 'USD',
      party_a: party_a || null,
      party_b: party_b || null,
      governing_law: governing_law || null,
    };

    // Parse amount safely - only use 'amount' column (not contract_value)
    if (amount !== undefined && amount !== null && amount !== '') {
      const cleaned = String(amount).replace(/[^\d.]/g, '');
      const parsed = cleaned ? parseFloat(cleaned) : null;
      if (parsed !== null && !isNaN(parsed)) {
        insertData.amount = parsed;
      }
    }

    console.log('[Contracts POST] Inserting:', Object.keys(insertData));

    const { data, error } = await supabase
      .from('contracts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[Contracts POST] Insert failed:', error);
      console.error('[Contracts POST] Error code:', error.code);
      console.error('[Contracts POST] Error message:', error.message);
      
      let userMessage = 'Failed to save contract';
      if (error.code === '42703') {
        userMessage = `Database error: Column does not exist - ${error.message}`;
      } else if (error.code === '23502') {
        userMessage = 'Database error: Required field is missing';
      } else if (error.code === '42501') {
        userMessage = 'Permission denied. Please check database policies.';
      }
      
      return NextResponse.json({
        error: userMessage,
        details: error.message,
        code: error.code,
      }, { status: 500 });
    }

    console.log('[Contracts POST] Success:', data?.id);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('[Contracts POST] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
