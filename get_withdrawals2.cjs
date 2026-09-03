const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
const serviceAccount = JSON.parse(serviceAccountStr);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();
db.settings({ databaseId: 'ai-studio-fb36f72e-d6e7-437c-8175-890b834eee0f' });
async function run() {
  const usersSnap = await db.collection('users').get();
  let magrinhaId = null;
  for (const doc of usersSnap.docs) {
    if (doc.data().displayName === 'Magrinha Sapeka.') magrinhaId = doc.id;
  }
  const withdrawalSnap = await db.collection('withdrawal_requests').where('userId', '==', magrinhaId).get();
  withdrawalSnap.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}
run().catch(console.error);
