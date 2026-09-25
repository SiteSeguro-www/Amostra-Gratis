
import { auth } from '../firebase';
import { getApiUrl } from '../config';

const MINIO_BUCKET = 'packzinhu-db';

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
    // For images, profile photos, and small files, try proxy first (100% reliable, no CORS issues)
    try {
      console.log(`[Upload] Enviando arquivo (${Math.round(file.size / 1024)}KB) via proxy da API...`);
      return await uploadViaProxy(file, token, onProgress);
    } catch (proxyError: any) {
      console.warn('[Upload] Falha no proxy, tentando upload direto MinIO...', proxyError.message);
      try {
        return await uploadViaPresigned(file, token, onProgress);
      } catch (presignedError: any) {
        console.error('[Upload] Ambas as estratégias de upload falharam:', { proxyError, presignedError });
        throw new Error(proxyError.message || presignedError.message || 'Falha no upload do arquivo');
      }
    }
  } else {
    // For larger files (>4MB videos), try presigned URL first to avoid serverless payload limits
    try {
      console.log(`[Upload] Enviando arquivo grande (${Math.round(file.size / (1024 * 1024))}MB) via presigned URL...`);
      return await uploadViaPresigned(file, token, onProgress);
    } catch (presignedError: any) {
      console.warn('[Upload] Falha no upload direto, tentando via proxy...', presignedError.message);
      try {
        return await uploadViaProxy(file, token, onProgress);
      } catch (proxyError: any) {
        console.error('[Upload] Ambas as estratégias de upload falharam:', { presignedError, proxyError });
        throw new Error(presignedError.message || proxyError.message || 'Falha no upload do arquivo');
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
