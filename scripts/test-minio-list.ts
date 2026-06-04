
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
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

async function readBackup() {
  try {
    const key = 'backups/profiles/zyXyRkjwCXS21tEFxpxu0vvame73.json';
    const response = await s3Client.send(new GetObjectCommand({ Bucket: 'uploads', Key: key }));
    const streamToString = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      });
    const body = await streamToString(response.Body);
    console.log(body);
  } catch (err) {
    console.error(err);
  }
}

readBackup();
