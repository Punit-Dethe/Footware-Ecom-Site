"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type AppUser,
  login as loginAction,
  logout as logoutAction,
  register as registerAction,
  syncSession,
} from "@/lib/data/customer";

export interface User {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  role: "customer" | "admin";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; user?: AppUser; error?: string }>;
  register: (params: {
    email: string;
    password: string;
    password_confirmation: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<{ success: boolean; user?: AppUser; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Checks whether the current route requires active authentication synchronization.
 * Public catalog routes (homepage, PLP, PDP, policies, etc.) return false.
 */
export function isAuthSensitivePath(pathname: string | null): boolean {
  if (!pathname) return false;
  const match = pathname.match(
    /^\/[a-z]{2}\/[a-z]{2,3}(?:-[a-z0-9]{2,8})*(\/.*)?$/i,
  );
  const normalized = (match ? match[1] || "/" : pathname).replace(/\/+$/, "") || "/";

  return (
    normalized === "/account" ||
    normalized.startsWith("/account/") ||
    normalized === "/checkout" ||
    normalized.startsWith("/checkout/") ||
    normalized === "/wholesale" ||
    normalized.startsWith("/wholesale/") ||
    normalized.startsWith("/auth/")
  );
}

function getClientPathname(): string {
  if (typeof window !== "undefined") {
    return window.location.pathname;
  }
  return "";
}

function toUser(customer: User): User {
  return {
    id: customer.id,
    email: customer.email,
    first_name: customer.first_name,
    last_name: customer.last_name,
    phone: customer.phone,
    // Role is strictly sourced from public.profiles.role; no email heuristics.
    role: customer.role || "customer",
  };
}

export function AuthProvider({
  children,
  initialPathname,
}: {
  children: ReactNode;
  initialPathname?: string;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const { customer, refreshed, stale } = await syncSession();
      if (refreshed) {
        router.refresh();
      }
      if (stale) return;
      setUser(customer ? toUser(customer) : null);
    } catch {
      // Leave existing session untouched on unexpected error
    }
  }, [router]);

  const lastSyncRef = useRef(0);

  // Initialize auth state with route-awareness to preserve storefront performance.
  // We use window.location.pathname inside useEffect to avoid dynamic usePathname()
  // blocking static prerendering at the layout root.
  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      const currentPath = initialPathname ?? getClientPathname();
      // Ordinary public catalog routes (homepage, PLP, PDP, category, search)
      // must NOT perform an auth roundtrip on initial render/hydration.
      if (!isAuthSensitivePath(currentPath)) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      lastSyncRef.current = Date.now();
      await refreshUser();
      if (active) {
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      active = false;
    };
  }, [initialPathname, refreshUser]);

  // Re-sync session when tab regains focus ONLY while on an auth-sensitive surface
  useEffect(() => {
    const currentPath = initialPathname ?? getClientPathname();
    if (!isAuthSensitivePath(currentPath)) return;

    const RESYNC_THROTTLE_MS = 30_000;
    const maybeResync = () => {
      const pathNow = initialPathname ?? getClientPathname();
      if (!isAuthSensitivePath(pathNow)) return;
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastSyncRef.current < RESYNC_THROTTLE_MS) return;
      lastSyncRef.current = Date.now();
      void refreshUser();
    };

    document.addEventListener("visibilitychange", maybeResync);
    window.addEventListener("focus", maybeResync);
    return () => {
      document.removeEventListener("visibilitychange", maybeResync);
      window.removeEventListener("focus", maybeResync);
    };
  }, [initialPathname, refreshUser]);

  // Login
  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginAction(email, password);
      if (result.success && result.user) {
        setUser(toUser(result.user));
        router.refresh();
      }
      return result;
    },
    [router],
  );

  // Register
  const register = useCallback(
    async (params: {
      email: string;
      password: string;
      password_confirmation: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
      metadata?: Record<string, unknown>;
    }) => {
      const result = await registerAction(params);
      if (result.success && result.user) {
        setUser(toUser(result.user));
        router.refresh();
      }
      return result;
    },
    [router],
  );

  // Logout
  const logout = useCallback(async () => {
    await logoutAction();
    setUser(null);
    router.refresh();
  }, [router]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: !!user,
    }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
