import { NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { processFile } from '@/lib/ocr';
import { extractMetadata } from '@/lib/ai';

export async function POST(request: Request) {
  let filePath: string | null = null;
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Validate file type - now supports PDF and images
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
    
    // Save file to uploads directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadDir = join(process.cwd(), 'uploads');
    const fileName = `${Date.now()}-${file.name}`;
    filePath = join(uploadDir, fileName);
    
    try {
      await writeFile(filePath, buffer);
    } catch (err) {
      // If uploads dir doesn't exist, create it
      const { mkdir } = await import('fs/promises');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(filePath, buffer);
    }
    
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
    
    // Extract text using OCR (supports both text-based and scanned documents)
    let extractedText = '';
    let isScanned = false;
    let ocrStatus = 'processing';
    
    try {
      const fileBuffer = await readFile(filePath);
      const result = await processFile(fileBuffer, mimeType, file.name);
      
      extractedText = result.text;
      isScanned = result.isScanned;
      ocrStatus = result.ocrSource === 'openrouter' ? 'ocr_openrouter' : (isScanned ? 'ocr_complete' : 'text_extracted');
      
      // Limit text length to prevent token overflow (max ~8000 chars)
      if (extractedText.length > 8000) {
        extractedText = extractedText.substring(0, 8000) + '\n\n[Document truncated due to length...]';
      }
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Could not extract text from document');
      }
    } catch (ocrError: any) {
      console.error('[Upload] OCR/Extraction error:', ocrError);
      ocrStatus = 'failed';
      
      return NextResponse.json(
        { 
          error: 'Failed to extract text',
          details: ocrError.message || 'Could not read text from this document. Please ensure it\'s clear and legible.',
          fileName: file.name,
          isScanned: isScanned,
        },
        { status: 422 }
      );
    }
    
    // Call AI to extract metadata
    let metadata;
    try {
      metadata = await extractMetadata(extractedText);
      
      if (!metadata) {
        throw new Error('AI returned empty metadata');
      }
    } catch (aiError: any) {
      console.error('[Upload] AI analysis error:', aiError);
      
      // Fallback: return basic data with warning
      metadata = {
        contract_name: file.name.replace(/\.[^/.]+$/, ""),
        contract_type: "Unknown",
        amount: null,
        effective_date: null,
        expiry_date: null,
        summary: "AI analysis failed. Please review the contract manually.",
      };
    }
    
    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileUrl: `/uploads/${fileName}`,
      metadata: metadata,
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
