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

function smartParseServiceAccount(sa: string): any {
  if (!sa) {
    throw new Error("A variável de ambiente FIREBASE_SERVICE_ACCOUNT está vazia.");
  }
  const originalSa = sa;
  sa = sa.trim();

  let parsed: any = null;

  // 1. Try parsing directly
  try {
    let p = JSON.parse(sa);
    if (typeof p === 'string') p = JSON.parse(p);
    if (p && typeof p === 'object') {
      parsed = p;
    }
  } catch (e) {}

  // 2. Try parsing after restoring escaped characters
  if (!parsed) {
    try {
      const sanitized = sa.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
      let p = JSON.parse(sanitized);
      if (typeof p === 'string') p = JSON.parse(p);
      if (p && typeof p === 'object') {
        parsed = p;
      }
    } catch (e) {}
  }

  // 3. Try parsing as Base64
  if (!parsed) {
    try {
      if (/^[A-Za-z0-9+/=\s\n]+$/.test(sa) && sa.length > 50) {
        const decoded = Buffer.from(sa, 'base64').toString('utf-8');
        let p = JSON.parse(decoded);
        if (typeof p === 'string') p = JSON.parse(p);
        if (p && typeof p === 'object') {
          parsed = p;
        }
      }
    } catch (e) {}
  }

  // 4. Try parsing with manually fixed escaped backslashes or single-to-double quote correction
  if (!parsed) {
    try {
      const doubleQuoted = sa.replace(/'/g, '"');
      let p = JSON.parse(doubleQuoted);
      if (p && typeof p === 'object') {
        parsed = p;
      }
    } catch (e) {}
  }

  // 5. Ultimate Fallback: Regex extraction of necessary credential fields if JSON syntax is completely broken
  if (!parsed) {
    try {
      const projectIdMatch = originalSa.match(/"project_id"\s*:\s*"([^"]+)"/);
      const clientEmailMatch = originalSa.match(/"client_email"\s*:\s*"([^"]+)"/);
      const privateKeyMatch = originalSa.match(/"private_key"\s*:\s*"([^"]+)"/);
      
      if (projectIdMatch && clientEmailMatch && privateKeyMatch) {
         parsed = {
          project_id: projectIdMatch[1],
          client_email: clientEmailMatch[1],
          private_key: privateKeyMatch[1].replace(/\\n/g, '\n')
        };
      }
    } catch (e) {}
  }

  // 6. Loose placeholder-based extraction
  if (!parsed) {
    try {
      const withoutKey = sa.replace(/"private_key"\s*:\s*"[^"]+"/, '"private_key": "PLACEHOLDER"');
      const p = JSON.parse(withoutKey);
      const keyMatch = sa.match(/"private_key"\s*:\s*"([^"]+)"/);
      if (keyMatch && p) {
        p.private_key = keyMatch[1].replace(/\\n/g, '\n');
        parsed = p;
      }
    } catch (e) {}
  }

  if (!parsed) {
    throw new Error("Não foi possível parsear a chave com nenhuma das 6 estratégias de decodificação. Verifique se o conteúdo do JSON foi colado por completo.");
  }

  // Normalize snake_case to camelCase
  const normalized: any = { ...parsed };
  if (normalized.project_id && !normalized.projectId) normalized.projectId = normalized.project_id;
  if (normalized.projectId && !normalized.project_id) normalized.project_id = normalized.projectId;
  
  if (normalized.private_key && !normalized.privateKey) normalized.privateKey = normalized.private_key;
  if (normalized.privateKey && !normalized.private_key) normalized.private_key = normalized.privateKey;
  
  if (normalized.client_email && !normalized.clientEmail) normalized.clientEmail = normalized.client_email;
  if (normalized.clientEmail && !normalized.client_email) normalized.client_email = normalized.clientEmail;

  if (!normalized.privateKey) {
    throw new Error("A chave do service_account ('private_key') não foi encontrada no JSON decodificado.");
  }
  if (!normalized.clientEmail) {
    throw new Error("O email da conta de serviço ('client_email') não foi encontrado no JSON decodificado.");
  }

  // Make sure the private key is properly formatted with actual newlines
  if (typeof normalized.privateKey === 'string') {
    normalized.privateKey = normalized.privateKey.replace(/\\n/g, '\n');
  }

  return normalized;
}

function ensureFirebase() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      try {
        const parsedAccount = smartParseServiceAccount(serviceAccount);
        initializeApp({
          credential: cert(parsedAccount),
          projectId: parsedAccount.projectId || (firebaseConfig as any).projectId,
          storageBucket: parsedAccount.storageBucket || (firebaseConfig as any).storageBucket
        });
      } catch (e: any) {
        console.error('FIREBASE_SERVICE_ACCOUNT parse error:', e);
        throw new Error("Erro de Inicialização do Firebase Admin: " + e.message);
      }
    } else {
      throw new Error("A variável FIREBASE_SERVICE_ACCOUNT não está configurada.");
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
