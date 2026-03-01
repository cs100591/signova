import { NextResponse } from 'next/server';
import { processFile } from '@/lib/ocr';
import { extractMetadata } from '@/lib/ai';
import { uploadFile } from '@/lib/r2';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
    
    if (!allowedExtensions.includes(fileExtension || '')) {
      return NextResponse.json(
        { 
          error: 'Invalid file type',
          details: 'Please upload PDF, JPG, PNG, or WEBP files.',
          supportedTypes: ['PDF', 'JPG', 'PNG', 'WEBP']
        },
        { status: 400 }
      );
    }
    
    // Get file buffer directly (no local filesystem write)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Determine MIME type
    let mimeType = file.type;
    if (!mimeType && fileExtension) {
      const mimeMap: Record<string, string> = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp'
      };
      mimeType = mimeMap[fileExtension] || 'application/octet-stream';
    }
    
    // Step 1: OCR processing (directly from memory buffer)
    console.log('[Upload] Starting OCR processing...');
    let extractedText = '';
    let isScanned = false;
    let ocrStatus = 'processing';
    
    try {
      const result = await processFile(buffer, mimeType, file.name);
      
      extractedText = result.text;
      isScanned = result.isScanned;
      ocrStatus = result.ocrSource === 'openrouter' ? 'ocr_openrouter' : (isScanned ? 'ocr_complete' : 'text_extracted');
      
      console.log(`[Upload] OCR complete: ${extractedText.length} chars, source: ${result.ocrSource}`);
      
      // Limit text length
      if (extractedText.length > 8000) {
        extractedText = extractedText.substring(0, 8000) + '\n\n[Document truncated due to length...]';
      }
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Could not extract text from document');
      }
    } catch (ocrError: any) {
      console.error('[Upload] OCR/Extraction error:', ocrError);
      return NextResponse.json(
        { 
          error: 'Failed to extract text',
          details: ocrError.message || 'Could not read text from this document. Please ensure it\'s clear and legible.',
          fileName: file.name,
        },
        { status: 422 }
      );
    }
    
    // Step 2: AI metadata extraction
    console.log('[Upload] Starting AI metadata extraction...');
    let metadata;
    try {
      metadata = await extractMetadata(extractedText);
      
      if (!metadata) {
        throw new Error('AI returned empty metadata');
      }
    } catch (aiError: any) {
      console.error('[Upload] AI analysis error:', aiError);
      
      // Fallback metadata
      metadata = {
        contract_name: file.name.replace(/\.[^/.]+$/, ""),
        contract_type: "Unknown",
        amount: null,
        effective_date: null,
        expiry_date: null,
        summary: "AI analysis failed. Please review the contract manually.",
      };
    }
    
    // Step 3: Upload to R2 for permanent storage
    console.log('[Upload] Uploading to R2...');
    let fileUrl = '';
    try {
      const r2Result = await uploadFile(buffer, file.name, mimeType);
      if (r2Result.success && r2Result.url) {
        fileUrl = r2Result.url;
        console.log('[Upload] R2 upload successful:', fileUrl);
      } else {
        console.warn('[Upload] R2 upload failed:', r2Result.error);
        // Continue anyway, we'll store without file URL
      }
    } catch (r2Error) {
      console.error('[Upload] R2 upload error:', r2Error);
      // Continue without file URL
    }
    
    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileUrl: fileUrl,
      metadata: metadata,
      extractedText: extractedText,
      extractedLength: extractedText.length,
      isScanned: isScanned,
      ocrStatus: ocrStatus,
    });
    
  } catch (error: any) {
    console.error('[Upload] General error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process file',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

// Increase body size limit for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};
