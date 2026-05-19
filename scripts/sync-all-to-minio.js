import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };
import { saveToMinioDB } from '../api/minio-db.js';
import dotenv from 'dotenv';
dotenv.config();

async function initializeFirebase() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      initializeApp({ credential: cert(JSON.parse(serviceAccount)), projectId: firebaseConfig.projectId });
    } else {
      initializeApp({ projectId: firebaseConfig.projectId });
    }
  }
}

async function syncAllToMinio() {
  await initializeFirebase();
  const db = getFirestore(firebaseConfig.firestoreDatabaseId);
  const collections = ['users', 'services', 'posts', 'chats', 'messages', 'notifications', 'follows', 'likes', 'comments', 'secret_contents', 'orders', 'withdrawals', 'withdrawal_requests'];
  
  for (const colName of collections) {
    console.log(`--- Syncing Collection: ${colName} ---`);
    const snap = await db.collection(colName).get();
    for (const doc of snap.docs) {
      try {
        await saveToMinioDB(colName, doc.id, { id: doc.id, ...doc.data() });
        console.log(`✅ Synced ${colName}/${doc.id}`);
      } catch (err) {
        console.error(`❌ Failed to sync ${colName}/${doc.id}:`, err.message);
      }
    }
  }
  console.log('--- Sync Completed ---');
}

syncAllToMinio();
