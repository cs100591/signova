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
 * Extract text chunks from PDF using pdf-parse-fork.
 * 
 * This function handles common PDF parsing errors and provides
 * user-friendly error messages.
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
    let result;
    try {
      result = await pdf(buffer);
    } catch (parseErr) {
      const errorMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      console.error('[extractPdfChunks] Parse error:', errorMsg);
      
      // Handle specific PDF errors
      if (errorMsg.includes('bad XRef') || errorMsg.includes('XRef')) {
        throw new Error(
          'This PDF file appears to be corrupted or has an invalid structure. ' +
          'Please try re-saving the PDF from its original source, or upload a different file.'
        );
      }
      
      if (errorMsg.includes('password') || errorMsg.includes('encrypted')) {
        throw new Error(
          'This PDF file is password-protected or encrypted. ' +
          'Please remove the password protection and try again.'
        );
      }
      
      if (errorMsg.includes('stream') || errorMsg.includes('EOF')) {
        throw new Error(
          'This PDF file appears to be incomplete or damaged. ' +
          'Please check the file and try uploading again.'
        );
      }
      
      // Generic parse error
      throw new Error(`Failed to parse PDF: ${errorMsg}`);
    }
    
    // Check if we got any text
    if (!result.text || result.text.trim().length === 0) {
      throw new Error(
        'This PDF file contains no extractable text. ' +
        'It may be a scanned image or have text stored as images. ' +
        'Please try uploading a text-based PDF.'
      );
    }
    
    // Split by page marker if present, otherwise estimate
    const pages = result.text.split(/\f/);
    
    const chunks: PdfChunk[] = [];
    let chunkIndex = 0;
    
    // Standard US Letter size in points
    const DEFAULT_PAGE_WIDTH = 612;
    const DEFAULT_PAGE_HEIGHT = 792;
    const LINE_HEIGHT = 14;
    
    pages.forEach((pageText, pageIndex) => {
      const pageNum = pageIndex + 1;
      const lines = pageText.split('\n').filter(line => line.trim().length > 5);
      
      lines.forEach((line, lineIndex) => {
        const yFromTop = lineIndex * LINE_HEIGHT;
        
        chunks.push({
          id: `chunk_p${pageNum}_${chunkIndex++}`,
          text: line.trim(),
          page: pageNum,
          x: 50,
          y: yFromTop,
          width: Math.min(line.length * 6, 512),
          height: LINE_HEIGHT,
          pageWidth: DEFAULT_PAGE_WIDTH,
          pageHeight: DEFAULT_PAGE_HEIGHT,
        });
      });
    });
    
    console.log(`[extractPdfChunks] Extracted ${chunks.length} chunks from ${pages.length} pages`);
    
    if (chunks.length === 0) {
      throw new Error(
        'Could not extract meaningful text from this PDF. ' +
        'The file may be empty or contain only images.'
      );
    }
    
    return chunks;
    
  } catch (error) {
    // Re-throw if it's already a user-friendly error
    if (error instanceof Error && error.message.includes('PDF')) {
      throw error;
    }
    
    console.error('[extractPdfChunks] Unexpected error:', error);
    throw new Error(
      'Unable to process this PDF file. Please try a different file or contact support if the problem persists.'
    );
  }
}
