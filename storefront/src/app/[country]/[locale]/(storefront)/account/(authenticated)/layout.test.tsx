import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { REQUEST_PATHNAME_HEADER, REQUEST_SEARCH_HEADER } from "@/i18n/routing";
import type { AppUser } from "@/lib/data/customer";

const mocks = vi.hoisted(() => ({
  customer: null as AppUser | null,
  accessToken: undefined as string | undefined,
  refreshToken: undefined as string | undefined,
  headers: vi.fn(),
  redirect: vi.fn((location: string) => {
    throw new Error(`redirect:${location}`);
  }),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/data/customer", () => ({
  getCustomer: vi.fn(() => Promise.resolve(mocks.customer)),
}));
vi.mock("@/lib/spree", () => ({
  getAccessToken: () => Promise.resolve(mocks.accessToken),
  getRefreshToken: () => Promise.resolve(mocks.refreshToken),
}));
vi.mock("@/components/account/AuthenticatedAccountShell", () => ({
  AuthenticatedAccountShell: ({
    children,
    loginHref,
  }: {
    children: React.ReactNode;
    loginHref: string;
  }) => (
    <div data-testid="account-shell" data-login-href={loginHref}>
      {children}
    </div>
  ),
}));

import { AuthenticatedAccountLayoutContent } from "./layout";

function renderLayout() {
  return AuthenticatedAccountLayoutContent({
    children: <div>Protected account content</div>,
    params: Promise.resolve({ country: "us", locale: "en" }),
  });
}

describe("AuthenticatedAccountLayoutContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.customer = null;
    mocks.accessToken = undefined;
    mocks.refreshToken = undefined;
    mocks.headers.mockResolvedValue(
      new Headers({
        [REQUEST_PATHNAME_HEADER]: "/us/en/account/orders",
        [REQUEST_SEARCH_HEADER]: "?state=complete",
      }),
    );
  });

  it("redirects an anonymous request before rendering protected chrome", async () => {
    await expect(renderLayout()).rejects.toThrow(
      "redirect:/us/en/account?redirect=%2Fus%2Fen%2Faccount%2Forders%3Fstate%3Dcomplete",
    );
    expect(mocks.redirect).toHaveBeenCalledOnce();
  });

  it("redirects when legacy tokens exist but no verified Supabase customer is found", async () => {
    mocks.accessToken = "legacy-access-token";
    mocks.refreshToken = "legacy-refresh-token";
    mocks.customer = null;

    await expect(renderLayout()).rejects.toThrow(
      "redirect:/us/en/account?redirect=%2Fus%2Fen%2Faccount%2Forders%3Fstate%3Dcomplete",
    );
    expect(mocks.redirect).toHaveBeenCalledOnce();
  });

  it("renders the protected route when a verified Supabase customer is present", async () => {
    mocks.customer = {
      id: "user-123",
      email: "user@example.com",
      role: "customer",
    };

    render(await renderLayout());

    expect(screen.getByText("Protected account content")).toBeInTheDocument();
    expect(screen.getByTestId("account-shell")).toHaveAttribute(
      "data-login-href",
      "/us/en/account?redirect=%2Fus%2Fen%2Faccount%2Forders%3Fstate%3Dcomplete",
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

