// Talks to the backend in /server. Requests go to /api on the same origin:
// the dev server forwards them ("proxy" in package.json) and in production
// the backend serves this app itself.

const TOKEN_KEY = 'tc-app-token';

type TokenListener = (token: string | null) => void;
const listeners = new Set<TokenListener>();

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  listeners.forEach(fn => fn(token));
}

// Called on every sign-in and sign-out; returns the unsubscribe function
export function onTokenChange(fn: TokenListener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Please check that it is running.');
  }

  // The session expired or the user was removed: sign out so the login page shows
  if (res.status === 401 && token) setToken(null);
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'Server error. Please try again.');
  return data as T;
}

const api = {
  get:    <T>(path: string) => request<T>('GET', path),
  post:   <T = void>(path: string, body?: unknown) => request<T>('POST', path, body),
  put:    <T = void>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: (path: string) => request<void>('DELETE', path),
};

export default api;
