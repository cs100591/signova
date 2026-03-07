import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { getDownloadUrl } from '@/lib/r2'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    
    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Convert to presigned URL if needed
    let pdfUrl = url
    try {
      const urlObj = new URL(url)
      const parts = urlObj.pathname.replace(/^\//, '').split('/')
      parts.shift() // remove bucket name
      const key = parts.join('/')
      const signed = await getDownloadUrl(key, 300)
      if (signed) pdfUrl = signed
    } catch {
      // Use original URL if conversion fails
    }

    // Fetch PDF from R2
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`)
    }

    // Stream the PDF back with proper headers
    const pdfBuffer = await response.arrayBuffer()
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (err) {
    console.error('PDF proxy error:', err)
    return NextResponse.json({ error: 'Failed to load PDF' }, { status: 500 })
  }
}
