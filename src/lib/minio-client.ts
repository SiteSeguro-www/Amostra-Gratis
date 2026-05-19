import * as Minio from "minio";

const MINIO_ENDPOINT_RAW = 'minio.packzinhu.online';
const MINIO_ENDPOINT = MINIO_ENDPOINT_RAW;

const MINIO_PORT = 443;
const MINIO_USE_SSL = true;

export const minioClient = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  region: process.env.MINIO_REGION || 'us-east-1',
  accessKey: 'packzinhu',
  secretKey: 'Slimsli89x*',
});

export async function ensureBucketAndPolicy(bucketName: string) {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      console.log(`[MinIO] Creating bucket: ${bucketName}`);
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`[MinIO] Bucket ${bucketName} created.`);
    }

    try {
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
      console.log(`[MinIO] Policy set to public read`);
    } catch(err: any) {
        console.error('[MinIO] Error setting policy:', err.message);
    }
    
    // Add CORS configuration via AWS SDK internally or via Minio Client
    try {
       const { s3Client } = await import('./s3');
       const { PutBucketCorsCommand } = await import('@aws-sdk/client-s3');
       const corsParams = {
          Bucket: bucketName,
          CORSConfiguration: {
              CORSRules: [
                  {
                      AllowedHeaders: ["*"],
                      AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                      AllowedOrigins: ["*", "https://packzinhu.online", "https://www.packzinhu.online", "https://cdn.packzinhu.online", "http://localhost:3000"],
                      ExposeHeaders: ["ETag"],
                      MaxAgeSeconds: 3000
                  }
              ]
          }
      };
      await s3Client.send(new PutBucketCorsCommand(corsParams));
      console.log(`[MinIO] CORS Policy set up for bucket ${bucketName}`);
    } catch (corsErr: any) {
       console.error('[MinIO] Error setting CORS:', corsErr.message);
    }
  } catch (err: any) {
    console.error(`[MinIO] Error ensuring bucket & policy for ${bucketName}:`, err.message);
  }
}
