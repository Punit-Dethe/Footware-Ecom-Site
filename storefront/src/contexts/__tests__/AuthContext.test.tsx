import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// useRouter and usePathname must return stable / controllable references.
const { mockRefresh, mockRouter, mockUsePathname } = vi.hoisted(() => {
  const refresh = vi.fn();
  const pathnameMock = vi.fn(() => "/us/en/account");
  return {
    mockRefresh: refresh,
    mockRouter: { refresh, push: () => {}, replace: () => {} },
    mockUsePathname: pathnameMock,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockUsePathname(),
}));

vi.mock("@/lib/data/customer", () => ({
  syncSession: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}));

import { AuthProvider, isAuthSensitivePath, useAuth } from "@/contexts/AuthContext";
import { syncSession } from "@/lib/data/customer";

const mockSyncSession = vi.mocked(syncSession);

const mockCustomer = {
  id: "user-1",
  email: "test@example.com",
  first_name: "Test",
  last_name: "User",
  role: "customer" as const,
} as never;

let currentTestPathname = "/us/en/account";

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider initialPathname={currentTestPathname}>{children}</AuthProvider>;
}

/** Dispatch a visibility change while pretending `msAhead` has elapsed. */
async function returnToTab(msAhead: number) {
  const spy = vi.spyOn(Date, "now").mockReturnValue(Date.now() + msAhead);
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
  spy.mockRestore();
}

describe("isAuthSensitivePath route classification", () => {
  it("classifies catalog routes as non-sensitive (0 auth overhead)", () => {
    expect(isAuthSensitivePath("/")).toBe(false);
    expect(isAuthSensitivePath("/us/en")).toBe(false);
    expect(isAuthSensitivePath("/us/en/products")).toBe(false);
    expect(isAuthSensitivePath("/us/en/products/runner-shoe-v2")).toBe(false);
    expect(isAuthSensitivePath("/us/en/c/running")).toBe(false);
    expect(isAuthSensitivePath("/us/en/search")).toBe(false);
    expect(isAuthSensitivePath("/us/en/terms-and-conditions")).toBe(false);
    expect(isAuthSensitivePath(null)).toBe(false);
  });

  it("classifies account, checkout, wholesale, and auth routes as sensitive", () => {
    expect(isAuthSensitivePath("/us/en/account")).toBe(true);
    expect(isAuthSensitivePath("/us/en/account/orders")).toBe(true);
    expect(isAuthSensitivePath("/us/en/checkout")).toBe(true);
    expect(isAuthSensitivePath("/us/en/wholesale")).toBe(true);
    expect(isAuthSensitivePath("/us/en/wholesale/orders")).toBe(true);
    expect(isAuthSensitivePath("/auth/confirm")).toBe(true);
  });
});

describe("AuthContext catalog route performance invariant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("performs 0 session sync calls on storefront homepage", async () => {
    currentTestPathname = "/us/en";
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSyncSession).not.toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("performs 0 session sync calls on PLP (/us/en/products)", async () => {
    currentTestPathname = "/us/en/products";
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSyncSession).not.toHaveBeenCalled();
  });

  it("performs 0 session sync calls on PDP (/us/en/products/performance-shoe)", async () => {
    currentTestPathname = "/us/en/products/performance-shoe";
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSyncSession).not.toHaveBeenCalled();
  });
});

describe("AuthContext session sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentTestPathname = "/us/en/account";
    mockSyncSession.mockResolvedValue({
      customer: mockCustomer,
      refreshed: false,
    });
  });

  it("syncs the session on mount when on /account and exposes the customer", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSyncSession).toHaveBeenCalledTimes(1);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe("test@example.com");
    expect(result.current.user?.role).toBe("customer");
  });

  it("re-syncs when the tab regains focus, throttling rapid events", async () => {
    renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(mockSyncSession).toHaveBeenCalledTimes(1));

    // Within the throttle window — ignored.
    await returnToTab(5_000);
    expect(mockSyncSession).toHaveBeenCalledTimes(1);

    // Past the throttle window — re-syncs.
    await returnToTab(31_000);
    await waitFor(() => expect(mockSyncSession).toHaveBeenCalledTimes(2));
  });

  it("re-renders server components after a transparent refresh", async () => {
    mockSyncSession.mockResolvedValue({
      customer: mockCustomer,
      refreshed: true,
    });

    renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
  });

  it("clears the user when the session is gone", async () => {
    mockSyncSession.mockResolvedValue({ customer: null, refreshed: false });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("strictly sources role from public.profiles.role without admin email heuristic", async () => {
    const maliciousAdminCandidate = {
      id: "user-attacker",
      email: "attacker-admin@example.com",
      first_name: "Attacker",
      last_name: "Admin",
      role: "customer" as const,
    } as never;

    mockSyncSession.mockResolvedValue({
      customer: maliciousAdminCandidate,
      refreshed: false,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user?.role).toBe("customer");
    expect(result.current.user?.role).not.toBe("admin");
  });
});
