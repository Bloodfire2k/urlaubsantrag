export const API_BASE =
  (import.meta.env?.VITE_API_URL?.trim() || '/api').replace(/\/+$/, '');

export const apiFetch = (path: string, init: RequestInit = {}) =>
  fetch(`${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
