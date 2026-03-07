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
  const { extractPdfChunks } = await import('@/lib/pdf/extractWithPositions')
  return { extractPdfChunks }
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
 * Fetch PDF with detailed logging and timeout
 */
async function fetchPdf(url: string, requestId: string, label: string): Promise<Buffer> {
  const timer = startTimer()
  log(requestId, 'info', `Fetching PDF ${label}`, { url: url.substring(0, 100) })
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout
    
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'Accept': 'application/pdf,*/*'
      }
    })
    clearTimeout(timeoutId)
    
    const elapsed = getElapsedMs(timer)
    
    if (!response.ok) {
      log(requestId, 'error', `PDF fetch failed ${label}`, {
        status: response.status,
        statusText: response.statusText,
        elapsedMs: elapsed
      })
      throw new Error(`Failed to fetch PDF ${label}: HTTP ${response.status} ${response.statusText}`)
    }
    
    const buffer = Buffer.from(await response.arrayBuffer())
    
    log(requestId, 'info', `PDF fetched successfully ${label}`, {
      size: buffer.length,
      contentType: response.headers.get('content-type'),
      elapsedMs: elapsed
    })
    
    return buffer
  } catch (err) {
    const elapsed = getElapsedMs(timer)
    
    if (err instanceof Error && err.name === 'AbortError') {
      log(requestId, 'error', `PDF fetch timeout ${label}`, { elapsedMs: elapsed })
      throw new Error(`Timeout fetching PDF ${label} after 30 seconds`)
    }
    
    log(requestId, 'error', `PDF fetch error ${label}`, {
      error: err instanceof Error ? err.message : String(err),
      elapsedMs: elapsed
    })
    throw err
  }
}

/**
 * Extract chunks from PDF or fallback to extracted_text from database
 */
async function extractChunksWithFallback(
  pdfUrl: string, 
  contractId: string | null,
  requestId: string,
  supabase: any
): Promise<any[]> {
  const timer = startTimer()
  
  // Try 1: Extract from PDF URL
  try {
    log(requestId, 'info', 'Attempting PDF extraction', { contractId })
    const { extractPdfChunks } = await loadPDF()
    const chunks = await extractPdfChunks(pdfUrl)
    
    const elapsed = getElapsedMs(timer)
    log(requestId, 'info', 'PDF extraction successful', {
      contractId,
      chunks: chunks.length,
      elapsedMs: elapsed
    })
    
    return chunks
  } catch (pdfError) {
    const elapsed = getElapsedMs(timer)
    log(requestId, 'warn', 'PDF extraction failed, trying fallback', {
      contractId,
      error: pdfError instanceof Error ? pdfError.message : String(pdfError),
      elapsedMs: elapsed
    })
    
    // Try 2: Fallback to database extracted_text
    if (contractId) {
      try {
        log(requestId, 'info', 'Fetching extracted_text from database', { contractId })
        
        const { data: contract, error } = await supabase
          .from('contracts')
          .select('extracted_text, contract_name')
          .eq('id', contractId)
          .single()
        
        if (error) {
          log(requestId, 'error', 'Database fetch error', { contractId, error: error.message })
        } else if (contract?.extracted_text) {
          // Convert extracted_text to chunks format
          const lines = contract.extracted_text.split('\n').filter((line: string) => line.trim().length > 5)
          const chunks = lines.map((line: string, index: number) => ({
            id: `chunk_fallback_${index}`,
            text: line.trim(),
            page: 1, // We don't know the page without PDF parsing
            x: 50,
            y: index * 14,
            width: Math.min(line.length * 6, 512),
            height: 14,
            pageWidth: 612,
            pageHeight: 792,
          }))
          
          log(requestId, 'info', 'Fallback extraction successful', {
            contractId,
            chunks: chunks.length,
            source: 'extracted_text'
          })
          
          return chunks
        } else {
          log(requestId, 'warn', 'No extracted_text found in database', { contractId })
        }
      } catch (fallbackError) {
        log(requestId, 'error', 'Fallback extraction failed', {
          contractId,
          error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        })
      }
    }
    
    // Both methods failed
    log(requestId, 'error', 'All extraction methods failed', { contractId })
    throw pdfError
  }
}

export const maxDuration = 60

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
        extractChunksWithFallback(signedUrlA, contractAId, requestId, supabase),
        extractChunksWithFallback(signedUrlB, contractBId, requestId, supabase),
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

      log(requestId, 'info', 'Chunks prepared for AI', {
        chunksAForAI: chunksAForAI.length,
        chunksBForAI: chunksBForAI.length
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

      // Try Haiku first, fall back to Sonnet, then Opus
      const MODELS = [
        'claude-haiku-4-5-20251001',
        'claude-sonnet-4-5-20251001',
        'claude-opus-4-5-20251001',
      ] as const

      let rawText = ''
      let lastError: unknown
      for (const modelId of MODELS) {
        try {
          log(requestId, 'info', `Trying AI model ${modelId}`)
          const result = await generateText({ model: anthropic(modelId), prompt })
          rawText = result.text
          log(requestId, 'info', `AI model ${modelId} succeeded`, { responseLength: rawText.length })
          break
        } catch (err) {
          log(requestId, 'error', `AI model ${modelId} failed`, {
            error: err instanceof Error ? err.message : String(err)
          })
          lastError = err
        }
      }
      
      if (!rawText) {
        throw lastError
      }

      // Strip markdown code fences if present
      const jsonText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      const comparison = JSON.parse(jsonText)
      
      log(requestId, 'info', 'AI analysis complete', { elapsedMs: getElapsedMs(aiTimer) })

      await supabase
        .from('contract_comparisons')
        .update({
          status: 'done',
          result_json: comparison,
          similarity_warning: !comparison.sameType,
        })
        .eq('id', record.id)

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