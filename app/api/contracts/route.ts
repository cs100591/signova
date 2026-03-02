import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get url params to filter by workspace if provided
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspaceId');

    let query = supabase.from('contracts').select('*');

    if (workspaceId && workspaceId !== 'personal') {
      // Fetch only workspace contracts
      query = query.eq('workspace_id', workspaceId);
    } else if (workspaceId === 'personal') {
      // Fetch only personal contracts
      query = query.eq('user_id', user.id).is('workspace_id', null);
    } else {
      // Fetch all (personal + any workspace user is a member of)
      const { data: memberships } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id);
      
      const workspaceIds = memberships?.map(m => m.workspace_id) || [];
      const orQuery = workspaceIds.length > 0 
        ? `user_id.eq.${user.id},workspace_id.in.(${workspaceIds.join(',')})`
        : `user_id.eq.${user.id}`;
        
      query = query.or(orQuery);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

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
      file_hash, contract_group_id, parent_contract_id, version
    } = body;

    if (!type) return NextResponse.json({ error: 'type is required' }, { status: 400 });

    // amount column in DB is TEXT — keep as string
    const amountStr = amount !== undefined && amount !== null && String(amount).trim() !== ''
      ? String(amount)
      : null;

    const contractName = (name || 'Untitled Contract').trim();
    // Some versions of the DB schema use 'title', while newer versions use 'name'.
    // We send both to guarantee compatibility and prevent the 'null value in column title' error.

    const payload = {
      user_id: user.id,
      title: contractName,
      name: contractName,
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
      file_hash: file_hash || null,
      contract_group_id: contract_group_id || null,
      parent_contract_id: parent_contract_id || null,
      version: version || 1,
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
