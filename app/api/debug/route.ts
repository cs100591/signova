import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const results: Record<string, any> = { user_id: user.id, user_email: user.email };

    // Check actual columns in contracts table via information_schema
    const { data: cols, error: colsErr } = await supabase
      .from('information_schema.columns' as any)
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'contracts')
      .order('ordinal_position' as any);
    results.contracts_columns = colsErr ? `ERROR: ${colsErr.message}` : cols?.map((c: any) => `${c.column_name} (${c.data_type}, nullable:${c.is_nullable})`);

    // Try minimal contract insert
    const testInsert = await supabase
      .from('contracts')
      .insert({ user_id: user.id, title: '__DIAG_TEST__', type: 'Other' })
      .select()
      .single();

    if (testInsert.error) {
      results.contract_insert_test = { FAILED: testInsert.error.message, code: testInsert.error.code };
    } else {
      results.contract_insert_test = { SUCCESS: true, id: testInsert.data?.id };
      if (testInsert.data?.id) {
        await supabase.from('contracts').delete().eq('id', testInsert.data.id);
      }
    }

    // Check profile
    const { data: profile, error: pErr } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    results.profile = pErr ? `ERROR: ${pErr.message}` : profile;

    // Check workspaces
    const { data: wsList, error: wErr } = await supabase.from('workspaces').select('*');
    results.workspaces = wErr ? `ERROR: ${wErr.message}` : wsList;

    return NextResponse.json(results, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
