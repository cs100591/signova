export type PdfChunk = {
  id: string
  text: string
  page: number
  x: number
  y: number
  width: number
  height: number
}

const PDF_WIDTH = 612  // standard PDF page width in pts
const PDF_HEIGHT = 792 // standard PDF page height in pts
const MARGIN_X = 50
const MARGIN_Y = 72

/**
 * Extract text from a PDF using Claude's native PDF vision capability.
 * Returns text with page markers like [PAGE 1], [PAGE 2], etc.
 */
async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const base64PDF = pdfBuffer.toString('base64')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'pdfs-2024-09-25',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64PDF,
              },
            },
            {
              type: 'text',
              text: 'Extract ALL text from this document. At the start of each page, insert a marker like [PAGE 1], [PAGE 2], etc. Preserve the structure and paragraphs. Return only the extracted text with page markers, nothing else.',
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude PDF extraction failed: ${response.status} — ${err.slice(0, 200)}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}

/**
 * Parse Claude-extracted text (with [PAGE N] markers) into page-level blocks.
 */
function parsePages(text: string): { pageNum: number; text: string }[] {
  const pages: { pageNum: number; text: string }[] = []
  const pageRegex = /\[PAGE\s+(\d+)\]/gi
  const markers: { index: number; pageNum: number }[] = []

  let match: RegExpExecArray | null
  while ((match = pageRegex.exec(text)) !== null) {
    markers.push({ index: match.index, pageNum: parseInt(match[1], 10) })
  }

  if (markers.length === 0) {
    // No page markers found — treat entire text as page 1
    if (text.trim().length > 0) {
      pages.push({ pageNum: 1, text: text.trim() })
    }
    return pages
  }

  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index + `[PAGE ${markers[i].pageNum}]`.length
    const end = i + 1 < markers.length ? markers[i + 1].index : text.length
    const pageText = text.slice(start, end).trim()
    if (pageText.length > 0) {
      pages.push({ pageNum: markers[i].pageNum, text: pageText })
    }
  }

  return pages
}

/**
 * Extract text chunks with approximate coordinates from a PDF URL.
 * Uses Claude's native PDF reading (no pdf-parse/pdfjs-dist dependency).
 */
export async function extractPdfChunks(pdfUrl: string): Promise<PdfChunk[]> {
  const response = await fetch(pdfUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())

  const rawText = await extractTextFromPdf(buffer)
  const pages = parsePages(rawText)

  const chunks: PdfChunk[] = []
  let chunkIndex = 0

  for (const page of pages) {
    const pageNum = page.pageNum
    const rawParagraphs = page.text
      .split(/[ \t]{3,}|\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 10)

    if (rawParagraphs.length === 0) continue

    const chunkHeight = Math.min((PDF_HEIGHT - MARGIN_Y * 2) / rawParagraphs.length, 60)

    for (let i = 0; i < rawParagraphs.length; i++) {
      chunks.push({
        id: `chunk_p${pageNum}_${chunkIndex++}`,
        text: rawParagraphs[i],
        page: pageNum,
        x: MARGIN_X,
        y: MARGIN_Y + i * chunkHeight,
        width: PDF_WIDTH - MARGIN_X * 2,
        height: Math.max(chunkHeight - 4, 12),
      })
    }
  }

  return chunks
}
