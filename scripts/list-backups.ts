
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const s3Client = new S3Client({
  endpoint: 'https://minio.packzinhu.online',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'packzinhu',
    secretAccessKey: 'Slimsli89x*',
  },
  forcePathStyle: true,
});

async function listBackups() {
  const command = new ListObjectsV2Command({ Bucket: 'uploads', Prefix: 'backups/' });
  const response = await s3Client.send(command);
  if (response.Contents) {
    response.Contents.forEach(obj => console.log(obj.Key));
  }
}
listBackups();
