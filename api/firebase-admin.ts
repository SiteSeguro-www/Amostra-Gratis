import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let firebaseConfig: any = {
  projectId: "gen-lang-client-0668923042",
  firestoreDatabaseId: "ai-studio-fb36f72e-d6e7-437c-8175-890b834eee0f",
  storageBucket: "gen-lang-client-0668923042.firebasestorage.app",
};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = { ...firebaseConfig, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
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

export function getAdminApp() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      try {
        const parsed = smartParseServiceAccount(serviceAccount);
        if (parsed) {
          return initializeApp({
            credential: cert(parsed),
            projectId: parsed.projectId || firebaseConfig.projectId,
            storageBucket: parsed.storageBucket || firebaseConfig.storageBucket
          });
        }
      } catch (e) {
        console.warn('[FirebaseAdmin] Failed to initialize with service account cert, falling back to project config:', e);
      }
    }
    return initializeApp({
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket
    });
  }
  return getApps()[0];
}

export function getAdminFirestore() {
  getAdminApp();
  return getFirestore(firebaseConfig.firestoreDatabaseId);
}

export function getAdminAuth() {
  getAdminApp();
  return getAuth();
}

export { firebaseConfig };
