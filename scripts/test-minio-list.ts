
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
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

async function showFolders() {
  const s3Client = new S3Client({
    endpoint: 'https://minio.packzinhu.online',
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'packzinhu',
      secretAccessKey: 'Slimsli89x*',
    },
    forcePathStyle: true,
  });

  try {
    const listCommand = new ListObjectsV2Command({ Bucket: 'uploads', Prefix: 'services/' });
    const response = await s3Client.send(listCommand);
    if (!response.Contents) {
      console.log('No objects in services/');
      return;
    }
    console.log('Items in services/:', response.Contents.length);
  } catch (e) {
    console.error(e);
  }
}
showFolders();
