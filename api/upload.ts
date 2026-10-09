import formidable from 'formidable';
import express from 'express';
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, ensureBucketAndPolicy } from './minio-s3.ts';
import { getAdminAuth, getAdminFirestore } from './firebase-admin.ts';
import fs from 'fs';

const MINIO_BUCKET = process.env.MINIO_BUCKET || 'packzinhu-db';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB 

export const config = {
  api: {
    bodyParser: false,
  },
};

async function saveMediaUploadToMinio(mediaRecord: any) {
  try {
    const key = `db/media_uploads/${mediaRecord.id}.json`;
    const buffer = Buffer.from(JSON.stringify(mediaRecord, null, 2));
    const command = new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'application/json'
    });
    await s3Client.send(command);
  } catch (err) {
    console.error('[Upload] MinioDB saving error', err);
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
    const adminAuth = getAdminAuth();
    const db = getAdminFirestore();

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !(authHeader as string).startsWith('Bearer ')) return res.status(401).json({ error: 'Nao autorizado' });
    const token = (authHeader as string).split('Bearer ')[1];
    const decodedUser = await adminAuth.verifyIdToken(token);
      
    const bodyArgs = await getBodyJSON(req);
    const fileKey = bodyArgs.fileKey;
    if (!fileKey) return res.status(400).json({ error: 'fileKey is required' });

    try {
      const mediaQuery = await db.collection('media_uploads').where('file_name', '==', fileKey).get();
      if (!mediaQuery.empty) {
        const mediaDoc = mediaQuery.docs[0];
        if (mediaDoc.data().user_id !== decodedUser.uid) {
          return res.status(403).json({ error: 'Proibido: Nao e dono do arquivo.' });
        }
        await mediaDoc.ref.delete();
      }
    } catch (e) {
      console.warn('[Media Delete] Firestore query skipped:', e);
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

export const handleUpload = async (req: express.Request, res: express.Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
    const adminAuth = getAdminAuth();
    const token = (authHeader as string).split('Bearer ')[1];
    decodedUser = await adminAuth.verifyIdToken(token);
  } catch (error: any) {
    console.error('[Upload API] Auth Error:', error.message);
    return res.status(401).json({ error: 'Token invalido.' });
  }

  try {
    await ensureBucketAndPolicy(MINIO_BUCKET);
  } catch (e) {
    console.warn('[Upload API] Bucket policy check warning:', e);
  }

  const form = formidable({
    multiples: false,
    maxFileSize: MAX_FILE_SIZE,
  });

  return new Promise<void>((resolve) => {
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

      const cleanName = (file.originalFilename || 'file').replace(/[^a-zA-Z0-9.\-_]/g, '');
      const fileKey = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanName}`;
      
      try {
        const fileBuffer = fs.readFileSync(file.filepath);
        
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
      
      saveMediaUploadToMinio(mediaRecord).catch(() => {});

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
