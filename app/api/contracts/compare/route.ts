import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { createSupabaseServerClient } from '@/lib/supabase'
import { extractPdfChunks, PdfChunk } from '@/lib/pdf/extractWithPositions'

export const maxDuration = 60

export async function POST(request: NextRequest) {
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
    // Extract chunks from both PDFs in parallel
    const [chunksA, chunksB] = await Promise.all([
      extractPdfChunks(contractAUrl),
      extractPdfChunks(contractBUrl),
    ])

    // Limit chunks sent to Claude to avoid token overflow
    const MAX_CHUNKS = 80
    const chunksAForAI = chunksA.slice(0, MAX_CHUNKS).map(({ id, text, page }) => ({ id, text, page }))
    const chunksBForAI = chunksB.slice(0, MAX_CHUNKS).map(({ id, text, page }) => ({ id, text, page }))

    if (!process.env.ANTHROPIC_API_KEY) {
      // Demo mode: return mock comparison
      const mockResult = buildMockResult(chunksA, chunksB)
      await supabase
        .from('contract_comparisons')
        .update({ status: 'done', result_json: mockResult, similarity_warning: false })
        .eq('id', record.id)
      return NextResponse.json({ comparison: mockResult, chunksA, chunksB, comparisonId: record.id })
    }

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
      model: anthropic('claude-sonnet-4-6'),
      prompt,
      maxOutputTokens: 4096,
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

    return NextResponse.json({ comparison, chunksA, chunksB, comparisonId: record.id })
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
}

function buildMockResult(chunksA: PdfChunk[], chunksB: PdfChunk[]) {
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
