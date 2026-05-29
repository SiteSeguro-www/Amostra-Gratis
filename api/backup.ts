import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, MINIO_BUCKET } from '../src/lib/s3';
import * as localDb from "../src/lib/db";


export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    const { type, data } = req.body;
    const result = await backupData(type, data);
    return res.status(200).json(result);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Handles backing up data to both Local SQLite and MinIO JSON objects.
 */
export async function backupData(type: string, data: any) {
  try {
    console.log(`[BackupData] Starting backup for type: ${type}`);
    // 1. Sync to MinIO (Primary Storage)
    const id = data.id || `${Date.now()}`;
    const fileName = `backups/${type}s/${id}.json`;
    
    console.log(`[BackupData] Preparing to save to bucket: ${MINIO_BUCKET}, key: ${fileName}`);

    await s3Client.send(new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: fileName,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    }));

    console.log(`[BackupData] Successfully saved to MinIO`);

    // 2. Sync to Local SQLite (Secondary Cache)
    switch (type) {
      case 'post':
        localDb.savePostLocal(data);
        break;
      case 'profile':
        break;
      case 'like':
        localDb.saveLikeLocal(data);
        break;
      case 'unlike':
        localDb.deleteLikeLocal(data.postId, data.userId);
        break;
      case 'comment':
        localDb.saveCommentLocal(data);
        break;
      case 'follow':
        localDb.saveFollowLocal(data.followerId, data.followingId);
        break;
      case 'unfollow':
        localDb.deleteFollowLocal(data.followerId, data.followingId);
        break;
    }

    return { success: true, message: `Backup of ${type} completed to MinIO and cached locally` };
  } catch (error: any) {
    console.error(`[Backup Error] ${error.message}`);
    return { success: false, error: error.message };
  }
}
