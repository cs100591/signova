import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Contracts GET]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    console.log('[Contracts POST] body:', JSON.stringify(body));

    const {
      name, type, amount, currency,
      effective_date, expiry_date,
      summary, file_url,
      party_a, party_b, governing_law,
    } = body;

    if (!type) return NextResponse.json({ error: 'type is required' }, { status: 400 });

    // amount column in DB is TEXT — keep as string
    const amountStr = amount !== undefined && amount !== null && String(amount).trim() !== ''
      ? String(amount)
      : null;

    const contractName = (name || 'Untitled Contract').trim();
    const payload = {
      user_id: user.id,
      title: contractName,  // DB has "title TEXT NOT NULL" (original schema)
      type,
      amount: amountStr,
      currency: currency || 'USD',
      effective_date: effective_date || null,
      expiry_date: expiry_date || null,
      summary: summary || null,
      file_url: file_url || null,
      party_a: party_a || null,
      party_b: party_b || null,
      governing_law: governing_law || null,
      status: 'active',
    };

    console.log('[Contracts POST] inserting payload:', JSON.stringify(payload));

    const { data, error } = await supabase
      .from('contracts')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[Contracts POST] DB error:', JSON.stringify(error));
      return NextResponse.json({
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }, { status: 500 });
    }

    console.log('[Contracts POST] success, id:', data?.id);
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    console.error('[Contracts POST] unexpected:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
