var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/lib/s3.ts
var s3_exports = {};
__export(s3_exports, {
  MINIO_BUCKET: () => MINIO_BUCKET,
  MINIO_ENDPOINT: () => MINIO_ENDPOINT,
  MINIO_ENDPOINT_RAW: () => MINIO_ENDPOINT_RAW,
  s3Client: () => s3Client
});
import { S3Client } from "@aws-sdk/client-s3";
var MINIO_ENDPOINT_RAW, MINIO_ENDPOINT, MINIO_USE_SSL, endPointUrl, s3Client, MINIO_BUCKET;
var init_s3 = __esm({
  "src/lib/s3.ts"() {
    MINIO_ENDPOINT_RAW = process.env.MINIO_ENDPOINT && !process.env.MINIO_ENDPOINT.includes("trycloudflare") ? process.env.MINIO_ENDPOINT.replace(/^https?:\/\//, "") : "minio.packzinhu.online";
    MINIO_ENDPOINT = MINIO_ENDPOINT_RAW;
    MINIO_USE_SSL = process.env.MINIO_SSL === "true" || true;
    endPointUrl = `https://${MINIO_ENDPOINT}`;
    s3Client = new S3Client({
      endpoint: endPointUrl,
      region: process.env.MINIO_REGION || "us-east-1",
      credentials: {
        accessKeyId: "packzinhu",
        secretAccessKey: "Slimsli89x*"
      },
      forcePathStyle: true
    });
    MINIO_BUCKET = process.env.MINIO_BUCKET || "packzinhu-db";
  }
});

// src/lib/minio-client.ts
var minio_client_exports = {};
__export(minio_client_exports, {
  ensureBucketAndPolicy: () => ensureBucketAndPolicy,
  minioClient: () => minioClient
});
import * as Minio from "minio";
async function ensureBucketAndPolicy(bucketName) {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      console.log(`[MinIO] Creating bucket: ${bucketName}`);
      await minioClient.makeBucket(bucketName, "us-east-1");
      console.log(`[MinIO] Bucket ${bucketName} created.`);
    }
    try {
      const policyContent = {
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${bucketName}/*`]
        }]
      };
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policyContent));
      console.log(`[MinIO] Policy set to public read`);
    } catch (err) {
      console.error("[MinIO] Error setting policy:", err.message);
    }
    try {
      const { s3Client: s3Client2 } = await Promise.resolve().then(() => (init_s3(), s3_exports));
      const { PutBucketCorsCommand } = await import("@aws-sdk/client-s3");
      const corsParams = {
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ["*"],
              AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
              AllowedOrigins: [
                "https://packzinhu.online",
                "https://www.packzinhu.online",
                "https://cdn.packzinhu.online",
                "https://ais-dev-vvtkqs525dn77fwrz5xxaa-109493740571.us-east5.run.app",
                "https://ais-pre-vvtkqs525dn77fwrz5xxaa-109493740571.us-east5.run.app",
                "http://localhost:3000",
                "http://localhost:5173"
              ],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3e3
            }
          ]
        }
      };
      await s3Client2.send(new PutBucketCorsCommand(corsParams));
      console.log(`[MinIO] CORS Policy set up for bucket ${bucketName}`);
    } catch (corsErr) {
      console.error("[MinIO] Error setting CORS:", corsErr.message);
    }
  } catch (err) {
    console.error(`[MinIO] Error ensuring bucket & policy for ${bucketName}:`, err.message);
  }
}
var MINIO_ENDPOINT_RAW2, MINIO_ENDPOINT2, MINIO_PORT, MINIO_USE_SSL2, minioClient;
var init_minio_client = __esm({
  "src/lib/minio-client.ts"() {
    MINIO_ENDPOINT_RAW2 = "minio.packzinhu.online";
    MINIO_ENDPOINT2 = MINIO_ENDPOINT_RAW2;
    MINIO_PORT = 443;
    MINIO_USE_SSL2 = true;
    minioClient = new Minio.Client({
      endPoint: MINIO_ENDPOINT2,
      port: MINIO_PORT,
      useSSL: MINIO_USE_SSL2,
      region: process.env.MINIO_REGION || "us-east-1",
      accessKey: "packzinhu",
      secretKey: "Slimsli89x*"
    });
  }
});

// api-handlers/minio-db.ts
var minio_db_exports = {};
__export(minio_db_exports, {
  default: () => handler,
  deleteFromMinioDB: () => deleteFromMinioDB,
  getSingleDocumentFromMinioDB: () => getSingleDocumentFromMinioDB,
  loadFromMinioDB: () => loadFromMinioDB,
  saveToMinioDB: () => saveToMinioDB
});
import { PutObjectCommand as PutObjectCommand2, GetObjectCommand, ListObjectsV2Command, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand, DeleteObjectCommand as DeleteObjectCommand2 } from "@aws-sdk/client-s3";
async function ensureDbBucket() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: DB_BUCKET }));
  } catch (err) {
    if (err.$metadata?.httpStatusCode === 404 || err.name === "NotFound") {
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: DB_BUCKET }));
        const policy = {
          Version: "2012-10-17",
          Statement: [{
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${DB_BUCKET}/*`]
          }]
        };
        await s3Client.send(new PutBucketPolicyCommand({ Bucket: DB_BUCKET, Policy: JSON.stringify(policy) }));
      } catch (e) {
        console.error("Failed to create db bucket", e);
      }
    }
  }
}
async function handler(req, res) {
  const { collection, docId, data } = req.method === "GET" ? req.query : req.body;
  try {
    if (req.method === "POST") {
      const result = await saveToMinioDB(collection, docId, data);
      return res.status(200).json(result);
    } else if (req.method === "GET") {
      const result = await loadFromMinioDB(collection);
      return res.status(200).json(result);
    } else if (req.method === "DELETE") {
      const result = await deleteFromMinioDB(collection, docId);
      return res.status(200).json(result);
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
async function saveToMinioDB(collection, docId, data) {
  try {
    await ensureDbBucket();
    const key = `${collection}/${docId}.json`;
    const body = JSON.stringify(data);
    await s3Client.send(new PutObjectCommand2({
      Bucket: DB_BUCKET,
      Key: key,
      Body: body,
      ContentType: "application/json"
    }));
    return { success: true, url: `https://cdn.packzinhu.online/${DB_BUCKET}/${key}` };
  } catch (error) {
    console.error(`[MinIO DB] Save Error (${collection}/${docId}):`, error.message);
    throw error;
  }
}
async function loadFromMinioDB(collection) {
  await ensureDbBucket();
  const prefix = `${collection}/`;
  const response = await s3Client.send(new ListObjectsV2Command({ Bucket: DB_BUCKET, Prefix: prefix }));
  if (!response.Contents) return [];
  const items = [];
  for (const obj of response.Contents) {
    if (!obj.Key) continue;
    try {
      const getReq = await s3Client.send(new GetObjectCommand({ Bucket: DB_BUCKET, Key: obj.Key }));
      const str = await getReq.Body?.transformToString();
      if (str) items.push(JSON.parse(str));
    } catch (e) {
      console.error(`Failed to load ${obj.Key}`, e);
    }
  }
  return items;
}
async function getSingleDocumentFromMinioDB(collection, docId) {
  await ensureDbBucket();
  const key = `${collection}/${docId}.json`;
  try {
    const getReq = await s3Client.send(new GetObjectCommand({ Bucket: DB_BUCKET, Key: key }));
    const str = await getReq.Body?.transformToString();
    if (str) return JSON.parse(str);
    return null;
  } catch (e) {
    console.error(`Failed to load ${key}`, e);
    return null;
  }
}
async function deleteFromMinioDB(collection, docId) {
  await ensureDbBucket();
  const key = `${collection}/${docId}.json`;
  await s3Client.send(new DeleteObjectCommand2({
    Bucket: DB_BUCKET,
    Key: key
  }));
  return { success: true };
}
var DB_BUCKET;
var init_minio_db = __esm({
  "api-handlers/minio-db.ts"() {
    init_s3();
    DB_BUCKET = process.env.MINIO_DB_BUCKET || "packzinhu-db";
  }
});

// api-handlers/packzinhu-db.ts
var packzinhu_db_exports = {};
__export(packzinhu_db_exports, {
  default: () => handler2,
  deleteFromMinioDB: () => deleteFromMinioDB2,
  loadFromMinioDB: () => loadFromMinioDB2,
  loadSingleFromMinioDB: () => loadSingleFromMinioDB,
  saveToMinioDB: () => saveToMinioDB2
});
import { PutObjectCommand as PutObjectCommand4, GetObjectCommand as GetObjectCommand2, ListObjectsV2Command as ListObjectsV2Command2, CreateBucketCommand as CreateBucketCommand2, HeadBucketCommand as HeadBucketCommand2, PutBucketPolicyCommand as PutBucketPolicyCommand2, DeleteObjectCommand as DeleteObjectCommand3 } from "@aws-sdk/client-s3";
async function ensureDbBucket2() {
  try {
    await s3Client.send(new HeadBucketCommand2({ Bucket: DB_BUCKET2 }));
  } catch (err) {
    if (err.$metadata?.httpStatusCode === 404 || err.name === "NotFound") {
      try {
        await s3Client.send(new CreateBucketCommand2({ Bucket: DB_BUCKET2 }));
        const policy = {
          Version: "2012-10-17",
          Statement: [{
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${DB_BUCKET2}/*`]
          }]
        };
        await s3Client.send(new PutBucketPolicyCommand2({ Bucket: DB_BUCKET2, Policy: JSON.stringify(policy) }));
      } catch (e) {
        console.error("Failed to create db bucket", e);
      }
    }
  }
}
async function handler2(req, res) {
  const { collection, docId, data } = req.method === "GET" ? req.query : req.body;
  try {
    if (req.method === "POST") {
      const result = await saveToMinioDB2(collection, docId, data);
      return res.status(200).json(result);
    } else if (req.method === "GET") {
      if (docId) {
        const result2 = await loadSingleFromMinioDB(collection, docId);
        return res.status(200).json(result2);
      }
      const result = await loadFromMinioDB2(collection);
      return res.status(200).json(result);
    } else if (req.method === "DELETE") {
      const result = await deleteFromMinioDB2(collection, docId);
      return res.status(200).json(result);
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
async function saveToMinioDB2(collection, docId, data) {
  try {
    await ensureDbBucket2();
    const key = `${collection}/${docId}.json`;
    const body = JSON.stringify(data);
    await s3Client.send(new PutObjectCommand4({
      Bucket: DB_BUCKET2,
      Key: key,
      Body: body,
      ContentType: "application/json"
    }));
    return { success: true, url: `https://cdn.packzinhu.online/${DB_BUCKET2}/${key}` };
  } catch (error) {
    console.error(`[MinIO DB] Save Error (${collection}/${docId}):`, error.message);
    throw error;
  }
}
async function loadFromMinioDB2(collection) {
  await ensureDbBucket2();
  const prefix = `${collection}/`;
  const response = await s3Client.send(new ListObjectsV2Command2({ Bucket: DB_BUCKET2, Prefix: prefix }));
  if (!response.Contents) return [];
  const items = [];
  for (const obj of response.Contents) {
    if (!obj.Key) continue;
    try {
      const getReq = await s3Client.send(new GetObjectCommand2({ Bucket: DB_BUCKET2, Key: obj.Key }));
      const str = await getReq.Body?.transformToString();
      if (str) items.push(JSON.parse(str));
    } catch (e) {
      console.error(`Failed to load ${obj.Key}`, e);
    }
  }
  return items;
}
async function loadSingleFromMinioDB(collection, docId) {
  try {
    await ensureDbBucket2();
    const key = `${collection}/${docId}.json`;
    const getReq = await s3Client.send(new GetObjectCommand2({ Bucket: DB_BUCKET2, Key: key }));
    const str = await getReq.Body?.transformToString();
    return str ? JSON.parse(str) : null;
  } catch (e) {
    if (e.name === "NoSuchKey") return null;
    throw e;
  }
}
async function deleteFromMinioDB2(collection, docId) {
  await ensureDbBucket2();
  const key = `${collection}/${docId}.json`;
  await s3Client.send(new DeleteObjectCommand3({
    Bucket: DB_BUCKET2,
    Key: key
  }));
  return { success: true };
}
var DB_BUCKET2;
var init_packzinhu_db = __esm({
  "api-handlers/packzinhu-db.ts"() {
    init_s3();
    DB_BUCKET2 = process.env.MINIO_DB_BUCKET || "packzinhu-db";
  }
});

// server.ts
import cors from "cors";
import express from "express";
import path2 from "path";
import { MercadoPagoConfig, Preference } from "mercadopago";
import dotenv from "dotenv";
import { initializeApp as initializeApp2, cert as cert2, getApps as getApps2 } from "firebase-admin/app";
import { getFirestore as getFirestore2 } from "firebase-admin/firestore";
import { getAuth as getAuth2 } from "firebase-admin/auth";
import nodemailer from "nodemailer";
import compression from "compression";
import webPush from "web-push";

// api-handlers/upload.ts
init_minio_client();
init_s3();
import formidable from "formidable";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

// api-handlers/firebase-admin.ts
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";
var firebaseConfig = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (e) {
}
function smartParseServiceAccount(sa) {
  if (!sa) return null;
  const originalSa = sa;
  sa = sa.trim();
  let parsed = null;
  try {
    let p = JSON.parse(sa);
    if (typeof p === "string") p = JSON.parse(p);
    if (p && typeof p === "object") parsed = p;
  } catch (e) {
  }
  if (!parsed) {
    try {
      const sanitized = sa.replace(/\\n/g, "\n").replace(/^"|"$/g, "");
      let p = JSON.parse(sanitized);
      if (typeof p === "string") p = JSON.parse(p);
      if (p && typeof p === "object") parsed = p;
    } catch (e) {
    }
  }
  if (!parsed) {
    try {
      if (/^[A-Za-z0-9+/=\s\n]+$/.test(sa) && sa.length > 50) {
        const decoded = Buffer.from(sa, "base64").toString("utf-8");
        let p = JSON.parse(decoded);
        if (typeof p === "string") p = JSON.parse(p);
        if (p && typeof p === "object") parsed = p;
      }
    } catch (e) {
    }
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
          private_key: privateKeyMatch[1].replace(/\\n/g, "\n")
        };
      }
    } catch (e) {
    }
  }
  if (!parsed) return null;
  const normalized = { ...parsed };
  if (normalized.project_id && !normalized.projectId) normalized.projectId = normalized.project_id;
  if (normalized.private_key && !normalized.privateKey) normalized.privateKey = normalized.private_key;
  if (normalized.client_email && !normalized.clientEmail) normalized.clientEmail = normalized.client_email;
  if (typeof normalized.privateKey === "string") {
    normalized.privateKey = normalized.privateKey.replace(/\\n/g, "\n");
  }
  return normalized;
}
function getAdminApp() {
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
        console.warn("[FirebaseAdmin] Failed to initialize with service account cert, falling back to project config:", e);
      }
    }
    return initializeApp({
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket
    });
  }
  return getApps()[0];
}
function getAdminFirestore() {
  getAdminApp();
  return getFirestore(firebaseConfig.firestoreDatabaseId);
}
function getAdminAuth() {
  getAdminApp();
  return getAuth();
}

// api-handlers/upload.ts
import fs2 from "fs";
var MINIO_BUCKET2 = process.env.MINIO_BUCKET || "packzinhu-db";
var MAX_FILE_SIZE = 100 * 1024 * 1024;
async function saveMediaUploadToMinio(mediaRecord) {
  try {
    const key = `db/media_uploads/${mediaRecord.id}.json`;
    const buffer = Buffer.from(JSON.stringify(mediaRecord, null, 2));
    const command = new PutObjectCommand({
      Bucket: MINIO_BUCKET2,
      Key: key,
      Body: buffer,
      ContentType: "application/json"
    });
    await s3Client.send(command);
  } catch (err) {
    console.error("[Upload] MinioDB saving error", err);
  }
}
async function getBodyJSON(req) {
  if (req.body && Object.keys(req.body).length > 0) return req.body;
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => body += chunk.toString());
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (e) {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}
async function handleDelete(req, res) {
  try {
    const adminAuth2 = getAdminAuth();
    const db3 = getAdminFirestore();
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Nao autorizado" });
    const token = authHeader.split("Bearer ")[1];
    const decodedUser = await adminAuth2.verifyIdToken(token);
    const bodyArgs = await getBodyJSON(req);
    const fileKey = bodyArgs.fileKey;
    if (!fileKey) return res.status(400).json({ error: "fileKey is required" });
    try {
      const mediaQuery = await db3.collection("media_uploads").where("file_name", "==", fileKey).get();
      if (!mediaQuery.empty) {
        const mediaDoc = mediaQuery.docs[0];
        if (mediaDoc.data().user_id !== decodedUser.uid) {
          return res.status(403).json({ error: "Proibido: Nao e dono do arquivo." });
        }
        await mediaDoc.ref.delete();
      }
    } catch (e) {
      console.warn("[Media Delete] Firestore query skipped:", e);
    }
    const command = new DeleteObjectCommand({
      Bucket: MINIO_BUCKET2,
      Key: fileKey
    });
    await s3Client.send(command);
    console.log(`[Media Delete] Sucesso: ${fileKey}`);
    res.json({ success: true });
  } catch (error) {
    console.error("[Media Delete] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
var handleUpload = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method === "DELETE") {
    return handleDelete(req, res);
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  let decodedUser = null;
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Nao autorizado. Token faltante." });
  }
  try {
    const adminAuth2 = getAdminAuth();
    const token = authHeader.split("Bearer ")[1];
    decodedUser = await adminAuth2.verifyIdToken(token);
  } catch (error) {
    console.error("[Upload API] Auth Error:", error.message);
    return res.status(401).json({ error: "Token invalido." });
  }
  try {
    await ensureBucketAndPolicy(MINIO_BUCKET2);
  } catch (e) {
    console.warn("[Upload API] Bucket policy check warning:", e);
  }
  const form = formidable({
    multiples: false,
    maxFileSize: MAX_FILE_SIZE
  });
  return new Promise((resolve) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("[Upload] Formidable error:", err);
        res.status(400).json({ error: `Erro no processamento: ${err.message}` });
        return resolve();
      }
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) {
        res.status(400).json({ error: "Nenhum arquivo enviado" });
        return resolve();
      }
      const cleanName = (file.originalFilename || "file").replace(/[^a-zA-Z0-9.\-_]/g, "");
      const fileKey = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanName}`;
      try {
        const fileBuffer = fs2.readFileSync(file.filepath);
        const command = new PutObjectCommand({
          Bucket: MINIO_BUCKET2,
          Key: fileKey,
          Body: fileBuffer,
          ContentType: file.mimetype || "application/octet-stream"
        });
        await s3Client.send(command);
        console.log(`[Upload] File uploaded successfully to ${fileKey}`);
      } catch (e) {
        console.error("File upload failed", e);
        res.status(500).json({ error: "Erro ao fazer upload do arquivo" });
        return resolve();
      }
      const publicUrl = `https://cdn.packzinhu.online/${MINIO_BUCKET2}/${fileKey}`;
      const userId = decodedUser.uid;
      const mediaRecord = {
        user_id: userId,
        file_name: fileKey,
        original_name: file.originalFilename || "unknown",
        folder: MINIO_BUCKET2,
        url: publicUrl,
        direct_url: publicUrl,
        mime_type: file.mimetype || "application/octet-stream",
        size: file.size || 0,
        id: Date.now()
      };
      saveMediaUploadToMinio(mediaRecord).catch(() => {
      });
      res.status(200).json({
        success: true,
        url: publicUrl,
        key: fileKey
      });
      resolve();
    });
  });
};

// api-handlers/presigned-url.ts
init_minio_client();
var handlePresignedUrl = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const adminAuth2 = getAdminAuth();
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "N\xE3o autorizado" });
    const token = authHeader.split("Bearer ")[1];
    await adminAuth2.verifyIdToken(token);
    const { fileName, contentType } = req.body;
    if (!fileName) return res.status(400).json({ error: "fileName \xE9 obrigat\xF3rio" });
    const MINIO_BUCKET3 = process.env.MINIO_BUCKET || "packzinhu-db";
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const fileKey = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanFileName}`;
    const presignedUrl = await minioClient.presignedPutObject(MINIO_BUCKET3, fileKey, 3600);
    res.json({ presignedUrl, fileKey });
  } catch (error) {
    console.error("[PresignedURL] Error:", error);
    res.status(500).json({ error: error.message || "Erro ao gerar URL assinada" });
  }
};

// src/lib/db.ts
var db = null;
function savePostLocal(post) {
  const stmt = db?.prepare(`
    INSERT OR REPLACE INTO posts (id, author_id, content, media_url, media_type, likes_count, comments_count, created_at, data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt?.run(
    post.id,
    post.authorId || post.author_id,
    post.content || "",
    post.mediaUrl || post.media_url || null,
    post.mediaType || post.media_type || null,
    post.likesCount || post.likes_count || 0,
    post.commentsCount || post.comments_count || 0,
    post.createdAt || post.created_at,
    JSON.stringify(post)
  );
}
function saveLikeLocal(like) {
  const stmt = db?.prepare(`
    INSERT OR REPLACE INTO likes (id, post_id, user_id, created_at)
    VALUES (?, ?, ?, ?)
  `);
  return stmt?.run(
    like.id || `${like.post_id}_${like.user_id}`,
    like.post_id || like.postId,
    like.user_id || like.userId,
    like.created_at || like.createdAt
  );
}
function deleteLikeLocal(postId, userId) {
  const stmt = db?.prepare("DELETE FROM likes WHERE post_id = ? AND user_id = ?");
  return stmt?.run(postId, userId);
}
function saveCommentLocal(comment) {
  const stmt = db?.prepare(`
    INSERT OR REPLACE INTO comments (id, post_id, user_id, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt?.run(
    comment.id,
    comment.post_id || comment.postId,
    comment.user_id || comment.userId,
    comment.content,
    comment.created_at || comment.createdAt
  );
}
function saveFollowLocal(followerId, followingId) {
  const stmt = db?.prepare(`
    INSERT OR REPLACE INTO follows (follower_id, following_id, created_at)
    VALUES (?, ?, ?)
  `);
  return stmt?.run(followerId, followingId, (/* @__PURE__ */ new Date()).toISOString());
}
function deleteFollowLocal(followerId, followingId) {
  const stmt = db?.prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?");
  return stmt?.run(followerId, followingId);
}
function getMediaByUser(userId) {
  const stmt = db?.prepare("SELECT * FROM media_uploads WHERE user_id = ? ORDER BY created_at DESC");
  return stmt?.all(userId);
}

