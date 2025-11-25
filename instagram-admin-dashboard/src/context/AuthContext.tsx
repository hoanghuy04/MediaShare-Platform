import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, authAPI, setAuthHeader } from "../lib/api";
import { tokenStorage } from "../lib/tokenStorage";
import type { AuthTokens, AuthUser } from "../types";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState>({
  user: null,
  loading: false,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = tokenStorage.accessToken;
    const refreshToken = tokenStorage.refreshToken;
    if (accessToken && refreshToken) {
      setLoading(true);
      setAuthHeader(accessToken);
      api
        .get("/auth/me")
        .then((res) => {
          setUser(res.data?.data ?? res.data);
        })
        .catch(() => {
          tokenStorage.clear();
          setAuthHeader(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    setLoading(true);
    try {
      const data = await authAPI.login(usernameOrEmail, password);
      const tokens: AuthTokens = {
        accessToken: data?.accessToken ?? data?.data?.accessToken,
        refreshToken: data?.refreshToken ?? data?.data?.refreshToken,
      };
      if (!tokens.accessToken || !tokens.refreshToken) {
        throw new Error("Invalid token response");
      }
      setAuthHeader(tokens.accessToken);
      const profile: AuthUser = data.user ?? data.data?.user ?? {
        id: "admin",
        username: usernameOrEmail,
        email: data?.email ?? `${usernameOrEmail}@example.com`,
        role: data?.user?.role ?? "ADMIN",
        avatar: data?.user?.avatar,
      };
      tokenStorage.set(tokens.accessToken, tokens.refreshToken);
      setUser(profile);
    } catch (error) {
      tokenStorage.clear();
      setAuthHeader(null);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    tokenStorage.clear();
    setAuthHeader(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useContext(AuthContext);

