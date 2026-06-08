import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

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
    throw new Error("Erro na inicialização do Firebase");
  }
}

async function sendSystemEmail(db: any, { to, subject, title, message, buttonText, buttonUrl, footer, bannerType }: { 
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
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: sender,
        pass: process.env.SMTP_PASS || '', 
      },
    });

    const bannerMap: any = {
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
          <div style="width: 100%; border-radius: 30px 30px 10px 10px; overflow: hidden; margin-bottom: 20px; position: relative; background-color: #111;">
            <img src="${currentBanner}" alt="Banner" style="width: 100%; display: block; object-fit: cover; max-height: 200px;" />
            <div style="position: absolute; top: 20px; left: 20px; display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.5); padding: 5px 15px; border-radius: 20px; backdrop-filter: blur(5px);">
               <img src="${siteUrl}/favicon.png" style="width: 24px; height: 24px; border-radius: 50%;" />
               <span style="font-weight: 900; letter-spacing: -0.5px; font-size: 16px;">PackZinhu</span>
            </div>
          </div>
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

    await transporter.sendMail(mailOptions);
    
    const emailLog = {
      to,
      subject: `${subject} - PackZinhu`,
      body: message,
      type: 'system_auto',
      createdAt: new Date().toISOString()
    };
    await db.collection('site_emails').add(emailLog);
  } catch (error) {
    console.error('Email error:', error);
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autorizado' });

  try {
    ensureFirebase();
    const db = getFirestore((firebaseConfig as any).firestoreDatabaseId);
    const adminAuth = getAuth();

    const token = authHeader.split('Bearer ')[1];
    const decodedUser = await adminAuth.verifyIdToken(token);
    
    const { followerId, followedId } = req.body;
    
    if (decodedUser.uid !== followerId) {
      return res.status(403).json({ error: 'Proibido' });
    }

    const followerSnap = await db.collection('users').doc(followerId).get();
    const followedSnap = await db.collection('users').doc(followedId).get();

    if (followerSnap.exists && followedSnap.exists) {
      const follower = followerSnap.data()!;
      const followed = followedSnap.data()!;

      if (followed.email) {
          await sendSystemEmail(db, {
            to: followed.email,
            subject: 'Você tem um novo seguidor!',
            title: 'Grande novidade!',
            message: `O usuário <strong>${follower.displayName || follower.username}</strong> começou a seguir você no PackZinhu.`,
            buttonText: 'Ver Perfil',
            buttonUrl: `${process.env.SITE_URL || 'https://packzinhu.online'}/profile/${followerId}`,
            bannerType: 'follow'
          });
      }
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao notificar seguidor' });
  }
}
