import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

// Diagnostic endpoint to check database state
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: any = {
      user: user.email,
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // Check 1: profiles table structure
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      results.checks.profiles_table = {
        exists: !profileError,
        error: profileError?.message || null,
        columns: profile ? Object.keys(profile) : null,
        plan: profile?.plan || 'NOT SET'
      };
    } catch (e: any) {
      results.checks.profiles_table = { error: e.message };
    }

    // Check 2: contracts table structure
    try {
      const { data: contractCols, error: contractError } = await supabase
        .rpc('get_table_columns', { table_name: 'contracts' });
      
      results.checks.contracts_table = {
        columns_query: contractError ? 'failed' : 'success',
        error: contractError?.message || null
      };
    } catch (e: any) {
      results.checks.contracts_table = { error: e.message };
    }

    // Check 3: Try to count contracts
    try {
      const { count, error: countError } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      results.checks.contracts_count = {
        count: count || 0,
        error: countError?.message || null
      };
    } catch (e: any) {
      results.checks.contracts_count = { error: e.message };
    }

    // Check 4: Try a simple insert (will rollback)
    try {
      const { error: insertError } = await supabase
        .from('contracts')
        .insert({
          user_id: user.id,
          name: 'TEST_CONTRACT_DELETE_ME',
          type: 'Test'
        })
        .select();
      
      if (!insertError) {
        // Clean up test record
        await supabase
          .from('contracts')
          .delete()
          .eq('name', 'TEST_CONTRACT_DELETE_ME');
      }
      
      results.checks.insert_test = {
        success: !insertError,
        error: insertError?.message || null
      };
    } catch (e: any) {
      results.checks.insert_test = { error: e.message };
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Diagnostic failed', details: error.message },
      { status: 500 }
    );
  }
}
