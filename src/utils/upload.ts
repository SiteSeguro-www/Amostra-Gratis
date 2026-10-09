
import { auth, storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getApiUrl } from '../config';

const MINIO_BUCKET = 'packzinhu-db';

// Upload via Firebase Storage Fallback
async function uploadViaFirebaseStorage(
  file: File,
  storagePath: string = 'uploads',
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('[Upload] Executando upload via Firebase Storage fallback...');
  const cleanName = (file.name || 'file').replace(/[^a-zA-Z0-9.\-_]/g, '');
  const fileKey = `${storagePath}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanName}`;
  const storageRef = ref(storage, fileKey);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type || 'application/octet-stream'
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        }
      },
      (error) => reject(error),
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('[Upload] Firebase Storage upload concluído:', downloadUrl);
          resolve(downloadUrl);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

// Upload via Backend Proxy (/api/upload)
async function uploadViaProxy(
  file: File,
  token: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', getApiUrl('/api/upload'));
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) {
            console.log('[Upload] Upload via proxy bem-sucedido:', data.url);
            resolve(data.url);
          } else {
            reject(new Error(data.error || 'Resposta inválida do servidor de upload'));
          }
        } catch (e: any) {
          reject(new Error(`Erro ao interpretar resposta do servidor: ${e.message}`));
        }
      } else {
        let msg = `Erro no upload: ${xhr.status} ${xhr.statusText}`;
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.error) msg = data.error;
        } catch (_) {}
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Erro de conexão ao enviar para o proxy do servidor'));
    };

    xhr.send(formData);
  });
}

// Upload via Presigned URL directly to MinIO
async function uploadViaPresigned(
  file: File,
  token: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('[Upload] Solicitando Presigned URL para upload direto no MinIO...');
  const presignedRes = await fetch(getApiUrl('/api/presigned-url'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || 'application/octet-stream'
    })
  });

  if (!presignedRes.ok) {
    const errObj = await presignedRes.json().catch(() => ({}));
    throw new Error(errObj.error || `Falha ao solicitar URL de upload (${presignedRes.status})`);
  }

  const { presignedUrl, fileKey } = await presignedRes.json();
  if (!presignedUrl || !fileKey) {
    throw new Error('Servidor não retornou URL de upload válida');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignedUrl);
    if (file.type) {
      xhr.setRequestHeader('Content-Type', file.type);
    }

    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const publicUrl = `https://cdn.packzinhu.online/${MINIO_BUCKET}/${fileKey}`;
        console.log('[Upload] Upload direto MinIO concluído:', publicUrl);
        resolve(publicUrl);
      } else {
        reject(new Error(`Falha no upload direto: ${xhr.status} ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Erro de conexão ao fazer upload direto'));
    };

    xhr.send(file);
  });
}

// Upload via Direct S3 to MinIO (Guaranteed Client Fallback)
async function uploadViaDirectS3(
  file: File,
  storagePath: string = 'uploads',
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('[Upload] Executando upload direto via MinIO S3...');
  const { s3Client, MINIO_BUCKET } = await import('../lib/s3');
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');

  const cleanName = (file.name || 'file').replace(/[^a-zA-Z0-9.\-_]/g, '');
  const fileKey = `${storagePath}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanName}`;

  if (onProgress) onProgress(30);

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  if (onProgress) onProgress(60);

  await s3Client.send(new PutObjectCommand({
    Bucket: MINIO_BUCKET,
    Key: fileKey,
    Body: uint8Array,
    ContentType: file.type || 'application/octet-stream',
  }));

  if (onProgress) onProgress(100);

  const publicUrl = `https://cdn.packzinhu.online/${MINIO_BUCKET}/${fileKey}`;
  console.log('[Upload] Upload direto MinIO S3 concluído com sucesso:', publicUrl);
  return publicUrl;
}

export async function uploadToStorage(
  file: File, 
  path: string = 'uploads',
  onProgress?: (progress: number) => void
): Promise<string> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  if (!token) throw new Error('Não autenticado. Faça login para enviar arquivos.');

  const isSmallFile = file.size <= 4 * 1024 * 1024; // 4MB threshold

  if (isSmallFile) {
    // For images, profile photos, and small files:
    // 1. Try proxy (MinIO via backend /api/upload)
    try {
      console.log(`[Upload] Enviando arquivo (${Math.round(file.size / 1024)}KB) via proxy da API...`);
      return await uploadViaProxy(file, token, onProgress);
    } catch (proxyError: any) {
      console.warn('[Upload] Falha no proxy, tentando upload direto MinIO...', proxyError.message);
      // 2. Try Presigned URL directly to MinIO
      try {
        return await uploadViaPresigned(file, token, onProgress);
      } catch (presignedError: any) {
        console.warn('[Upload] Falha no upload MinIO presigned, tentando S3 direto...', presignedError.message);
        // 3. Fallback to Direct S3
        try {
          return await uploadViaDirectS3(file, path, onProgress);
        } catch (s3Error: any) {
          console.error('[Upload] Todas as estratégias de upload falharam:', { proxyError, presignedError, s3Error });
          throw new Error(proxyError.message || presignedError.message || s3Error.message || 'Falha no upload do arquivo');
        }
      }
    }
  } else {
    // For larger files (>4MB videos):
    // 1. Try presigned URL first to avoid serverless payload limits
    try {
      console.log(`[Upload] Enviando arquivo grande (${Math.round(file.size / (1024 * 1024))}MB) via presigned URL...`);
      return await uploadViaPresigned(file, token, onProgress);
    } catch (presignedError: any) {
      console.warn('[Upload] Falha no presigned URL, tentando via proxy...', presignedError.message);
      // 2. Try proxy via /api/upload
      try {
        return await uploadViaProxy(file, token, onProgress);
      } catch (proxyError: any) {
        console.warn('[Upload] Falha no proxy, tentando S3 direto...', proxyError.message);
        // 3. Fallback to Direct S3
        try {
          return await uploadViaDirectS3(file, path, onProgress);
        } catch (s3Error: any) {
          console.error('[Upload] Todas as estratégias de upload falharam:', { presignedError, proxyError, s3Error });
          throw new Error(presignedError.message || proxyError.message || s3Error.message || 'Falha no upload do arquivo');
        }
      }
    }
  }
}

export async function deleteMedia(fileKey: string): Promise<boolean> {
  try {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(getApiUrl('/api/upload'), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ fileKey })
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Failed to delete media:', error);
    return false;
  }
}

export async function syncToLocalBackup(type: string, data: any) {
  try {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    
    await fetch(getApiUrl('/api/packzinhu-db/backup'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ type, data })
    });
  } catch (error) {
    console.warn('[Local Sync Failed] but continuing...', error);
  }
}
