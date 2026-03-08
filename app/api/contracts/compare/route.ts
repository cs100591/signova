import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { randomUUID } from 'crypto'

// Dynamic imports to handle potential module loading issues
async function loadAI() {
  const { anthropic } = await import('@ai-sdk/anthropic')
  const { generateText } = await import('ai')
  return { anthropic, generateText }
}

async function loadPDF() {
  const { extractChunksWithFallback } = await import('@/lib/pdf/extractWithPositions')
  return { extractChunksWithFallback }
}

async function loadR2() {
  const { getDownloadUrl } = await import('@/lib/r2')
  return { getDownloadUrl }
}

// Generate unique request ID for tracing
function generateRequestId(): string {
  return `cmp_${Date.now()}_${randomUUID().slice(0, 8)}`
}

// Logging helper with request ID
function log(requestId: string, level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${requestId}] [Compare]`
  const logData = data ? ` ${JSON.stringify(data)}` : ''
  
  if (level === 'error') {
    console.error(`${prefix} [ERROR] ${message}${logData}`)
  } else if (level === 'warn') {
    console.warn(`${prefix} [WARN] ${message}${logData}`)
  } else {
    console.log(`${prefix} [INFO] ${message}${logData}`)
  }
}

// Performance timing helper
function startTimer() {
  return process.hrtime.bigint()
}

function getElapsedMs(start: bigint): number {
  return Number(process.hrtime.bigint() - start) / 1000000
}

/**
 * Convert a raw R2 storage URL to a presigned URL for server-side access.
 * R2 URLs are not publicly accessible — we need presigned URLs.
 */
async function toPresignedUrl(rawUrl: string, requestId: string): Promise<string> {
  const timer = startTimer()
  try {
    log(requestId, 'info', 'Processing URL', { url: rawUrl.substring(0, 100) })
    
    const { getDownloadUrl } = await loadR2()
    const url = new URL(rawUrl)
    const parts = url.pathname.replace(/^\//, '').split('/')
    parts.shift() // remove bucket name
    const key = parts.join('/')
    
    log(requestId, 'info', 'Extracted key', { key, parts })
    
    const signed = await getDownloadUrl(key, 300) // 5 min expiry
    const elapsed = getElapsedMs(timer)
    
    log(requestId, 'info', 'Generated presigned URL', { 
      elapsedMs: elapsed,
      signed: signed ? signed.substring(0, 100) : 'null' 
    })
    
    return signed ?? rawUrl
  } catch (err) {
    const elapsed = getElapsedMs(timer)
    log(requestId, 'error', 'toPresignedUrl failed', { 
      elapsedMs: elapsed,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    })
    return rawUrl
  }
}

/**
 * Extract chunks with logging wrapper
 */
async function extractWithLogging(
  pdfUrl: string, 
  contractId: string | null,
  requestId: string,
  supabase: any
): Promise<any[]> {
  const timer = startTimer()
  
  try {
    log(requestId, 'info', 'Attempting PDF extraction', { contractId })
    const { extractChunksWithFallback } = await loadPDF()
    const chunks = await extractChunksWithFallback(pdfUrl, contractId, supabase)
    
    const elapsed = getElapsedMs(timer)
    log(requestId, 'info', 'PDF extraction successful', {
      contractId,
      chunks: chunks.length,
      elapsedMs: elapsed
    })
    
    return chunks
  } catch (error) {
    const elapsed = getElapsedMs(timer)
    log(requestId, 'error', 'PDF extraction failed', {
      contractId,
      error: error instanceof Error ? error.message : String(error),
      elapsedMs: elapsed
    })
    throw error
  }
}

/**
 * Find the best matching chunk by text similarity (simple word overlap)
 */
function findBestChunkMatch(
  topic: string, 
  chunks: { id: string, text: string, page: number }[]
): string | null {
  const topicLower = topic.toLowerCase()
  const topicWords = topicLower.split(/\s+/).filter(w => w.length > 3)
  
  let bestMatch: { id: string, score: number } | null = null
  
  for (const chunk of chunks) {
    const textLower = chunk.text.toLowerCase()
    // Count how many topic words appear in the chunk text
    let score = 0
    for (const word of topicWords) {
      if (textLower.includes(word)) score++
    }
    // Bonus for exact topic name in text
    if (textLower.includes(topicLower)) score += 5
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { id: chunk.id, score }
    }
  }
  
  return bestMatch?.id ?? null
}

/**
 * Validate AI-returned chunk IDs and fix invalid ones via text matching
 */
function validateAndFixChunkIds(
  comparison: any,
  chunksA: { id: string, text: string, page: number }[],
  chunksB: { id: string, text: string, page: number }[],
  validAIds: Set<string>,
  validBIds: Set<string>,
  requestId: string
): any {
  if (!comparison?.matches || !Array.isArray(comparison.matches)) {
    log(requestId, 'warn', 'No matches array in AI response')
    return { sameType: true, typeWarning: null, matches: [] }
  }

  let fixedCount = 0
  let removedCount = 0

  const validatedMatches = comparison.matches
    .map((match: any) => {
      let { chunkA, chunkB, topic } = match

      // Validate chunkA
      if (chunkA && !validAIds.has(chunkA)) {
        log(requestId, 'warn', `Invalid chunkA "${chunkA}" for topic "${topic}", attempting text match`)
        chunkA = findBestChunkMatch(topic, chunksA)
        if (chunkA) fixedCount++
      }

      // Validate chunkB
      if (chunkB && !validBIds.has(chunkB)) {
        log(requestId, 'warn', `Invalid chunkB "${chunkB}" for topic "${topic}", attempting text match`)
        chunkB = findBestChunkMatch(topic, chunksB)
        if (chunkB) fixedCount++
      }

      // For added/removed, try text match if chunk is still null
      if (!chunkA && match.changeType !== 'added') {
        chunkA = findBestChunkMatch(topic, chunksA)
        if (chunkA) fixedCount++
      }
      if (!chunkB && match.changeType !== 'removed') {
        chunkB = findBestChunkMatch(topic, chunksB)
        if (chunkB) fixedCount++
      }

      return { ...match, chunkA, chunkB }
    })
    .filter((match: any) => {
      // Remove matches where BOTH chunks are null (can't highlight anything)
      if (!match.chunkA && !match.chunkB) {
        removedCount++
        return false
      }
      return true
    })

  log(requestId, 'info', 'Chunk ID validation complete', {
    totalMatches: comparison.matches.length,
    fixedChunkIds: fixedCount,
    removedMatches: removedCount,
    finalMatches: validatedMatches.length
  })

  return {
    ...comparison,
    matches: validatedMatches
  }
}

export const maxDuration = 60

/**
 * GET /api/contracts/compare
 * Returns comparison history for the current user.
 * Optional query param: ?id=xxx to load a single comparison with full data (re-extract chunks + sign URLs).
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const comparisonId = searchParams.get('id')

    // Single comparison detail: re-extract chunks + sign URLs + return stored result
    if (comparisonId) {
      const { data: comparison, error: fetchErr } = await supabase
        .from('contract_comparisons')
        .select('*')
        .eq('id', comparisonId)
        .eq('user_id', user.id)
        .single()

      if (fetchErr || !comparison) {
        return NextResponse.json({ error: 'Comparison not found' }, { status: 404 })
      }

      if (comparison.status !== 'done' || !comparison.result_json) {
        return NextResponse.json({ error: 'Comparison has no results' }, { status: 400 })
      }

      // Re-extract chunks and sign URLs (no AI cost, just PDF processing)
      try {
        const { getDownloadUrl } = await loadR2()
        const { extractChunksWithFallback } = await loadPDF()

        const signUrl = async (rawUrl: string) => {
          try {
            const url = new URL(rawUrl)
            const parts = url.pathname.replace(/^\//, '').split('/')
            parts.shift()
            const key = parts.join('/')
            return (await getDownloadUrl(key, 300)) ?? rawUrl
          } catch { return rawUrl }
        }

        const [signedUrlA, signedUrlB] = await Promise.all([
          signUrl(comparison.contract_a_url),
          signUrl(comparison.contract_b_url),
        ])

        const [chunksA, chunksB] = await Promise.all([
          extractChunksWithFallback(signedUrlA, comparison.contract_a_id, supabase),
          extractChunksWithFallback(signedUrlB, comparison.contract_b_id, supabase),
        ])

        return NextResponse.json({
          comparison: comparison.result_json,
          chunksA,
          chunksB,
          comparisonId: comparison.id,
          signedUrlA,
          signedUrlB,
        })
      } catch (err) {
        console.error('[Compare GET] Failed to re-extract:', err)
        return NextResponse.json({ error: 'Failed to load comparison data' }, { status: 500 })
      }
    }

    // List all comparisons for this user
    const { data: comparisons, error: listErr } = await supabase
      .from('contract_comparisons')
      .select(`
        id,
        contract_a_id,
        contract_b_id,
        status,
        similarity_warning,
        result_json,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (listErr) {
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }

    // Join with contracts table to get names
    const contractIds = new Set<string>()
    for (const c of comparisons || []) {
      if (c.contract_a_id) contractIds.add(c.contract_a_id)
      if (c.contract_b_id) contractIds.add(c.contract_b_id)
    }

    let contractNames: Record<string, string> = {}
    if (contractIds.size > 0) {
      const { data: contracts } = await supabase
        .from('contracts')
        .select('id, title')
        .in('id', Array.from(contractIds))

      if (contracts) {
        contractNames = Object.fromEntries(contracts.map(c => [c.id, c.title || 'Untitled']))
      }
    }

    // Get user's comparison usage
    const { canCompareContract } = await import('@/lib/usage')
    const quotaCheck = await canCompareContract(user.id)

    const history = (comparisons || []).map(c => ({
      id: c.id,
      contractAId: c.contract_a_id,
      contractBId: c.contract_b_id,
      contractAName: c.contract_a_id ? (contractNames[c.contract_a_id] || 'Unknown') : 'Unknown',
      contractBName: c.contract_b_id ? (contractNames[c.contract_b_id] || 'Unknown') : 'Unknown',
      status: c.status,
      matchCount: c.result_json?.matches?.length || 0,
      similarityWarning: c.similarity_warning,
      createdAt: c.created_at,
    }))

    return NextResponse.json({
      history,
      comparisonsUsed: quotaCheck.comparisonsUsed,
      comparisonsLimit: quotaCheck.comparisonsLimit,
    })
  } catch (err) {
    console.error('[Compare GET] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  const totalTimer = startTimer()
  
  log(requestId, 'info', 'Compare request started')
  
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      log(requestId, 'warn', 'Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    log(requestId, 'info', 'User authenticated', { userId: user.id.slice(0, 8) + '...' })

    // Check comparison quota
    const { canCompareContract } = await import('@/lib/usage')
    const quotaCheck = await canCompareContract(user.id)
    if (!quotaCheck.allowed) {
      log(requestId, 'warn', 'Comparison quota exceeded', {
        used: quotaCheck.comparisonsUsed,
        limit: quotaCheck.comparisonsLimit
      })
      return NextResponse.json(
        { 
          error: 'COMPARISON_LIMIT_REACHED',
          message: quotaCheck.reason,
          comparisonsUsed: quotaCheck.comparisonsUsed,
          comparisonsLimit: quotaCheck.comparisonsLimit,
        },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body?.contractAUrl || !body?.contractBUrl) {
      log(requestId, 'error', 'Missing required parameters', { body: Object.keys(body || {}) })
      return NextResponse.json(
        { error: 'contractAUrl and contractBUrl are required' },
        { status: 400 }
      )
    }

    const { contractAUrl, contractBUrl, contractAId, contractBId } = body
    
    log(requestId, 'info', 'Request parameters', {
      contractAId: contractAId || 'none',
      contractBId: contractBId || 'none',
      hasContractAUrl: !!contractAUrl,
      hasContractBUrl: !!contractBUrl
    })

    // Create a pending record
    const recordTimer = startTimer()
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
      log(requestId, 'error', 'Failed to create comparison record', {
        error: insertError?.message,
        elapsedMs: getElapsedMs(recordTimer)
      })
      return NextResponse.json({ error: 'Failed to create comparison record' }, { status: 500 })
    }
    
    log(requestId, 'info', 'Comparison record created', { 
      comparisonId: record.id,
      elapsedMs: getElapsedMs(recordTimer)
    })

    try {
      // Step 1: Generate presigned URLs
      const urlTimer = startTimer()
      const [signedUrlA, signedUrlB] = await Promise.all([
        toPresignedUrl(contractAUrl, requestId),
        toPresignedUrl(contractBUrl, requestId),
      ])
      log(requestId, 'info', 'Presigned URLs generated', { elapsedMs: getElapsedMs(urlTimer) })

      // Step 2: Extract chunks from both sources with fallback
      const extractTimer = startTimer()
      const [chunksA, chunksB] = await Promise.all([
        extractWithLogging(signedUrlA, contractAId, requestId, supabase),
        extractWithLogging(signedUrlB, contractBId, requestId, supabase),
      ])
      
      log(requestId, 'info', 'Chunks extracted', {
        chunksA: chunksA.length,
        chunksB: chunksB.length,
        elapsedMs: getElapsedMs(extractTimer)
      })

      // Limit chunks sent to Claude to avoid token overflow
      const MAX_CHUNKS = 80
      const chunksAForAI = chunksA.slice(0, MAX_CHUNKS).map((chunk: { id: string, text: string, page: number }) => ({ id: chunk.id, text: chunk.text, page: chunk.page }))
      const chunksBForAI = chunksB.slice(0, MAX_CHUNKS).map((chunk: { id: string, text: string, page: number }) => ({ id: chunk.id, text: chunk.text, page: chunk.page }))

      // Build a lookup of valid chunk IDs for validation
      const validChunkAIds = new Set(chunksAForAI.map((c: { id: string }) => c.id))
      const validChunkBIds = new Set(chunksBForAI.map((c: { id: string }) => c.id))

      log(requestId, 'info', 'Chunks prepared for AI', {
        chunksAForAI: chunksAForAI.length,
        chunksBForAI: chunksBForAI.length,
        sampleAIds: chunksAForAI.slice(0, 5).map((c: { id: string }) => c.id),
        sampleBIds: chunksBForAI.slice(0, 5).map((c: { id: string }) => c.id)
      })

      if (!process.env.ANTHROPIC_API_KEY) {
        log(requestId, 'warn', 'No ANTHROPIC_API_KEY, using demo mode')
        const mockResult = buildMockResult(chunksA, chunksB)
        await supabase
          .from('contract_comparisons')
          .update({ status: 'done', result_json: mockResult, similarity_warning: false })
          .eq('id', record.id)
        return NextResponse.json({ comparison: mockResult, chunksA, chunksB, comparisonId: record.id })
      }

      // Step 3: AI Analysis
      const aiTimer = startTimer()
      const { anthropic, generateText } = await loadAI()

      // Build a concise chunk list format: "id | page | text" for each chunk
      const formatChunks = (chunks: { id: string, text: string, page: number }[]) =>
        chunks.map(c => `${c.id} | p${c.page} | ${c.text.substring(0, 120)}`).join('\n')

      const prompt = `You are a contract comparison expert. Compare these two contracts and identify meaningful differences.

IMPORTANT RULES:
- Return ONLY valid JSON, no other text
- For chunkA/chunkB, you MUST use the EXACT chunk IDs from the lists below (e.g. "chunk_p1_0", "chunk_p2_15")
- Only include MEANINGFUL differences — skip boilerplate/headers/dates unless they changed substantively
- Focus on clauses that affect rights, obligations, risks, and liabilities

CONTRACT A CHUNKS (format: id | page | text):
${formatChunks(chunksAForAI)}

CONTRACT B CHUNKS (format: id | page | text):
${formatChunks(chunksBForAI)}

VALID CHUNK IDs FOR CONTRACT A: ${chunksAForAI.map((c: { id: string }) => c.id).join(', ')}
VALID CHUNK IDs FOR CONTRACT B: ${chunksBForAI.map((c: { id: string }) => c.id).join(', ')}

Return this EXACT JSON structure:
{
  "sameType": true,
  "typeWarning": null,
  "matches": [
    {
      "topic": "Section Topic Name",
      "chunkA": "exact_chunk_id_from_A_or_null",
      "chunkB": "exact_chunk_id_from_B_or_null",
      "changeType": "modified|added|removed|unchanged",
      "riskA": "high|medium|low|none",
      "riskB": "high|medium|low|none",
      "riskChange": "increased|decreased|same|new|removed",
      "summary": "One sentence describing what changed and why it matters"
    }
  ]
}

Rules for matches:
- "modified": same topic exists in both, but content differs
- "added": only in Contract B (chunkA should be null)
- "removed": only in Contract A (chunkB should be null)  
- "unchanged": identical in both contracts — DO NOT include unchanged sections
- Order matches by severity: high risk first, then medium, then low
- Include 3-8 matches maximum, focusing on the most important differences
- For chunkA/chunkB: prefer the SECTION HEADING chunk (e.g. "3. OBLIGATIONS") over the content chunk. This ensures the highlight covers the section title.
- NEVER return chunk IDs that are not in the valid ID lists above`

      // Use Sonnet for better quality and consistency, with temperature 0
      const MODEL = 'claude-sonnet-4-6'

      let rawText = ''
      try {
        log(requestId, 'info', `Using AI model ${MODEL}`)
        const result = await generateText({ 
          model: anthropic(MODEL), 
          prompt,
          temperature: 0 // Deterministic output for consistency
        })
        rawText = result.text
        log(requestId, 'info', `AI model ${MODEL} succeeded`, { responseLength: rawText.length })
      } catch (err) {
        log(requestId, 'error', `AI model ${MODEL} failed, trying Haiku fallback`, {
          error: err instanceof Error ? err.message : String(err)
        })
        // Fallback to Haiku
        try {
          const result = await generateText({ 
            model: anthropic('claude-haiku-4-5-20251001'), 
            prompt,
            temperature: 0
          })
          rawText = result.text
        } catch (err2) {
          log(requestId, 'error', 'Haiku fallback also failed', {
            error: err2 instanceof Error ? err2.message : String(err2)
          })
          throw err2
        }
      }

      // Strip markdown code fences if present
      const jsonText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      const rawComparison = JSON.parse(jsonText)
      
      log(requestId, 'info', 'AI analysis complete', { elapsedMs: getElapsedMs(aiTimer) })

      // Step 4: Validate and fix chunk IDs
      // The AI sometimes returns invalid chunk IDs — fix them via text matching
      const comparison = validateAndFixChunkIds(rawComparison, chunksAForAI, chunksBForAI, validChunkAIds, validChunkBIds, requestId)

      await supabase
        .from('contract_comparisons')
        .update({
          status: 'done',
          result_json: comparison,
          similarity_warning: !comparison.sameType,
        })
        .eq('id', record.id)

      // Increment comparison usage counter (after successful comparison)
      const { incrementComparisonUsage } = await import('@/lib/usage')
      await incrementComparisonUsage(user.id)
      log(requestId, 'info', 'Comparison usage incremented')

      const totalElapsed = getElapsedMs(totalTimer)
      log(requestId, 'info', 'Compare request completed successfully', {
        totalElapsedMs: totalElapsed,
        comparisonId: record.id,
        matches: comparison.matches?.length || 0
      })

      return NextResponse.json({ 
        comparison, 
        chunksA, 
        chunksB, 
        comparisonId: record.id,
        signedUrlA,
        signedUrlB
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Comparison failed'
      log(requestId, 'error', 'Compare processing error', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        totalElapsedMs: getElapsedMs(totalTimer)
      })
      
      await supabase
        .from('contract_comparisons')
        .update({ status: 'error' })
        .eq('id', record.id)

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }
  } catch (outerErr) {
    log(requestId, 'error', 'Route handler error', {
      error: outerErr instanceof Error ? outerErr.message : String(outerErr),
      stack: outerErr instanceof Error ? outerErr.stack : undefined,
      totalElapsedMs: getElapsedMs(totalTimer)
    })
    
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