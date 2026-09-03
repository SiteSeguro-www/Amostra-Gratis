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
  let magrinhaData = null;
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    if (data.displayName === 'Magrinha Sapeka.' || data.email === 'bdf.josie@gmail.com') {
      magrinhaId = doc.id;
      magrinhaData = data;
    }
  }

  if (magrinhaId) {
    const ordersSnap = await db.collection('orders').where('sellerId', '==', magrinhaId).get();
    let deliveredSum = 0;
    for (const doc of ordersSnap.docs) {
      let data = doc.data();
      if (data.status === 'paid') {
        await doc.ref.update({ status: 'delivered', deliveredAt: new Date().toISOString() });
        data.status = 'delivered';
        console.log(`Updated order ${doc.id} to delivered`);
      }
      
      if (data.status === 'delivered' || data.status === 'completed') {
        deliveredSum += (Number(data.amount) || 0) * 0.95;
      }
    }
    
    // Check if she has any withdrawal requests
    const withdrawalSnap = await db.collection('withdrawal_requests').where('userId', '==', magrinhaId).get();
    let totalWithdrawn = 0;
    withdrawalSnap.forEach(doc => {
      // If it's pending or paid, it's deducted from balance
      totalWithdrawn += Number(doc.data().amount) || 0;
    });
    
    let correctBalance = deliveredSum - totalWithdrawn;
    if (correctBalance < 0) correctBalance = 0;
    
    await db.collection('users').doc(magrinhaId).update({ balance: correctBalance });
    console.log(`Updated Magrinha balance to ${correctBalance}`);
  }
}
run().catch(console.error);
