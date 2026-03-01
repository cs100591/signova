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
      amount,
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
      console.warn('[Contracts POST] Some columns missing, retrying with base columns:', error.message);
      const { data: d2, error: e2 } = await supabase
        .from('contracts')
        .insert(insertData)
        .select()
        .single();
      data = d2;
      error = e2;
    }
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save contract', details: error.message },
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
