import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, MINIO_ENDPOINT } from "./src/lib/s3.js";

async function testConnection() {
  console.log('Testing connection to:', MINIO_ENDPOINT);
  try {
    const command = new PutObjectCommand({
      Bucket: 'test-bucket',
      Key: 'test.txt',
      Body: 'Hello World',
      ContentType: 'text/plain'
    });
    
    await s3Client.send(command);
    console.log('✅ Successfully uploaded test file!');
  } catch (err) {
    console.error('❌ Failed to upload test file:', err);
  }
}

testConnection();
