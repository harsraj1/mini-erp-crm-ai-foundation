import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, errorMessage, tokenKey } from '../api/client';
import type { User } from '../types';

interface Auth { user: User | null; loading: boolean; error: string; login: (email: string, password: string) => Promise<void>; logout: () => void; retry: () => void }
const AuthContext = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const expired = () => { setUser(null); setError('Your session expired. Please sign in again.'); };
    window.addEventListener('session-expired', expired);
    setLoading(true);
    if (!sessionStorage.getItem(tokenKey)) setLoading(false);
    else void api.get<{ data: { user: User } }>('/auth/me').then((res) => { if (active) { setUser(res.data.data.user); setError(''); } })
      .catch((err: unknown) => { if (active) setError(errorMessage(err)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; window.removeEventListener('session-expired', expired); };
  }, [attempt]);
  async function login(email: string, password: string) {
    const response = await api.post<{ data: { token: string; user: User } }>('/auth/login', { email, password });
    sessionStorage.setItem(tokenKey, response.data.data.token);
    setUser(response.data.data.user); setError('');
  }
  function logout() { sessionStorage.removeItem(tokenKey); setUser(null); setError(''); }
  return <AuthContext.Provider value={{ user, loading, error, login, logout, retry: () => setAttempt((value) => value + 1) }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider is required'); return value; }