// server.ts
init_minio_db();

// api-handlers/backup.ts
init_s3();
import { PutObjectCommand as PutObjectCommand3 } from "@aws-sdk/client-s3";
async function backupData(type, data) {
  try {
    console.log(`[BackupData] Starting backup for type: ${type}`);
    const id = data.id || `${Date.now()}`;
    const fileName = `backups/${type}s/${id}.json`;
    console.log(`[BackupData] Preparing to save to bucket: ${MINIO_BUCKET}, key: ${fileName}`);
    await s3Client.send(new PutObjectCommand3({
      Bucket: MINIO_BUCKET,
      Key: fileName,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json"
    }));
    console.log(`[BackupData] Successfully saved to MinIO`);
    switch (type) {
      case "post":
        savePostLocal(data);
        break;
      case "profile":
        break;
      case "like":
        saveLikeLocal(data);
        break;
      case "unlike":
        deleteLikeLocal(data.postId, data.userId);
        break;
      case "comment":
        saveCommentLocal(data);
        break;
      case "follow":
        saveFollowLocal(data.followerId, data.followingId);
        break;
      case "unfollow":
        deleteFollowLocal(data.followerId, data.followingId);
        break;
    }
    return { success: true, message: `Backup of ${type} completed to MinIO and cached locally` };
  } catch (error) {
    console.error(`[Backup Error] ${error.message}`);
    return { success: false, error: error.message };
  }
}

