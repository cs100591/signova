import vision from '@google-cloud/vision';
import * as pdfjsLib from 'pdfjs-dist';
import { createCanvas } from 'canvas';

/**
 * Get Google Vision client - works in both local and Vercel environments
 * 
 * Local: Uses GOOGLE_APPLICATION_CREDENTIALS (file path)
 * Vercel: Uses GOOGLE_VISION_KEY_JSON (JSON string)
 */
function getVisionClient() {
  if (process.env.GOOGLE_VISION_KEY_JSON) {
    // Vercel production environment - use JSON directly
    const credentials = JSON.parse(process.env.GOOGLE_VISION_KEY_JSON);
    return new vision.ImageAnnotatorClient({ credentials });
  }
  
  // Local development - use key file
  return new vision.ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './gcp-key.json',
  });
}

const visionClient = getVisionClient();

// OCR Image (JPG / PNG / WEBP)
export async function ocrImage(imageBuffer: Buffer): Promise<string> {
  const [result] = await visionClient.documentTextDetection({
    image: { content: imageBuffer.toString('base64') }
  });
  
  const text = result.fullTextAnnotation?.text || '';
  if (!text) throw new Error('No text detected in image');
  return text;
}

// Extract text layer from text-based PDF
async function extractTextLayer(pdfBuffer: Buffer): Promise<string> {
  try {
    const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText.trim();
  } catch {
    return ''; // Extraction failed, fallback to OCR
  }
}

// OCR Scanned PDF (convert pages to images)
async function ocrScannedPDF(pdfBuffer: Buffer): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
  const totalPages = pdf.numPages;
  
  // Protection: only OCR first 20 pages
  const maxPages = Math.min(totalPages, 20);
  let fullText = '';

  console.log(`Scanning ${maxPages} of ${totalPages} pages via OCR...`);

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });

    // Render to canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (page as any).render({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvasContext: ctx as any,
      viewport
    }).promise;

    // Canvas → JPEG buffer
    const imageBuffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });

    // OCR this page
    const [result] = await visionClient.documentTextDetection({
      image: { content: imageBuffer.toString('base64') }
    });

    const pageText = result.fullTextAnnotation?.text || '';
    fullText += `[Page ${i}]\n${pageText}\n\n`;
  }

  if (totalPages > 20) {
    fullText += `\n[Note: Document has ${totalPages} pages. Analysis based on first 20 pages.]`;
  }

  return fullText.trim();
}

// Process PDF (auto-detect text vs scanned)
export async function processPDF(pdfBuffer: Buffer): Promise<string> {
  // Step 1: Try to extract text layer
  const textLayerContent = await extractTextLayer(pdfBuffer);
  
  // Step 2: Check if has enough text (< 200 chars = scanned)
  if (textLayerContent.length >= 200) {
    console.log('Text PDF detected - using text layer');
    return textLayerContent;
  }

  // Step 3: Scanned PDF - OCR each page
  console.log('Scanned PDF detected - switching to OCR');
  return await ocrScannedPDF(pdfBuffer);
}

// Main export - handles all file types
export async function extractText(file: Buffer, mimeType: string): Promise<string> {
  // PDF
  if (mimeType === 'application/pdf') {
    return await processPDF(file);
  }
  
  // Images
  if (['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    return await ocrImage(file);
  }
  
  throw new Error(`Unsupported file type: ${mimeType}`);
}

export { visionClient };
