import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'

export type PdfChunk = {
  id: string
  text: string
  page: number
  x: number
  y: number
  width: number
  height: number
}

// Disable worker for server-side extraction to avoid worker file issues
pdfjs.GlobalWorkerOptions.workerSrc = ''

/**
 * Extract text chunks with REAL coordinates from a PDF using pdfjs-dist.
 */
export async function extractPdfChunks(pdfUrl: string): Promise<PdfChunk[]> {
  const chunks: PdfChunk[] = []
  
  try {
    // Fetch PDF
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
    }
    
    const buffer = Buffer.from(await response.arrayBuffer())
    
    // Load PDF with pdfjs
    const loadingTask = pdfjs.getDocument({ data: buffer })
    const pdf = await loadingTask.promise
    
    let chunkIndex = 0
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      // Group text items by line using their y-coordinate
      const lineMap = new Map<number, TextItem[]>()
      
      for (const item of textContent.items) {
        if ('str' in item && item.str.trim().length > 0) {
          const textItem = item as TextItem
          // Get y-coordinate from transform matrix
          // transform[5] is the y position
          const y = textItem.transform[5]
          // Round to nearest integer to group close y-values
          const yKey = Math.round(y)
          
          if (!lineMap.has(yKey)) {
            lineMap.set(yKey, [])
          }
          lineMap.get(yKey)!.push(textItem)
        }
      }
      
      // Sort lines by y-coordinate (top to bottom)
      const sortedLines = Array.from(lineMap.entries())
        .sort((a, b) => b[0] - a[0]) // PDF coordinates: higher y = lower on page
      
      // Process each line
      for (const [y, items] of sortedLines) {
        // Sort items in line by x-coordinate (left to right)
        items.sort((a, b) => a.transform[4] - b.transform[4])
        
        // Combine text in the same line
        const lineText = items.map(item => item.str).join(' ').trim()
        
        if (lineText.length > 10) {
          // Calculate bounding box for the entire line
          const firstItem = items[0]
          const lastItem = items[items.length - 1]
          
          const x = firstItem.transform[4]
          const yPos = firstItem.transform[5]
          const width = (lastItem.transform[4] + lastItem.width) - x
          // Estimate height from font size or use default
          const height = items[0].height || 12
          
          chunks.push({
            id: `chunk_p${pageNum}_${chunkIndex++}`,
            text: lineText,
            page: pageNum,
            x: x,
            y: yPos,
            width: width,
            height: height,
          })
        }
      }
      
      // Clean up
      page.cleanup()
    }
    
    // Clean up PDF document
    pdf.destroy()
    
  } catch (error) {
    console.error('[extractPdfChunks] Error:', error)
    throw error
  }
  
  return chunks
}

interface TextItem {
  str: string
  dir: string
  width: number
  height: number
  transform: number[] // [a, b, c, d, e, f] where e=x, f=y
  fontName: string
  hasEOL: boolean
}
