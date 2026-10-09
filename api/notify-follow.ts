import nodemailer from 'nodemailer';
import { getAdminFirestore, getAdminAuth } from './firebase-admin.ts';

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
  const emailLog: any = {
    to,
    subject,
    title,
    message,
    buttonText: buttonText || null,
    buttonUrl: buttonUrl || null,
    footer: footer || null,
    bannerType: bannerType || 'default',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  try {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const smtpUser = process.env.SMTP_USER || 'contato.packzinhu@gmail.com';
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpPass) {
      console.warn('SMTP_PASS not configured. Skipping email send.');
      emailLog.status = 'skipped_no_credentials';
      await db.collection('site_emails').add(emailLog);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const bannerUrls = {
      sale: process.env.BANNER_SALE_URL,
      purchase: process.env.BANNER_PURCHASE_URL,
      follow: process.env.BANNER_FOLLOW_URL,
      security: process.env.BANNER_SECURITY_URL,
      default: process.env.BANNER_DEFAULT_URL || 'https://packzinhu.online/banner-principal.jpeg'
    };

    const bannerImage = bannerUrls[bannerType || 'default'] || bannerUrls.default;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #0f0f13; color: #ffffff; padding: 20px; border-radius: 8px;">
        ${bannerImage ? `<img src="${bannerImage}" alt="Banner" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 6px; margin-bottom: 20px;" />` : ''}
        <h2 style="color: #a855f7;">${title}</h2>
        <p style="font-size: 16px; line-height: 1.5;">${message}</p>
        ${buttonUrl && buttonText ? `
          <div style="margin-top: 25px; margin-bottom: 25px;">
            <a href="${buttonUrl}" style="background-color: #a855f7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              ${buttonText}
            </a>
          </div>
        ` : ''}
        <hr style="border: 0; border-top: 1px solid #27272a; margin: 20px 0;" />
        <p style="font-size: 12px; color: #71717a;">${footer || 'PackZinhu - Todos os direitos reservados.'}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"PackZinhu" <${smtpUser}>`,
      to,
      subject,
      html: htmlContent
    });

    emailLog.status = 'sent';
    await db.collection('site_emails').add(emailLog);
  } catch (error: any) {
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
    const db = getAdminFirestore();
    const adminAuth = getAdminAuth();

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
  } catch (error: any) {
    console.error('Notify Follow Error:', error);
    return res.status(500).json({ error: error.message || 'Erro ao notificar' });
  }
}
