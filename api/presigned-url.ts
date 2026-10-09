import express from 'express';
import { minioClient } from './minio-s3.ts';
import { getAdminAuth } from './firebase-admin.ts';

export const handlePresignedUrl = async (req: express.Request, res: express.Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const adminAuth = getAdminAuth();
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autorizado' });
    
    const token = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(token);

    const { fileName, contentType } = req.body;
    if (!fileName) return res.status(400).json({ error: 'fileName é obrigatório' });

    const MINIO_BUCKET = process.env.MINIO_BUCKET || 'packzinhu-db';
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const fileKey = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanFileName}`;

    // Gera URL assinada com validade de 1 hora
    const presignedUrl = await minioClient.presignedPutObject(MINIO_BUCKET, fileKey, 3600);

    res.json({ presignedUrl, fileKey });
  } catch (error: any) {
    console.error('[PresignedURL] Error:', error);
    res.status(500).json({ error: error.message || 'Erro ao gerar URL assinada' });
  }
};

export default handlePresignedUrl;
