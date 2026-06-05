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
  const config = { projectId: firebaseConfig.projectId };
  if (serviceAccount) {
    config.credential = cert(JSON.parse(serviceAccount));
  }
  initializeApp(config);
}

const db = getFirestore(firebaseConfig.firestoreDatabaseId);

const OLD_SUPABASE_DOMAIN = 'https://usdzlpaletfbvvhkvaki.supabase.co/storage/v1/object/public/media/';
const OLD_SUPABASE_HTTP = 'http://usdzlpaletfbvvhkvaki.supabase.co/storage/v1/object/public/media/';
const OLD_CLOUDFLARE_DOMAIN = 'https://accompanied-circumstances-above-numeric.trycloudflare.com/uploads/';
const NEW_MINIO_DOMAIN = 'https://cdn.packzinhu.online/uploads/';

function replaceUrls(str) {
  if (typeof str !== 'string') return str;
  let newStr = str;
  // Handle old Cloudflare domain
  if (newStr.includes(OLD_CLOUDFLARE_DOMAIN)) {
    newStr = newStr.replace(OLD_CLOUDFLARE_DOMAIN, NEW_MINIO_DOMAIN);
  }
  // Handle Supabase domain (it includes the protocol)
  if (newStr.includes(OLD_SUPABASE_DOMAIN)) {
    newStr = newStr.replace(OLD_SUPABASE_DOMAIN, NEW_MINIO_DOMAIN);
  }
  if (newStr.includes(OLD_SUPABASE_HTTP)) {
    newStr = newStr.replace(OLD_SUPABASE_HTTP, NEW_MINIO_DOMAIN);
  }
  // also fix if someone used without protocol
  if (newStr.includes('usdzlpaletfbvvhkvaki.supabase.co/storage/v1/object/public/media/')) {
     newStr = newStr.replace('usdzlpaletfbvvhkvaki.supabase.co/storage/v1/object/public/media/', NEW_MINIO_DOMAIN);
     newStr = newStr.replace('https://https://', 'https://');
  }
  newStr = newStr.replace('https://https://', 'https://');
  return newStr;
}

async function fixUrlsInCollection(collectionName, fieldsToFix) {
  console.log(`Corrigindo URLs na coleção: ${collectionName}...`);
  const snapshot = await db.collection(collectionName).get();
  
  let count = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    let needsUpdate = false;
    let updatableData = {};

    for (const field of fieldsToFix) {
      if (typeof data[field] === 'string') {
        const fixed = replaceUrls(data[field]);
        if (fixed !== data[field]) {
          updatableData[field] = fixed;
          needsUpdate = true;
        }
      }
    }

    if (data.images && Array.isArray(data.images)) {
      const newImages = data.images.map(img => replaceUrls(img));
      if (JSON.stringify(newImages) !== JSON.stringify(data.images)) {
        updatableData.images = newImages;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await doc.ref.update(updatableData);
      console.log(`- Documento ${doc.id} atualizado.`);
      count++;
    }
  }
  
  console.log(`Coleção ${collectionName}: ${count} documentos corrigidos.`);
}

async function run() {
  console.log('Iniciando alteração de URLs (Supabase/Cloudflare -> MinIO) no Firebase...');
  await fixUrlsInCollection('users', ['photoURL', 'coverUrl', 'avatarUrl']);
  await fixUrlsInCollection('profiles', ['photoURL', 'coverUrl', 'avatarUrl']);
  await fixUrlsInCollection('services', ['coverUrl', 'imageUrl', 'mediaUrl']);
  await fixUrlsInCollection('posts', ['mediaUrl', 'imageUrl']);
  await fixUrlsInCollection('secret_contents', ['url', 'mediaUrl', 'imageUrl']);
  await fixUrlsInCollection('messages', ['mediaUrl', 'imageUrl']);
  console.log('Finalizado!');
}

run().catch(console.error);
