// pdf-parse-fork is a CommonJS fork that bundles pdfjs v2.x — no browser APIs required
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse-fork')

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
 * Uses pdf-parse (pure Node.js, no browser APIs) for reliable Vercel compatibility.
 * Coordinates are approximate — based on text position within the page.
 */
export async function extractPdfChunks(pdfUrl: string): Promise<PdfChunk[]> {
  const response = await fetch(pdfUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())

  const pageTexts: string[] = []

  // Custom page renderer captures text per page
  const renderPage = async (pageData: { getTextContent: () => Promise<{ items: Array<{ str?: string }> }> }) => {
    const content = await pageData.getTextContent()
    const text = content.items
      .filter((item) => typeof item.str === 'string' && item.str.trim().length > 0)
      .map((item) => item.str)
      .join(' ')
    pageTexts.push(text)
    return text
  }

  await pdfParse(buffer, { pagerender: renderPage })

  const chunks: PdfChunk[] = []
  let chunkIndex = 0

  for (let pageIdx = 0; pageIdx < pageTexts.length; pageIdx++) {
    const pageNum = pageIdx + 1
    const pageText = pageTexts[pageIdx]

    // Split into paragraph-like chunks on 3+ whitespace characters
    const rawParagraphs = pageText.split(/[ \t]{3,}|\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 10)
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
