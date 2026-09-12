import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAuthenticated: false,
  refreshUser: vi.fn(async () => {}),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: mocks.isAuthenticated,
    refreshUser: mocks.refreshUser,
  }),
}));

import { AuthRouteSync } from "../AuthRouteSync";

describe("AuthRouteSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = false;
  });

  it("invokes refreshUser on mount when unauthenticated to synchronize session from catalog navigation", () => {
    mocks.isAuthenticated = false;

    render(<AuthRouteSync />);

    expect(mocks.refreshUser).toHaveBeenCalledTimes(1);
  });

  it("does not invoke refreshUser when already authenticated", () => {
    mocks.isAuthenticated = true;

    render(<AuthRouteSync />);

    expect(mocks.refreshUser).not.toHaveBeenCalled();
  });
});
