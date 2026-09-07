import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { StorageProvider, UploadResult } from './storage-provider.interface';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

function mimeTypeToExt(mimeType: string): string {
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  return '.jpg';
}

// Stand-in implementation - saves to a local ./uploads folder, served back
// via the static route registered in main.ts. Fine for local dev and a
// first small deployment; anything running multiple server instances, or
// that needs files to survive a redeploy, should swap this for a real
// object storage adapter (S3, GCS, Azure Blob) implementing the same
// interface - nothing else in the app needs to change.
@Injectable()
export class LocalDiskStorageProvider implements StorageProvider {
  async upload(buffer: Buffer, originalName: string, mimeType: string): Promise<UploadResult> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const ext = extname(originalName) || mimeTypeToExt(mimeType);
    const key = `${randomUUID()}${ext}`;
    await fs.writeFile(join(UPLOAD_DIR, key), buffer);
    return { url: `/uploads/${key}`, key };
  }
}