// server.ts
init_s3();
import multer from "multer";
import { PutObjectCommand as PutObjectCommand5, GetObjectCommand as GetObjectCommand3 } from "@aws-sdk/client-s3";
import fs3 from "fs";
var firebaseConfig2 = {};
try {
  const configPath = path2.join(process.cwd(), "firebase-applet-config.json");
  if (fs3.existsSync(configPath)) {
    firebaseConfig2 = JSON.parse(fs3.readFileSync(configPath, "utf8"));
  }
} catch (e) {
}
dotenv.config({ override: true });
function initializeFirebase() {
  if (getApps2().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      try {
        let parsedAccount = JSON.parse(serviceAccount);
        if (typeof parsedAccount === "string") parsedAccount = JSON.parse(parsedAccount);
        initializeApp2({
          credential: cert2(parsedAccount),
          projectId: firebaseConfig2.projectId,
          storageBucket: firebaseConfig2.storageBucket
        });
        console.log("Firebase Admin initialized with Service Account");
      } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT. Attempting fallback parse...");
        try {
          const sanitized = serviceAccount.replace(/\\n/g, "\n").replace(/^"|"$/g, "");
          const parsed = JSON.parse(sanitized);
          initializeApp2({
            credential: cert2(parsed),
            projectId: firebaseConfig2.projectId,
            storageBucket: firebaseConfig2.storageBucket
          });
          console.log("Firebase Admin initialized with Service Account (sanitized)");
        } catch (e2) {
          console.error("FIREBASE_SERVICE_ACCOUNT is malformed. Admin tools will fail.", e2);
          initializeApp2({
            projectId: firebaseConfig2.projectId,
            storageBucket: firebaseConfig2.storageBucket
          });
        }
      }
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT not found, using default initialization");
      initializeApp2({
        projectId: firebaseConfig2.projectId,
        storageBucket: firebaseConfig2.storageBucket
      });
    }
  }
}
initializeFirebase();
var db2 = getFirestore2(firebaseConfig2.firestoreDatabaseId);
var adminAuth;
try {
  adminAuth = getAuth2();
} catch (e) {
  console.warn("Could not initialize adminAuth in global scope:", e);
}
var client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ? process.env.MERCADOPAGO_ACCESS_TOKEN.trim() : "",
  options: { timeout: 5e3 }
});
var transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: 587,
  secure: false,
  // Use STARTTLS
  auth: {
    user: process.env.SMTP_USER || "contato.packzinhu@gmail.com",
    pass: process.env.SMTP_PASS || ""
    // App Password for Gmail
  }
});
async function sendSystemEmail({ to, subject, title, message, buttonText, buttonUrl, footer, bannerType }) {
  try {
    const sender = process.env.SMTP_USER || "contato.packzinhu@gmail.com";
    const siteUrl = process.env.SITE_URL || "https://packzinhu.online";
    const transporter2 = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: 587,
      secure: false,
      // Use STARTTLS
      auth: {
        user: sender,
        pass: process.env.SMTP_PASS || ""
        // App Password for Gmail
      }
    });
    const bannerMap = {
      sale: process.env.BANNER_SALE_URL || "https://packzinhu.online/banner-principal.jpeg",
      purchase: process.env.BANNER_PURCHASE_URL || "https://packzinhu.online/banner-principal.jpeg",
      follow: process.env.BANNER_FOLLOW_URL || "https://packzinhu.online/banner-principal.jpeg",
      security: process.env.BANNER_SECURITY_URL || "https://packzinhu.online/banner-principal.jpeg",
      default: process.env.BANNER_DEFAULT_URL || `${siteUrl}/banner-principal.jpeg`
    };
    const currentBanner = bannerMap[bannerType || "default"];
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
            ` : ""}
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
               <div style="background: rgba(34, 197, 94, 0.1); color: #22c55e; padding: 4px 10px; border-radius: 8px; font-size: 9px; font-weight: 700; border: 1px solid rgba(34, 197, 94, 0.2);">\u2714 PAGAMENTO 100% SEGURO</div>
               <div style="background: rgba(139, 92, 246, 0.1); color: #8B5CF6; padding: 4px 10px; border-radius: 8px; font-size: 9px; font-weight: 700; border: 1px solid rgba(139, 92, 246, 0.2);">\u2714 SUPORTE EXCLUSIVO</div>
            </div>

            <div style="margin-top: 25px; pt: 15px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 11px; color: #666; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700;">packzinhu.online</span>
              <div style="display: flex; gap: 10px;">
                <span style="color: #8B5CF6;">\u2022</span>
                <span>Qualidade Garantida</span>
              </div>
            </div>
          </div>
          
          <div style="margin-top: 25px; text-align: center; font-size: 10px; color: #333; font-weight: 600;">
            <p>${footer || "Voc\xEA recebeu este e-mail por ser um usu\xE1rio verificado PackZinhu."}</p>
            <p>\xA9 2026 PackZinhu - Todos os direitos reservados.</p>
          </div>
        </div>
      `
    };
    console.log("Sending email with config:", { host: process.env.SMTP_HOST || "smtp.gmail.com", user: process.env.SMTP_USER || "contato.packzinhu@gmail.com" });
    await transporter2.sendMail(mailOptions);
    const emailLog = {
      to,
      subject: `${subject} - PackZinhu`,
      body: message,
      type: "system_auto",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const emailRef = await db2.collection("site_emails").add(emailLog);
    saveToMinioDB("site_emails", emailRef.id, emailLog).catch(() => {
    });
    console.log(`System email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`Failed to send system email to ${to}:`, error);
    if (!process.env.SMTP_PASS) {
      console.error("CRITICAL: SMTP_PASS is NOT configured in the environment.");
    }
  }
}
var app = express();
app.use(cors({
  origin: true,
  // Reflects the request origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));
app.options("*all", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
  res.header("Access-Control-Allow-Credentials", "true");
  res.status(200).end();
});
app.use((req, res, next) => {
  if (!req.url.startsWith("/api") && !req.url.startsWith("/assets") && !req.url.startsWith("/@") && !req.url.startsWith("/src")) {
    req.url = `/api${req.url}`;
  }
  next();
});
app.use((req, res, next) => {
  if (!req.url.startsWith("/assets") && !req.url.endsWith(".png") && !req.url.endsWith(".jpg") && !req.url.endsWith(".jpeg") && !req.url.endsWith(".svg") && !req.url.endsWith(".ico")) {
    console.log(`[HTTP] ${req.method} ${req.url}`);
  }
  next();
});
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    console.error("Body Parser Error:", err.message);
    return res.status(400).json({ error: "Invalid JSON" });
  }
  next();
});
app.get("/api/random-background", async (req, res) => {
  try {
    const { ListObjectsV2Command: ListObjectsV2Command3 } = await import("@aws-sdk/client-s3");
    const command = new ListObjectsV2Command3({
      Bucket: MINIO_BUCKET,
      Prefix: "images/"
    });
    const response = await s3Client.send(command);
    if (!response.Contents || response.Contents.length === 0) {
      return res.json({ success: true, url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800&q=80" });
    }
    const files = response.Contents.filter((item) => item.Size && item.Size > 0);
    if (files.length === 0) {
      return res.json({ success: true, url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800&q=80" });
    }
    const randomFile = files[Math.floor(Math.random() * files.length)];
    const fileUrl = `https://${MINIO_ENDPOINT_RAW}/${MINIO_BUCKET}/${randomFile.Key.split("/").map(encodeURIComponent).join("/")}`;
    res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error("Error fetching random background:", error);
    res.status(500).json({ error: "Failed to fetch random background" });
  }
});
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", environment: process.env.NODE_ENV });
});
app.get(["/api/backup", "/api/packzinhu-db/backup"], (req, res) => {
  res.json({ status: "active", message: "Backup API ready" });
});
app.post(["/api/backup", "/api/packzinhu-db/backup"], async (req, res) => {
  try {
    const { type, data } = req.body;
    if (!type || !data) return res.status(400).json({ error: "Missing type or data" });
    const result = await backupData(type, data);
    res.json(result);
  } catch (error) {
    console.error("[Backup Route Error]", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});
var publicVapidKey = process.env.VAPID_PUBLIC_KEY || "BAzPbLyW7tJ4_mgg0uzZYCDbEwgzKdKyUWnADWGdIK-NozwCqscdV_PTa5akCF8_lw1PpIIBs5eYgdmjjaucTf4";
var privateVapidKey = process.env.VAPID_PRIVATE_KEY || "pvpwEwqvuQ-aFNJlzwgD1bx_LGdyJv0ydfu3eXAwGRE";
webPush.setVapidDetails(
  "mailto:contato.packzinhu@gmail.com",
  publicVapidKey,
  privateVapidKey
);
app.get("/api/webpush/vapidPublicKey", (req, res) => {
  res.send(publicVapidKey);
});
app.post("/api/webpush/subscribe", async (req, res) => {
  const subscription = req.body;
  const authHeader = req.headers.authorization;
  try {
    let userId = "anonymous";
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      try {
        const decodedUser = await adminAuth.verifyIdToken(token);
        userId = decodedUser.uid;
      } catch (e) {
      }
    }
    const subData = {
      subscription,
      userId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const subId = subscription.endpoint.replace(/[^a-zA-Z0-9]/g, "");
    await db2.collection("webpush_subscriptions").doc(subId).set(subData);
    saveToMinioDB("webpush_subscriptions", subId, subData).catch(() => {
    });
    res.status(201).json({});
  } catch (error) {
    console.error("Subscription error", error);
    res.status(500).json({ error: "Failed" });
  }
});
app.post("/api/admin/send-webpush", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "N\xE3o autorizado" });
  try {
    const token = authHeader.split("Bearer ")[1];
    const decodedUser = await adminAuth.verifyIdToken(token);
    const { title, message, url } = req.body;
    const payload = JSON.stringify({ title, message, url });
    const snapshot = await db2.collection("webpush_subscriptions").get();
    const promises = [];
    snapshot.forEach((doc) => {
      const sub = doc.data().subscription;
      promises.push(
        webPush.sendNotification(sub, payload).catch((err) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log("Subscription has expired or is no longer valid: ", err);
            return doc.ref.delete();
          } else {
            console.error("Subscription broadcast error:", err);
          }
        })
      );
    });
    await Promise.all(promises);
    res.status(200).json({ success: true, count: promises.length });
  } catch (error) {
    console.error("Push broadcast error:", error);
    res.status(200).json({ error: error.message });
  }
});
app.get("/api/media/*fileKey", async (req, res) => {
  const fileKey = req.params.fileKey || req.params[0];
  try {
    if (!fileKey) return res.status(400).send("File key required");
    console.log(`[MediaProxy] Attempting to fetch: "${fileKey}" from bucket "${MINIO_BUCKET}"`);
    const command = new GetObjectCommand3({
      Bucket: MINIO_BUCKET,
      Key: fileKey
    });
    const response = await s3Client.send(command);
    if (response.ContentType) {
      res.setHeader("Content-Type", response.ContentType);
    }
    if (response.ContentType?.startsWith("video/")) {
      res.setHeader("Cache-Control", "public, max-age=86400");
    } else {
      res.setHeader("Cache-Control", "public, max-age=31536000");
    }
    const body = response.Body;
    if (body) {
      console.log(`[MediaProxy] Success streaming: ${fileKey}`);
      body.pipe(res);
    } else {
      console.warn(`[MediaProxy] Empty body for key: ${fileKey}`);
      res.status(404).send("Not found");
    }
  } catch (error) {
    console.error(`[MediaProxy] Error fetching "${fileKey}":`, error.name, error.message);
    if (error.name === "NoSuchKey" || error.name === "NotFound") {
      console.warn(`[MediaProxy] Key not found: ${fileKey}`);
      return res.status(404).send("File not found in storage");
    }
    res.status(500).send("Internal server error proxying media");
  }
});
var upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });
app.post("/api/presigned-url", handlePresignedUrl);
app.post(["/api/upload", "/api/packzinhu-db-upload"], upload.single("file"), async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    console.log("[DEBUG] AuthHeader check:", {
      authorizationHeader: req.headers.authorization,
      AuthorizationHeader: req.headers.Authorization,
      rawHeaders: req.rawHeaders
    });
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Nao autorizado. Token faltante.", debug: "Auth header missing or invalid format" });
    }
    let decodedUser = null;
    try {
      const token = authHeader.split("Bearer ")[1];
      const authInstance = adminAuth || getAuth2();
      decodedUser = await authInstance.verifyIdToken(token);
    } catch (error) {
      return res.status(401).json({ error: "Token invalido." });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }
    const fileKey = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "")}`;
    const { s3Client: s3Client2, MINIO_BUCKET: MINIO_BUCKET3 } = await Promise.resolve().then(() => (init_s3(), s3_exports));
    const { ensureBucketAndPolicy: ensureBucketAndPolicy2 } = await Promise.resolve().then(() => (init_minio_client(), minio_client_exports));
    await ensureBucketAndPolicy2(MINIO_BUCKET3);
    const command = new PutObjectCommand5({
      Bucket: MINIO_BUCKET3,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype || "application/octet-stream"
    });
    await s3Client2.send(command);
    const publicUrl = `https://cdn.packzinhu.online/${MINIO_BUCKET3}/${fileKey}`;
    try {
      const mediaRecord = {
        user_id: decodedUser.uid,
        file_name: fileKey,
        original_name: file.originalname || "unknown",
        folder: MINIO_BUCKET3,
        url: publicUrl,
        direct_url: publicUrl,
        mime_type: file.mimetype || "application/octet-stream",
        size: file.size || 0,
        id: Date.now()
      };
      saveToMinioDB("media_uploads", mediaRecord.id.toString(), mediaRecord).catch(() => {
      });
    } catch (dbErr) {
      console.error("[Upload] DB Sync Warning:", dbErr.message);
    }
    res.status(200).json({
      success: true,
      url: publicUrl,
      key: fileKey
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Erro ao processar upload" });
  }
});
app.all("/api/packzinhu-db", async (req, res) => {
  const handler3 = (await Promise.resolve().then(() => (init_packzinhu_db(), packzinhu_db_exports))).default;
  return handler3(req, res);
});
app.delete(["/api/upload", "/api/packzinhu-db-upload"], async (req, res) => {
  try {
    await handleUpload(req, res);
  } catch (error) {
    console.error("Delete media error:", error);
    res.status(200).json({ error: error.message });
  }
});
app.post("/api/admin/sync-supabase", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "N\xE3o autorizado" });
  try {
    const token = authHeader.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);
    console.log("[AdminSync] Sync triggered for Supabase -> MinIO and Firebase");
    import("child_process").then(({ exec }) => {
      exec("npx tsx scripts/sync-supabase-to-minio.js && npx tsx scripts/sync-supabase-db.js && npx tsx scripts/update-firebase-urls.js", (err, stdout, stderr) => {
        if (err) console.error("Sync error:", err);
        console.log("Sync output:", stdout);
        if (stderr) console.error("Sync stderr:", stderr);
      });
    });
    res.json({ success: true, message: "Sincroniza\xE7\xE3o iniciada com sucesso." });
  } catch (error) {
    console.error("Sync auth error:", error);
    res.status(200).json({ error: error.message });
  }
});
app.post("/api/admin/fix-follower-counts", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "N\xE3o autorizado" });
  try {
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (decodedToken.email !== "dweminem@gmail.com" && decodedToken.email !== "contato.packzinhu@gmail.com") {
      return res.status(403).json({ error: "Proibido" });
    }
    console.log("[AdminFix] Fixing follower counts...");
    const users = await db2.collection("users").get();
    for (const userDoc of users.docs) {
      const userId = userDoc.id;
      const followersSnap = await db2.collection("follows").where("following_id", "==", userId).get();
      const followingSnap = await db2.collection("follows").where("follower_id", "==", userId).get();
      await userDoc.ref.update({
        followersCount: followersSnap.size,
        followingCount: followingSnap.size
      });
    }
    console.log("[AdminFix] Follower counts fixed.");
    res.json({ success: true, message: "Contagens de seguidores corrigidas." });
  } catch (e) {
    console.error("[AdminFix] Error:", e);
    res.status(500).json({ error: e.message });
  }
});
app.get("/api/test-t-follow", async (req, res) => {
  try {
    const followerId = "TEST_FOLLOWER";
    const followingId = "TEST_FOLLOWING";
    const followRef = db2.collection("follows");
    const userRef = db2.collection("users").doc(followingId);
    const currentUserRef = db2.collection("users").doc(followerId);
    let newFollowersCount = 0;
    await db2.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      const currentUserDoc = await t.get(currentUserRef);
      const currentFollowers = Number(userDoc.data()?.followersCount) || 0;
      const currentFollowing = Number(currentUserDoc.data()?.followingCount) || 0;
      newFollowersCount = currentFollowers + 1;
      console.log(`[TestFollowInfo] Transaction: User ${followingId} followers: ${currentFollowers} (after: ${newFollowersCount})`);
      t.set(userRef, { followersCount: newFollowersCount }, { merge: true });
      t.set(currentUserRef, { followingCount: currentFollowing + 1 }, { merge: true });
    });
    res.json({ success: true, newFollowersCount });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});
