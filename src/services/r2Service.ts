
import { R2Config } from '../types';
import { persistence } from '../utils/persistence';

export const getR2Config = async (): Promise<R2Config | null> => {
  try {
    const config = await persistence.getItem('r2Config');
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error('Error getting R2 config:', error);
    return null;
  }
};

export const saveR2Config = async (config: R2Config): Promise<void> => {
  try {
    await persistence.setItem('r2Config', JSON.stringify(config));
    console.log('R2 config saved successfully');
  } catch (error) {
    console.error('Error saving R2 config:', error);
    throw error;
  }
};

const generateFileId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const hashFileName = async (fileName: string): Promise<string> => {
  const extension = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
  const hash = await sha256(fileName + Date.now() + Math.random());
  return hash.substring(0, 16) + extension;
};

const createAwsSignature = async (
  method: string,
  path: string,
  headers: Record<string, string>,
  config: R2Config,
  payload: ArrayBuffer | string = ''
): Promise<string> => {
  const region = 'auto';
  const service = 's3';
  
  // Create canonical request
  const sortedHeaders = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaders
    .map(key => `${key.toLowerCase()}:${headers[key].trim()}\n`)
    .join('');
  const signedHeaders = sortedHeaders.map(key => key.toLowerCase()).join(';');
  
  const payloadHash = await sha256(payload);
  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  
  const date = headers['X-Amz-Date'];
  const dateStamp = date.substr(0, 8);
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = await sha256(canonicalRequest);
  const stringToSign = `AWS4-HMAC-SHA256\n${date}\n${credentialScope}\n${canonicalRequestHash}`;
  
  // Calculate signature
  const signingKey = await getSignatureKey(config.secretAccessKey, dateStamp, region, service);
  const signature = await hmacSha256(signingKey, stringToSign);
  
  return `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
};

const sha256 = async (data: string | ArrayBuffer): Promise<string> => {
  if (!crypto || !crypto.subtle) {
    throw new Error('crypto.subtle is not available. Please use HTTPS or localhost to enable secure cryptography APIs required for R2 uploads.');
  }
  const encoder = new TextEncoder();
  const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const hmacSha256 = async (key: ArrayBuffer, data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const hmacSha256Buffer = async (key: ArrayBuffer, data: string): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
};

const getSignatureKey = async (
  key: string,
  dateStamp: string,
  regionName: string,
  serviceName: string
): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const kDate = await hmacSha256Buffer(encoder.encode(`AWS4${key}`).buffer, dateStamp);
  const kRegion = await hmacSha256Buffer(kDate, regionName);
  const kService = await hmacSha256Buffer(kRegion, serviceName);
  const kSigning = await hmacSha256Buffer(kService, 'aws4_request');
  return kSigning;
};

const getAmzDate = (): string => {
  const now = new Date();
  return now.toISOString().replace(/[:-]|\.\d{3}/g, '');
};

const generatePresignedUrl = async (
  fileName: string,
  config: R2Config,
  expiresIn: number = 600 // 10 minutes
): Promise<string> => {
  // If custom domain is configured, use it directly (no AWS signature needed)
  if (config.publicUrl) {
    return `${config.publicUrl.replace(/\/$/, '')}/${fileName}`;
  }
  
  // Otherwise, generate AWS pre-signed URL
  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
  const path = `/${config.bucketName}/${fileName}`;
  const region = 'auto';
  const service = 's3';
  
  const amzDate = getAmzDate();
  const dateStamp = amzDate.substr(0, 8);
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  
  // Build canonical query string for presigned URL
  const credential = encodeURIComponent(`${config.accessKeyId}/${credentialScope}`);
  const queryParams = [
    `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
    `X-Amz-Credential=${credential}`,
    `X-Amz-Date=${amzDate}`,
    `X-Amz-Expires=${expiresIn}`,
    `X-Amz-SignedHeaders=host`
  ].join('&');
  
  // Create canonical request (for pre-signed URLs, payload is always UNSIGNED-PAYLOAD)
  const canonicalHeaders = `host:${config.accountId}.r2.cloudflarestorage.com\n`;
  const signedHeaders = 'host';
  const payloadHash = 'UNSIGNED-PAYLOAD';
  
  const canonicalRequest = `GET\n${path}\n${queryParams}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  
  const canonicalRequestHash = await sha256(canonicalRequest);
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;
  
  // Calculate signature
  const signingKey = await getSignatureKey(config.secretAccessKey, dateStamp, region, service);
  const signature = await hmacSha256(signingKey, stringToSign);
  
  return `${endpoint}${path}?${queryParams}&X-Amz-Signature=${signature}`;
};

export const uploadFileToR2 = async (file: File, hashFilenames: boolean = true): Promise<{ fileId: string; url: string }> => {
  const config = await getR2Config();
  
  if (!config) {
    throw new Error('R2 configuration not found. Please configure your R2 settings.');
  }

  // Hash the filename to prevent guessing/enumeration while preserving extension, or use original name
  const fileName = hashFilenames ? await hashFileName(file.name) : file.name;
  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
  const path = `/${config.bucketName}/${fileName}`;
  const url = `${endpoint}${path}`;

  const amzDate = getAmzDate();
  const fileBuffer = await file.arrayBuffer();
  const contentHash = await sha256(fileBuffer);

  const headers: Record<string, string> = {
    'Host': `${config.accountId}.r2.cloudflarestorage.com`,
    'X-Amz-Date': amzDate,
    'X-Amz-Content-Sha256': contentHash,
    'Content-Type': file.type || 'application/octet-stream',
  };

  const authorization = await createAwsSignature('PUT', path, headers, config, fileBuffer);
  headers['Authorization'] = authorization;

  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: fileBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Upload failed:', errorText);
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }

  // Generate pre-signed URL for downloading (valid for 10 minutes)
  const downloadUrl = await generatePresignedUrl(fileName, config, 600);

  return { fileId: fileName, url: downloadUrl };
};

export const deleteFileFromR2 = async (fileId: string): Promise<void> => {
  const config = await getR2Config();
  
  if (!config) {
    throw new Error('R2 configuration not found.');
  }

  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
  const path = `/${config.bucketName}/${fileId}`;
  const url = `${endpoint}${path}`;

  const amzDate = getAmzDate();

  const headers: Record<string, string> = {
    'Host': `${config.accountId}.r2.cloudflarestorage.com`,
    'X-Amz-Date': amzDate,
    'X-Amz-Content-Sha256': await sha256(''),
  };

  const authorization = await createAwsSignature('DELETE', path, headers, config, '');
  headers['Authorization'] = authorization;

  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
  }
};

export const getFilesList = async (): Promise<string[]> => {
  // This is a placeholder - R2 list operations would require similar signing
  return [];
};
