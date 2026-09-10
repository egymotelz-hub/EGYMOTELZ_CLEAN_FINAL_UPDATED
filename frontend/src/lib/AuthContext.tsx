"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, authApi } from "./apiClient";

interface AuthUser {
  id: string;
  fullName?: string;
  roles: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Silent refresh on load: the httpOnly refresh cookie (if any, from a prior
  // session) is sent automatically by the browser — no token to manage in JS.
  useEffect(() => {
    authApi
      .refresh()
      .then((res) => {
        setAccessToken(res.accessToken);
        return api.get<AuthUser>("/auth/me", res.accessToken);
      })
      .then(setUser)
      .catch(() => {
        /* no valid session cookie — that's fine, just stay logged out */
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<{ accessToken: string; user: AuthUser }>("/auth/login", { email, password });
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }

  function logout() {
    authApi.logout().finally(() => {
      setAccessToken(null);
      setUser(null);
    });
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, loading }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
