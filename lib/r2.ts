import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 is S3-compatible
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY || '',
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET || 'signova-contracts';

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadFile(
  file: Buffer | Blob,
  fileName: string,
  contentType: string = 'application/pdf'
): Promise<UploadResult> {
  try {
    const key = `contracts/${Date.now()}-${fileName}`;
    
    // Convert Blob to Buffer if needed
    let body: Buffer;
    if (file instanceof Blob) {
      const arrayBuffer = await file.arrayBuffer();
      body = Buffer.from(arrayBuffer);
    } else {
      body = file;
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await r2Client.send(command);

    // Generate a public URL (R2 objects are public by default or need presigned URL)
    const publicUrl = `${process.env.CLOUDFLARE_R2_ENDPOINT}/${BUCKET_NAME}/${key}`;

    return {
      success: true,
      url: publicUrl,
      key: key,
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Get a presigned URL for downloading a file
 */
export async function getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('R2 get URL error:', error);
    return null;
  }
}

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error('R2 delete error:', error);
    return false;
  }
}

/**
 * Generate a unique file key
 */
export function generateFileKey(fileName: string, userId?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const prefix = userId ? `users/${userId}` : 'contracts';
  return `${prefix}/${timestamp}-${random}-${fileName}`;
}
