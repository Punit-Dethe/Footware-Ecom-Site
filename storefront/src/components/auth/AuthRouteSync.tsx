"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Route-level client sync for auth-consuming surfaces (/account, /checkout, /wholesale).
 * When an authenticated user navigates from a public catalog route (where initial
 * auth calls are suppressed for performance) into an auth-sensitive subtree, this
 * component synchronizes the existing session without requiring a manual page reload.
 */
export function AuthRouteSync() {
  const { isAuthenticated, refreshUser } = useAuth();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      void refreshUser();
    }
  }, [isAuthenticated, refreshUser]);

  return null;
}
