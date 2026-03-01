import { ImageAnnotatorClient } from "@google-cloud/vision";
// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "canvas";

// Polyfill DOMMatrix for Node.js environment
if (typeof DOMMatrix === 'undefined') {
  // @ts-ignore
  global.DOMMatrix = class DOMMatrix {
    constructor(init?: any) {}
    multiply(other: DOMMatrix) { return this; }
    translate(x: number, y: number) { return this; }
    scale(x: number, y: number) { return this; }
  };
}

// Initialize Vision client
let visionClient: ImageAnnotatorClient;

try {
  visionClient = new ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });
} catch (error) {
  console.warn("Google Vision not configured:", error);
}

/**
 * OCR image files (JPG, PNG, WEBP)
 */
export const ocrImage = async (imageBuffer: Buffer): Promise<string> => {
  if (!visionClient) {
    throw new Error("OCR service not configured");
  }

  try {
    const [result] = await visionClient.documentTextDetection({
      image: { content: imageBuffer.toString("base64") },
    });

    const text = result.fullTextAnnotation?.text || "";
    
    if (!text || text.trim().length === 0) {
      throw new Error("No text detected in image");
    }

    return text;
  } catch (err: any) {
    console.error("Google Vision OCR failed:", err.message);
    throw new Error("Could not read text from image. Please ensure the image is clear and legible.");
  }
};

/**
 * Process PDF - automatically detect text vs scanned
 */
export const processPDF = async (pdfBuffer: Buffer): Promise<string> => {
  // Step 1: Try to extract text layer
  const textLayerContent = await extractTextLayer(pdfBuffer);
  
  // Step 2: If enough text found, use text layer (not scanned)
  if (textLayerContent.length >= 200) {
    console.log("[OCR] Text-based PDF detected - using text layer");
    return textLayerContent;
  }

  // Step 3: Scanned PDF - convert to images and OCR
  console.log("[OCR] Scanned PDF detected - using OCR");
  return await ocrScannedPDF(pdfBuffer);
};

/**
 * Extract text layer from text-based PDF
 */
const extractTextLayer = async (pdfBuffer: Buffer): Promise<string> => {
  try {
    const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n\n";
    }

    return fullText.trim();
  } catch (error) {
    console.error("[OCR] Text extraction failed:", error);
    return ""; // Fallback to OCR
  }
};

/**
 * OCR scanned PDF (convert pages to images)
 */
const ocrScannedPDF = async (pdfBuffer: Buffer): Promise<string> => {
  if (!visionClient) {
    throw new Error("OCR service not configured");
  }

  try {
    const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
    const totalPages = pdf.numPages;
    
    // Limit to first 20 pages for large documents
    const maxPages = Math.min(totalPages, 20);
    let fullText = "";

    console.log(`[OCR] Processing ${maxPages} of ${totalPages} pages...`);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // 2x for better OCR accuracy

      // Render to canvas
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext("2d");
      
      await page.render({
        canvasContext: context as any,
        viewport,
        // @ts-ignore - canvas is optional for node-canvas
        canvas: canvas as any,
      }).promise;

      // Canvas to JPEG buffer
      const imageBuffer = canvas.toBuffer("image/jpeg", { quality: 0.95 });

      // OCR this page
      const [result] = await visionClient.documentTextDetection({
        image: { content: imageBuffer.toString("base64") },
      });

      const pageText = result.fullTextAnnotation?.text || "";
      fullText += `[Page ${i}]\n${pageText}\n\n`;
    }

    // Add note if document was truncated
    if (totalPages > 20) {
      fullText += `\n[Note: Document has ${totalPages} pages. Analysis based on first 20 pages.]\n`;
    }

    return fullText.trim();
  } catch (error: any) {
    console.error("[OCR] PDF OCR failed:", error.message);
    throw new Error("Could not process scanned PDF. Please try a clearer scan or text-based PDF.");
  }
};

/**
 * Main entry point - process any file type
 */
export const processFile = async (
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ text: string; isScanned: boolean }> => {
  let text = "";
  let isScanned = false;

  try {
    if (mimeType === "application/pdf") {
      // Try text extraction first
      const textLayer = await extractTextLayer(fileBuffer);
      
      if (textLayer.length >= 200) {
        text = textLayer;
        isScanned = false;
        console.log("[OCR] Processed as text-based PDF");
      } else {
        // Must be scanned
        text = await ocrScannedPDF(fileBuffer);
        isScanned = true;
        console.log("[OCR] Processed as scanned PDF");
      }
    } 
    else if (["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      text = await ocrImage(fileBuffer);
      isScanned = true;
      console.log("[OCR] Processed as image");
    }
    else {
      throw new Error(`Unsupported file type: ${mimeType}. Please upload PDF or image (JPG, PNG, WEBP).`);
    }

    // Validate extracted text
    if (!text || text.trim().length < 50) {
      throw new Error(
        isScanned 
          ? "Could not extract text from scanned document. Please ensure the image is clear and text is legible."
          : "Could not extract sufficient text from document. The PDF may be empty or corrupted."
      );
    }

    return { text, isScanned };
  } catch (error: any) {
    console.error("[OCR] Processing failed:", error.message);
    throw error;
  }
};
