import api, { getToken, setToken } from '../api/client';
import { UserProfile } from '../types/auth';

export async function signIn(username: string, password: string) {
  const data = await api.post<{ token: string; user: UserProfile }>('/auth/login', { username, password });
  setToken(data.token);
  return data;
}

export async function signOut() {
  setToken(null);
}

export async function getMyProfile(): Promise<UserProfile | null> {
  if (!getToken()) return null;
  return api.get<UserProfile>('/auth/me').catch(() => null);
}

export async function changeMyPassword(password: string): Promise<void> {
  await api.post('/auth/password', { password });
}

export async function listUsers(): Promise<UserProfile[]> {
  return api.get<UserProfile[]>('/users');
}

export async function createUser(
  username: string,
  password: string,
  role: 'admin' | 'user'
): Promise<void> {
  await api.post('/users', { username, password, role });
}

export async function updateUser(
  userId: string,
  username: string,
  password: string,
  role: 'admin' | 'user'
): Promise<void> {
  await api.put(`/users/${userId}`, { username, password, role });
}

export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}`);
}
