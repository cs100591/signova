import PDFParser from 'pdf2json';

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
 * Extract text chunks from PDF using pdf2json with real coordinates.
 * 
 * pdf2json provides real PDF coordinates without requiring browser APIs,
 * making it ideal for Vercel serverless functions.
 */
export async function extractPdfChunks(pdfUrl: string): Promise<PdfChunk[]> {
  try {
    // Fetch PDF
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Parse with pdf2json
    const pdfData = await parsePDF(buffer);
    
    const chunks: PdfChunk[] = [];
    let chunkIndex = 0;
    
    pdfData.Pages.forEach((page: any, pageIndex: number) => {
      const pageNum = pageIndex + 1;
      const pageWidth = page.Width || 612;
      const pageHeight = page.Height || 792;
      
      // Process text blocks
      if (page.Texts && Array.isArray(page.Texts)) {
        page.Texts.forEach((textBlock: any) => {
          const text = decodeURIComponent(textBlock.R?.map((r: any) => r.T).join('') || '');
          
          if (text.trim().length <= 3) return;
          
          // pdf2json coordinates are relative to page (0-100 scale typically)
          // Convert to PDF points
          const x = (textBlock.x / 100) * pageWidth;
          const y = (textBlock.y / 100) * pageHeight;
          
          // Estimate width based on text length and font size
          const fontSize = textBlock.R?.[0]?.TS?.[1] || 12;
          const width = Math.min(text.length * (fontSize * 0.6), pageWidth - x - 50);
          const height = fontSize * 1.2;
          
          chunks.push({
            id: `chunk_p${pageNum}_${chunkIndex++}`,
            text: text.trim(),
            page: pageNum,
            x,
            y,
            width,
            height,
            pageWidth,
            pageHeight,
          });
        });
      }
    });
    
    console.log(`[extractPdfChunks] Extracted ${chunks.length} chunks from ${pdfData.Pages.length} pages`);
    
    if (chunks.length === 0) {
      throw new Error('NO_TEXT_EXTRACTED');
    }
    
    return chunks;
    
  } catch (error) {
    // Re-throw specific error codes for fallback handling
    if (error instanceof Error && error.message === 'NO_TEXT_EXTRACTED') {
      throw error;
    }
    
    console.error('[extractPdfChunks] Error:', error);
    throw new Error(
      'Unable to process this PDF file. Please try a different file or contact support if the problem persists.'
    );
  }
}

/**
 * Parse PDF buffer using pdf2json
 */
function parsePDF(buffer: Buffer): Promise<any> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    
    pdfParser.on('pdfParser_dataError', (errData: any) => {
      reject(new Error(`PDF parse error: ${errData.parserError}`));
    });
    
    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      resolve(pdfData);
    });
    
    pdfParser.parseBuffer(buffer);
  });
}

/**
 * Extract chunks from PDF or fallback to extracted_text from database
 * for scanned/image-based PDFs
 */
export async function extractChunksWithFallback(
  pdfUrl: string,
  contractId: string | null,
  supabase: any
): Promise<PdfChunk[]> {
  try {
    // Try PDF extraction first
    return await extractPdfChunks(pdfUrl);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // If it's a "no text" error and we have a contract ID, try database fallback
    if (errorMessage.includes('NO_TEXT_EXTRACTED') && contractId) {
      console.log(`[extractChunksWithFallback] PDF extraction returned no text, trying database fallback for ${contractId}`);
      
      try {
        const { data: contract, error: dbError } = await supabase
          .from('contracts')
          .select('extracted_text, contract_name')
          .eq('id', contractId)
          .single();
        
        if (dbError) {
          console.error('[extractChunksWithFallback] Database error:', dbError.message);
        } else if (contract?.extracted_text) {
          // Convert extracted_text to chunks format
          // For scanned PDFs, we don't have real coordinates, so we create
          // placeholder chunks at the top of the page
          const lines = contract.extracted_text
            .split('\n')
            .filter((line: string) => line.trim().length > 5);
          
          const chunks: PdfChunk[] = [];
          const DEFAULT_PAGE_WIDTH = 612;
          const DEFAULT_PAGE_HEIGHT = 792;
          const LINE_HEIGHT = 14;
          
          // Group lines into logical chunks (e.g., every 5 lines = 1 chunk)
          const CHUNK_SIZE = 5;
          for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
            const chunkLines = lines.slice(i, i + CHUNK_SIZE);
            const text = chunkLines.join(' ');
            const lineIndex = Math.floor(i / CHUNK_SIZE);
            
            chunks.push({
              id: `chunk_scanned_${i}`,
              text: text.trim(),
              page: 1, // Scanned PDFs often single page or we don't know page numbers
              x: 50,
              y: 50 + (lineIndex * LINE_HEIGHT * CHUNK_SIZE),
              width: Math.min(text.length * 6, 512),
              height: LINE_HEIGHT * CHUNK_SIZE,
              pageWidth: DEFAULT_PAGE_WIDTH,
              pageHeight: DEFAULT_PAGE_HEIGHT,
            });
          }
          
          console.log(`[extractChunksWithFallback] Fallback extraction successful: ${chunks.length} chunks from extracted_text`);
          return chunks;
        }
      } catch (fallbackError) {
        console.error('[extractChunksWithFallback] Fallback extraction failed:', fallbackError);
      }
    }
    
    // Re-throw original error if fallback didn't work
    throw error;
  }
}
