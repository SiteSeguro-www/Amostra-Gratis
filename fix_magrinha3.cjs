const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
const serviceAccount = JSON.parse(serviceAccountStr);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
db.settings({ databaseId: 'ai-studio-fb36f72e-d6e7-437c-8175-890b834eee0f' });

async function run() {
  const usersSnap = await db.collection('users').get();
  let magrinhaId = null;
  for (const doc of usersSnap.docs) {
    if (doc.data().displayName === 'Magrinha Sapeka.') {
      magrinhaId = doc.id;
    }
  }
  
  if (magrinhaId) {
    // Set her balance explicitly to 14.25 (9.50 from Vieira + 4.75 from DWWWWW)
    await db.collection('users').doc(magrinhaId).update({ balance: 14.25 });
    console.log(`Manually updated Magrinha balance to 14.25`);
  }
}
run().catch(console.error);
