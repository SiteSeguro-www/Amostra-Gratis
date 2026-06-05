import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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
  let config: any = { projectId: (firebaseConfig as any).projectId };
  if (serviceAccount) {
    let parsed = JSON.parse(serviceAccount);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    config.credential = cert(parsed);
  }
  initializeApp(config);
}

const db = getFirestore((firebaseConfig as any).firestoreDatabaseId);

async function syncAll() {
  console.log('Fetching users to sync profile data...');
  const usersSnap = await db.collection('users').get();
  
  const userMap: Record<string, any> = {};
  for (const doc of usersSnap.docs) {
      userMap[doc.id] = doc.data();
  }

  console.log(`Loaded ${usersSnap.size} users. Syncing services...`);
  
  const servicesSnap = await db.collection('services').get();
  let servicesUpdated = 0;
  for (const doc of servicesSnap.docs) {
      const data = doc.data();
      if (!data.sellerId) continue;
      const user = userMap[data.sellerId];
      if (user) {
          const expectedName = user.displayName || user.name || data.sellerName;
          const expectedPhoto = user.photoURL || user.avatarUrl || data.sellerPhoto || '';
          
          if (data.sellerName !== expectedName || data.sellerPhoto !== expectedPhoto) {
              await doc.ref.update({
                  sellerName: expectedName,
                  sellerPhoto: expectedPhoto
              });
              servicesUpdated++;
          }
      }
  }
  console.log(`Updated ${servicesUpdated} services.`);

  console.log('Syncing posts...');
  const postsSnap = await db.collection('posts').get();
  let postsUpdated = 0;
  for (const doc of postsSnap.docs) {
      const data = doc.data();
      if (!data.authorId) continue;
      const user = userMap[data.authorId];
      if (user) {
          const expectedName = user.displayName || user.name || data.authorName;
          const expectedPhoto = user.photoURL || user.avatarUrl || data.authorPhoto || '';
          
          if (data.authorName !== expectedName || data.authorPhoto !== expectedPhoto) {
              await doc.ref.update({
                  authorName: expectedName,
                  authorPhoto: expectedPhoto
              });
              postsUpdated++;
          }
      }
  }
  console.log(`Updated ${postsUpdated} posts.`);
  
  console.log('Syncing secret_contents...');
  const secretContentsSnap = await db.collection('secret_contents').get();
  let scUpdated = 0;
  for (const doc of secretContentsSnap.docs) {
      const data = doc.data();
      if (!data.authorId) continue;
      const user = userMap[data.authorId];
      if (user) {
          const expectedName = user.displayName || user.name || data.authorName;
          const expectedPhoto = user.photoURL || user.avatarUrl || data.authorPhoto || '';
          
          if (data.authorName !== expectedName || data.authorPhoto !== expectedPhoto) {
              await doc.ref.update({
                  authorName: expectedName,
                  authorPhoto: expectedPhoto
              });
              scUpdated++;
          }
      }
  }
  console.log(`Updated ${scUpdated} secret contents.`);

  console.log('Sync complete.');
}

syncAll().catch(console.error);
