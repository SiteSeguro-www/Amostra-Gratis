import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const MINIO_ENDPOINT = 'https://cdn.packzinhu.online';
const MINIO_REGION = 'us-east-1';
const MINIO_ACCESS_KEY = 'packzinhu';
const MINIO_SECRET_KEY = 'Slimsli89x*';

const s3Client = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: MINIO_REGION,
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
  requestHandler: {
    requestTimeout: 10000,
  }
});

async function run() {
  const fileKey = 'test_uploads/imagem_teste.png';
  const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=";
  const buffer = Buffer.from(pngBase64, 'base64');
  
  const command = new PutObjectCommand({
    Bucket: 'packzinhu-db',
    Key: fileKey,
    Body: buffer,
    ContentType: 'image/png',
  });

  try {
    await s3Client.send(command);
    console.log(`Success! File uploaded to packzinhu-db/${fileKey}`);
  } catch (err) {
    console.error('Error uploading:', err);
  }
}

run();
