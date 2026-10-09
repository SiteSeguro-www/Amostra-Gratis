import { PutObjectCommand, GetObjectCommand, ListObjectsV2Command, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from './minio-s3.ts';

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { collection, docId, data } = req.method === 'GET' ? req.query : (req.body || {});

  try {
    if (req.method === 'POST') {
      const result = await saveToMinioDB(collection, docId, data);
      return res.status(200).json(result);
    } else if (req.method === 'GET') {
      if (docId) {
        const result = await loadSingleFromMinioDB(collection, docId);
        return res.status(200).json(result);
      }
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
    return { success: true, key };
  } catch (err: any) {
    console.error(`Error saving ${collection}/${docId} to MinIO:`, err);
    throw err;
  }
}

export async function loadFromMinioDB(collection: string) {
  try {
    await ensureDbBucket();
    const prefix = `${collection}/`;
    const response = await s3Client.send(new ListObjectsV2Command({
      Bucket: DB_BUCKET,
      Prefix: prefix
    }));

    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }

    const items = await Promise.all(response.Contents.map(async (obj) => {
      try {
        const getReq = await s3Client.send(new GetObjectCommand({
          Bucket: DB_BUCKET,
          Key: obj.Key
        }));
        const str = await getReq.Body?.transformToString();
        return str ? JSON.parse(str) : null;
      } catch (e) {
        return null;
      }
    }));

    return items.filter(Boolean);
  } catch (err: any) {
    console.error(`Error loading collection ${collection} from MinIO:`, err);
    return [];
  }
}

export async function loadSingleFromMinioDB(collection: string, docId: string) {
  try {
    await ensureDbBucket();
    const key = `${collection}/${docId}.json`;
    try {
      const getReq = await s3Client.send(new GetObjectCommand({
        Bucket: DB_BUCKET,
        Key: key
      }));
      const str = await getReq.Body?.transformToString();
      return str ? JSON.parse(str) : null;
    } catch (e: any) {
      if (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw e;
    }
  } catch (err: any) {
    console.error(`Error loading ${collection}/${docId} from MinIO:`, err);
    return null;
  }
}

export async function deleteFromMinioDB(collection: string, docId: string) {
  try {
    await ensureDbBucket();
    const key = `${collection}/${docId}.json`;
    await s3Client.send(new DeleteObjectCommand({
      Bucket: DB_BUCKET,
      Key: key
    }));
    return { success: true };
  } catch (err: any) {
    console.error(`Error deleting ${collection}/${docId} from MinIO:`, err);
    throw err;
  }
}
