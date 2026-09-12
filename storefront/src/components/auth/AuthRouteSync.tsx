"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface RouteSyncContextValue {
  isSyncing: boolean;
}

const RouteSyncContext = createContext<RouteSyncContextValue>({
  isSyncing: false,
});

/**
 * Accesses route-level auth synchronization status.
 * Used by account pages and shell to avoid false anonymous redirects and flashing
 * while the single route-entry sync runs.
 */
export function useRouteSync(): RouteSyncContextValue {
  return useContext(RouteSyncContext);
}

/**
 * Route-level client sync owner for auth-consuming surfaces (/account, /checkout, /wholesale).
 * When an authenticated user navigates from a public catalog route (where initial
 * auth calls are suppressed for performance) into an auth-sensitive subtree, this
 * component is the sole owner of session synchronization without requiring a manual page reload.
 */
export function AuthRouteSync({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, refreshUser } = useAuth();
  const [isSyncing, setIsSyncing] = useState(!isAuthenticated);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    let active = true;
    if (!isAuthenticated && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      setIsSyncing(true);
      void refreshUser().finally(() => {
        if (active) {
          setIsSyncing(false);
        }
      });
    } else {
      setIsSyncing(false);
    }
    return () => {
      active = false;
    };
  }, [isAuthenticated, refreshUser]);

  return (
    <RouteSyncContext.Provider value={{ isSyncing }}>
      {children ?? null}
    </RouteSyncContext.Provider>
  );
}
