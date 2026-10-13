import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, onTokenChange } from '../api/client';
import { getMyProfile } from '../lib/auth';
import { UserProfile, Session } from '../types/auth';

interface AuthCtx {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthCtx>({ session: null, profile: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apply = (token: string | null) => {
      setSession(token ? { token } : null);
      if (token) getMyProfile().then(setProfile);
      else setProfile(null);
    };

    apply(getToken());
    setLoading(false);

    return onTokenChange(apply);
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
