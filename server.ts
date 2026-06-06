import cors from 'cors';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import dotenv from 'dotenv';
import { initializeApp, cert, getApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import nodemailer from 'nodemailer';
import compression from 'compression';
import webPush from 'web-push';
import { getStorage } from 'firebase-admin/storage';
import { handleUpload } from './api/upload.js';
import { handlePresignedUrl } from './api/presigned-url.js';
import { getMediaByUser } from './src/lib/db.js';
import { saveToMinioDB } from './api/minio-db.js';

import { backupData } from './api/backup.js';
import multer from 'multer';
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, MINIO_BUCKET, MINIO_ENDPOINT_RAW } from './src/lib/s3.js';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

dotenv.config({ override: true });

// Readable Stream helper for MinIO proxy
async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: any) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
function initializeFirebase() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      try {
        let parsedAccount = JSON.parse(serviceAccount);
        if (typeof parsedAccount === 'string') parsedAccount = JSON.parse(parsedAccount);
        initializeApp({
          credential: cert(parsedAccount),
          projectId: firebaseConfig.projectId,
          storageBucket: firebaseConfig.storageBucket
        });
        console.log('Firebase Admin initialized with Service Account');
      } catch (e) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT. Attempting fallback parse...');
        try {
          const sanitized = serviceAccount.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
          const parsed = JSON.parse(sanitized);
          initializeApp({
            credential: cert(parsed),
            projectId: firebaseConfig.projectId,
            storageBucket: firebaseConfig.storageBucket
          });
          console.log('Firebase Admin initialized with Service Account (sanitized)');
        } catch (e2) {
          console.error("FIREBASE_SERVICE_ACCOUNT is malformed. Admin tools will fail.", e2);
          initializeApp({
            projectId: firebaseConfig.projectId,
            storageBucket: firebaseConfig.storageBucket
          });
        }
      }
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT not found, using default initialization');
      initializeApp({
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket
      });
    }
  }
}

initializeFirebase();
// Use the specific firestoreDatabaseId from config
const db = getFirestore(firebaseConfig.firestoreDatabaseId);
const adminAuth = getAuth();

// Initialize Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ? process.env.MERCADOPAGO_ACCESS_TOKEN.trim() : '',
  options: { timeout: 5000 }
});

// Email Transporter (User needs to configure SMTP in .env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.SMTP_USER || 'contato.packzinhu@gmail.com',
    pass: process.env.SMTP_PASS || '', // App Password for Gmail
  },
});

