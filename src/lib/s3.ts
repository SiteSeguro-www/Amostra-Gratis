import { S3Client } from "@aws-sdk/client-s3";

export const MINIO_ENDPOINT_RAW = (process.env.MINIO_ENDPOINT && !process.env.MINIO_ENDPOINT.includes('trycloudflare')) ? process.env.MINIO_ENDPOINT.replace(/^https?:\/\//, '') : 'minio.packzinhu.online';
export const MINIO_ENDPOINT = MINIO_ENDPOINT_RAW;

const MINIO_USE_SSL = process.env.MINIO_SSL === 'true' || true;
const endPointUrl = `https://${MINIO_ENDPOINT}`;

export const s3Client = new S3Client({
  endpoint: endPointUrl,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: 'packzinhu',
    secretAccessKey: 'Slimsli89x*',
  },
  forcePathStyle: true,
});

export const MINIO_BUCKET = process.env.MINIO_BUCKET || 'packzinhu-db';
