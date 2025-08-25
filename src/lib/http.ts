// Token-Getter: erst sessionStorage, dann localStorage, dann Cookie "token"
function getToken() {
  const t = sessionStorage.getItem('token') || localStorage.getItem('urlaub_token');
  if (t) return t;
  const m = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export async function httpGetJson(path: string, { signal, prev } : { signal?: AbortSignal, prev?: any } = {}) {
  const token = getToken();
  const url = `${path}${path.includes('?') ? '&' : '?'}t=${Date.now()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
    credentials: 'include', // falls Login-Cookie genutzt wird
    signal,
  });
  if (res.status === 304) return prev ?? null;
  if (res.status === 401) {
    // Benutzer abmelden/weiterleiten, aber UI-State nicht leeren
    console.warn('401 Unauthorized – redirect to /login');
    if (location.pathname !== '/login') location.href = '/login';
    return prev ?? null;
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
