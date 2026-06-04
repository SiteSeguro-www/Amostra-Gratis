
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert } from 'firebase-admin/app';
import dotenv from 'dotenv';
import fs from 'fs';
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

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ projectId: config.projectId, credential: cert(sa) });
const db = getFirestore(config.firestoreDatabaseId);

async function restoreBackup(table) {
  console.log(`Restoring ${table}...`);
  const listCommand = new ListObjectsV2Command({ Bucket: 'uploads', Prefix: `backups/${table}/` });
  const response = await s3Client.send(listCommand);
  if (!response.Contents) return;

  for (const obj of response.Contents) {
    const getCommand = new GetObjectCommand({ Bucket: 'uploads', Key: obj.Key });
    const getResponse = await s3Client.send(getCommand);
    const body = await new Promise((resolve) => {
      const chunks = [];
      getResponse.Body.on("data", (chunk) => chunks.push(chunk));
      getResponse.Body.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    });
    const data = JSON.parse(body);
    const docId = data.id || obj.Key.split('/').pop().replace('.json', '');
    
    // Restore
    await db.collection(table).doc(docId).set(data, { merge: true });
    console.log(`Restored ${table}/${docId}`);
  }
}

async function run() {
  await restoreBackup('profiles');
  await restoreBackup('posts');
  console.log('Done');
}
run();
