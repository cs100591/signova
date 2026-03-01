import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contracts', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      workspace_id, 
      name, 
      type, 
      amount, 
      currency,
      effective_date, 
      expiry_date, 
      summary, 
      file_url,
      party_a,
      party_b
    } = body;
    
    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name and type are required' },
        { status: 400 }
      );
    }
    
    // Build insert object with only base columns (always safe)
    const insertData: Record<string, any> = {
      user_id: user.id,
      name,
      type,
      effective_date: effective_date || null,
      expiry_date: expiry_date || null,
      summary,
      file_url,
    };

    // Try inserting with all columns first; if it fails due to missing columns,
    // retry with minimal columns
    let insertObj: Record<string, any> = {
      ...insertData,
      workspace_id: workspace_id || null,
      amount: amount || null,
      currency: currency || 'USD',
      party_a: party_a || null,
      party_b: party_b || null,
      status: 'active',
    };

    let { data, error } = await supabase
      .from('contracts')
      .insert(insertObj)
      .select()
      .single();

    // If fails due to missing columns, retry with minimal set
    if (error && (error.message.includes('column') || error.code === '42703')) {
      console.warn('[Contracts POST] Some columns missing, retrying with minimal columns:', error.message);
      // Always include name and type as they are required
      const minimalInsertData: Record<string, any> = {
        user_id: user.id,
        name,  // name is required by database
        type,  // type is required by database
        effective_date: effective_date || null,
        expiry_date: expiry_date || null,
        summary: summary || null,
        file_url: file_url || null,
        status: 'active',
      };
      const { data: d2, error: e2 } = await supabase
        .from('contracts')
        .insert(minimalInsertData)
        .select()
        .single();
      data = d2;
      error = e2;
    }
    
    if (error) {
      console.error('Database error:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      // Provide more specific error messages
      let userMessage = 'Failed to save contract';
      if (error.code === '42703') {
        userMessage = 'Database error: Missing required columns. Please contact support.';
      } else if (error.code === '23502') {
        userMessage = 'Database error: Missing required field. Please fill in all required fields.';
      } else if (error.message?.includes('column')) {
        userMessage = `Database error: ${error.message}. Please run database migrations.`;
      }
      
      return NextResponse.json(
        { 
          error: userMessage, 
          details: error.message,
          code: error.code,
          hint: 'Database columns may be missing. Run SQL migrations in Supabase Dashboard.'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
