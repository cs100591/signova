import { ImageAnnotatorClient } from "@google-cloud/vision";
import { extractTextWithOpenRouter } from "./openrouter-ocr";

// Initialize Vision client (optional - only if configured)
let visionClient: ImageAnnotatorClient | undefined;

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    visionClient = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
    console.log("[OCR] Google Vision client initialized");
  }
} catch (error) {
  console.warn("[OCR] Google Vision not configured:", error);
}

/**
 * Extract text from a text-based PDF using pdf-parse
 * This is the primary method - fast and free, no AI needed
 */
const extractTextFromPDF = async (pdfBuffer: Buffer): Promise<string> => {
  try {
    // Dynamically import pdf-parse to avoid issues at module load time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const fn = pdfParse.default ?? pdfParse;
    const data = await fn(pdfBuffer);
    return data.text || "";
  } catch (err: any) {
    console.warn("[OCR] pdf-parse failed:", err.message);
    return "";
  }
};

/**
 * OCR image files (JPG, PNG, WEBP) using Google Vision
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
 * Process PDF - tries native text extraction first, then AI OCR for scanned PDFs
 */
export const processPDF = async (pdfBuffer: Buffer, fileName: string = "document.pdf"): Promise<string> => {
  console.log("[OCR] Processing PDF...");

  // Step 1: Try native text extraction (fastest, most accurate for text PDFs)
  const nativeText = await extractTextFromPDF(pdfBuffer);
  
  if (nativeText && nativeText.trim().length >= 100) {
    console.log(`[OCR] Native PDF text extraction successful: ${nativeText.length} chars`);
    return nativeText;
  }

  console.log("[OCR] Native extraction got insufficient text, trying AI OCR...");

  // Step 2: Try OpenRouter AI (for scanned PDFs / image PDFs)
  try {
    const result = await extractTextWithOpenRouter(pdfBuffer, "application/pdf", fileName);
    if (result.text && result.text.trim().length >= 100) {
      console.log(`[OCR] OpenRouter OCR successful: ${result.text.length} chars`);
      return result.text;
    }
  } catch (err: any) {
    console.warn("[OCR] OpenRouter OCR failed:", err.message);
  }

  // If native text was between 50-99 chars, still use it
  if (nativeText && nativeText.trim().length >= 50) {
    return nativeText;
  }

  throw new Error(
    "Could not extract text from PDF. Please ensure the PDF contains selectable text and is not password-protected. For scanned documents, please upload as an image (JPG/PNG)."
  );
};

/**
 * Main entry point - process any file type
 */
export const processFile = async (
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string = "document"
): Promise<{ text: string; isScanned: boolean; ocrSource: "vision" | "openrouter" | "native" }> => {
  let text = "";
  let isScanned = false;
  let ocrSource: "vision" | "openrouter" | "native" = "native";

  try {
    if (mimeType === "application/pdf") {
      // PDF: try native first, then AI OCR
      const nativeText = await extractTextFromPDF(fileBuffer);
      
      if (nativeText && nativeText.trim().length >= 100) {
        text = nativeText;
        isScanned = false;
        ocrSource = "native";
        console.log("[OCR] Processed PDF with native text extraction");
      } else {
        // Scanned PDF - try AI OCR
        try {
          const result = await extractTextWithOpenRouter(fileBuffer, "application/pdf", fileName);
          text = result.text;
          isScanned = true;
          ocrSource = "openrouter";
          console.log("[OCR] Processed scanned PDF with OpenRouter");
        } catch (aiErr: any) {
          // Use whatever native text we got, even if short
          if (nativeText && nativeText.trim().length > 0) {
            text = nativeText;
            ocrSource = "native";
          } else {
            throw new Error(
              "Could not extract text from this PDF. Please ensure it contains selectable text or upload as JPG/PNG image."
            );
          }
        }
      }
    } else if (["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
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
