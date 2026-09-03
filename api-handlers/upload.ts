import { PassThrough } from 'stream';
import formidable from 'formidable';
import express from 'express';
import { minioClient, ensureBucketAndPolicy } from '../src/lib/minio-client.js';
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from '../src/lib/s3.js';
import fs from "fs";
import path from "path";

let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {}

async function saveMediaUploadToMonio(mediaRecord: any) {
  try {
    const minioDBBucket = process.env.MINIO_DB_BUCKET || 'packzinhu-db';
    const key = `db/media_uploads/${mediaRecord.id}.json`;
    const buffer = Buffer.from(JSON.stringify(mediaRecord));
    const command = new PutObjectCommand({
      Bucket: minioDBBucket,
      Key: key,
      Body: buffer,
      ContentType: 'application/json'
    });
    await s3Client.send(command);
  } catch (err) {
    console.error('[Upload] MinioDB saving error', err);
  }
}


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

async function getBodyJSON(req: express.Request): Promise<any> {
  if (req.body && Object.keys(req.body).length > 0) return req.body;
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch (e) { resolve({}); }
    });
    req.on('error', reject);
  });
}

async function handleDelete(req: express.Request, res: express.Response) {
  try {
    ensureFirebase();
    const adminAuth = getAuth();
    const db = getFirestore(firebaseConfig.firestoreDatabaseId);

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Nao autorizado' });
    const token = authHeader.split('Bearer ')[1];
    const decodedUser = await adminAuth.verifyIdToken(token);
      
    const bodyArgs = await getBodyJSON(req);
    const fileKey = bodyArgs.fileKey;
    if (!fileKey) return res.status(400).json({ error: 'fileKey is required' });

    const mediaQuery = await db.collection('media_uploads').where('file_name', '==', fileKey).get();
    if (!mediaQuery.empty) {
      const mediaDoc = mediaQuery.docs[0];
      if (mediaDoc.data().user_id !== decodedUser.uid) {
         return res.status(403).json({ error: 'Proibido: Nao e dono do arquivo.' });
      }
      await mediaDoc.ref.delete();
    }

    const command = new DeleteObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: fileKey,
    });

    await s3Client.send(command);
    console.log(`[Media Delete] Sucesso: ${fileKey}`);
    res.json({ success: true });
  } catch (error: any) {
    console.error('[Media Delete] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
}

const MINIO_BUCKET = process.env.MINIO_BUCKET || 'packzinhu-db';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB 

export const config = {
  api: {
    bodyParser: false,
  },
};

export const handleUpload = async (req: express.Request, res: express.Response) => {
  if (req.method === 'DELETE') {
    return handleDelete(req, res);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let decodedUser: any = null;
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !(authHeader as string).startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Nao autorizado. Token faltante.' });
  }

  try {
    ensureFirebase();
    const adminAuth = getAuth();
    const token = (authHeader as string).split('Bearer ')[1];
    decodedUser = await adminAuth.verifyIdToken(token);
  } catch (error: any) {
    console.error('[Upload API] Auth Error:', error.message);
    return res.status(401).json({ error: 'Token invalido.' });
  }

  // Ensure bucket exists and has correct policy
  await ensureBucketAndPolicy(MINIO_BUCKET);

  const form = formidable({
    multiples: false,
    maxFileSize: MAX_FILE_SIZE,
  });

  try {
    const ak = process.env.MINIO_ACCESS_KEY;
    const sk = process.env.MINIO_SECRET_KEY;
    console.log(`[AUTH DEBUG] AK=${ak ? ak.length : 'env-null'} SK=${sk ? sk.length : 'env-null'}`);
  } catch(e) {}
  
  return new Promise<void>((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('[Upload] Formidable error:', err);
        res.status(400).json({ error: `Erro no processamento: ${err.message}` });
        return resolve();
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado' });
        return resolve();
      }

      const fileKey = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${file.originalFilename}`;
      
      try {
        const fs = await import('fs');
        const fileBuffer = fs.readFileSync(file.filepath);
        console.log(`[Upload] file.size=${file.size}, fileBuffer.length=${fileBuffer.length}`);
        
        const command = new PutObjectCommand({
          Bucket: MINIO_BUCKET,
          Key: fileKey,
          Body: fileBuffer,
          ContentType: file.mimetype || 'application/octet-stream',
        });
        await s3Client.send(command);
        
        console.log(`[Upload] File uploaded successfully to ${fileKey}`);
      } catch (e: any) {
        console.error('File upload failed', e);
        res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
        return resolve();
      }

      const publicUrl = `https://cdn.packzinhu.online/${MINIO_BUCKET}/${fileKey}`;
      const userId = decodedUser.uid;

      try {
        const mediaRecord = {
          user_id: userId,
          file_name: fileKey,
          original_name: file.originalFilename || 'unknown',
          folder: MINIO_BUCKET,
          url: publicUrl,
          direct_url: publicUrl,
          mime_type: file.mimetype || 'application/octet-stream',
          size: file.size || 0,
          id: Date.now()
        };
        
        await saveMediaUploadToMonio(mediaRecord);
      } catch (dbErr: any) {
        console.error('[Upload] DB Sync Warning:', dbErr.message);
      }

      res.status(200).json({
        success: true,
        url: publicUrl,
        key: fileKey
      });
      resolve();
    });
  });
};

export default handleUpload;
