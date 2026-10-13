export interface UserProfile {
  id: string;
  username: string;
  role: 'admin' | 'user';
  created_by?: string;
  created_at?: string;
}

export interface Session {
  token: string;
}
