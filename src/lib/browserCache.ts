/**
 * Simple browser cache helper with TTL (Time-To-Live)
 */

export const browserCache = {
  set(key: string, data: any, ttlMinutes: number = 5) {
    const now = new Date();
    const item = {
      data,
      expiry: now.getTime() + (ttlMinutes * 60000),
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  get(key: string) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    const now = new Date();

    if (now.getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.data;
  }
};
