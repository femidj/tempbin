export const validateAccountId = (id: string): string | null => {
  if (!id) return 'validation.required';
  // Cloudflare Account IDs are typically 32 hex characters
  if (!/^[a-f0-9]{32}$/i.test(id.trim())) return 'validation.invalidAccountId';
  return null;
};

export const validateBucketName = (name: string): string | null => {
  if (!name) return 'validation.required';
  // R2 bucket naming rules (similar to S3)
  if (name.length < 3 || name.length > 63) return 'validation.bucketNameLength';
  if (!/^[a-z0-9-]+$/.test(name)) return 'validation.bucketNameChars';
  if (/^-|-$/.test(name)) return 'validation.bucketNameHyphen';
  return null;
};

export const validateAccessKeyId = (id: string): string | null => {
  if (!id) return 'validation.required';
  // R2 Access Key IDs are typically 32 hex characters
  if (!/^[a-f0-9]{32}$/i.test(id.trim())) return 'validation.invalidAccessKeyId';
  return null;
};

export const validateSecretAccessKey = (key: string): string | null => {
  if (!key) return 'validation.required';
  // R2 Secret Access Keys are typically 64 hex characters
  if (!/^[a-f0-9]{64}$/i.test(key.trim())) return 'validation.invalidSecretAccessKey';
  return null;
};

export const validatePublicUrl = (url: string): string | null => {
  if (!url) return null; // Optional
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return 'validation.invalidUrlProtocol';
    }
    return null;
  } catch {
    return 'validation.invalidUrl';
  }
};
