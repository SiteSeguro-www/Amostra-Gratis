import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from './minio-s3.js';
import { getAdminFirestore, getAdminAuth } from './firebase-admin.js';

const DB_BUCKET = process.env.MINIO_DB_BUCKET || 'packzinhu-db';

async function saveToMinioDB(collection: string, docId: string, data: any) {
  try {
    const key = `${collection}/${docId}.json`;
    const command = new PutObjectCommand({
      Bucket: DB_BUCKET,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json'
    });
    await s3Client.send(command);
  } catch (err) {
    console.error('Failed to sync to Minio', err);
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Não autorizado' });

  try {
    const db = getAdminFirestore();
    const adminAuth = getAdminAuth();

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const followerId = decodedToken.uid;
    const { followingId, action } = req.body;

    if (!followingId || !action) return res.status(400).json({ error: 'Dados incompletos' });

    const followRef = db.collection('follows');
    const userRef = db.collection('users').doc(followingId);
    const currentUserRef = db.collection('users').doc(followerId);

    if (action === 'follow') {
      const followObj = {
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date().toISOString()
      };
      const docRef = await followRef.add(followObj);

      let newFollowersCount = 0;
      await db.runTransaction(async (t) => {
        const userDoc = await t.get(userRef);
        const currentUserDoc = await t.get(currentUserRef);

        const currentFollowers = Number(userDoc.data()?.followersCount) || 0;
        const currentFollowing = Number(currentUserDoc.data()?.followingCount) || 0;

        newFollowersCount = currentFollowers + 1;
        t.set(userRef, { followersCount: newFollowersCount }, { merge: true });
        t.set(currentUserRef, { followingCount: currentFollowing + 1 }, { merge: true });
      });

      try {
        const updatedDoc = await userRef.get();
        await saveToMinioDB('users', followingId, updatedDoc.data());
      } catch (e) { console.error(e); }

      return res.status(200).json({ success: true, followId: docRef.id, newFollowersCount });
    } else {
      const q = followRef.where('follower_id', '==', followerId).where('following_id', '==', followingId);
      const snaps = await q.get();

      if (snaps.empty) return res.status(200).json({ success: true });

      for (const doc of snaps.docs) {
        await doc.ref.delete();
      }

      let newFollowersCount = 0;
      await db.runTransaction(async (t) => {
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
        await saveToMinioDB('users', followingId, updatedDoc.data());
      } catch (e) { console.error(e); }

      return res.status(200).json({ success: true, newFollowersCount });
    }
  } catch (error: any) {
    console.error('Toggle Follow Error:', error);
    return res.status(500).json({ error: error.message || 'Erro interno' });
  }
}
