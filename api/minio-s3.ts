import { S3Client } from "@aws-sdk/client-s3";
import * as Minio from "minio";

export const MINIO_ENDPOINT_RAW = (process.env.MINIO_ENDPOINT && !process.env.MINIO_ENDPOINT.includes('trycloudflare')) 
  ? process.env.MINIO_ENDPOINT.replace(/^https?:\/\//, '') 
  : 'minio.packzinhu.online';

export const MINIO_ENDPOINT = MINIO_ENDPOINT_RAW;
export const MINIO_BUCKET = process.env.MINIO_BUCKET || 'packzinhu-db';

const rawSecret = process.env.MINIO_SECRET_KEY;
const MINIO_SECRET_KEY = (rawSecret && rawSecret.toLowerCase() === 'slimsli89x*') ? 'Slimsli89x*' : (rawSecret || 'Slimsli89x*');
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'packzinhu';

export const s3Client = new S3Client({
  endpoint: `https://${MINIO_ENDPOINT}`,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

export const minioClient = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: 443,
  useSSL: true,
  region: process.env.MINIO_REGION || 'us-east-1',
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

export async function ensureBucketAndPolicy(bucketName: string = MINIO_BUCKET) {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      console.log(`[MinIO] Creating bucket: ${bucketName}`);
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`[MinIO] Bucket ${bucketName} created.`);
    }

    const policyContent = {
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucketName}/*`]
      }]
    };
    
    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policyContent));
  } catch (err: any) {
    console.warn('[MinIO] Warning ensuring bucket/policy:', err.message);
  }
}
