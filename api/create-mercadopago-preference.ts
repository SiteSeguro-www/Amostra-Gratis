import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from '../src/lib/s3.js';
import fs from 'fs';
import path from 'path';

const DB_BUCKET = process.env.MINIO_DB_BUCKET || 'packzinhu-db';

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

async function saveToMinioDB(collection: string, docId: string, data: any) {
  try {
    const key = `${collection}/${docId}.json`;
    const command = new PutObjectCommand({
      Bucket: DB_BUCKET,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json'
    });
    await s3Client.send(command);
  } catch (err) {
    console.error('Failed to sync to Minio', err);
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    ensureFirebase();
    const db = getFirestore((firebaseConfig as any).firestoreDatabaseId);

    const { serviceId, serviceTitle, amount, sellerId, buyerId, buyerName, buyerEmail } = req.body;

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN || !process.env.MERCADOPAGO_ACCESS_TOKEN.trim()) {
      return res.status(500).json({ error: 'MERCADOPAGO_ACCESS_TOKEN não configurado no servidor.' });
    }

    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN.trim() });
    const preference = new Preference(client);
    
    // Fallback if req.headers.host isn't set perfectly
    const siteHost = req.headers.host || 'packzinhu.online';
    const protocol = siteHost.includes('localhost') ? 'http' : 'https';
    const siteUrl = process.env.SITE_URL || process.env.VITE_URL || `${protocol}://${siteHost}`;
    
    const orderRef = db.collection('orders').doc();
    const orderId = orderRef.id;

    const response = await preference.create({
      body: {
        items: [
          {
            id: serviceId,
            title: serviceTitle,
            quantity: 1,
            unit_price: Number(amount),
            currency_id: 'BRL',
          }
        ],
        payer: {
          name: buyerName || 'User',
          email: buyerEmail || 'test@example.com',
        },
        back_urls: {
          success: `${siteUrl}/payment/success`,
          failure: `${siteUrl}/checkout/${serviceId}?error=payment_failed`,
          pending: `${siteUrl}/payment/success`,
        },
        auto_return: 'approved',
        notification_url: `${siteUrl}/api/webhook`,
        external_reference: JSON.stringify({
          orderId,
          serviceId,
          serviceTitle,
          sellerId,
          buyerId,
          amount
        }),
        payment_methods: {
          excluded_payment_types: [],
          installments: 12,
        }
      }
    });

    const orderData = {
      id: orderId,
      serviceId,
      serviceTitle,
      amount,
      seller_id: sellerId,
      sellerId, 
      buyer_id: buyerId,
      buyerId, 
      buyerName,
      buyerEmail,
      status: 'pending',
      paymentMethod: 'mercado_pago',
      preferenceId: response.id,
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(), 
    };
    
    await orderRef.set(orderData);
    saveToMinioDB('orders', orderId, orderData).catch(() => {});

    return res.status(200).json({ init_point: response.init_point, id: response.id });
  } catch (error: any) {
    console.error('Mercado Pago Error:', error);
    // Return 200 with error property so Vercel doesn't block the body if it considers it a crash
    return res.status(200).json({ 
      error: error.message || 'Erro ao criar preferência de pagamento',
      stack: error.stack,
      name: error.name
    });
  }
}
