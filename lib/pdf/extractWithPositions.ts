import pdf from 'pdf-parse-fork';

export type PdfChunk = {
  id: string;
  text: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  pageWidth: number;
  pageHeight: number;
}

/**
 * Extract text chunks from PDF using pdf-parse-fork (Node.js native, no browser APIs).
 * This is more reliable on Vercel than pdfjs-dist which requires DOM polyfills.
 * 
 * Uses estimated positions based on line-by-line parsing.
 */
export async function extractPdfChunks(pdfUrl: string): Promise<PdfChunk[]> {
  try {
    // Fetch PDF
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Parse with pdf-parse-fork
    const result = await pdf(buffer);
    
    // Split by page marker if present, otherwise estimate
    const pages = result.text.split(/\f/);
    
    const chunks: PdfChunk[] = [];
    let chunkIndex = 0;
    
    // Standard US Letter size in points (pdf-parse doesn't give us page dimensions)
    const DEFAULT_PAGE_WIDTH = 612;
    const DEFAULT_PAGE_HEIGHT = 792;
    const LINE_HEIGHT = 14;
    
    pages.forEach((pageText, pageIndex) => {
      const pageNum = pageIndex + 1;
      const lines = pageText.split('\n').filter(line => line.trim().length > 5);
      
      lines.forEach((line, lineIndex) => {
        // Estimate position - these are approximations
        const yFromTop = lineIndex * LINE_HEIGHT;
        
        chunks.push({
          id: `chunk_p${pageNum}_${chunkIndex++}`,
          text: line.trim(),
          page: pageNum,
          x: 50, // Estimated left margin
          y: yFromTop,
          width: Math.min(line.length * 6, 512), // Estimate width based on character count
          height: LINE_HEIGHT,
          pageWidth: DEFAULT_PAGE_WIDTH,
          pageHeight: DEFAULT_PAGE_HEIGHT,
        });
      });
    });
    
    console.log(`[extractPdfChunks] Extracted ${chunks.length} chunks from ${pages.length} pages`);
    return chunks;
    
  } catch (error) {
    console.error('[extractPdfChunks] Error:', error);
    throw error;
  }
}
