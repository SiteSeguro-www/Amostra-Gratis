import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { s3Client } from '../src/lib/s3.js';
import { PutObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

let firebaseConfig = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.error('Configuração do Firebase Admin não encontrada.');
}

if (getApps().length === 0) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const config = { projectId: firebaseConfig.projectId };
  if (serviceAccount) {
    config.credential = cert(JSON.parse(serviceAccount));
  }
  initializeApp(config);
}

const firestoreDb = getFirestore(firebaseConfig.firestoreDatabaseId);

const DB_BUCKET = process.env.MINIO_DB_BUCKET || 'packzinhu-db';

async function verifyMinioBucket() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: DB_BUCKET }));
  } catch (err) {
    if (err.$metadata?.httpStatusCode === 404 || err.name === 'NotFound') {
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: DB_BUCKET }));
      } catch (e) {
        console.error("Failed to create db bucket", e);
      }
    }
  }
}

async function saveToMinio(collection, docId, data) {
  try {
    const key = `${collection}/${docId}.json`;
    const body = JSON.stringify(data);
    await s3Client.send(new PutObjectCommand({
      Bucket: DB_BUCKET,
      Key: key,
      Body: body,
      ContentType: 'application/json'
    }));
  } catch (error) {
    console.error(`[MinIO DB] Save Error (${collection}/${docId}):`, error.message);
  }
}

const client = new pg.Client('postgresql://postgres:5rAV9fwkbP02GYUo@db.usdzlpaletfbvvhkvaki.supabase.co:5432/postgres');
const OLD_SUPABASE_DOMAIN = 'usdzlpaletfbvvhkvaki.supabase.co/storage/v1/object/public/media/';
const NEW_MINIO_DOMAIN = 'minio.packzinhu.online/packzinhu-db/';

function fixDataUrls(data) {
  let JSONString = JSON.stringify(data);
  if (JSONString.includes(OLD_SUPABASE_DOMAIN)) {
    JSONString = JSONString.split(OLD_SUPABASE_DOMAIN).join(NEW_MINIO_DOMAIN);
  }
  return JSON.parse(JSONString);
}


const tables = ['likes', 'follows', 'comments', 'chats', 'messages', 'notifications', 'profiles', 'services', 'orders'];

async function syncAll() {
  await client.connect();
  await verifyMinioBucket();

  for (const table of tables) {
    try {
      console.log(`Buscando dados de: ${table}...`);
      const { rows } = await client.query(`SELECT * FROM ${table}`);
      console.log(`Encontrados ${rows.length} registros em ${table}.`);

      let firestoreCount = 0;
      let minioCount = 0;

      // Group rows to run in parallel
      const batchSize = 50;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        await Promise.all(batch.map(async (row) => {
          let rowData = fixDataUrls(row);

          // Identify the ID field
          let docId = rowData.id;
          if (table === 'follows' && rowData.follower_id && rowData.following_id) {
            docId = `${rowData.follower_id}_${rowData.following_id}`;
          }
          if (!docId) {
            docId = Date.now().toString() + Math.random().toString().substr(2, 5);
          }

          // Save to Firestore
          try {
            await firestoreDb.collection(table).doc(docId).set(rowData, { merge: true });
            firestoreCount++;
          } catch (e) {
            console.error(`Erro Firebase ${table}/${docId}:`, e.message);
          }

          // Save to MinIO JSON
          try {
            await saveToMinio(table, docId, rowData);
            minioCount++;
          } catch (e) {
            console.error(`Erro MinIO ${table}/${docId}:`, e.message);
          }
        }));
      }

      console.log(`Concluído -> ${table}: ${firestoreCount} Firebase, ${minioCount} MinIO.`);
    } catch (err) {
      if (err.message.includes('does not exist')) {
        console.log(`Tabela ${table} não existe no Supabase, pulando.`);
      } else {
        console.error(`Erro processando ${table}:`, err.message);
      }
    }
  }

  await client.end();
  console.log('Sincronização global do Supabase (Bando de Dados) concluída!');
}

syncAll().catch(console.error);
