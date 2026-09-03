import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import fs from 'fs';
import path from 'path';
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from '../../src/lib/s3.js';

const DB_BUCKET = process.env.MINIO_DB_BUCKET || 'packzinhu-db';

let firebaseConfig = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {}

function smartParseServiceAccount(sa: string): any {
  if (!sa) return null;
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
      const sanitized = sa.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
      let p = JSON.parse(sanitized);
      if (typeof p === 'string') p = JSON.parse(p);
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

  if (!parsed) return null;

  const normalized: any = { ...parsed };
  if (normalized.project_id && !normalized.projectId) normalized.projectId = normalized.project_id;
  if (normalized.private_key && !normalized.privateKey) normalized.privateKey = normalized.private_key;
  if (normalized.client_email && !normalized.clientEmail) normalized.clientEmail = normalized.client_email;
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
      if (parsedAccount) {
        initializeApp({
          credential: cert(parsedAccount),
          projectId: parsedAccount.projectId || (firebaseConfig as any).projectId,
          storageBucket: parsedAccount.storageBucket || (firebaseConfig as any).storageBucket
        });
        return;
      }
    }
    throw new Error("Erro na inicialização do Firebase Admin");
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
    console.error(`Failed to sync ${collection}/${docId} to MinIO`, err);
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado. Faça login novamente.' });

  try {
    ensureFirebase();
    const adminAuth = getAuth();
    const db = getFirestore((firebaseConfig as any).firestoreDatabaseId);

    const token = authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1].trim() : authHeader.trim();
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    if (!userId) {
      return res.status(401).json({ error: 'Token de autenticação inválido.' });
    }

    // Se for ação de confirmação de repasse (Admin Payout Confirm)
    const isConfirmAction = req.query?.action === 'confirm' || (req.body && req.body.requestId);
    if (isConfirmAction) {
      const { requestId } = req.body || {};
      if (!requestId) return res.status(400).json({ error: 'requestId obrigatório' });

      const requestRef = db.collection('withdrawal_requests').doc(requestId);
      const requestSnap = await requestRef.get();

      if (!requestSnap.exists) return res.status(404).json({ error: 'Solicitação não encontrada' });

      const requestData = requestSnap.data()!;
      if (requestData.status === 'paid') return res.status(400).json({ error: 'Solicitação já foi paga' });

      const payoutUpdate = {
        status: 'paid',
        paidAt: new Date().toISOString(),
        paidBy: decodedToken.email || decodedToken.uid
      };
      await requestRef.update(payoutUpdate);
      saveToMinioDB('withdrawal_requests', requestId, { ...requestData, ...payoutUpdate }).catch(() => {});

      // Notificação para o vendedor
      const notif = {
        recipient_id: requestData.userId,
        sender_id: 'system',
        type: 'payment',
        message: `Seu repasse de R$ ${Number(requestData.amount).toFixed(2)} foi processado com sucesso!`,
        read: false,
        created_at: new Date().toISOString()
      };
      const notifRef = await db.collection('notifications').add(notif);
      saveToMinioDB('notifications', notifRef.id, notif).catch(() => {});

      return res.status(200).json({ success: true });
    }

    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const userData = userSnap.data()!;
    const balance = Number(userData.balance) || 0;

    if (balance <= 0) {
      return res.status(400).json({ error: 'Você não possui saldo disponível para resgate.' });
    }

    // Buscar dados bancários
    const bankSnap = await db.collection('bank_accounts').doc(userId).get();
    const bankData = bankSnap.exists ? bankSnap.data() : {};
    const pixKey = (bankData?.pixKey || userData.pixKey || '').toString().trim();

    if (!pixKey) {
      return res.status(400).json({ error: 'Chave PIX não configurada nas Configurações da conta.' });
    }

    // Criar solicitação de saque
    const requestData = {
      userId,
      userEmail: userData.email || decodedToken.email || "",
      userName: userData.displayName || userData.username || "Usuário",
      amount: balance,
      status: 'pending',
      pixKey,
      accountName: bankData?.accountName || userData.displayName || "",
      cpf: bankData?.cpf || "",
      rgCnh: bankData?.rgCnh || "",
      bankName: bankData?.bankName || "",
      createdAt: new Date().toISOString(),
    };

    const withdrawalRef = await db.collection('withdrawal_requests').add(requestData);
    saveToMinioDB('withdrawal_requests', withdrawalRef.id, requestData).catch(() => {});

    // Zerar saldo do usuário
    const updateBalance = { balance: 0 };
    await userRef.update(updateBalance);
    saveToMinioDB('users', userId, { ...userData, ...updateBalance }).catch(() => {});

    return res.status(200).json({ 
      success: true, 
      requestId: withdrawalRef.id,
      amount: balance
    });
  } catch (error: any) {
    console.error('Withdraw rescue-balance error:', error);
    return res.status(500).json({ error: error.message || 'Erro interno ao processar resgate de saldo.' });
  }
}
