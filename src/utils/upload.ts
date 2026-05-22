
import { auth } from '../firebase';
import { getApiUrl } from '../config';

export async function uploadToStorage(
  file: File, 
  path: string = 'uploads',
  onProgress?: (progress: number) => void
): Promise<string> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  if (!token) throw new Error('Não autenticado');

  // Request a presigned URL from our API
  console.log('[Upload] Solicitando Presigned URL para upload DIRETO no MinIO...');
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
    throw new Error(errObj.error || 'Falha ao solicitar URL de upload');
  }

  const { presignedUrl, fileKey } = await presignedRes.json();

  // Upload directly to MinIO/S3 using XMLHttpRequest for progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

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
        // Resolve with the public URL matching MinIO configuration
        const MINIO_BUCKET = 'packzinhu-db'; // Or pull from config
        const publicUrl = `https://cdn.packzinhu.online/${MINIO_BUCKET}/${fileKey}`;
        resolve(publicUrl);
      } else {
        reject(new Error(`Falha no upload direto: ${xhr.status} ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Erro de conexão ao fazer upload direto (Verifique o CORS e SSL do MinIO)'));
    };

    console.log('[Upload] Enviando arquivo DIRETO para MinIO bypassando Vercel...');
    xhr.send(file);
  });
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
