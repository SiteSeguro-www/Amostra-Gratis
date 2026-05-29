import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import fs from 'fs';
import path from 'path';

let firebaseConfig = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {}

function ensureFirebase() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      try {
        const parsedAccount = JSON.parse(serviceAccount);
        initializeApp({
          credential: cert(parsedAccount),
          projectId: (firebaseConfig as any).projectId,
          storageBucket: (firebaseConfig as any).storageBucket
        });
      } catch (e) {
        initializeApp({ 
          projectId: (firebaseConfig as any).projectId || "packzinhu",
          storageBucket: (firebaseConfig as any).storageBucket
        });
      }
    } else {
      initializeApp({ 
        projectId: (firebaseConfig as any).projectId || "packzinhu",
        storageBucket: (firebaseConfig as any).storageBucket
      });
    }
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const type = req.body?.type || req.query?.topic || req.body?.topic;
  const dataId = req.body?.data?.id || req.body?.id || req.query?.id;
  
  console.log(`[Webhook Vercel] ${req.method} | Type: ${type} | ID: ${dataId}`);

  if (String(dataId) === '123456') {
    console.log('[Webhook Vercel] Test request MP. Returning 200 OK.');
    return res.status(200).send('OK');
  }
  
  if (!type || !dataId) {
    return res.status(200).send('OK');
  }
  
  try {
    if ((type === 'payment' || type === 'mp-payment') && dataId) {
      // Fetch details from MercadoPago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()}`
        }
      });
      
      if (!mpResponse.ok) {
        throw new Error(`Failed to fetch payment details ${dataId}. Status: ${mpResponse.status}`);
      }
      
      const paymentData = await mpResponse.json();
      let externalReference: any = {};
      try {
        externalReference = JSON.parse(paymentData.external_reference || '{}');
      } catch (e) {
        console.error('Failed to parse external_reference JSON', e);
      }
      
      const orderId = externalReference.orderId || paymentData.preference_id || paymentData.order?.id || `mp_${dataId}`;
      
      ensureFirebase();
      const db = getFirestore((firebaseConfig as any).firestoreDatabaseId);
      const orderRef = db.collection('orders').doc(orderId);
      
      const orderSnap = await orderRef.get();
      const currentData = orderSnap.data() || {};
      
      let newStatus = currentData.status || 'pending';
      
      if (paymentData.status === 'approved') {
        newStatus = 'paid';
      } else if (paymentData.status === 'pending' || paymentData.status === 'in_process') {
        newStatus = 'pending';
      } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled' || paymentData.status === 'refunded') {
        newStatus = 'refused';
      }
      
      const updateOrder = {
        status: newStatus,
        mercadoPagoPaymentId: dataId,
        updatedAt: new Date().toISOString(),
        ...externalReference
      };

      await orderRef.set(updateOrder, { merge: true });
      
      // Fetch MinIO Sync
      const host = req.headers.host || 'packzinhu.online';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      fetch(`${protocol}://${host}/api/minio-db/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: 'orders', docId: orderId, data: { ...currentData, ...updateOrder } })
      }).catch(e => console.error("MinIO webhook sync err", e));
      
      // Notificacoes para vendedor e comprador
      if (paymentData.status === 'approved') {
        const sellerId = updateOrder.sellerId;
        const buyerId = updateOrder.buyerId;
        
        if (sellerId) {
          const sellerRef = db.collection('users').doc(sellerId);
          await sellerRef.set({
            balance: (currentData.amount || updateOrder.amount) ? FieldValue.increment(Number(currentData.amount || updateOrder.amount)) : 0
          }, { merge: true });

          await db.collection('notifications').add({
            recipient_id: sellerId,
            type: 'sale',
            related_id: orderId,
            message: `Pagamento recebido! Você vendeu ${updateOrder.serviceTitle || 'um item'}.`,
            read: false,
            created_at: new Date().toISOString()
          });
        }
        
        if (buyerId) {
          await db.collection('notifications').add({
            recipient_id: buyerId,
            type: 'purchase_success',
            related_id: orderId,
            message: `Pagamento aprovado para ${updateOrder.serviceTitle || 'seu item'}.`,
            read: false,
            created_at: new Date().toISOString()
          });
        }
      }

      console.log(`[Webhook Vercel] Order ${orderId} updated to ${newStatus}`);
    }
    
    return res.status(200).send('OK');
  } catch (error) {
    console.error('[Webhook Vercel] Error handling webhook:', error);
    return res.status(500).send('Internal Server Error');
  }
}
