import { PutObjectCommand, GetObjectCommand, ListObjectsV2Command, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, MINIO_ENDPOINT } from '../src/lib/s3';

const DB_BUCKET = process.env.MINIO_DB_BUCKET || 'packzinhu-db';

async function ensureDbBucket() {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: DB_BUCKET }));
  } catch (err: any) {
    if (err.$metadata?.httpStatusCode === 404 || err.name === 'NotFound') {
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: DB_BUCKET }));
        const policy = {
          Version: "2012-10-17",
          Statement: [{
            Effect: "Allow", Principal: "*", Action: ["s3:GetObject"], Resource: [`arn:aws:s3:::${DB_BUCKET}/*`]
          }]
        };
        await s3Client.send(new PutBucketPolicyCommand({ Bucket: DB_BUCKET, Policy: JSON.stringify(policy) }));
      } catch (e) {
        console.error("Failed to create db bucket", e);
      }
    }
  }
}


export default async function handler(req: any, res: any) {
  const { collection, docId, data } = req.method === 'GET' ? req.query : req.body;

  try {
    if (req.method === 'POST') {
      const result = await saveToMinioDB(collection, docId, data);
      return res.status(200).json(result);
    } else if (req.method === 'GET') {
      const result = await loadFromMinioDB(collection);
      return res.status(200).json(result);
    } else if (req.method === 'DELETE') {
       const result = await deleteFromMinioDB(collection, docId);
       return res.status(200).json(result);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function saveToMinioDB(collection: string, docId: string, data: any) {
  try {
    await ensureDbBucket();
    const key = `${collection}/${docId}.json`;
    const body = JSON.stringify(data);
    await s3Client.send(new PutObjectCommand({
      Bucket: DB_BUCKET,
      Key: key,
      Body: body,
      ContentType: 'application/json'
    }));
    return { success: true, url: `https://cdn.packzinhu.online/${DB_BUCKET}/${key}` };
  } catch (error: any) {
    console.error(`[MinIO DB] Save Error (${collection}/${docId}):`, error.message);
    throw error;
  }
}

export async function loadFromMinioDB(collection: string) {
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

export async function getSingleDocumentFromMinioDB(collection: string, docId: string) {
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

export async function deleteFromMinioDB(collection: string, docId: string) {
    await ensureDbBucket();
    const key = `${collection}/${docId}.json`;
    await s3Client.send(new DeleteObjectCommand({
        Bucket: DB_BUCKET,
        Key: key
    }));
    return { success: true };
}
