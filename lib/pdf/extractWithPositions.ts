import { PDFParse, VerbosityLevel } from 'pdf-parse'

// Disable web worker — use same-thread parsing (required for Vercel serverless)
try { PDFParse.setWorker('') } catch { /* pdfjs may not be ready yet */ }

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
 * Extract text chunks with approximate coordinates from a PDF URL.
 * Uses pdf-parse v2 with stopAtErrors:false to recover from structural PDF errors.
 * Requires Node.js 22+ (set via package.json engines) for pdfjs-dist v5 compatibility.
 */
export async function extractPdfChunks(pdfUrl: string): Promise<PdfChunk[]> {
  const response = await fetch(pdfUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())

  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    stopAtErrors: false,
    verbosity: VerbosityLevel.ERRORS,
    disableFontFace: true,
    isEvalSupported: false,
  })

  const result = await parser.getText()

  const chunks: PdfChunk[] = []
  let chunkIndex = 0

  for (const page of result.pages) {
    const pageNum = page.num
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