app.post("/api/toggle-follow", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "N\xE3o autorizado" });
  try {
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const followerId = decodedToken.uid;
    const { followingId, action } = req.body;
    console.log(`[FollowInfo] Follower ${followerId} ${action}ing ${followingId}`);
    if (!followingId || !action) return res.status(400).json({ error: "Dados incompletos" });
    const followRef = db2.collection("follows");
    const userRef = db2.collection("users").doc(followingId);
    const currentUserRef = db2.collection("users").doc(followerId);
    if (action === "follow") {
      const followObj = {
        follower_id: followerId,
        following_id: followingId,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      const docRef = await followRef.add(followObj);
      let newFollowersCount = 0;
      await db2.runTransaction(async (t) => {
        const userDoc = await t.get(userRef);
        const currentUserDoc = await t.get(currentUserRef);
        const currentFollowers = Number(userDoc.data()?.followersCount) || 0;
        const currentFollowing = Number(currentUserDoc.data()?.followingCount) || 0;
        newFollowersCount = currentFollowers + 1;
        console.log(`[FollowInfo] Transaction: User ${followingId} followers: ${currentFollowers} (after: ${newFollowersCount})`);
        t.set(userRef, { followersCount: newFollowersCount }, { merge: true });
        t.set(currentUserRef, { followingCount: currentFollowing + 1 }, { merge: true });
      });
      try {
        const updatedDoc = await userRef.get();
        await saveToMinioDB("users", followingId, updatedDoc.data());
      } catch (e) {
        console.error("Failed to sync follow to minio", e);
      }
      res.json({ success: true, followId: docRef.id, newFollowersCount });
    } else {
      const q = followRef.where("follower_id", "==", followerId).where("following_id", "==", followingId);
      const snaps = await q.get();
      if (snaps.empty) return res.json({ success: true });
      for (const doc of snaps.docs) {
        await doc.ref.delete();
      }
      let newFollowersCount = 0;
      await db2.runTransaction(async (t) => {
        const userDoc = await t.get(userRef);
        const currentUserDoc = await t.get(currentUserRef);
        const currentFollowers = Number(userDoc.data()?.followersCount) || 0;
        const currentFollowing = Number(currentUserDoc.data()?.followingCount) || 0;
        newFollowersCount = Math.max(0, currentFollowers - 1);
        t.set(userRef, { followersCount: newFollowersCount }, { merge: true });
        t.set(currentUserRef, { followingCount: Math.max(0, currentFollowing - 1) }, { merge: true });
      });
      try {
        const updatedDoc = await userRef.get();
        await saveToMinioDB("users", followingId, updatedDoc.data());
      } catch (e) {
        console.error("Failed to sync unfollow to minio", e);
      }
      res.json({ success: true, newFollowersCount });
    }
  } catch (e) {
    console.error("Follow error:", e);
    res.status(500).json({ error: e.message });
  }
});
app.post("/api/admin/sync-all-to-minio", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "N\xE3o autorizado" });
  try {
    const token = authHeader.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);
    console.log("[AdminSync] Total sync triggered...");
    (async () => {
      try {
        const collections = await db2.listCollections();
        for (const col of collections) {
          const docs = await col.listDocuments();
          for (const docRef of docs) {
            const doc = await docRef.get();
            await saveToMinioDB(col.id, doc.id, doc.data());
          }
        }
        console.log("[AdminSync] Total sync finished.");
      } catch (e) {
        console.error("[AdminSync] Error:", e);
      }
    })();
    res.json({ success: true, message: "Sincroniza\xE7\xE3o Total iniciada em segundo plano." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post("/api/admin/sync-all-data", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "N\xE3o autorizado" });
  try {
    const token = authHeader.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);
    console.log("[AdminSync] Sync triggered...");
    res.json({ success: true, message: "Sincroniza\xE7\xE3o iniciada com sucesso." });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(200).json({ error: error.message });
  }
});
app.post("/api/minio-db/save", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Nao autorizado." });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedUser = await adminAuth.verifyIdToken(token);
    const { saveToMinioDB: saveToMinioDB3 } = await Promise.resolve().then(() => (init_minio_db(), minio_db_exports));
    const { collection, docId, data } = req.body;
    if (data && data.userId && data.userId !== decodedUser.uid) {
      return res.status(403).json({ error: "Nao autorizado: ID do usuario invalido." });
    }
    if (!collection || !docId) return res.status(400).json({ error: "collection and docId required" });
    const result = await saveToMinioDB3(collection, docId, data);
    res.json(result);
  } catch (e) {
    console.error("MinIO DB Save error", e);
    res.status(500).json({ error: e.message });
  }
});
app.post("/api/minio-db/delete", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Nao autorizado." });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedUser = await adminAuth.verifyIdToken(token);
    const { deleteFromMinioDB: deleteFromMinioDB3, getSingleDocumentFromMinioDB: getSingleDocumentFromMinioDB2 } = await Promise.resolve().then(() => (init_minio_db(), minio_db_exports));
    const { collection, docId } = req.body;
    if (!collection || !docId) return res.status(400).json({ error: "collection and docId required" });
    const existingDoc = await getSingleDocumentFromMinioDB2(collection, docId);
    if (existingDoc && existingDoc.userId && existingDoc.userId !== decodedUser.uid) {
      return res.status(403).json({ error: "Nao autorizado: Voce nao pode apagar dados de outra pessoa." });
    }
    const result = await deleteFromMinioDB3(collection, docId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.get("/api/minio-db/load", async (req, res) => {
  try {
    const { loadFromMinioDB: loadFromMinioDB3 } = await Promise.resolve().then(() => (init_minio_db(), minio_db_exports));
    const { collection } = req.query;
    if (!collection) return res.status(400).json({ error: "collection query param required" });
    const result = await loadFromMinioDB3(collection);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post(["/api/account/rescue-balance", "/api/rescue-balance"], async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "N\xE3o autorizado. Fa\xE7a login novamente." });
  try {
    const token = authHeader.startsWith("Bearer ") ? authHeader.split("Bearer ")[1].trim() : authHeader.trim();
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    if (!userId) {
      return res.status(401).json({ error: "Token de autentica\xE7\xE3o inv\xE1lido." });
    }
    const userRef = db2.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado." });
    }
    const userData = userSnap.data();
    const balance = Number(userData.balance) || 0;
    if (balance <= 0) {
      return res.status(400).json({ error: "Voc\xEA n\xE3o possui saldo dispon\xEDvel para resgate." });
    }
    const bankSnap = await db2.collection("bank_accounts").doc(userId).get();
    const bankData = bankSnap.exists ? bankSnap.data() : {};
    const pixKey = (bankData?.pixKey || userData.pixKey || "").toString().trim();
    if (!pixKey) {
      return res.status(400).json({ error: "Chave PIX n\xE3o cadastrada. Por favor, cadastre uma chave PIX antes de solicitar o resgate." });
    }
    const requestRef = db2.collection("withdrawal_requests").doc();
    const requestData = {
      userId,
      amount: balance,
      pixKey,
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await userRef.update({ balance: 0 });
    saveToMinioDB("users", userId, { ...userData, balance: 0 }).catch(() => {
    });
    await requestRef.set(requestData);
    saveToMinioDB("withdrawal_requests", requestRef.id, requestData).catch(() => {
    });
    res.status(200).json({ success: true, message: "Solicita\xE7\xE3o de saque enviada com sucesso!" });
  } catch (error) {
    console.error("Withdraw error:", error);
    res.status(500).json({ error: error.message || "Erro ao processar saque" });
  }
});
app.post("/api/admin/payout/confirm", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "N\xE3o autorizado" });
  try {
    const token = authHeader.split("Bearer ")[1];
    const decodedUser = await adminAuth.verifyIdToken(token);
    const { requestId } = req.body;
    const requestRef = db2.collection("withdrawal_requests").doc(requestId);
    const requestSnap = await requestRef.get();
    if (!requestSnap.exists) return res.status(404).json({ error: "Request not found" });
    const requestData = requestSnap.data();
    if (requestData.status === "paid") return res.status(400).json({ error: "Request already paid" });
    const payoutUpdate = {
      status: "paid",
      paidAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await requestRef.update(payoutUpdate);
    saveToMinioDB("withdrawal_requests", requestId, { ...requestData, ...payoutUpdate }).catch(() => {
    });
    const notif = {
      recipient_id: requestData.userId,
      sender_id: "system",
      type: "payment",
      message: `Seu repasse de R$ ${Number(requestData.amount).toFixed(2)} foi processado com sucesso!`,
      read: false,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const notifRef = await db2.collection("notifications").add(notif);
    saveToMinioDB("notifications", notifRef.id, notif).catch(() => {
    });
    if (requestData.userEmail) {
      await sendSystemEmail({
        to: requestData.userEmail,
        subject: "Pagamento Processado",
        title: `Ol\xE1, ${requestData.userName || "Vendedor"}!`,
        message: `Temos \xF3timas not\xEDcias! Seu repasse de <strong>R$ ${Number(requestData.amount).toFixed(2)}</strong> foi processado com sucesso e enviado para sua chave PIX cadastrada.`,
        buttonText: "Ver meu Dashboard",
        buttonUrl: `${process.env.SITE_URL || "https://packzinhu.com"}/dashboard?tab=payouts`,
        bannerType: "sale"
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Payout confirm error:", error);
    res.status(200).json({ error: error.message });
  }
});
app.post("/api/admin/send-custom-email", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "N\xE3o autorizado" });
  try {
    const token = authHeader.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);
    const { to, subject, body } = req.body;
    if (!to || !subject || !body) {
      return res.status(400).json({ error: "Destinat\xE1rio, assunto e corpo s\xE3o obrigat\xF3rios." });
    }
    await sendSystemEmail({
      to,
      subject,
      title: "Mensagem da Administra\xE7\xE3o",
      message: body.replace(/\n/g, "<br>"),
      footer: "Esta \xE9 uma mensagem oficial da administra\xE7\xE3o do PackZinhu."
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Custom email send error:", error);
    res.status(200).json({ error: error.message });
  }
});
app.post("/api/notify-follow", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "N\xE3o autorizado" });
  try {
    const token = authHeader.split("Bearer ")[1];
    const decodedUser = await adminAuth.verifyIdToken(token);
    const { followerId, followedId } = req.body;
    if (decodedUser.uid !== followerId) {
      return res.status(403).json({ error: "Proibido" });
    }
    const followerSnap = await db2.collection("users").doc(followerId).get();
    const followedSnap = await db2.collection("users").doc(followedId).get();
    if (followerSnap.exists && followedSnap.exists) {
      const follower = followerSnap.data();
      const followed = followedSnap.data();
      await sendSystemEmail({
        to: followed.email,
        subject: "Voc\xEA tem um novo seguidor!",
        title: "Grande novidade!",
        message: `O usu\xE1rio <strong>${follower.displayName || follower.username}</strong> come\xE7ou a seguir voc\xEA no PackZinhu.`,
        buttonText: "Ver Perfil",
        buttonUrl: `${process.env.SITE_URL || "https://packzinhu.com"}/profile/${followerId}`,
        bannerType: "follow"
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao notificar seguidor" });
  }
});
app.post("/api/account/delete-request", async (req, res) => {
  const { userId } = req.body;
  try {
    const userSnap = await db2.collection("users").doc(userId).get();
    if (!userSnap.exists) return res.status(404).json({ error: "User not found" });
    const user = userSnap.data();
    const code = Math.floor(1e5 + Math.random() * 9e5).toString();
    await db2.collection("deletion_requests").doc(userId).set({
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1e3).toISOString()
    });
    await sendSystemEmail({
      to: user.email,
      subject: "Confirma\xE7\xE3o de Exclus\xE3o de Conta",
      title: "Aviso de Seguran\xE7a",
      message: `Recebemos um pedido para excluir permanentemente sua conta no PackZinhu. <br><br>Seu c\xF3digo de confirma\xE7\xE3o \xE9: <strong style="font-size: 24px; color: #8B5CF6; letter-spacing: 2px;">${code}</strong><br><br>Este c\xF3digo expira em 10 minutos. Se voc\xEA n\xE3o solicitou isso, ignore este e-mail e proteja sua conta.`,
      bannerType: "security"
    });
    res.json({ success: true, message: "C\xF3digo enviado ao e-mail cadastrado." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao solicitar exclus\xE3o" });
  }
});
app.post("/api/account/delete-confirm", async (req, res) => {
  const { userId, code } = req.body;
  try {
    const requestSnap = await db2.collection("deletion_requests").doc(userId).get();
    if (!requestSnap.exists) return res.status(400).json({ error: "Solicita\xE7\xE3o n\xE3o encontrada ou c\xF3digo expirado." });
    const requestData = requestSnap.data();
    if (requestData.code !== code || /* @__PURE__ */ new Date() > new Date(requestData.expiresAt)) {
      return res.status(400).json({ error: "C\xF3digo inv\xE1lido ou expirado." });
    }
    await db2.collection("deletion_requests").doc(userId).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao confirmar exclus\xE3o" });
  }
});
app.get("/api/auth/mercadopago/url", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: "MERCADOPAGO_CLIENT_ID is not configured" });
  const SITE_URL = process.env.VITE_URL || process.env.SITE_URL || "https://packzinhu.online";
  const redirectUri = `${SITE_URL}/callback`;
  const authUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${userId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.json({ url: authUrl });
});
app.post("/api/auth/mercadopago/exchange", async (req, res) => {
  try {
    const { code, userId } = req.body;
    if (!code || !userId) return res.status(400).json({ error: "Missing code or userId" });
    const clientId = process.env.MERCADOPAGO_CLIENT_ID;
    const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
    const SITE_URL = process.env.VITE_URL || process.env.SITE_URL || "https://packzinhu.online";
    const redirectUri = `${SITE_URL}/callback`;
    const response = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_secret: clientSecret || "",
        client_id: clientId || "",
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("MercadoPago Auth Error:", data);
      return res.status(400).json({ error: "Failed to authenticate with Mercado Pago", details: data });
    }
    const userRef = db2.collection("users").doc(userId);
    const mpData = {
      hasMercadoPago: true,
      mercadoPagoAccessToken: data.access_token,
      mercadoPagoRefreshToken: data.refresh_token,
      mercadoPagoUserId: data.user_id,
      mercadoPagoPublicKey: data.public_key,
      mercadoPagoExpiresIn: data.expires_in,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await userRef.set(mpData, { merge: true });
    const currentData = (await userRef.get()).data() || {};
    saveToMinioDB("users", userId, { ...currentData, ...mpData }).catch(() => {
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("MercadoPago Exchange error:", error);
    res.status(200).json({ error: error.message });
  }
});
app.post("/api/create-wallet-preference", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const idToken = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (e) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const userId = decodedToken.uid;
    const { packageId, amount, hotCoins, buyerEmail, buyerName } = req.body;
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN || !process.env.MERCADOPAGO_ACCESS_TOKEN.trim()) {
      return res.status(200).json({ error: "MERCADOPAGO_ACCESS_TOKEN n\xE3o configurado no servidor." });
    }
    const client2 = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN.trim() });
    const preference = new Preference(client2);
    const siteUrl = process.env.SITE_URL || `https://${req.get("host")}`;
    const orderId = db2.collection("orders").doc().id;
    const response = await preference.create({
      body: {
        items: [
          {
            id: `hotcoins_${packageId}`,
            title: `${hotCoins} HotCoins`,
            quantity: 1,
            unit_price: Number(amount),
            currency_id: "BRL"
          }
        ],
        payer: {
          name: buyerName || decodedToken.name || "An\xF4nimo",
          email: buyerEmail || decodedToken.email || "test@example.com"
        },
        back_urls: {
          success: `${siteUrl}/shop?payment=success`,
          failure: `${siteUrl}/shop?payment=failure`,
          pending: `${siteUrl}/shop?payment=pending`
        },
        auto_return: "approved",
        notification_url: `${siteUrl}/api/webhook`,
        external_reference: JSON.stringify({
          orderId,
          type: "hotcoins",
          buyerId: userId,
          hotCoins,
          amount
        }),
        payment_methods: {
          excluded_payment_types: [],
          installments: 12
        }
      }
    });
    const orderData = {
      id: orderId,
      type: "hotcoins",
      packageId,
      hotCoins,
      amount,
      buyerId: userId,
      status: "pending",
      paymentMethod: "mercado_pago",
      preferenceId: response.id,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await db2.collection("orders").doc(orderId).set(orderData);
    saveToMinioDB("orders", orderId, orderData).catch(() => {
    });
    return res.json({ init_point: response.init_point });
  } catch (error) {
    console.error("Error creating MP preference for hotcoins:", error);
    res.status(200).json({ error: error.message });
  }
});
app.post("/api/create-mercadopago-preference", async (req, res) => {
  try {
    const { serviceId, serviceTitle, amount, sellerId, buyerId, buyerName, buyerEmail } = req.body;
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN || !process.env.MERCADOPAGO_ACCESS_TOKEN.trim()) {
      return res.status(200).json({ error: "MERCADOPAGO_ACCESS_TOKEN n\xE3o configurado no servidor." });
    }
    const client2 = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN.trim() });
    const preference = new Preference(client2);
    const siteUrl = process.env.SITE_URL || `https://${req.get("host")}`;
    const orderId = db2.collection("orders").doc().id;
    const response = await preference.create({
      body: {
        items: [
          {
            id: serviceId,
            title: serviceTitle,
            quantity: 1,
            unit_price: Number(amount),
            currency_id: "BRL"
          }
        ],
        payer: {
          name: buyerName || "An\xF4nimo",
          email: buyerEmail || "test@example.com"
          // Mercado Pago requires an email
        },
        back_urls: {
          success: `${siteUrl}/payment/success`,
          failure: `${siteUrl}/checkout/${serviceId}?error=payment_failed`,
          pending: `${siteUrl}/payment/success`
        },
        auto_return: "approved",
        notification_url: `${siteUrl}/api/webhook`,
        external_reference: JSON.stringify({
          orderId,
          serviceId,
          serviceTitle: (serviceTitle || "").substring(0, 50),
          sellerId,
          buyerId,
          amount
        }),
        payment_methods: {
          excluded_payment_types: [],
          // Allow all: Pix, Card, Boleto
          installments: 12
        }
      }
    });
    const orderData = {
      id: orderId,
      serviceId: serviceId || "",
      serviceTitle: serviceTitle || "",
      amount: amount || 0,
      seller_id: sellerId || "",
      sellerId: sellerId || "",
      // Compatibility
      buyer_id: buyerId || "",
      buyerId: buyerId || "",
      // Compatibility
      buyerName: buyerName || "An\xF4nimo",
      buyerEmail: buyerEmail || "anonimo@example.com",
      status: "pending",
      paymentMethod: "mercado_pago",
      preferenceId: response.id,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
      // Compatibility
    };
    await db2.collection("orders").doc(orderId).set(orderData);
    saveToMinioDB("orders", orderId, orderData).catch(() => {
    });
    if (sellerId && buyerId) {
      try {
        const sellerNotif = {
          recipient_id: sellerId,
          sender_id: "system",
          type: "sale_pending",
          message: `Visite seu chat! Um cliente iniciou a compra de "${serviceTitle}" e pagar\xE1 em instantes.`,
          read: false,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        const notifRef = await db2.collection("notifications").add(sellerNotif);
        saveToMinioDB("notifications", notifRef.id, sellerNotif).catch(() => {
        });
        const chatId = [buyerId, sellerId].sort().join("_");
        await db2.collection("chats").doc(chatId).collection("messages").add({
          senderId: buyerId,
          text: `\u{1F6D2} Ol\xE1! Acabei de iniciar a compra do servi\xE7o "${serviceTitle}". Estou finalizando o pagamento.`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        await db2.collection("chats").doc(chatId).collection("messages").add({
          senderId: sellerId,
          text: `Ol\xE1! Vi que voc\xEA iniciou o pedido de "${serviceTitle}". Assim que o pagamento for aprovado, eu serei notificado e entregarei no prazo! \u{1F49C}`,
          timestamp: new Date(Date.now() + 1e3).toISOString()
        });
        await db2.collection("chats").doc(chatId).set({
          participants: [buyerId, sellerId],
          lastMessage: `Aguardando a confirma\xE7\xE3o do pagamento do pedido...`,
          lastMessageTime: new Date(Date.now() + 1e3).toISOString(),
          id: chatId
        }, { merge: true });
      } catch (e) {
        console.error("Error sending pending order notifications/chats: ", e);
      }
    }
    res.json({ init_point: response.init_point, id: response.id });
  } catch (error) {
    console.error("Mercado Pago Error:", error);
    res.status(200).json({ error: error.message || "Erro ao criar prefer\xEAncia de pagamento", details: error.cause || error });
  }
});
app.all(["/api/mercadopago-webhook", "/api/webhook"], async (req, res) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(200).send("OK");
  }
  const type = req.body?.type || req.query?.topic || req.body?.topic || req.body?.action;
  if (type && type.includes("test")) {
    console.log("[Webhook] Test request received from simulator. Returning 200 OK.");
    return res.status(200).send("OK");
  }
  const dataId = req.body?.data?.id || req.body?.id || req.query?.id;
  const signature = req.headers["x-signature"] || req.headers["x-mp-signature"];
  const xRequestId = req.headers["x-request-id"];
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (signature && xRequestId && secret) {
    try {
      const parts = signature.split(",");
      let ts = "";
      let v1 = "";
      for (const p of parts) {
        const [k, v] = p.split("=");
        if (k === "ts") ts = v;
        if (k === "v1") v1 = v;
      }
      if (ts && v1) {
        const crypto = __require("crypto");
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
        const hmac = crypto.createHmac("sha256", secret);
        hmac.update(manifest);
        const computedHash = hmac.digest("hex");
        if (computedHash !== v1) {
          console.error("[Webhook] Signature validation failed!");
          return res.status(200).send("Invalid signature");
        } else {
          console.log("[Webhook] Signature validated successfully.");
        }
      }
    } catch (e) {
      console.error("[Webhook] Error validating signature:", e);
    }
  } else {
    console.log("[Webhook] Missing signature headers or secret. Skipping signature validation.");
  }
  console.log(`[Webhook] ${req.method} received at ${req.path} | Type: ${type} | ID: ${dataId}`);
  if (String(dataId) === "123456") {
    console.log("[Webhook] Test request. Returning 200 OK.");
    return res.status(200).send("OK");
  }
  if (!type || !dataId) {
    console.log("[Webhook] Invalid request format or missing ID. Returning 200 to stop retry.");
    return res.status(200).send("OK");
  }
  try {
    if ((type === "payment" || type === "mp-payment") && dataId) {
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()}`
        }
      });
      if (!mpResponse.ok) {
        throw new Error(`Failed to fetch payment details ${dataId}. Status: ${mpResponse.status}`);
      }
      const paymentData = await mpResponse.json();
      let externalReference = {};
      try {
        externalReference = JSON.parse(paymentData.external_reference || "{}");
      } catch (e) {
        console.error("[Webhook] Failed to parse external_reference JSON");
      }
      const orderId = externalReference.orderId || paymentData.preference_id || paymentData.order?.id || `mp_${dataId}`;
      const orderRef = db2.collection("orders").doc(orderId);
      const orderSnap = await orderRef.get();
      const currentData = orderSnap.data() || {};
      let newStatus = currentData.status || "pending";
      if (paymentData.status === "approved") {
        newStatus = "paid";
      } else if (paymentData.status === "pending" || paymentData.status === "in_process") {
        newStatus = "pending";
      } else if (paymentData.status === "rejected" || paymentData.status === "cancelled" || paymentData.status === "refunded") {
        newStatus = "refused";
      }
      const updateOrder = {
        status: newStatus,
        mercadoPagoPaymentId: dataId,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        ...externalReference
      };
      await orderRef.set(updateOrder, { merge: true });
      saveToMinioDB("orders", orderId, { ...currentData, ...updateOrder }).catch(() => {
      });
      console.log(`[Webhook] Order ${orderId} updated to status: ${newStatus}`);
      if (newStatus === "paid" && currentData.status !== "paid" && currentData.status !== "delivered" && externalReference.type === "hotcoins") {
        try {
          const buyerId = externalReference.buyerId;
          const hotCoins = Number(externalReference.hotCoins) || 0;
          if (buyerId && hotCoins > 0) {
            const userRef = db2.collection("users").doc(buyerId);
            const { FieldValue: FieldValue2 } = __require("firebase-admin/firestore");
            await userRef.update({
              hotCoins: FieldValue2.increment(hotCoins)
            });
            const transRef = db2.collection("hotcoin_transactions").doc();
            const transData = {
              userId: buyerId,
              amount: hotCoins,
              type: "earn",
              description: `Compra de Pacote de ${hotCoins} HotCoins`,
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            };
            await transRef.set(transData);
            saveToMinioDB("hotcoin_transactions", transRef.id, transData).catch(() => {
            });
            await orderRef.set({ status: "delivered", updatedAt: (/* @__PURE__ */ new Date()).toISOString() }, { merge: true });
            console.log(`[Webhook] Credited ${hotCoins} HotCoins to user ${buyerId} for order ${orderId}`);
          }
        } catch (err) {
          console.error("[Webhook] Error processing hotcoins:", err);
        }
      }
      if (newStatus === "paid" && currentData.status !== "paid" && currentData.status !== "delivered" && externalReference.type !== "hotcoins") {
        try {
          const sellerSnap = await db2.collection("users").doc(externalReference.sellerId).get();
          const buyerSnap = await db2.collection("users").doc(externalReference.buyerId).get();
          if (sellerSnap.exists) {
            const seller = sellerSnap.data();
            await sendSystemEmail({
              to: seller.email,
              subject: "Nova Venda Realizada!",
              title: "Parab\xE9ns pela venda!",
              message: `Voc\xEA acabou de realizar uma venda de <strong>R$ ${externalReference.amount}</strong>. Acesse seu painel para processar o pedido.`,
              buttonText: "Ver Vendas",
              buttonUrl: `${process.env.SITE_URL || "https://packzinhu.online"}/dashboard?tab=sales`,
              bannerType: "sale"
            });
            const sellerNotif = {
              recipient_id: externalReference.sellerId,
              sender_id: "system",
              type: "sale",
              message: `Voc\xEA realizou uma nova venda de R$ ${externalReference.amount}!`,
              read: false,
              created_at: (/* @__PURE__ */ new Date()).toISOString()
            };
            const sNotifRef = await db2.collection("notifications").add(sellerNotif);
            saveToMinioDB("notifications", sNotifRef.id, sellerNotif).catch(() => {
            });
          }
          if (buyerSnap.exists) {
            const buyer = buyerSnap.data();
            await sendSystemEmail({
              to: buyer.email,
              subject: "Sua compra foi aprovada!",
              title: "Compra Confirmada!",
              message: `Seu pagamento foi aprovado. O valor est\xE1 seguro e ser\xE1 liberado ao vendedor ap\xF3s a entrega.`,
              buttonText: "Minhas Compras",
              buttonUrl: `${process.env.SITE_URL || "https://packzinhu.online"}/dashboard?tab=purchases`,
              bannerType: "purchase"
            });
            const buyerNotif = {
              recipient_id: externalReference.buyerId,
              sender_id: "system",
              type: "purchase",
              message: `Seu pagamento do servi\xE7o "${externalReference.serviceTitle || "contratado"}" foi aprovado!`,
              read: false,
              created_at: (/* @__PURE__ */ new Date()).toISOString()
            };
            const bNotifRef = await db2.collection("notifications").add(buyerNotif);
            saveToMinioDB("notifications", bNotifRef.id, buyerNotif).catch(() => {
            });
          }
          const chatId = [externalReference.buyerId, externalReference.sellerId].sort().join("_");
          await db2.collection("chats").doc(chatId).collection("messages").add({
            senderId: "system",
            text: `\u2705 Pagamento de R$ ${externalReference.amount} aprovado para o pedido... O vendedor j\xE1 pode iniciar o servi\xE7o!`,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          await db2.collection("chats").doc(chatId).set({
            participants: [externalReference.buyerId, externalReference.sellerId],
            lastMessage: `\u2705 Pagamento aprovado! O servi\xE7o ser\xE1 iniciado.`,
            lastMessageTime: (/* @__PURE__ */ new Date()).toISOString(),
            id: chatId
          }, { merge: true });
        } catch (e) {
          console.error("[Webhook] Failed to send emails/notifications:", e);
        }
      }
    }
    return res.status(200).send("OK");
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return res.status(200).send("OK");
  }
});
app.post("/api/orders/confirm-delivery", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "N\xE3o autorizado" });
    const token = authHeader.split("Bearer ")[1];
    const decodedUser = await adminAuth.verifyIdToken(token);
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "ID do pedido obrigat\xF3rio" });
    const orderRef = db2.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return res.status(404).json({ error: "Pedido n\xE3o encontrado" });
    const orderData = orderSnap.data();
    if (orderData.buyerId !== decodedUser.uid) return res.status(403).json({ error: "Apenas o comprador pode liberar" });
    if (orderData.status === "delivered") return res.status(400).json({ error: "Pagamento j\xE1 foi liberado" });
    const amount = Number(orderData.amount);
    if (isNaN(amount)) throw new Error("Valor do pedido inv\xE1lido");
    const sellerNetAmount = amount * 0.95;
    const sellerRef = db2.collection("users").doc(orderData.sellerId);
    await db2.runTransaction(async (t) => {
      const sellerDoc = await t.get(sellerRef);
      const sellerData = sellerDoc.data() || {};
      const currentBalance = Number(sellerData.balance || 0);
      const newBalance = currentBalance + sellerNetAmount;
      const deliveredAt = (/* @__PURE__ */ new Date()).toISOString();
      t.update(sellerRef, { balance: newBalance });
      t.update(orderRef, {
        status: "delivered",
        deliveredAt
      });
      saveToMinioDB("users", orderData.sellerId, { ...sellerData, balance: newBalance }).catch(() => {
      });
      saveToMinioDB("orders", orderId, { ...orderData, status: "delivered", deliveredAt }).catch(() => {
      });
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error confirming delivery:", error);
    res.status(200).json({ error: error.message });
  }
});
app.get("/api/my-uploads", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "N\xE3o autorizado" });
    const token = authHeader.split("Bearer ")[1];
    const decodedUser = await adminAuth.verifyIdToken(token);
    const uploads = getMediaByUser(decodedUser.uid);
    res.json({ success: true, uploads });
  } catch (error) {
    console.error("Error fetching SQL uploads:", error);
    res.status(200).json({ error: error.message });
  }
});
app.post("/api/admin/resolve-dispute", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "N\xE3o autorizado" });
    const token = authHeader.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);
    const { orderId, resolution } = req.body;
    if (!orderId || !resolution) return res.status(400).json({ error: "Faltam par\xE2metros" });
    const orderRef = db2.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return res.status(404).json({ error: "Pedido n\xE3o encontrado" });
    const orderData = orderSnap.data();
    if (orderData.status !== "disputed") return res.status(400).json({ error: "Pedido n\xE3o est\xE1 em disputa" });
    if (resolution === "release") {
      const amount = Number(orderData.amount);
      const sellerNetAmount = amount * 0.95;
      const sellerRef = db2.collection("users").doc(orderData.sellerId);
      await db2.runTransaction(async (t) => {
        const sellerDoc = await t.get(sellerRef);
        const sellerData = sellerDoc.data() || {};
        const currentBalance = Number(sellerData.balance || 0);
        t.update(sellerRef, { balance: currentBalance + sellerNetAmount });
        t.update(orderRef, { status: "delivered", resolvedAt: (/* @__PURE__ */ new Date()).toISOString() });
      });
      saveToMinioDB("orders", orderId, { ...orderData, status: "delivered" }).catch(() => {
      });
    } else if (resolution === "refund") {
      await orderRef.update({ status: "refunded", resolvedAt: (/* @__PURE__ */ new Date()).toISOString() });
      saveToMinioDB("orders", orderId, { ...orderData, status: "refunded" }).catch(() => {
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error resolving dispute:", error);
    res.status(200).json({ error: error.message });
  }
});
app.post("/api/orders/:orderId/status", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const { status } = req.body;
    const { orderId } = req.params;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "N\xE3o autorizado" });
    const token = authHeader.split("Bearer ")[1];
    await adminAuth.verifyIdToken(token);
    const orderRef = db2.collection("orders").doc(orderId);
    const updateData = { status, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await orderRef.update(updateData);
    const orderSnap = await orderRef.get();
    if (orderSnap.exists) {
      saveToMinioDB("orders", orderId, orderSnap.data()).catch(() => {
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error changing order status:", error);
    res.status(200).json({ error: error.message });
  }
});
async function startDevServer() {
  const PORT = 3e3;
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      maxAge: "1y",
      immutable: true,
      index: false
      // Let the *all route handle index.html without caching it too long
    }));
    app.get("*all", (req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
  try {
    const { ensureBucketAndPolicy: ensureBucketAndPolicy2 } = await Promise.resolve().then(() => (init_minio_client(), minio_client_exports));
    const { MINIO_BUCKET: MINIO_BUCKET3 } = await Promise.resolve().then(() => (init_s3(), s3_exports));
    await ensureBucketAndPolicy2(MINIO_BUCKET3);
  } catch (err) {
    console.warn("Could not ensure MinIO bucket on startup. Will retry on upload.");
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startDevServer();
}
export {
  app
};
