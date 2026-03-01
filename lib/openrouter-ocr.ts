/**
 * OpenRouter OCR Module
 * Uses Gemini 2.5 Flash via OpenRouter for OCR when Google Vision fails
 */

interface OpenRouterOCRResult {
  text: string;
  isScanned: boolean;
  model: string;
}

/**
 * Extract text from PDF using OpenRouter Gemini
 * Converts PDF to base64 and sends to Gemini for OCR
 */
export async function extractTextWithOpenRouter(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<OpenRouterOCRResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenRouter API key not configured");
  }

  // Convert file to base64
  const base64Content = fileBuffer.toString('base64');
  
  // Determine file type for OpenRouter
  let fileType = 'application/pdf';
  if (mimeType.includes('image')) {
    fileType = mimeType;
  }

  console.log(`[OpenRouter OCR] Processing ${fileName} (${fileType})...`);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://signova.ai',
        'X-Title': 'Signova Contract OCR'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract all the text from this document. Preserve the formatting as much as possible. Return only the extracted text, no explanations.`
              },
              {
                type: 'file',
                file: {
                  filename: fileName,
                  content: base64Content,
                  content_type: fileType
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[OpenRouter OCR] API error:', response.status, errorData);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content || '';

    console.log(`[OpenRouter OCR] Extracted ${extractedText.length} characters`);

    return {
      text: extractedText,
      isScanned: true,
      model: 'gemini-2.5-flash'
    };

  } catch (error: any) {
    console.error('[OpenRouter OCR] Failed:', error.message);
    throw error;
  }
}

/**
 * Fallback OCR function - tries OpenRouter when other methods fail
 */
export async function fallbackOCR(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<OpenRouterOCRResult> {
  console.log('[OCR] Attempting OpenRouter fallback...');
  
  try {
    return await extractTextWithOpenRouter(fileBuffer, mimeType, fileName);
  } catch (error: any) {
    console.error('[OCR] OpenRouter fallback failed:', error.message);
    throw new Error('All OCR methods failed. Please try a clearer document or text-based PDF.');
  }
}
