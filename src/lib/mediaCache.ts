import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'PackZinhuCache';
const STORE_NAME = 'media-cache';

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};

export const mediaCache = {
  async set(url: string, blob: Blob) {
    try {
      const db = await getDB();
      await db.put(STORE_NAME, blob, url);
    } catch (err) {
      console.warn('Falha ao salvar no cache:', err);
    }
  },

  async get(url: string): Promise<string | null> {
    try {
      const db = await getDB();
      const blob = await db.get(STORE_NAME, url);
      if (blob) {
        return URL.createObjectURL(blob);
      }
      return null;
    } catch (err) {
      return null;
    }
  },

  async fetchAndCache(url: string): Promise<string> {
    const cached = await this.get(url);
    if (cached) return cached;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await this.set(url, blob);
      return URL.createObjectURL(blob);
    } catch (err) {
      return url; // Retorna a URL original se falhar
    }
  }
};
