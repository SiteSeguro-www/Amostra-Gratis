// API Configuration
export const API_URL = '';

// Helper to build API URLs
export const getApiUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (typeof API_URL === 'string' && API_URL.length > 0) {
    return `${API_URL.replace(/\/$/, '')}${cleanPath}`;
  }

  // In browser, relative paths are usually best for unified Full-Stack apps
  return cleanPath;
};
