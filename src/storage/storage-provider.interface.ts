export interface UploadResult {
  url: string;
  key: string;
}

// Every media upload in the app - listing photos, condition-report photos,
// etc. - goes through this interface, never a specific cloud SDK directly.
// Swap LocalDiskStorageProvider for an S3/GCS/Azure Blob adapter once real
// cloud credentials exist; nothing calling this interface needs to change.
export interface StorageProvider {
  upload(buffer: Buffer, originalName: string, mimeType: string): Promise<UploadResult>;
}
