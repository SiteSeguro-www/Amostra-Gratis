import { s3Client, MINIO_BUCKET } from './src/lib/s3.js';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

async function test() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: MINIO_BUCKET,
      Prefix: 'images/',
    });
    const response = await s3Client.send(command);
    console.log("Response:", JSON.stringify({
      contents: response.Contents?.map(c => ({ Key: c.Key, Size: c.Size }))
    }, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}
test();
