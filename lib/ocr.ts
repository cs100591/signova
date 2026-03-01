import { ImageAnnotatorClient } from "@google-cloud/vision";
import { extractTextWithOpenRouter } from "./openrouter-ocr";

// Initialize Vision client
let visionClient: ImageAnnotatorClient | undefined;

try {
  visionClient = new ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });
  console.log("[OCR] Google Vision client initialized");
} catch (error) {
  console.warn("[OCR] Google Vision not configured:", error);
}

/**
 * Simple PDF text extraction using OpenRouter (Gemini)
 * This is more reliable than pdfjs-dist which has compatibility issues
 */
const extractPDFTextWithAI = async (pdfBuffer: Buffer, fileName: string): Promise<string> => {
  console.log("[OCR] Using OpenRouter AI for PDF extraction...");
  
  try {
    const result = await extractTextWithOpenRouter(pdfBuffer, 'application/pdf', fileName);
    return result.text;
  } catch (error: any) {
    console.error("[OCR] OpenRouter PDF extraction failed:", error.message);
    throw new Error("Could not extract text from PDF. Please try a text-based PDF or clearer scan.");
  }
};

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
 * Process PDF - uses AI for reliable extraction
 */
export const processPDF = async (pdfBuffer: Buffer, fileName: string = "document.pdf"): Promise<string> => {
  console.log("[OCR] Processing PDF...");
  
  // Try OpenRouter AI extraction first (most reliable)
  try {
    const text = await extractPDFTextWithAI(pdfBuffer, fileName);
    
    if (text && text.trim().length >= 100) {
      console.log(`[OCR] Successfully extracted ${text.length} characters using AI`);
      return text;
    }
    
    throw new Error("Insufficient text extracted");
  } catch (error: any) {
    console.error("[OCR] PDF processing failed:", error.message);
    throw new Error("Could not extract text from PDF. Please ensure it's not password-protected and contains selectable text, or try uploading as an image.");
  }
};

/**
 * Main entry point - process any file type
 */
export const processFile = async (
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string = "document"
): Promise<{ text: string; isScanned: boolean; ocrSource: "vision" | "openrouter" }> => {
  let text = "";
  let isScanned = false;
  let ocrSource: "vision" | "openrouter" = "openrouter";

  try {
    if (mimeType === "application/pdf") {
      // PDF - use AI extraction
      text = await processPDF(fileBuffer, fileName);
      isScanned = true;
      ocrSource = "openrouter";
    } 
    else if (["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      // Images - try Google Vision first, fallback to OpenRouter
      if (visionClient) {
        try {
          text = await ocrImage(fileBuffer);
          isScanned = true;
          ocrSource = "vision";
          console.log("[OCR] Processed image with Google Vision");
        } catch (visionError: any) {
          console.warn("[OCR] Google Vision failed, trying OpenRouter:", visionError.message);
          const result = await extractTextWithOpenRouter(fileBuffer, mimeType, fileName);
          text = result.text;
          isScanned = true;
          ocrSource = "openrouter";
          console.log("[OCR] Processed image with OpenRouter fallback");
        }
      } else {
        // No Vision client, use OpenRouter directly
        const result = await extractTextWithOpenRouter(fileBuffer, mimeType, fileName);
        text = result.text;
        isScanned = true;
        ocrSource = "openrouter";
        console.log("[OCR] Processed image with OpenRouter (no Vision)");
      }
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // Final validation
    if (!text || text.trim().length < 50) {
      throw new Error(
        "Could not extract sufficient text from the document. The file may be empty, corrupted, or password-protected."
      );
    }

    return { text, isScanned, ocrSource };
  } catch (error: any) {
    console.error("[OCR] Processing failed:", error.message);
    throw error;
  }
};
