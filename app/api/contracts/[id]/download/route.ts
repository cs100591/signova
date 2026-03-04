import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { getDownloadUrl } from '@/lib/r2';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch contract — verify user owns it
    const { data: contract, error } = await supabase
      .from('contracts')
      .select('file_url, user_id')
      .eq('id', id)
      .single();

    if (error || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    if (contract.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!contract.file_url) {
      return NextResponse.json({ error: 'No file attached' }, { status: 404 });
    }

    // Extract R2 key from the stored URL
    // Stored as: https://<endpoint>/<bucket>/<key>  e.g. contracts/1234-file.pdf
    const url = new URL(contract.file_url);
    // pathname = /<bucket>/<key...>  — drop leading slash and bucket segment
    const parts = url.pathname.replace(/^\//, '').split('/');
    parts.shift(); // remove bucket name
    const key = parts.join('/');

    if (!key) {
      return NextResponse.json({ error: 'Invalid file reference' }, { status: 500 });
    }

    // Generate a presigned URL valid for 60 seconds
    const signedUrl = await getDownloadUrl(key, 60);
    if (!signedUrl) {
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
    }

    return NextResponse.redirect(signedUrl);
  } catch (err) {
    console.error('[Download] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