// Email Helper with modern templates and dynamic banners
async function sendSystemEmail({ to, subject, title, message, buttonText, buttonUrl, footer, bannerType }: { 
  to: string, 
  subject: string, 
  title: string, 
  message: string, 
  buttonText?: string, 
  buttonUrl?: string,
  footer?: string,
  bannerType?: 'sale' | 'purchase' | 'follow' | 'security' | 'default'
}) {
  try {
    const sender = process.env.SMTP_USER || 'contato.packzinhu@gmail.com';
    const siteUrl = process.env.SITE_URL || 'https://packzinhu.online';
    
    // Email Transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: sender,
        pass: process.env.SMTP_PASS || '', // App Password for Gmail
      },
    });

    // Banner mapping - Using environment variables set by user
    const bannerMap = {
      sale: process.env.BANNER_SALE_URL || 'https://packzinhu.online/banner-principal.jpeg',
      purchase: process.env.BANNER_PURCHASE_URL || 'https://packzinhu.online/banner-principal.jpeg',
      follow: process.env.BANNER_FOLLOW_URL || 'https://packzinhu.online/banner-principal.jpeg',
      security: process.env.BANNER_SECURITY_URL || 'https://packzinhu.online/banner-principal.jpeg',
      default: process.env.BANNER_DEFAULT_URL || `${siteUrl}/banner-principal.jpeg`
    };

    const currentBanner = bannerMap[bannerType || 'default'];

    const mailOptions = {
      from: `"PackZinhu" <${sender}>`,
      to,
      subject: `${subject} - PackZinhu`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #050505; color: white; padding: 20px; max-width: 600px; margin: 0 auto; border-radius: 40px; border: 1px solid #1a1a1a;">
          
          <!-- Banner Header -->
          <div style="width: 100%; border-radius: 30px 30px 10px 10px; overflow: hidden; margin-bottom: 20px; position: relative; background-color: #111;">
            <img src="${currentBanner}" alt="Banner" style="width: 100%; display: block; object-fit: cover; max-height: 200px;" />
            <div style="position: absolute; top: 20px; left: 20px; display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.5); padding: 5px 15px; border-radius: 20px; backdrop-filter: blur(5px);">
               <img src="${siteUrl}/favicon.png" style="width: 24px; height: 24px; border-radius: 50%;" />
               <span style="font-weight: 900; letter-spacing: -0.5px; font-size: 16px;">PackZinhu</span>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="background-color: #0f0f15; padding: 40px 30px; border-radius: 30px; border: 1px solid #1a1a25; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <h2 style="margin-top: 0; color: #fff; font-size: 24px; font-weight: 800; text-shadow: 0 0 20px rgba(139, 92, 246, 0.3);">${title}</h2>
            <div style="font-size: 16px; line-height: 1.6; color: #a1a1aa; margin: 20px 0;">
              ${message}
            </div>
            
            ${buttonText && buttonUrl ? `
              <div style="margin-top: 40px; text-align: center;">
                <a href="${buttonUrl}" style="background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%); color: white; padding: 16px 45px; border-radius: 20px; text-decoration: none; font-weight: 900; display: inline-block; font-size: 16px; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3); transition: transform 0.2s;">
                  ${buttonText}
                </a>
              </div>
            ` : ''}
          </div>
          
          <!-- Business Card Style Footer -->
          <div style="margin-top: 25px; background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2b 100%); border-radius: 30px; padding: 30px; border: 1px solid #2a2a3a; position: relative; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.4);">
            <div style="display: flex; align-items: center; gap: 20px; position: relative; z-index: 1;">
              <div style="background: linear-gradient(to bottom, #8B5CF6, #D946EF); padding: 2px; border-radius: 14px;">
                <img src="${siteUrl}/favicon.png" style="width: 56px; height: 56px; border-radius: 12px; display: block; background: #000;" />
              </div>
              <div>
                <div style="font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -1px;">PackZinhu</div>
                <div style="color: #8B5CF6; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-top: 2px;">Respira. Vende. Escala.</div>
              </div>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 8px; flex-wrap: wrap;">
               <div style="background: rgba(34, 197, 94, 0.1); color: #22c55e; padding: 4px 10px; border-radius: 8px; font-size: 9px; font-weight: 700; border: 1px solid rgba(34, 197, 94, 0.2);">✔ PAGAMENTO 100% SEGURO</div>
               <div style="background: rgba(139, 92, 246, 0.1); color: #8B5CF6; padding: 4px 10px; border-radius: 8px; font-size: 9px; font-weight: 700; border: 1px solid rgba(139, 92, 246, 0.2);">✔ SUPORTE EXCLUSIVO</div>
            </div>

            <div style="margin-top: 25px; pt: 15px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 11px; color: #666; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700;">packzinhu.online</span>
              <div style="display: flex; gap: 10px;">
                <span style="color: #8B5CF6;">•</span>
                <span>Qualidade Garantida</span>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 25px; text-align: center; font-size: 10px; color: #333; font-weight: 600;">
            <p>${footer || 'Você recebeu este e-mail por ser um usuário verificado PackZinhu.'}</p>
            <p>© 2026 PackZinhu - Todos os direitos reservados.</p>
          </div>
        </div>
      `,
    };

    console.log('Sending email with config:', { host: process.env.SMTP_HOST || 'smtp.gmail.com', user: process.env.SMTP_USER || 'contato.packzinhu@gmail.com' });
    await transporter.sendMail(mailOptions);
    
    // Log the sent email
    const emailLog = {
      to,
      subject: `${subject} - PackZinhu`,
      body: message,
      type: 'system_auto',
      createdAt: new Date().toISOString()
    };
    const emailRef = await db.collection('site_emails').add(emailLog);
    saveToMinioDB('site_emails', emailRef.id, emailLog).catch(() => {});

    console.log(`System email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`Failed to send system email to ${to}:`, error);
    if (!process.env.SMTP_PASS) {
      console.error('CRITICAL: SMTP_PASS is NOT configured in the environment.');
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  const allowedOrigins = [
    'https://packzinhu.online',
    'https://www.packzinhu.online',
    'http://localhost:3000',
    'https://ais-dev-vvtkqs525dn77fwrz5xxaa-109493740571.us-east5.run.app',
    'https://ais-pre-vvtkqs525dn77fwrz5xxaa-109493740571.us-east5.run.app'
  ];

  // Extremely permissive CORS for dev environment to avoid common redirect issues
  app.use(cors({ 
    origin: true, // Reflects the request origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
  }));

  // Handle preflight explicitly and instantly to prevent any redirects from other middlewares
  app.options('*all', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
  });

  // Generic request logger to help debug
  app.use((req, res, next) => {
    // Favicon SEO Redirects/Routes
    const faviconPaths = [
      '/favicon-16x16.png',
      '/favicon-32x32.png',
      '/favicon-48x48.png',
      '/apple-touch-icon.png',
      '/apple-touch-icon-precomposed.png',
      '/android-chrome-192x192.png',
      '/android-chrome-512x512.png'
    ];
    
    if (faviconPaths.includes(req.url)) {
      return res.sendFile(path.join(__dirname, 'public', 'favicon.png'));
    }

    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  });

  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Prevent 400 Bad Request crashing from malformed webhook JSON bodies
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && 'body' in err) {
      console.error('Body Parser Error:', err.message);
      return res.status(400).json({ error: 'Invalid JSON' }); 
    }
    next();
  });

  // Health check
  app.get('/api/random-background', async (req, res) => {
    try {
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      const command = new ListObjectsV2Command({
        Bucket: MINIO_BUCKET,
        Prefix: 'images/',
      });
      const response = await s3Client.send(command);
      
      if (!response.Contents || response.Contents.length === 0) {
        return res.json({ success: true, url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800&q=80' }); // fallback
      }

      const files = response.Contents.filter((item: any) => item.Size && item.Size > 0);
      
      if (files.length === 0) {
        return res.json({ success: true, url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800&q=80' });
      }

      const randomFile = files[Math.floor(Math.random() * files.length)];
      
      const fileUrl = `https://${MINIO_ENDPOINT_RAW}/${MINIO_BUCKET}/${randomFile.Key.split('/').map(encodeURIComponent).join('/')}`;
      
      res.json({ success: true, url: fileUrl });
    } catch (error) {
      console.error('Error fetching random background:', error);
      res.status(500).json({ error: 'Failed to fetch random background' });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV });
  });

  // Data Backup API (Sync to Local SQLite & MinIO)
  app.get(['/api/backup', '/api/packzinhu-db/backup'], (req, res) => {
    res.json({ status: 'active', message: 'Backup API ready' });
  });

  app.post(['/api/backup', '/api/packzinhu-db/backup'], async (req, res) => {
    try {
      const { type, data } = req.body;
      if (!type || !data) return res.status(400).json({ error: "Missing type or data" });
      const result = await backupData(type, data);
      res.json(result);
    } catch (error: any) {
      console.error('[Backup Route Error]', error);
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  });

  // --- Web Push Setup ---
  const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BAzPbLyW7tJ4_mgg0uzZYCDbEwgzKdKyUWnADWGdIK-NozwCqscdV_PTa5akCF8_lw1PpIIBs5eYgdmjjaucTf4';
  const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'pvpwEwqvuQ-aFNJlzwgD1bx_LGdyJv0ydfu3eXAwGRE';
  
  webPush.setVapidDetails(
    'mailto:contato.packzinhu@gmail.com',
    publicVapidKey,
    privateVapidKey
  );

  app.get('/api/webpush/vapidPublicKey', (req, res) => {
    res.send(publicVapidKey);
  });

  // In-memory or Firestore DB should be used, but since we have Firestore...
  app.post('/api/webpush/subscribe', async (req, res) => {
    const subscription = req.body;
    const authHeader = req.headers.authorization;
    
    // Store it in Firestore
    try {
      let userId = 'anonymous';
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1];
        try {
          const decodedUser = await adminAuth.verifyIdToken(token);
          userId = decodedUser.uid;
        } catch (e) {
          // ignore verification if token is invalid, but store anonymous anyway
        }
      }

      const subData = {
        subscription,
        userId,
        createdAt: new Date().toISOString()
      };
      const subId = subscription.endpoint.replace(/[^a-zA-Z0-9]/g, '');
      await db.collection('webpush_subscriptions').doc(subId).set(subData);
      saveToMinioDB('webpush_subscriptions', subId, subData).catch(() => {});

      res.status(201).json({});
    } catch (error) {
      console.error('Subscription error', error);
      res.status(500).json({ error: 'Failed' });
    }
  });

  // Admin: Send web push
  app.post('/api/admin/send-webpush', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autorizado' });
    
    try {
      const token = authHeader.split('Bearer ')[1];
      const decodedUser = await adminAuth.verifyIdToken(token);
      
      const { title, message, url } = req.body;
      const payload = JSON.stringify({ title, message, url });

      const snapshot = await db.collection('webpush_subscriptions').get();
      
      const promises: any[] = [];
      snapshot.forEach(doc => {
        const sub = doc.data().subscription;
        promises.push(
          webPush.sendNotification(sub, payload).catch(err => {
            if (err.statusCode === 404 || err.statusCode === 410) {
              console.log('Subscription has expired or is no longer valid: ', err);
              return doc.ref.delete();
            } else {
              console.error('Subscription broadcast error:', err);
            }
          })
        );
      });
      
      await Promise.all(promises);

      res.status(200).json({ success: true, count: promises.length });
    } catch (error: any) {
      console.error('Push broadcast error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  // --- End Web Push Setup ---

  // Media Proxy for MinIO (Bypasses CORS/Privacy issues)
  app.get('/api/media/*fileKey', async (req, res) => {
    const fileKey = req.params.fileKey || req.params[0];
    try {
      if (!fileKey) return res.status(400).send('File key required');

      console.log(`[MediaProxy] Attempting to fetch: "${fileKey}" from bucket "${MINIO_BUCKET}"`);

      const command = new GetObjectCommand({
        Bucket: MINIO_BUCKET,
        Key: fileKey,
      });

      const response = await s3Client.send(command);
      
      if (response.ContentType) {
        res.setHeader('Content-Type', response.ContentType);
      }
      
      // Dynamic Cache-Control based on type
      if (response.ContentType?.startsWith('video/')) {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Videos 1 day
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Images 1 year
      }

      // Stream the body to response
      const body = response.Body as any;
      if (body) {
        console.log(`[MediaProxy] Success streaming: ${fileKey}`);
        body.pipe(res);
      } else {
        console.warn(`[MediaProxy] Empty body for key: ${fileKey}`);
        res.status(404).send('Not found');
      }
    } catch (error: any) {
      console.error(`[MediaProxy] Error fetching "${fileKey}":`, error.name, error.message);
      
      if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
        console.warn(`[MediaProxy] Key not found: ${fileKey}`);
        return res.status(404).send('File not found in storage');
      }
      
      // Fallback log for general errors
      res.status(500).send('Internal server error proxying media');
    }
  });

  // Upload Proxy to bypass CORS issues on Storage
  // Increased limit to 100MB for videos
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });
  
  app.post('/api/presigned-url', handlePresignedUrl);
  app.post(['/api/upload', '/api/packzinhu-db-upload'], upload.single('file'), async (req, res) => {
    try {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      console.log('[DEBUG] AuthHeader check:', {
        authorizationHeader: req.headers.authorization,
        AuthorizationHeader: req.headers.Authorization,
        rawHeaders: req.rawHeaders
      });
      if (!authHeader || !(authHeader as string).startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Nao autorizado. Token faltante.', debug: 'Auth header missing or invalid format' });
      }

      let decodedUser: any = null;
      try {
        const token = (authHeader as string).split('Bearer ')[1];
        decodedUser = await adminAuth.verifyIdToken(token);
      } catch (error: any) {
        return res.status(401).json({ error: 'Token invalido.' });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const fileKey = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
      
      const { s3Client, MINIO_BUCKET } = await import('./src/lib/s3.js');
      const { ensureBucketAndPolicy } = await import('./src/lib/minio-client.js');
      
      await ensureBucketAndPolicy(MINIO_BUCKET);

      const command = new PutObjectCommand({
        Bucket: MINIO_BUCKET,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype || 'application/octet-stream',
      });
      await s3Client.send(command);

      const publicUrl = `https://cdn.packzinhu.online/${MINIO_BUCKET}/${fileKey}`;

      try {
        const mediaRecord = {
          user_id: decodedUser.uid,
          file_name: fileKey,
          original_name: file.originalname || 'unknown',
          folder: MINIO_BUCKET,
          url: publicUrl,
          direct_url: publicUrl,
          mime_type: file.mimetype || 'application/octet-stream',
          size: file.size || 0,
          id: Date.now()
        };
        saveToMinioDB('media_uploads', mediaRecord.id.toString(), mediaRecord).catch(() => {});
      } catch (dbErr: any) {
        console.error('[Upload] DB Sync Warning:', dbErr.message);
      }

      res.status(200).json({
        success: true,
        url: publicUrl,
        key: fileKey
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Erro ao processar upload' });
    }
  });

  app.all('/api/packzinhu-db', async (req, res) => {
    const handler = (await import('./api/packzinhu-db')).default;
    return handler(req, res);
  });
  app.delete(['/api/upload', '/api/packzinhu-db-upload'], async (req, res) => {
    try {
      await handleUpload(req, res);
    } catch (error: any) {
      console.error('Delete media error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Sync global data
  app.post('/api/admin/sync-supabase', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autorizado' });
    
    try {
      const token = authHeader.split('Bearer ')[1];
      await adminAuth.verifyIdToken(token);
      
      console.log('[AdminSync] Sync triggered for Supabase -> MinIO and Firebase');
      
      import('child_process').then(({ exec }) => {
        exec('npx tsx scripts/sync-supabase-to-minio.js && npx tsx scripts/sync-supabase-db.js && npx tsx scripts/update-firebase-urls.js', (err, stdout, stderr) => {
          if (err) console.error('Sync error:', err);
          console.log('Sync output:', stdout);
          if (stderr) console.error('Sync stderr:', stderr);
        });
      });
      
      res.json({ success: true, message: 'Sincronização iniciada com sucesso.' });
    } catch (error: any) {
      console.error('Sync auth error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/sync-all-data', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autorizado' });
    
    try {
      const token = authHeader.split('Bearer ')[1];
      await adminAuth.verifyIdToken(token);
      
      console.log('[AdminSync] Sync triggered...');
      
      res.json({ success: true, message: 'Sincronização iniciada com sucesso.' });
    } catch (error: any) {
      console.error('Sync error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  // --- MinIO DB Endpoints ---
  app.post('/api/minio-db/save', async (req, res) => {
    try {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (!authHeader || !(authHeader as string).startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Nao autorizado.' });
      }
      const token = (authHeader as string).split('Bearer ')[1];
      const decodedUser = await adminAuth.verifyIdToken(token);

      const { saveToMinioDB } = await import('./api/minio-db.js');
      const { collection, docId, data } = req.body;
      
      // Basic authorship check: if data has userId, ensure it matches
      if (data && data.userId && data.userId !== decodedUser.uid) {
         return res.status(403).json({ error: 'Nao autorizado: ID do usuario invalido.' });
      }

      if (!collection || !docId) return res.status(400).json({ error: "collection and docId required" });
      const result = await saveToMinioDB(collection, docId, data);
      res.json(result);
    } catch (e: any) {
      console.error("MinIO DB Save error", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/minio-db/delete', async (req, res) => {
    try {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (!authHeader || !(authHeader as string).startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Nao autorizado.' });
      }
      const token = (authHeader as string).split('Bearer ')[1];
      const decodedUser = await adminAuth.verifyIdToken(token);

      const { deleteFromMinioDB, getSingleDocumentFromMinioDB } = await import('./api/minio-db.js');
      const { collection, docId } = req.body;
      if (!collection || !docId) return res.status(400).json({ error: "collection and docId required" });
      
      // Ownership check: load doc, check userId
      const existingDoc = await getSingleDocumentFromMinioDB(collection, docId);
      if (existingDoc && existingDoc.userId && existingDoc.userId !== decodedUser.uid) {
         return res.status(403).json({ error: 'Nao autorizado: Voce nao pode apagar dados de outra pessoa.' });
      }

      const result = await deleteFromMinioDB(collection, docId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/minio-db/load', async (req, res) => {
    try {
      const { loadFromMinioDB } = await import('./api/minio-db.js');
      const { collection } = req.query;
      if (!collection) return res.status(400).json({ error: "collection query param required" });
      const result = await loadFromMinioDB(collection as string);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  // --------------------------

  // Withdrawal Request
  app.post('/api/withdraw', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const token = authHeader.split(' ')[1];
      const decodedToken = await getAuth().verifyIdToken(token);
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

      // Create withdrawal request
      const requestData = {
        userId,
        userEmail: userData.email,
        userName: userData.displayName || userData.username,
        amount: balance,
        status: 'pending',
        pixKey,
        createdAt: new Date().toISOString(),
      };

      const withdrawalRef = await db.collection('withdrawal_requests').add(requestData);
      saveToMinioDB('withdrawal_requests', withdrawalRef.id, requestData).catch(() => {});
      
      // Reset user balance
      const updateBalance = { balance: 0 };
      await userRef.update(updateBalance);
      saveToMinioDB('users', userId, { ...userData, ...updateBalance }).catch(() => {});

      res.json({ success: true });
    } catch (error: any) {
      console.error('Withdraw error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Confirm Payout
  app.post('/api/admin/payout/confirm', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autorizado' });
    
    try {
      const token = authHeader.split('Bearer ')[1];
      const decodedUser = await adminAuth.verifyIdToken(token);
      // Aqui você poderia verificar se decodedUser.uid é de um admin
      
      const { requestId } = req.body;
      const requestRef = db.collection('withdrawal_requests').doc(requestId);
      const requestSnap = await requestRef.get();
      
      if (!requestSnap.exists) return res.status(404).json({ error: 'Request not found' });
      
      const requestData = requestSnap.data()!;
      if (requestData.status === 'paid') return res.status(400).json({ error: 'Request already paid' });

      // Update request status
      const payoutUpdate = {
        status: 'paid',
        paidAt: new Date().toISOString()
      };
      await requestRef.update(payoutUpdate);
      saveToMinioDB('withdrawal_requests', requestId, { ...requestData, ...payoutUpdate }).catch(() => {});

      // Create notification for seller
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

      // Try to send email
      if (requestData.userEmail) {
        await sendSystemEmail({
          to: requestData.userEmail,
          subject: 'Pagamento Processado',
          title: `Olá, ${requestData.userName || 'Vendedor'}!`,
          message: `Temos ótimas notícias! Seu repasse de <strong>R$ ${Number(requestData.amount).toFixed(2)}</strong> foi processado com sucesso e enviado para sua chave PIX cadastrada.`,
          buttonText: 'Ver meu Dashboard',
          buttonUrl: `${process.env.SITE_URL || 'https://packzinhu.com'}/dashboard?tab=payouts`,
          bannerType: 'sale'
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Payout confirm error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Send Custom Email
  app.post('/api/admin/send-custom-email', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autorizado' });

    try {
      const token = authHeader.split('Bearer ')[1];
      await adminAuth.verifyIdToken(token);
      
      const { to, subject, body } = req.body;

      if (!to || !subject || !body) {
        return res.status(400).json({ error: 'Destinatário, assunto e corpo são obrigatórios.' });
      }

      await sendSystemEmail({
        to,
        subject,
        title: 'Mensagem da Administração',
        message: body.replace(/\n/g, '<br>'),
        footer: 'Esta é uma mensagem oficial da administração do PackZinhu.'
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Custom email send error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // User: Notify New Follower
  app.post('/api/notify-follow', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autorizado' });

    try {
      const token = authHeader.split('Bearer ')[1];
      const decodedUser = await adminAuth.verifyIdToken(token);
      
      const { followerId, followedId } = req.body;
      
      // Ensure the caller is the actual follower
      if (decodedUser.uid !== followerId) {
        return res.status(403).json({ error: 'Proibido' });
      }

      const followerSnap = await db.collection('users').doc(followerId).get();
      const followedSnap = await db.collection('users').doc(followedId).get();

      if (followerSnap.exists && followedSnap.exists) {
        const follower = followerSnap.data()!;
        const followed = followedSnap.data()!;

        await sendSystemEmail({
          to: followed.email,
          subject: 'Você tem um novo seguidor!',
          title: 'Grande novidade!',
          message: `O usuário <strong>${follower.displayName || follower.username}</strong> começou a seguir você no PackZinhu.`,
          buttonText: 'Ver Perfil',
          buttonUrl: `${process.env.SITE_URL || 'https://packzinhu.com'}/profile/${followerId}`,
          bannerType: 'follow'
        });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao notificar seguidor' });
    }
  });

  // User: Request Account Deletion (2-Step Verification)
  app.post('/api/account/delete-request', async (req, res) => {
    const { userId } = req.body;
    try {
      const userSnap = await db.collection('users').doc(userId).get();
      if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });
      
      const user = userSnap.data()!;
      // Generate a simple 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store code temporarily for 10 mins
      await db.collection('deletion_requests').doc(userId).set({
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });

      await sendSystemEmail({
        to: user.email,
        subject: 'Confirmação de Exclusão de Conta',
        title: 'Aviso de Segurança',
        message: `Recebemos um pedido para excluir permanentemente sua conta no PackZinhu. <br><br>Seu código de confirmação é: <strong style="font-size: 24px; color: #8B5CF6; letter-spacing: 2px;">${code}</strong><br><br>Este código expira em 10 minutos. Se você não solicitou isso, ignore este e-mail e proteja sua conta.`,
        bannerType: 'security'
      });

      res.json({ success: true, message: 'Código enviado ao e-mail cadastrado.' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao solicitar exclusão' });
    }
  });

  // User: Confirm Account Deletion
  app.post('/api/account/delete-confirm', async (req, res) => {
    const { userId, code } = req.body;
    try {
      const requestSnap = await db.collection('deletion_requests').doc(userId).get();
      if (!requestSnap.exists) return res.status(400).json({ error: 'Solicitação não encontrada ou código expirado.' });
      
      const requestData = requestSnap.data()!;
      if (requestData.code !== code || new Date() > new Date(requestData.expiresAt)) {
        return res.status(400).json({ error: 'Código inválido ou expirado.' });
      }

      // Cleanup
      await db.collection('deletion_requests').doc(userId).delete();
      
      // Note: Real deletion happens on the client-side/auth-level usually, 
      // but we return success so the client knows it can proceed.
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao confirmar exclusão' });
    }
  });

  // Mercado Pago: Create Preference
  // MERCADOPAGO OAUTH FLOW
  app.get('/api/auth/mercadopago/url', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    
    // https://auth.mercadopago.com/authorization?client_id=APP_ID&response_type=code&platform_id=mp&state=RANDOM_ID&redirect_uri=YOUR_URL
    const clientId = process.env.MERCADOPAGO_CLIENT_ID;
    if (!clientId) return res.status(500).json({ error: 'MERCADOPAGO_CLIENT_ID is not configured' });
    
    const SITE_URL = process.env.VITE_URL || process.env.SITE_URL || 'https://packzinhu.online';
    const redirectUri = `${SITE_URL}/callback`;
    const authUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${userId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    res.json({ url: authUrl });
  });

  app.post('/api/auth/mercadopago/exchange', async (req, res) => {
    try {
      const { code, userId } = req.body;
      if (!code || !userId) return res.status(400).json({ error: 'Missing code or userId' });

      // In a real app we need to exchange this code for an access token
      // POST https://api.mercadopago.com/oauth/token
      const clientId = process.env.MERCADOPAGO_CLIENT_ID;
      const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
      
      const SITE_URL = process.env.VITE_URL || process.env.SITE_URL || 'https://packzinhu.online';
      const redirectUri = `${SITE_URL}/callback`;

      const response = await fetch('https://api.mercadopago.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_secret: clientSecret || '',
          client_id: clientId || '',
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('MercadoPago Auth Error:', data);
        return res.status(400).json({ error: 'Failed to authenticate with Mercado Pago', details: data });
      }

      // Save the credentials to user
      const userRef = db.collection('users').doc(userId as string);
      
      const mpData = {
        hasMercadoPago: true,
        mercadoPagoAccessToken: data.access_token,
        mercadoPagoRefreshToken: data.refresh_token,
        mercadoPagoUserId: data.user_id,
        mercadoPagoPublicKey: data.public_key,
        mercadoPagoExpiresIn: data.expires_in,
        updatedAt: new Date().toISOString()
      };
      
      await userRef.set(mpData, { merge: true });
      
      const currentData = (await userRef.get()).data() || {};
      saveToMinioDB('users', userId as string, { ...currentData, ...mpData }).catch(() => {});

      return res.json({ success: true });
    } catch (error: any) {
      console.error('MercadoPago Exchange error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/create-mercadopago-preference', async (req, res) => {
    try {
      const { serviceId, serviceTitle, amount, sellerId, buyerId, buyerName, buyerEmail } = req.body;

      if (!process.env.MERCADOPAGO_ACCESS_TOKEN || !process.env.MERCADOPAGO_ACCESS_TOKEN.trim()) {
        return res.status(500).json({ error: 'MERCADOPAGO_ACCESS_TOKEN não configurado no servidor.' });
      }

      const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN.trim() });
      const preference = new Preference(client);
      
      const siteUrl = process.env.SITE_URL || `https://${req.get('host')}`;
      
      const orderId = db.collection('orders').doc().id;

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
            name: buyerName || 'Anônimo',
            email: buyerEmail || 'test@example.com', // Mercado Pago requires an email
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
            excluded_payment_types: [], // Allow all: Pix, Card, Boleto
            installments: 12,
          }
        }
      });

      // Optionally save order as pending here
      const orderData = {
        id: orderId,
        serviceId: serviceId || '',
        serviceTitle: serviceTitle || '',
        amount: amount || 0,
        seller_id: sellerId || '',
        sellerId: sellerId || '', // Compatibility
        buyer_id: buyerId || '',
        buyerId: buyerId || '', // Compatibility
        buyerName: buyerName || 'Anônimo',
        buyerEmail: buyerEmail || 'anonimo@example.com',
        status: 'pending',
        paymentMethod: 'mercado_pago',
        preferenceId: response.id,
        created_at: new Date().toISOString(),
        createdAt: new Date().toISOString(), // Compatibility
      };
      
      await db.collection('orders').doc(orderId).set(orderData);
      saveToMinioDB('orders', orderId, orderData).catch(() => {});

      res.json({ init_point: response.init_point, id: response.id });
    } catch (error: any) {
      console.error('Mercado Pago Error:', error);
      res.status(500).json({ error: error.message || 'Erro ao criar preferência de pagamento' });
    }
  });

  // Mercado Pago: Webhook Segura
  app.all(['/api/mercadopago-webhook', '/api/webhook'], async (req: any, res: any) => {
    // Tratamento de OPTIONS-CORS ou Métodos de teste do MP
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(200).send('OK');
    }
    
    // MP Webhooks format: req.body.type, IPN format: req.query.topic or req.body.topic
    const type = req.body?.type || req.query?.topic || req.body?.topic;
    
    // Captura O payload principal e as variáveis extras que eles mandam (pode ser data.id ou direto id dependendo do evento)
    const dataId = req.body?.data?.id || req.body?.id || req.query?.id;
    
    console.log(`[Webhook] ${req.method} received at ${req.path} | Type: ${type} | ID: ${dataId}`);

    // Mercado Pago requirements
    if (String(dataId) === '123456') {
      console.log('[Webhook] Test request. Returning 200 OK.');
      return res.status(200).send('OK');
    }
    
    if (!type || !dataId) {
      // Ignora junk traffic sem ID.
      console.log('[Webhook] Invalid request format or missing ID. Returning 200 to stop retry.');
      return res.status(200).send('OK');
    }
    
    try {
      if ((type === 'payment' || type === 'mp-payment') && dataId) {
        // Fetch payment details
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
          headers: {
            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()}`
          }
        });
        
        if (!mpResponse.ok) {
          throw new Error(`Failed to fetch payment details ${dataId}. Status: ${mpResponse.status}`);
        }
        
        const paymentData = await mpResponse.json();
        
        let externalReference: any = {};
        try {
          externalReference = JSON.parse(paymentData.external_reference || '{}');
        } catch (e) {
          console.error('[Webhook] Failed to parse external_reference JSON');
        }
        
        const orderId = externalReference.orderId || paymentData.preference_id || paymentData.order?.id || `mp_${dataId}`;
        const orderRef = db.collection('orders').doc(orderId);
        
        // Verifica o pedido antes de atualizar
        const orderSnap = await orderRef.get();
        const currentData = orderSnap.data() || {};
        
        let newStatus = currentData.status || 'pending';
        
        if (paymentData.status === 'approved') {
          newStatus = 'paid'; // Pagamento retido: marcado como pago mas saldo ainda não liberado no /confirm-delivery
        } else if (paymentData.status === 'pending' || paymentData.status === 'in_process') {
          newStatus = 'pending';
        } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled' || paymentData.status === 'refunded') {
          newStatus = 'refused';
        }
        
        const updateOrder = {
          status: newStatus,
          mercadoPagoPaymentId: dataId,
          updatedAt: new Date().toISOString(),
          ...externalReference
        };
        await orderRef.set(updateOrder, { merge: true });
        saveToMinioDB('orders', orderId, { ...currentData, ...updateOrder }).catch(() => {});
        
        console.log(`[Webhook] Order ${orderId} updated to status: ${newStatus}`);

        // --- Send Emails Only If It Just Transitioned to Paid ---
        if (newStatus === 'paid' && currentData.status !== 'paid' && currentData.status !== 'delivered') {
          try {
            const sellerSnap = await db.collection('users').doc(externalReference.sellerId).get();
            const buyerSnap = await db.collection('users').doc(externalReference.buyerId).get();
            
            if (sellerSnap.exists) {
              const seller = sellerSnap.data()!;
              await sendSystemEmail({
                to: seller.email,
                subject: 'Nova Venda Realizada!',
                title: 'Parabéns pela venda!',
                message: `Você acabou de realizar uma venda de <strong>R$ ${externalReference.amount}</strong>. Acesse seu painel para processar o pedido.`,
                buttonText: 'Ver Vendas',
                buttonUrl: `${process.env.SITE_URL || 'https://packzinhu.online'}/dashboard?tab=sales`,
                bannerType: 'sale'
              });

              // In-app notification
              const sellerNotif = {
                recipient_id: externalReference.sellerId,
                sender_id: 'system',
                type: 'sale',
                message: `Você realizou uma nova venda de R$ ${externalReference.amount}!`,
                read: false,
                created_at: new Date().toISOString()
              };
              const sNotifRef = await db.collection('notifications').add(sellerNotif);
              saveToMinioDB('notifications', sNotifRef.id, sellerNotif).catch(() => {});
            }

            if (buyerSnap.exists) {
              const buyer = buyerSnap.data()!;
              await sendSystemEmail({
                to: buyer.email,
                subject: 'Sua compra foi aprovada!',
                title: 'Compra Confirmada!',
                message: `Seu pagamento foi aprovado. O valor está seguro e será liberado ao vendedor após a entrega.`,
                buttonText: 'Minhas Compras',
                buttonUrl: `${process.env.SITE_URL || 'https://packzinhu.online'}/dashboard?tab=purchases`,
                bannerType: 'purchase'
              });

              // In-app notification
              const buyerNotif = {
                recipient_id: externalReference.buyerId,
                sender_id: 'system',
                type: 'purchase',
                message: `Seu pagamento do serviço "${externalReference.serviceTitle || 'contratado'}" foi aprovado!`,
                read: false,
                created_at: new Date().toISOString()
              };
              const bNotifRef = await db.collection('notifications').add(buyerNotif);
              saveToMinioDB('notifications', bNotifRef.id, buyerNotif).catch(() => {});
            }
          } catch (e) {
            console.error('[Webhook] Failed to send emails:', e);
          }
        }
      }
      
      return res.status(200).send('OK'); 
    } catch (error) {
      console.error('[Webhook] Error:', error);
      return res.status(200).send('Error Caught'); 
    }
  });

  // Release payment to seller balance
  app.post('/api/orders/confirm-delivery', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autorizado' });
      const token = authHeader.split('Bearer ')[1];
      const decodedUser = await adminAuth.verifyIdToken(token);

      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ error: 'ID do pedido obrigatório' });

      const orderRef = db.collection('orders').doc(orderId);
      const orderSnap = await orderRef.get();
      if (!orderSnap.exists) return res.status(404).json({ error: 'Pedido não encontrado' });
      
      const orderData = orderSnap.data()!;
      if (orderData.buyerId !== decodedUser.uid) return res.status(403).json({ error: 'Apenas o comprador pode liberar' });
      if (orderData.status === 'delivered') return res.status(400).json({ error: 'Pagamento já foi liberado' });

      // Calculate net amount for seller (e.g., 95%) 
      const amount = Number(orderData.amount);
      if (isNaN(amount)) throw new Error('Valor do pedido inválido');
      
      const sellerNetAmount = amount * 0.95;

      const sellerRef = db.collection('users').doc(orderData.sellerId);
      
      await db.runTransaction(async (t) => {
        const sellerDoc = await t.get(sellerRef);
        const sellerData = sellerDoc.data() || {};
        const currentBalance = Number(sellerData.balance || 0);
        const newBalance = currentBalance + sellerNetAmount;
        
        const deliveredAt = new Date().toISOString();
        t.update(sellerRef, { balance: newBalance });
        t.update(orderRef, { 
          status: 'delivered', 
          deliveredAt
        });

        saveToMinioDB('users', orderData.sellerId, { ...sellerData, balance: newBalance }).catch(() => {});
        saveToMinioDB('orders', orderId, { ...orderData, status: 'delivered', deliveredAt }).catch(() => {});
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Local SQL Media Library
  app.get('/api/my-uploads', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autorizado' });
      const token = authHeader.split('Bearer ')[1];
      const decodedUser = await adminAuth.verifyIdToken(token);
      
      const uploads = getMediaByUser(decodedUser.uid);
      res.json({ success: true, uploads });
    } catch (error: any) {
      console.error('Error fetching SQL uploads:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Change order status manually (Dashboard)
  app.post('/api/admin/resolve-dispute', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autorizado' });
      const token = authHeader.split('Bearer ')[1];
      await adminAuth.verifyIdToken(token);

      const { orderId, resolution } = req.body;
      if (!orderId || !resolution) return res.status(400).json({ error: 'Faltam parâmetros' });

      const orderRef = db.collection('orders').doc(orderId);
      const orderSnap = await orderRef.get();
      if (!orderSnap.exists) return res.status(404).json({ error: 'Pedido não encontrado' });

      const orderData = orderSnap.data()!;
      if (orderData.status !== 'disputed') return res.status(400).json({ error: 'Pedido não está em disputa' });

      if (resolution === 'release') {
        const amount = Number(orderData.amount);
        const sellerNetAmount = amount * 0.95;
        const sellerRef = db.collection('users').doc(orderData.sellerId);

        await db.runTransaction(async (t) => {
          const sellerDoc = await t.get(sellerRef);
          const sellerData = sellerDoc.data() || {};
          const currentBalance = Number(sellerData.balance || 0);
          
          t.update(sellerRef, { balance: currentBalance + sellerNetAmount });
          t.update(orderRef, { status: 'delivered', resolvedAt: new Date().toISOString() });
        });
        
        saveToMinioDB('orders', orderId, { ...orderData, status: 'delivered' }).catch(() => {});
      } else if (resolution === 'refund') {
        await orderRef.update({ status: 'refunded', resolvedAt: new Date().toISOString() });
        saveToMinioDB('orders', orderId, { ...orderData, status: 'refunded' }).catch(() => {});
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error resolving dispute:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/orders/:orderId/status', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const { status } = req.body;
      const { orderId } = req.params;

      if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autorizado' });
      const token = authHeader.split('Bearer ')[1];
      await adminAuth.verifyIdToken(token); // Verify validity

      const orderRef = db.collection('orders').doc(orderId);
      const updateData = { status, updatedAt: new Date().toISOString() };
      await orderRef.update(updateData);
      
      const orderSnap = await orderRef.get();
      if (orderSnap.exists) {
        saveToMinioDB('orders', orderId, orderSnap.data()).catch(() => {});
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error changing order status:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Configure cache for static files (1 year)
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      index: false // Let the *all route handle index.html without caching it too long
    }));
    
    app.get('*all', (req, res) => {
      // Don't cache index.html long-term so users get updates
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  try {
    const { ensureBucketAndPolicy } = await import('./src/lib/minio-client.js');
    const { MINIO_BUCKET } = await import('./src/lib/s3.js');
    await ensureBucketAndPolicy(MINIO_BUCKET);
  } catch (err) {
    console.warn("Could not ensure MinIO bucket on startup. Will retry on upload.");
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
