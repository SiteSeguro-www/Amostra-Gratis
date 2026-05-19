/**
 * Saves data to the MinIO server as JSON
 */
import { getApiUrl } from '../config';

export async function saveToMonio(collectionName: string, data: any) {
  try {
    const docId = data.id || Date.now().toString();
    
    fetch(getApiUrl('/api/packzinhu-db'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ collection: collectionName, docId, data })
    }).catch(err => console.error('MinIO sync background error:', err));
    
  } catch (error) {
    console.error('MinIO sync setup error:', error);
  }
}

/**
 * Loads data from the MinIO server
 */
export async function loadFromMonio(collectionName: string) {
  try {
    const response = await fetch(getApiUrl(`/api/packzinhu-db?collection=${encodeURIComponent(collectionName)}`));
    if (response.ok) {
      const dbItems = await response.json();
      return dbItems;
    }
    return null;
  } catch (error) {
    console.error('MinIO load error:', error);
    return null;
  }
}

export async function loadSingleFromMonio(collectionName: string, docId: string) {
  try {
    const response = await fetch(getApiUrl(`/api/packzinhu-db?collection=${encodeURIComponent(collectionName)}&docId=${encodeURIComponent(docId)}`));
    if (response.ok) {
      const dbItem = await response.json();
      return dbItem;
    }
    return null;
  } catch (error) {
    console.error('MinIO load single error:', error);
    return null;
  }
}

export async function deleteFromMonio(collectionName: string, docId: string) {
  try {
    fetch(getApiUrl('/api/packzinhu-db'), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ collection: collectionName, docId })
    }).catch(err => console.error('MinIO delete background error:', err));
  } catch (error) {
    console.error('MinIO delete setup error:', error);
  }
}

