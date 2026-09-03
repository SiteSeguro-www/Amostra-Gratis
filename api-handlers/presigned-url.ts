import express from 'express';
import { minioClient } from '../src/lib/minio-client.js';
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import fs from "fs";
import path from "path";

let firebaseConfig: any = {};
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
          projectId: parsedAccount.projectId || firebaseConfig.projectId,
          storageBucket: parsedAccount.storageBucket || firebaseConfig.storageBucket
        });
      } catch (e) {
        initializeApp({ projectId: firebaseConfig.projectId, storageBucket: firebaseConfig.storageBucket });
      }
    } else {
      initializeApp({ projectId: firebaseConfig.projectId, storageBucket: firebaseConfig.storageBucket });
    }
  }
}

export const handlePresignedUrl = async (req: express.Request, res: express.Response) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    ensureFirebase();
    const adminAuth = getAuth();
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autorizado' });
    
    const token = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(token);

    const { fileName, contentType } = req.body;
    if (!fileName) return res.status(400).json({ error: 'fileName é obrigatório' });

    const MINIO_BUCKET = process.env.MINIO_BUCKET || 'packzinhu-db';
    const fileKey = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${fileName}`;

    // Gera URL assinada com validade de 1 hora
    const presignedUrl = await minioClient.presignedPutObject(MINIO_BUCKET, fileKey, 3600);

    res.json({ presignedUrl, fileKey });
  } catch (error: any) {
    console.error('[PresignedURL] Error:', error);
    res.status(500).json({ error: error.message });
  }
};

export default handlePresignedUrl;
