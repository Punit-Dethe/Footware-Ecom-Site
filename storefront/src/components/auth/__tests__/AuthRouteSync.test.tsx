import { act, render, screen } from "@testing-library/react";
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

import { AuthRouteSync, useRouteSync } from "../AuthRouteSync";

function TestConsumer() {
  const { isSyncing } = useRouteSync();
  return <div data-testid="sync-status">{isSyncing ? "syncing" : "idle"}</div>;
}

describe("AuthRouteSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = false;
  });

  it("invokes refreshUser on mount when unauthenticated to synchronize session from catalog navigation", async () => {
    mocks.isAuthenticated = false;

    let resolveRefresh: () => void = () => {};
    mocks.refreshUser.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    await act(async () => {
      render(
        <AuthRouteSync>
          <TestConsumer />
        </AuthRouteSync>,
      );
    });

    expect(mocks.refreshUser).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("sync-status")).toHaveTextContent("syncing");

    await act(async () => {
      resolveRefresh();
    });

    expect(screen.getByTestId("sync-status")).toHaveTextContent("idle");
  });

  it("does not invoke refreshUser when already authenticated", async () => {
    mocks.isAuthenticated = true;

    await act(async () => {
      render(
        <AuthRouteSync>
          <TestConsumer />
        </AuthRouteSync>,
      );
    });

    expect(mocks.refreshUser).not.toHaveBeenCalled();
    expect(screen.getByTestId("sync-status")).toHaveTextContent("idle");
  });
});
