import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSyncSession = vi.fn();
const mockReplace = vi.fn();
const mockRouter = {
  push: vi.fn(),
  replace: mockReplace,
  refresh: vi.fn(),
};

const mockCustomer = {
  id: "user-123",
  email: "shopper@example.com",
  role: "customer" as const,
};

vi.mock("@/lib/data/customer", () => ({
  syncSession: () => mockSyncSession(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/us/en/account",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/account/AccountShell", () => ({
  AccountShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="account-shell">{children}</div>
  ),
}));

import { AuthProvider, useAuth } from "../AuthContext";
import { AuthRouteSync } from "@/components/auth/AuthRouteSync";
import { AuthenticatedAccountShell } from "@/components/account/AuthenticatedAccountShell";
import AccountPage from "@/app/[country]/[locale]/(storefront)/account/page";

describe("Client session sync ownership (B2.2 Section 6 invariants)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSyncSession.mockResolvedValue({
      customer: mockCustomer,
      refreshed: false,
      stale: false,
    });
  });

  it("fresh anonymous homepage: syncSession count = 0", async () => {
    function DummyHome() {
      const { user } = useAuth();
      return <div>Home user: {user?.email ?? "anon"}</div>;
    }

    render(
      <AuthProvider initialPathname="/us/en">
        <DummyHome />
      </AuthProvider>,
    );

    expect(mockSyncSession).not.toHaveBeenCalled();
    expect(screen.getByText("Home user: anon")).toBeInTheDocument();
  });

  it("fresh PLP: syncSession count = 0", async () => {
    function DummyPLP() {
      const { user } = useAuth();
      return <div>PLP user: {user?.email ?? "anon"}</div>;
    }

    render(
      <AuthProvider initialPathname="/us/en/products">
        <DummyPLP />
      </AuthProvider>,
    );

    expect(mockSyncSession).not.toHaveBeenCalled();
    expect(screen.getByText("PLP user: anon")).toBeInTheDocument();
  });

  it("fresh PDP: syncSession count = 0", async () => {
    function DummyPDP() {
      const { user } = useAuth();
      return <div>PDP user: {user?.email ?? "anon"}</div>;
    }

    render(
      <AuthProvider initialPathname="/us/en/products/performance-shoe">
        <DummyPDP />
      </AuthProvider>,
    );

    expect(mockSyncSession).not.toHaveBeenCalled();
    expect(screen.getByText("PDP user: anon")).toBeInTheDocument();
  });

  it("PDP → account SPA transition: exactly one route-entry sync", async () => {
    // 1. Initial render on catalog route (PDP)
    const { rerender } = render(
      <AuthProvider initialPathname="/us/en/products/performance-shoe">
        <div>PDP Content</div>
      </AuthProvider>,
    );

    expect(mockSyncSession).not.toHaveBeenCalled();

    // 2. SPA Transition into /account: AuthRouteSync mounts with AccountPage
    await act(async () => {
      rerender(
        <AuthProvider initialPathname="/us/en/products/performance-shoe">
          <AuthRouteSync>
            <AccountPage />
          </AuthRouteSync>
        </AuthProvider>,
      );
    });

    // Exactly one route-entry sync was triggered by AuthRouteSync
    expect(mockSyncSession).toHaveBeenCalledTimes(1);
  });

  it("PDP → protected account route: exactly one route-entry sync and no false login redirect", async () => {
    let resolveSync: (val: unknown) => void = () => {};
    mockSyncSession.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSync = resolve;
        }),
    );

    // 1. Initial render on catalog route (PDP)
    const { rerender } = render(
      <AuthProvider initialPathname="/us/en/products/performance-shoe">
        <div>PDP Content</div>
      </AuthProvider>,
    );

    expect(mockSyncSession).not.toHaveBeenCalled();

    // 2. SPA Transition into protected account route (/account/orders)
    await act(async () => {
      rerender(
        <AuthProvider initialPathname="/us/en/products/performance-shoe">
          <AuthRouteSync>
            <AuthenticatedAccountShell loginHref="/us/en/account?redirect=%2Fus%2Fen%2Faccount%2Forders">
              <div>Protected Orders Content</div>
            </AuthenticatedAccountShell>
          </AuthRouteSync>
        </AuthProvider>,
      );
    });

    // Sync is in-flight: exactly 1 call
    expect(mockSyncSession).toHaveBeenCalledTimes(1);
    // Crucial: Must NOT falsely redirect while sync is in progress!
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.queryByTestId("account-shell")).not.toBeInTheDocument();

    // 3. Sync completes with verified session
    await act(async () => {
      resolveSync({
        customer: mockCustomer,
        refreshed: false,
        stale: false,
      });
    });

    // User is verified, content rendered, no redirect
    await waitFor(() => {
      expect(screen.getByTestId("account-shell")).toBeInTheDocument();
    });
    expect(screen.getByText("Protected Orders Content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockSyncSession).toHaveBeenCalledTimes(1);
  });

  it("account focus after throttle: one resync", async () => {
    function DummyAccount() {
      const { loading, user } = useAuth();
      return (
        <div>
          Account Root - {loading ? "loading" : "idle"} - {user?.email ?? "none"}
        </div>
      );
    }

    render(
      <AuthProvider initialPathname="/us/en/account">
        <DummyAccount />
      </AuthProvider>,
    );

    // Initial sync completes and context becomes idle
    await waitFor(() => {
      expect(screen.getByText("Account Root - idle - shopper@example.com")).toBeInTheDocument();
    });
    expect(mockSyncSession).toHaveBeenCalledTimes(1);

    // Rapid event within throttle window (< 30s) -> 0 additional calls
    const now = Date.now();
    const spy5s = vi.spyOn(Date, "now").mockReturnValue(now + 5_000);
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    spy5s.mockRestore();

    expect(mockSyncSession).toHaveBeenCalledTimes(1);

    // Event past throttle window (> 30s) -> exactly 1 resync
    const spy35s = vi.spyOn(Date, "now").mockReturnValue(now + 35_000);
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    spy35s.mockRestore();

    await waitFor(() => {
      expect(mockSyncSession).toHaveBeenCalledTimes(2);
    });
  });
});
