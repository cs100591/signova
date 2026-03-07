import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'

// Dynamic imports to handle potential module loading issues
async function loadAI() {
  const { anthropic } = await import('@ai-sdk/anthropic')
  const { generateText } = await import('ai')
  return { anthropic, generateText }
}

async function loadPDF() {
  const { extractPdfChunks } = await import('@/lib/pdf/extractWithPositions')
  return { extractPdfChunks }
}

async function loadR2() {
  const { getDownloadUrl } = await import('@/lib/r2')
  return { getDownloadUrl }
}

/**
 * Convert a raw R2 storage URL to a presigned URL for server-side access.
 * R2 URLs are not publicly accessible — we need presigned URLs.
 */
async function toPresignedUrl(rawUrl: string): Promise<string> {
  try {
    const { getDownloadUrl } = await loadR2()
    const url = new URL(rawUrl)
    const parts = url.pathname.replace(/^\//, '').split('/')
    parts.shift() // remove bucket name
    const key = parts.join('/')
    const signed = await getDownloadUrl(key, 300) // 5 min expiry
    return signed ?? rawUrl
  } catch {
    return rawUrl
  }
}

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body?.contractAUrl || !body?.contractBUrl) {
      return NextResponse.json(
        { error: 'contractAUrl and contractBUrl are required' },
        { status: 400 }
      )
    }

    const { contractAUrl, contractBUrl, contractAId, contractBId } = body

    // Create a pending record
    const { data: record, error: insertError } = await supabase
      .from('contract_comparisons')
      .insert({
        user_id: user.id,
        contract_a_id: contractAId ?? null,
        contract_b_id: contractBId ?? null,
        contract_a_url: contractAUrl,
        contract_b_url: contractBUrl,
        status: 'processing',
      })
      .select('id')
      .single()

    if (insertError || !record) {
      return NextResponse.json({ error: 'Failed to create comparison record' }, { status: 500 })
    }

    try {
      // Load modules dynamically
      const { extractPdfChunks } = await loadPDF()
      
      // Convert raw R2 URLs to presigned URLs (R2 requires auth for access)
      const [signedUrlA, signedUrlB] = await Promise.all([
        toPresignedUrl(contractAUrl),
        toPresignedUrl(contractBUrl),
      ])

      // Extract chunks from both PDFs in parallel
      const [chunksA, chunksB] = await Promise.all([
        extractPdfChunks(signedUrlA),
        extractPdfChunks(signedUrlB),
      ])

      // Limit chunks sent to Claude to avoid token overflow
      const MAX_CHUNKS = 80
      const chunksAForAI = chunksA.slice(0, MAX_CHUNKS).map((chunk: { id: string, text: string, page: number }) => ({ id: chunk.id, text: chunk.text, page: chunk.page }))
      const chunksBForAI = chunksB.slice(0, MAX_CHUNKS).map((chunk: { id: string, text: string, page: number }) => ({ id: chunk.id, text: chunk.text, page: chunk.page }))

      if (!process.env.ANTHROPIC_API_KEY) {
        // Demo mode: return mock comparison
        const mockResult = buildMockResult(chunksA, chunksB)
        await supabase
          .from('contract_comparisons')
          .update({ status: 'done', result_json: mockResult, similarity_warning: false })
          .eq('id', record.id)
        return NextResponse.json({ comparison: mockResult, chunksA, chunksB, comparisonId: record.id })
      }

      const { anthropic, generateText } = await loadAI()

      const prompt = `You are analyzing two contracts for comparison. Return ONLY valid JSON, no other text.

CONTRACT A CHUNKS:
${JSON.stringify(chunksAForAI, null, 2)}

CONTRACT B CHUNKS:
${JSON.stringify(chunksBForAI, null, 2)}

Tasks:
1. Determine if these are the same type of contract (yes/no + reason)
2. Match sections by topic across both contracts
3. For each matched pair, identify what changed (if anything), risk level of each (high/medium/low/none), and how risk changed (increased/decreased/same/new/removed)
4. Identify unmatched sections (present in one, not the other)

Return JSON only:
{
  "sameType": boolean,
  "typeWarning": "string or null",
  "matches": [
    {
      "topic": "Payment Terms",
      "chunkA": "chunk_id or null",
      "chunkB": "chunk_id or null",
      "changeType": "modified|added|removed|unchanged",
      "riskA": "high|medium|low|none",
      "riskB": "high|medium|low|none",
      "riskChange": "increased|decreased|same|new|removed",
      "summary": "Brief description of what changed"
    }
  ]
}`

      const { text: rawText } = await generateText({
        model: anthropic('claude-haiku-4-5-20251001'),
        prompt,
      })

      // Strip markdown code fences if present
      const jsonText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      const comparison = JSON.parse(jsonText)

      await supabase
        .from('contract_comparisons')
        .update({
          status: 'done',
          result_json: comparison,
          similarity_warning: !comparison.sameType,
        })
        .eq('id', record.id)

      return NextResponse.json({ 
        comparison, 
        chunksA, 
        chunksB, 
        comparisonId: record.id,
        signedUrlA,
        signedUrlB
      })
    } catch (err) {
      console.error('Compare error:', err)
      await supabase
        .from('contract_comparisons')
        .update({ status: 'error' })
        .eq('id', record.id)

      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Comparison failed' },
        { status: 500 }
      )
    }
  } catch (outerErr) {
    console.error('Route handler error:', outerErr)
    return NextResponse.json(
      { error: outerErr instanceof Error ? outerErr.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

function buildMockResult(chunksA: any[], chunksB: any[]) {
  return {
    sameType: true,
    typeWarning: null,
    matches: [
      {
        topic: 'Payment Terms',
        chunkA: chunksA[0]?.id ?? null,
        chunkB: chunksB[0]?.id ?? null,
        changeType: 'modified',
        riskA: 'medium',
        riskB: 'high',
        riskChange: 'increased',
        summary: 'Contract B has stricter payment terms with shorter grace period.',
      },
      {
        topic: 'Termination Clause',
        chunkA: chunksA[1]?.id ?? null,
        chunkB: chunksB[1]?.id ?? null,
        changeType: 'modified',
        riskA: 'low',
        riskB: 'low',
        riskChange: 'same',
        summary: 'Similar termination conditions in both contracts.',
      },
      {
        topic: 'Liability Cap',
        chunkA: null,
        chunkB: chunksB[2]?.id ?? null,
        changeType: 'added',
        riskA: 'none',
        riskB: 'high',
        riskChange: 'new',
        summary: 'Contract B introduces a liability cap not present in Contract A.',
      },
    ],
  }
}
