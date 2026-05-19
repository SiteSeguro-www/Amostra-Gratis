import { S3Client, PutBucketCorsCommand, PutBucketPolicyCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

dotenv.config();

const MINIO_ENDPOINT_RAW = 'cdn.packzinhu.online';
const MINIO_ENDPOINT = MINIO_ENDPOINT_RAW;
const MINIO_USE_SSL = true;
const endPointUrl = `${MINIO_USE_SSL ? 'https' : 'http'}://${MINIO_ENDPOINT}`;

const s3Client = new S3Client({
  endpoint: endPointUrl,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: 'packzinhu',
    secretAccessKey: 'Slimsli89x*',
  },
  forcePathStyle: true,
});

const MINIO_BUCKET = process.env.MINIO_BUCKET || 'packzinhu-db';

async function setup() {
  console.log("Setting up Bucket: ", MINIO_BUCKET);
  // Ensure bucket created
  try {
    await s3Client.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }));
    console.log("Bucket created or already exists.");
  } catch(e: any) {
    if(e.name !== 'BucketAlreadyOwnedByYou' && e.name !== 'BucketAlreadyExists') {
        console.error("Create bucket error", e);
    }
  }

  // Set Policy
  try {
      const policyContent = {
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: { AWS: ["*"] }, // "*" instead of AWS: "*" for minio sometimes? AWS: "*" works
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`]
        }]
      };
      await s3Client.send(new PutBucketPolicyCommand({
          Bucket: MINIO_BUCKET,
          Policy: JSON.stringify(policyContent)
      }));
      console.log("Policy set");
  } catch (e) {
      console.error("Policy error", e);
  }

  // Set CORS
  try {
    const corsParams = {
        Bucket: MINIO_BUCKET,
        CORSConfiguration: {
            CORSRules: [
                {
                    AllowedHeaders: ["*"],
                    AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                    AllowedOrigins: ["*", "https://packzinhu.online", "https://www.packzinhu.online", "http://localhost:3000"],
                    ExposeHeaders: ["ETag"],
                    MaxAgeSeconds: 3000
                }
            ]
        }
    };
    await s3Client.send(new PutBucketCorsCommand(corsParams));
    console.log("CORS set");
  } catch(e) {
    console.error("CORS error", e);
  }
}

setup().then(() => console.log('Done')).catch(console.error);
