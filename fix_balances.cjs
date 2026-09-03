const admin = require('firebase-admin');
const serviceAccount = require('./firebase-applet-config.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function run() {
  const usersSnap = await db.collection('users').get();
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    // Get all completed/delivered orders for this seller
    const ordersSnap = await db.collection('orders').where('sellerId', '==', userId).get();
    let totalEarnings = 0;
    
    ordersSnap.forEach(orderDoc => {
      const order = orderDoc.data();
      if (order.status === 'delivered' || order.status === 'completed') {
         totalEarnings += (Number(order.amount) || 0) * 0.95;
      }
    });
    
    // Let's just log it first
    console.log(`User ${userData.displayName} (${userId}) - Raw Calc Earnings: ${totalEarnings}, Current Balance: ${userData.balance}`);
    
    // But we need to account for withdrawals! 
    // We cannot just set balance = totalEarnings if they withdrew some.
  }
}
run().catch(console.error);
