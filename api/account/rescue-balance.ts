import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from '../../src/lib/s3.js';
import * as fs from 'fs';
import * as path from 'path';

const DB_BUCKET = process.env.MINIO_DB_BUCKET || 'packzinhu-db';

let firebaseConfig = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {}

function smartParseServiceAccount(sa: string): any {
  if (!sa) throw new Error("A variável de ambiente FIREBASE_SERVICE_ACCOUNT está vazia.");
  const originalSa = sa;
  sa = sa.trim();
  let parsed: any = null;
  try {
    let p = JSON.parse(sa);
    if (typeof p === 'string') p = JSON.parse(p);
    if (p && typeof p === 'object') parsed = p;
  } catch (e) {}
  if (!parsed) {
    try {
      if (/^[A-Za-z0-9+/=\s\n]+$/.test(sa) && sa.length > 50) {
        const decoded = Buffer.from(sa, 'base64').toString('utf-8');
        let p = JSON.parse(decoded);
        if (typeof p === 'string') p = JSON.parse(p);
        if (p && typeof p === 'object') parsed = p;
      }
    } catch (e) {}
  }
  if (!parsed) {
    try {
      const doubleQuoted = sa.replace(/'/g, '"');
      let p = JSON.parse(doubleQuoted);
      if (p && typeof p === 'object') parsed = p;
    } catch (e) {}
  }
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
  if (!parsed) {
    throw new Error("Não foi possível parsear a chave com nenhuma das estratégias de decodificação.");
  }
  const normalized: any = { ...parsed };
  if (normalized.project_id && !normalized.projectId) normalized.projectId = normalized.project_id;
  if (normalized.projectId && !normalized.project_id) normalized.project_id = normalized.projectId;
  if (normalized.private_key && !normalized.privateKey) normalized.privateKey = normalized.private_key;
  if (normalized.privateKey && !normalized.private_key) normalized.private_key = normalized.privateKey;
  if (normalized.client_email && !normalized.clientEmail) normalized.clientEmail = normalized.client_email;
  if (normalized.clientEmail && !normalized.client_email) normalized.client_email = normalized.clientEmail;
  if (!normalized.privateKey) throw new Error("A chave do service_account não foi encontrada.");
  if (!normalized.clientEmail) throw new Error("O email da conta de serviço não foi encontrado.");
  if (typeof normalized.privateKey === 'string') {
    normalized.privateKey = normalized.privateKey.replace(/\\n/g, '\n');
  }
  return normalized;
}

function ensureFirebase() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      const parsedAccount = smartParseServiceAccount(serviceAccount);
      initializeApp({
        credential: cert(parsedAccount),
        projectId: parsedAccount.projectId || (firebaseConfig as any).projectId,
      });
    } else {
      throw new Error("A variável FIREBASE_SERVICE_ACCOUNT não está configurada.");
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

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  try {
    ensureFirebase();
    const db = getFirestore();
    const adminAuth = getAuth();

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });
    
    const userData = userSnap.data()!;
    const balance = userData.balance || 0;
    
    if (balance <= 0) return res.status(400).json({ error: 'Saldo insuficiente' });

    const bankSnap = await db.collection('bank_accounts').doc(userId).get();
    const pixKey = bankSnap.exists ? bankSnap.data()?.pixKey : '';

    if (!pixKey) return res.status(400).json({ error: 'Chave PIX não configurada' });

    const requestData = {
      userId,
      userEmail: userData.email || "",
      userName: userData.displayName || userData.username || "Usuário",
      amount: balance,
      status: 'pending',
      pixKey,
      createdAt: new Date().toISOString(),
    };

    const withdrawalRef = await db.collection('withdrawal_requests').add(requestData);
    saveToMinioDB('withdrawal_requests', withdrawalRef.id, requestData).catch(() => {});
    
    const updateBalance = { balance: 0 };
    await userRef.update(updateBalance);
    saveToMinioDB('users', userId, { ...userData, ...updateBalance }).catch(() => {});

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Withdraw error:', error);
    res.status(200).json({ error: error.message });
  }
}
