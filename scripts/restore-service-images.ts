import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
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

const db = getFirestore(firebaseConfig.firestoreDatabaseId);

const s3Client = new S3Client({
  endpoint: 'https://minio.packzinhu.online',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'packzinhu',
    secretAccessKey: 'Slimsli89x*',
  },
  forcePathStyle: true,
});

async function restoreProfiles() {
  const listCommand = new ListObjectsV2Command({ Bucket: 'uploads', Prefix: 'profiles/' });
  const response = await s3Client.send(listCommand);
  if (!response.Contents) return console.log('No objects in profiles/');

  const filesByUser = {};
  response.Contents.forEach(obj => {
    if (obj.Key === 'profiles/') return;
    const filename = obj.Key.replace('profiles/', '');
    const parts = filename.split('_');
    if (parts.length >= 2) {
      const sellerId = parts[0];
      const timestampStr = parts[1].split('.')[0];
      const timestamp = parseInt(timestampStr, 10);
      if (!filesByUser[sellerId]) filesByUser[sellerId] = [];
      filesByUser[sellerId].push({ filename: obj.Key, timestamp });
    }
  });

  const usersSnap = await db.collection('users').get();
  for (const doc of usersSnap.docs) {
      const userId = doc.id;
      const files = (filesByUser[userId] || []).sort((a,b) => b.timestamp - a.timestamp); // latest first
      if (files.length > 0) {
          const newUrl = `https://cdn.packzinhu.online/uploads/${files[0].filename}`;
          // console.log(`Profile ${userId} -> ${newUrl}`);
          await doc.ref.update({ photoURL: newUrl, avatarUrl: newUrl });
      }
  }
}

async function restoreCovers() {
  const listCommand = new ListObjectsV2Command({ Bucket: 'uploads', Prefix: 'covers/' });
  const response = await s3Client.send(listCommand);
  if (!response.Contents) return;

  const filesByUser = {};
  response.Contents.forEach(obj => {
    if (obj.Key === 'covers/') return;
    const filename = obj.Key.replace('covers/', '');
    const parts = filename.split('_');
    if (parts.length >= 2) {
      const sellerId = parts[0];
      const timestampStr = parts[1].split('.')[0];
      const timestamp = parseInt(timestampStr, 10);
      if (!filesByUser[sellerId]) filesByUser[sellerId] = [];
      filesByUser[sellerId].push({ filename: obj.Key, timestamp });
    }
  });

  const usersSnap = await db.collection('users').get();
  for (const doc of usersSnap.docs) {
      const userId = doc.id;
      const files = (filesByUser[userId] || []).sort((a,b) => b.timestamp - a.timestamp); // latest first
      if (files.length > 0) {
          const newUrl = `https://cdn.packzinhu.online/uploads/${files[0].filename}`;
          await doc.ref.update({ coverUrl: newUrl });
      }
  }
}

async function run() {
  console.log('Restoring services...');
  const listCommand = new ListObjectsV2Command({ Bucket: 'uploads', Prefix: 'services/' });
  const response = await s3Client.send(listCommand);
  if (!response.Contents) return console.log('No objects in services/');

  const filesBySeller = {};
  response.Contents.forEach(obj => {
    // skip folder object itself
    if (obj.Key === 'services/') return;
    const filename = obj.Key.replace('services/', '');
    // format: sellerId_timestamp.ext
    const parts = filename.split('_');
    if (parts.length >= 2) {
      const sellerId = parts[0];
      const timestampStr = parts[1].split('.')[0];
      const timestamp = parseInt(timestampStr, 10);
      if (!filesBySeller[sellerId]) filesBySeller[sellerId] = [];
      filesBySeller[sellerId].push({ filename: obj.Key, timestamp });
    }
  });

  const servicesSnap = await db.collection('services').get();
  const servicesBySeller = {};
  servicesSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.sellerId) {
      if (!servicesBySeller[data.sellerId]) servicesBySeller[data.sellerId] = [];
      let createdAt = 0;
      if (data.createdAt) {
         if (data.createdAt.toMillis) createdAt = data.createdAt.toMillis();
         else if (data.createdAt.seconds) createdAt = data.createdAt.seconds * 1000;
         else createdAt = new Date(data.createdAt).getTime();
      }
      servicesBySeller[data.sellerId].push({
        id: doc.id,
        createdAt,
        docRef: doc.ref,
        title: data.title
      });
    }
  });

  for (const sellerId in servicesBySeller) {
    const services = servicesBySeller[sellerId].sort((a,b) => a.createdAt - b.createdAt);
    const files = (filesBySeller[sellerId] || []).sort((a,b) => a.timestamp - b.timestamp);

    for (let i = 0; i < services.length; i++) {
        const service = services[i];
        if (files[i]) {
            const newUrl = `https://cdn.packzinhu.online/uploads/${files[i].filename}`;
            console.log(`Matching: ${service.title} -> ${newUrl}`);
            await service.docRef.update({ coverUrl: newUrl });
        } else {
            console.log(`No image found for service ${service.title} (seller: ${sellerId})`);
        }
    }
  }

  console.log('Restoring posts...');
  const postsCommand = new ListObjectsV2Command({ Bucket: 'uploads', Prefix: 'posts/' });
  const postsResponse = await s3Client.send(postsCommand);
  if (postsResponse.Contents) {
      const postsByUser = {};
      postsResponse.Contents.forEach(obj => {
         if (obj.Key === 'posts/') return;
         const filename = obj.Key.replace('posts/', '');
         const parts = filename.split('_');
         if (parts.length >= 2) {
             const uId = parts[0];
             const ts = parseInt(parts[1].split('.')[0], 10);
             if(!postsByUser[uId]) postsByUser[uId] = [];
             postsByUser[uId].push({ filename: obj.Key, ts });
         }
      });
      
      const postsSnap = await db.collection('posts').get();
      const fbPostsByUser = {};
      postsSnap.docs.forEach(doc => {
          const d = doc.data();
          if (d.authorId) {
             if(!fbPostsByUser[d.authorId]) fbPostsByUser[d.authorId] = [];
             let createdAt = 0;
             if (d.createdAt) {
                if(d.createdAt.toMillis) createdAt = d.createdAt.toMillis();
                else createdAt = new Date(d.createdAt).getTime();
             }
             fbPostsByUser[d.authorId].push({ id: doc.id, docRef: doc.ref, createdAt });
          }
      });

      for (const uId in fbPostsByUser) {
          const fps = fbPostsByUser[uId].sort((a,b) => a.createdAt - b.createdAt);
          const fFs = (postsByUser[uId] || []).sort((a,b) => a.ts - b.ts);
          for (let i=0; i<fps.length; i++) {
              if (fFs[i]) {
                  await fps[i].docRef.update({ mediaUrl: `https://cdn.packzinhu.online/uploads/${fFs[i].filename}` });
              }
          }
      }
  }

  await restoreProfiles();
  await restoreCovers();
  console.log('Done restoring images!');
}

run().catch(console.error);
