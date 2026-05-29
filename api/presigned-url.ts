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

function ensureFirebase() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      try {
        const parsedAccount = JSON.parse(serviceAccount);
        initializeApp({
          credential: cert(parsedAccount),
          projectId: firebaseConfig.projectId,
          storageBucket: firebaseConfig.storageBucket
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
