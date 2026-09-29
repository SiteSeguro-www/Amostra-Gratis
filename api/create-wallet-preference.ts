import { MercadoPagoConfig, Preference } from 'mercadopago';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from './minio-s3.js';
import { getAdminFirestore, getAdminAuth } from './firebase-admin.js';

const DB_BUCKET = process.env.MINIO_DB_BUCKET || 'packzinhu-db';

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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken: any;
    try {
      const adminAuth = getAdminAuth();
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (e: any) {
      return res.status(401).json({ error: 'Invalid token: ' + (e.message || '') });
    }

    const userId = decodedToken.uid;
    const { packageId, amount, hotCoins, buyerEmail, buyerName } = req.body;

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN || !process.env.MERCADOPAGO_ACCESS_TOKEN.trim()) {
      return res.status(200).json({ error: 'MERCADOPAGO_ACCESS_TOKEN não configurado no servidor.' });
    }

    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN.trim() });
    const preference = new Preference(client);

    const siteHost = req.headers.host || 'packzinhu.online';
    const protocol = siteHost.includes('localhost') ? 'http' : 'https';
    const siteUrl = process.env.SITE_URL || process.env.VITE_URL || `${protocol}://${siteHost}`;

    const db = getAdminFirestore();
    const orderRef = db.collection('orders').doc();
    const orderId = orderRef.id;

    const response = await preference.create({
      body: {
        items: [
          {
            id: `hotcoins_${packageId}`,
            title: `${hotCoins} HotCoins`,
            quantity: 1,
            unit_price: Number(amount),
            currency_id: 'BRL',
          }
        ],
        payer: {
          name: buyerName || decodedToken.name || 'Anônimo',
          email: buyerEmail || decodedToken.email || 'test@example.com',
        },
        back_urls: {
          success: `${siteUrl}/shop?payment=success`,
          failure: `${siteUrl}/shop?payment=failure`,
          pending: `${siteUrl}/shop?payment=pending`
        },
        auto_return: 'approved',
        notification_url: `${siteUrl}/api/webhook`,
        external_reference: JSON.stringify({
          orderId,
          type: 'hotcoins',
          buyerId: userId,
          hotCoins,
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
      type: 'hotcoins',
      packageId,
      hotCoins,
      amount: amount,
      buyerId: userId,
      status: 'pending',
      paymentMethod: 'mercado_pago',
      preferenceId: response.id,
      createdAt: new Date().toISOString(),
    };

    await orderRef.set(orderData);
    saveToMinioDB('orders', orderId, orderData).catch(() => {});

    return res.status(200).json({ init_point: response.init_point, id: response.id });
  } catch (error: any) {
    console.error('Error creating MP preference for hotcoins:', error);
    return res.status(200).json({ error: error.message || 'Erro ao processar recarga de moedas' });
  }
}
