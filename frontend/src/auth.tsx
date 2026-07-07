import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { router } from 'expo-router';
import { api, User, setToken, getToken } from './api';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (body: { name: string; email: string; password: string; role: 'customer' | 'seller' | 'admin' }) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const t = await getToken();
    if (!t) { setUser(null); setLoading(false); return; }
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      await setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // best-effort seed on first launch
    api.seed().catch(() => {});
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const r = await api.login({ email, password });
    await setToken(r.token);
    setUser(r.user);
    return r.user as User;
  };
  const register = async (body: any) => {
    const r = await api.register(body);
    await setToken(r.token);
    setUser(r.user);
    return r.user as User;
  };
  const logout = async () => {
    await setToken(null);
    setUser(null);
    router.replace('/login');
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('AuthProvider missing');
  return c;
}
