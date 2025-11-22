export interface FileItem {
  id: string;
  name: string;
  size: number;
  uploadedAt: number;
  expiresAt: number;
  url: string;
  hash?: string;
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
}
