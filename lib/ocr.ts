/**
 * OCR Module - Text extraction from PDFs and images
 *
 * Strategy:
 * 1. PDFs → Send directly to Claude Sonnet as base64 (native PDF support)
 * 2. Images → Google Vision OCR first, fallback to Claude
 */

// Initialize Vision client (optional)
let visionClient: any = null;

const initVision = async () => {
  if (visionClient !== null) return visionClient;
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const { ImageAnnotatorClient } = await import("@google-cloud/vision");
      visionClient = new ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      });
      console.log("[OCR] Google Vision client initialized");
    } else {
      visionClient = false; // Mark as unavailable
    }
  } catch (err) {
    console.warn("[OCR] Google Vision not available:", (err as Error).message);
    visionClient = false;
  }
  return visionClient;
};

/**
 * Extract text from a PDF using Claude's native PDF vision capability.
 * Claude can read PDFs directly as base64 documents — no pdf-parse needed.
 */
const extractPDFWithClaude = async (pdfBuffer: Buffer): Promise<string> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const base64PDF = pdfBuffer.toString("base64");

  console.log("[OCR] Sending PDF to Claude for text extraction...");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "pdfs-2024-09-25",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64PDF,
              },
            },
            {
              type: "text",
              text: "Extract ALL text from this document. Preserve the structure. Return only the extracted text, nothing else.",
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("[OCR] Claude PDF extraction error:", response.status, err.slice(0, 200));
    throw new Error(`Claude PDF extraction failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";

  console.log(`[OCR] Claude extracted ${text.length} chars from PDF`);
  return text;
};

/**
 * OCR image files using Google Vision
 */
const ocrImageWithVision = async (imageBuffer: Buffer): Promise<string> => {
  const client = await initVision();
  if (!client) throw new Error("Google Vision not configured");

  const [result] = await client.documentTextDetection({
    image: { content: imageBuffer.toString("base64") },
  });

  const text = result.fullTextAnnotation?.text || "";
  if (!text || text.trim().length === 0) {
    throw new Error("No text detected in image");
  }
  return text;
};

/**
 * Extract text from image using Claude vision
 */
const extractImageWithClaude = async (
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const base64Image = imageBuffer.toString("base64");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: "Extract ALL text from this image. Preserve the structure. Return only the extracted text, nothing else.",
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude image OCR failed: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
};

/**
 * Main entry point - process any file type
 */
export const processFile = async (
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string = "document"
): Promise<{
  text: string;
  isScanned: boolean;
  ocrSource: "claude" | "vision" | "openrouter" | "native";
}> => {
  console.log(`[OCR] Processing ${fileName} (${mimeType})`);

  if (mimeType === "application/pdf") {
    // PDFs: use Claude native PDF reading
    try {
      const text = await extractPDFWithClaude(fileBuffer);
      if (text && text.trim().length >= 50) {
        return { text, isScanned: false, ocrSource: "claude" };
      }
      throw new Error("Insufficient text extracted from PDF");
    } catch (err: any) {
      console.error("[OCR] Claude PDF extraction failed:", err.message);

      // Fallback to OpenRouter
      try {
        const { extractTextWithOpenRouter } = await import("./openrouter-ocr");
        const result = await extractTextWithOpenRouter(fileBuffer, mimeType, fileName);
        if (result.text && result.text.trim().length >= 50) {
          return { text: result.text, isScanned: true, ocrSource: "openrouter" };
        }
      } catch (fallbackErr: any) {
        console.error("[OCR] OpenRouter fallback also failed:", fallbackErr.message);
      }

      throw new Error(
        "Could not extract text from this PDF. Please ensure it is not password-protected and contains readable text."
      );
    }
  }

  if (["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    // Images: try Google Vision first, then Claude
    const client = await initVision();
    if (client) {
      try {
        const text = await ocrImageWithVision(fileBuffer);
        return { text, isScanned: true, ocrSource: "vision" };
      } catch (visionErr: any) {
        console.warn("[OCR] Vision failed, trying Claude:", visionErr.message);
      }
    }

    // Claude image fallback
    const text = await extractImageWithClaude(fileBuffer, mimeType);
    if (!text || text.trim().length < 50) {
      throw new Error("Could not extract sufficient text from this image.");
    }
    return { text, isScanned: true, ocrSource: "claude" };
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
};

// Keep exports for backward compatibility
export const processPDF = async (
  pdfBuffer: Buffer,
  fileName: string = "document.pdf"
): Promise<string> => {
  const result = await processFile(pdfBuffer, "application/pdf", fileName);
  return result.text;
};

export const ocrImage = async (imageBuffer: Buffer): Promise<string> => {
  const result = await processFile(imageBuffer, "image/jpeg", "image.jpg");
  return result.text;
};
