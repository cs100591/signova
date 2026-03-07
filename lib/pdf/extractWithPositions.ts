import { createRequire } from 'module'
import type { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs'

export type PdfChunk = {
  id: string
  text: string
  page: number
  x: number
  y: number
  width: number
  height: number
  pageWidth: number
  pageHeight: number
}

interface TextItem {
  str: string
  dir: string
  width: number
  height: number
  transform: number[] // [a, b, c, d, e, f] where e=x, f=y (baseline from bottom)
  fontName: string
  hasEOL: boolean
}

// Dynamically import pdfjs-dist to avoid module loading issues at build time
async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  return pdfjs
}

// Get worker path at runtime (only runs in Node.js server context)
function getWorkerSrc(): string {
  const require = createRequire(import.meta.url)
  const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')
  return new URL('file://' + workerPath).href
}

/**
 * Extract text chunks with REAL coordinates from a PDF using pdfjs-dist.
 * 
 * Uses the legacy build which is compatible with Node.js server environments.
 * Coordinates are extracted from the actual PDF text positions and flipped
 * from PDF coordinate system (y from bottom) to viewport coordinates (y from top).
 * 
 * Each line of text becomes one chunk, which matches the granularity that
 * AI uses when identifying contract clauses.
 */
export async function extractPdfChunks(pdfUrl: string): Promise<PdfChunk[]> {
  const chunks: PdfChunk[] = []
  
  try {
    // Load pdfjs-dist dynamically
    const pdfjs = await loadPdfJs()
    const { getDocument, GlobalWorkerOptions } = pdfjs
    
    // Set worker source to the legacy worker file (file:// URL for Node.js)
    GlobalWorkerOptions.workerSrc = getWorkerSrc()
    
    // Fetch PDF
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
    }
    
    const buffer = Buffer.from(await response.arrayBuffer())
    
    // Load PDF with pdfjs
    const pdf = await getDocument({ 
      data: buffer,
      verbosity: 0,
    }).promise
    
    let chunkIndex = 0
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const viewport = page.getViewport({ scale: 1.0 })
      const pageWidth = viewport.width
      const pageHeight = viewport.height
      
      // Group text items by line using their y-coordinate (PDF: y from bottom)
      const lineMap = new Map<number, TextItem[]>()
      
      for (const item of textContent.items) {
        if ('str' in item && item.str.trim().length > 0) {
          const textItem = item as TextItem
          const yKey = Math.round(textItem.transform[5])
          
          if (!lineMap.has(yKey)) {
            lineMap.set(yKey, [])
          }
          lineMap.get(yKey)!.push(textItem)
        }
      }
      
      // Sort lines top to bottom (PDF: larger y = higher on page)
      const sortedLines = Array.from(lineMap.entries()).sort((a, b) => b[0] - a[0])
      
      // Create one chunk per line
      for (const [yPdf, items] of sortedLines) {
        // Sort items in line left to right
        items.sort((a, b) => a.transform[4] - b.transform[4])
        
        const text = items.map(item => item.str).join(' ').trim()
        if (text.length <= 5) continue
        
        const firstItem = items[0]
        const lastItem = items[items.length - 1]
        const lineHeight = Math.max(...items.map(item => item.height || 12))
        
        const x = firstItem.transform[4]
        const width = (lastItem.transform[4] + lastItem.width) - x
        
        // Coordinate conversion:
        // PDF: y increases from bottom, transform[5] is baseline position
        // Viewport: y increases from top, we want top of text box
        // So: y_top = pageHeight - (baseline + height)
        const yTop = pageHeight - (yPdf + lineHeight)
        
        chunks.push({
          id: `chunk_p${pageNum}_${chunkIndex++}`,
          text,
          page: pageNum,
          x,
          y: yTop,
          width,
          height: lineHeight,
          pageWidth,
          pageHeight,
        })
      }
      
      page.cleanup()
    }
    
    pdf.destroy()
    
  } catch (error) {
    console.error('[extractPdfChunks] Error:', error)
    throw error
  }
  
  return chunks
}
