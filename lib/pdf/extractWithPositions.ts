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
 * Uses pdf-parse v2 with stopAtErrors:false — recovers from bad XRef tables
 * and other structural PDF errors.
 *
 * IMPORTANT: pdf-parse is loaded via dynamic import() so the toHex polyfill
 * can be applied BEFORE pdfjs-dist v5 module initialization runs.
 * Static ESM imports are hoisted — a top-level import would crash on Node 18/20.
 */
export async function extractPdfChunks(pdfUrl: string): Promise<PdfChunk[]> {
  // 1. Polyfill Uint8Array.prototype.toHex BEFORE loading pdfjs-dist v5
  //    (Node.js < 22 lacks this method; pdfjs-dist v5 calls it at module init)
  if (!(Uint8Array.prototype as unknown as Record<string, unknown>).toHex) {
    Object.defineProperty(Uint8Array.prototype, 'toHex', {
      value: function (): string {
        return Array.from(this as Uint8Array)
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join('')
      },
      writable: true,
      configurable: true,
    })
  }

  // 2. Dynamic import — NOW safe because toHex polyfill is in place
  const { PDFParse, VerbosityLevel } = await import('pdf-parse')
  try { PDFParse.setWorker('') } catch { /* ignore if pdfjs not ready */ }

  // 3. Fetch the PDF
  const response = await fetch(pdfUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())

  // 4. Parse with error recovery enabled
  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    stopAtErrors: false,      // recover from bad XRef / structural errors
    verbosity: VerbosityLevel.ERRORS,
    disableFontFace: true,
    isEvalSupported: false,
  })

  const result = await parser.getText()

  // 5. Build chunks from extracted page texts
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
