import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { getDownloadUrl } from '@/lib/r2'

/**
 * Check if a URL is already a presigned URL (has AWS signature params)
 */
function isPresignedUrl(url: string): boolean {
  return url.includes('X-Amz') || url.includes('X-Amz-Algorithm') || url.includes('X-Amz-Credential')
}

/**
 * Extract R2 key from a raw R2 URL
 * Format: https://<account>.r2.cloudflarestorage.com/<bucket>/<key>
 */
function extractR2Key(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const parts = urlObj.pathname.replace(/^\//, '').split('/')
    if (parts.length < 2) return null
    parts.shift() // remove bucket name
    return parts.join('/')
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    
    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Determine which URL to use for fetching
    let pdfUrl = url
    
    // Only convert to presigned if it's NOT already presigned
    if (!isPresignedUrl(url)) {
      try {
        const key = extractR2Key(url)
        if (key) {
          const signed = await getDownloadUrl(key, 300) // 5 min expiry
          if (signed) {
            pdfUrl = signed
          } else {
            console.error('[PDF Proxy] Failed to generate presigned URL for key:', key)
            throw new Error('Failed to generate presigned URL')
          }
        } else {
          console.error('[PDF Proxy] Could not extract key from URL:', url)
          throw new Error('Could not extract R2 key from URL')
        }
      } catch (conversionErr) {
        console.error('[PDF Proxy] URL conversion error:', conversionErr)
        // If conversion fails, try using original URL as fallback
        console.log('[PDF Proxy] Falling back to original URL')
      }
    } else {
      console.log('[PDF Proxy] URL is already presigned, using directly')
    }

    console.log('[PDF Proxy] Fetching from URL:', pdfUrl.substring(0, 100) + '...')

    // Fetch PDF from R2
    const response = await fetch(pdfUrl, {
      headers: {
        'Accept': 'application/pdf',
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details')
      console.error('[PDF Proxy] Fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        url: pdfUrl.substring(0, 100) + '...',
        errorText: errorText.substring(0, 500),
      })
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
    }

    // Stream the PDF back with proper headers
    const pdfBuffer = await response.arrayBuffer()
    
    console.log('[PDF Proxy] Successfully fetched PDF, size:', pdfBuffer.byteLength, 'bytes')
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'private, max-age=300',
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('[PDF Proxy] Fatal error:', {
      message: errorMessage,
      stack: err instanceof Error ? err.stack : undefined,
      url: request.url.substring(0, 200),
    })
    return NextResponse.json({ 
      error: 'Failed to load PDF',
      details: errorMessage,
    }, { status: 500 })
  }
}
