import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSupabase = vi.hoisted(() => ({
  auth: {
    getClaims: vi.fn(),
  },
}));

const mockProfileDb = vi.hoisted(() => ({
  getProfile: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

vi.mock("@/lib/db/profile", () => ({
  getProfile: mockProfileDb.getProfile,
}));

import { AdminAuthError, getAdminIdentity, requireAdmin } from "../admin";

describe("Server-Side Admin Authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies access to anonymous users (no token / claims)", async () => {
    mockSupabase.auth.getClaims.mockResolvedValue({
      data: { claims: null },
      error: null,
    });

    const identity = await getAdminIdentity();
    expect(identity).toBeNull();
    expect(mockProfileDb.getProfile).not.toHaveBeenCalled();

    await expect(requireAdmin()).rejects.toThrow(AdminAuthError);
  });

  it("denies access when session is expired or invalid without throwing", async () => {
    mockSupabase.auth.getClaims.mockResolvedValue({
      data: null,
      error: { message: "JWT expired", status: 401 },
    });

    const identity = await getAdminIdentity();
    expect(identity).toBeNull();
    expect(mockProfileDb.getProfile).not.toHaveBeenCalled();

    await expect(requireAdmin()).rejects.toThrow("Admin authorization required.");
  });

  it("denies access to authenticated customer users (role = 'customer')", async () => {
    const userId = "c1111111-1111-1111-1111-111111111111";
    mockSupabase.auth.getClaims.mockResolvedValue({
      data: {
        claims: { sub: userId, email: "customer@example.com" },
      },
      error: null,
    });

    mockProfileDb.getProfile.mockResolvedValue({
      id: userId,
      role: "customer",
      first_name: "Customer",
      last_name: "User",
      phone: null,
    });

    const identity = await getAdminIdentity();
    expect(identity).toBeNull();
    expect(mockProfileDb.getProfile).toHaveBeenCalledWith(userId);

    await expect(requireAdmin()).rejects.toThrow(AdminAuthError);
  });

  it("authorizes verified administrator (role = 'admin')", async () => {
    const adminId = "a2222222-2222-2222-2222-222222222222";
    mockSupabase.auth.getClaims.mockResolvedValue({
      data: {
        claims: { sub: adminId, email: "admin@mirzafootwear.com" },
      },
      error: null,
    });

    mockProfileDb.getProfile.mockResolvedValue({
      id: adminId,
      role: "admin",
      first_name: "Mirza",
      last_name: "Admin",
      phone: null,
    });

    const identity = await getAdminIdentity();
    expect(identity).not.toBeNull();
    expect(identity?.userId).toBe(adminId);
    expect(identity?.email).toBe("admin@mirzafootwear.com");
    expect(identity?.profile.role).toBe("admin");

    const required = await requireAdmin();
    expect(required.userId).toBe(adminId);
  });

  it("fails closed (throws) on Supabase Auth infrastructure outage", async () => {
    mockSupabase.auth.getClaims.mockResolvedValue({
      data: null,
      error: { message: "Internal server error", status: 503 },
    });

    await expect(getAdminIdentity()).rejects.toThrow(
      "Auth service infrastructure outage: Internal server error",
    );
  });

  it("fails closed (throws) on network/fetch exception from auth service", async () => {
    mockSupabase.auth.getClaims.mockResolvedValue({
      data: null,
      error: { message: "fetch failed: ECONNREFUSED", status: undefined },
    });

    await expect(getAdminIdentity()).rejects.toThrow(
      "Auth service infrastructure outage",
    );
  });

  it("fails closed (throws) on database outage during profile lookup", async () => {
    const adminId = "a2222222-2222-2222-2222-222222222222";
    mockSupabase.auth.getClaims.mockResolvedValue({
      data: {
        claims: { sub: adminId, email: "admin@mirzafootwear.com" },
      },
      error: null,
    });

    mockProfileDb.getProfile.mockRejectedValue(
      new Error("PostgreSQL pool connection timeout"),
    );

    await expect(getAdminIdentity()).rejects.toThrow(
      "PostgreSQL pool connection timeout",
    );
  });
});
