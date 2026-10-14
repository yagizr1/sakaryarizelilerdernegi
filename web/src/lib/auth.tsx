import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, clearToken, getToken, setToken } from "./api";

export type Role = "ADMIN" | "MEMBER";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  memberId?: string;
  status?: string;
};

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  loginAdmin: (email: string, password: string) => Promise<void>;
  loginMember: (nationalId: string, password: string) => Promise<void>;
  logout: () => void;
  homePath: string;
};

const AuthContext = createContext<AuthCtx | null>(null);

function normalizeUser(u: AuthUser): AuthUser {
  const role = (u.role || "").toUpperCase() === "MEMBER" ? "MEMBER" : "ADMIN";
  return { ...u, role };
}

export function homeForRole(role?: Role | string | null) {
  if ((role || "").toUpperCase() === "MEMBER") return "/member/dashboard";
  return "/admin/dashboard";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api<AuthUser>("/auth/me")
      .then((u) => setUser(normalizeUser(u)))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      homePath: homeForRole(user?.role),
      async loginAdmin(email, password) {
        const res = await api<{ token: string; user: AuthUser }>("/auth/admin/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setToken(res.token);
        setUser(normalizeUser(res.user));
      },
      async loginMember(nationalId, password) {
        const res = await api<{ token: string; user: AuthUser }>("/auth/member/login", {
          method: "POST",
          body: JSON.stringify({ nationalId, password }),
        });
        setToken(res.token);
        setUser(normalizeUser(res.user));
      },
      logout() {
        clearToken();
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider içinde kullanılmalı");
  return ctx;
}
