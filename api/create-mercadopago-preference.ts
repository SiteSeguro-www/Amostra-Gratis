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
      throw new Error("A variável FIREBASE_SERVICE_ACCOUNT não está configurada nas variáveis de ambiente da hospedagem (ex: Vercel). Adicione-a para dar suporte seguro a pagamentos e banco de dados.");
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
      serviceId: serviceId || '',
      serviceTitle: serviceTitle || '',
      amount: amount || 0,
      seller_id: sellerId || '',
      sellerId: sellerId || '', 
      buyer_id: buyerId || '',
      buyerId: buyerId || '', 
      buyerName: buyerName || 'Anônimo',
      buyerEmail: buyerEmail || 'anonimo@example.com',
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
