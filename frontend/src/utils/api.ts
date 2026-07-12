const configuredBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const API_BASE_URL = configuredBaseUrl || (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
