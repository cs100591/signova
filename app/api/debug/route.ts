import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const results: Record<string, any> = { user_id: user.id, user_email: user.email };

    // Check what columns exist in each table
    for (const table of ['contracts', 'profiles', 'workspaces', 'workspace_members']) {
      const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: table })
        .select();
      results[`${table}_columns`] = error ? `ERROR: ${error.message}` : data;
    }

    // Try a real minimal contract insert
    const testInsert = await supabase
      .from('contracts')
      .insert({
        user_id: user.id,
        name: '__DIAGNOSTIC_TEST__',
        type: 'Other',
        status: 'active',
      })
      .select()
      .single();

    if (testInsert.error) {
      results.contract_insert_test = { FAILED: testInsert.error.message, code: testInsert.error.code };
    } else {
      results.contract_insert_test = { SUCCESS: true, id: testInsert.data?.id };
      // Clean up test row
      if (testInsert.data?.id) {
        await supabase.from('contracts').delete().eq('id', testInsert.data.id);
      }
    }

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    results.profile = profileError ? `ERROR: ${profileError.message}` : profile;

    // Check workspaces
    const { data: wsList, error: wsError } = await supabase
      .from('workspaces')
      .select('*');
    results.workspaces = wsError ? `ERROR: ${wsError.message}` : wsList;

    return NextResponse.json(results, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
