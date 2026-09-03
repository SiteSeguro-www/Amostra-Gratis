const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT || fs.readFileSync('./firebase-applet-config.json', 'utf8');
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
    const data = doc.data();
    if (data.displayName === 'Magrinha Sapeka.' || data.email === 'bdf.josie@gmail.com') {
      magrinhaId = doc.id;
      console.log('Magrinha ID:', magrinhaId, 'Balance:', data.balance);
    }
  }

  if (magrinhaId) {
    const ordersSnap = await db.collection('orders').where('sellerId', '==', magrinhaId).get();
    ordersSnap.forEach(doc => {
      console.log('Order:', doc.id, doc.data().status, doc.data().amount, 'Buyer:', doc.data().buyerName || doc.data().buyerId);
    });
  }
}
run().catch(console.error);
