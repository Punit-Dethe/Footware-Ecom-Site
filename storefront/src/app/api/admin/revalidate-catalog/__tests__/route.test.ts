import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

const mockCache = vi.hoisted(() => ({
  updateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: mockAuth.requireAdmin,
}));

vi.mock("next/cache", () => ({
  updateTag: mockCache.updateTag,
  revalidatePath: mockCache.revalidatePath,
}));

import { POST } from "../route";

describe("POST /api/admin/revalidate-catalog", () => {
  const originalSecret = process.env.SUPABASE_SECRET_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_SECRET_KEY = "test-secret-key";
  });

  afterAll(() => {
    process.env.SUPABASE_SECRET_KEY = originalSecret;
  });

  it("returns 401 when neither secret nor admin session is valid", async () => {
    mockAuth.requireAdmin.mockRejectedValue(new Error("Unauthorized"));

    const req = new Request("https://example.com/api/admin/revalidate-catalog", {
      method: "POST",
      headers: {
        "x-admin-secret": "wrong-secret",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
    expect(mockCache.updateTag).not.toHaveBeenCalled();
    expect(mockCache.revalidatePath).not.toHaveBeenCalled();
  });

  it("succeeds when valid x-admin-secret header is provided", async () => {
    const req = new Request("https://example.com/api/admin/revalidate-catalog", {
      method: "POST",
      headers: {
        "x-admin-secret": "test-secret-key",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.invalidated).toBe("catalog-public");
    expect(mockCache.updateTag).toHaveBeenCalledWith("catalog-public");
    expect(mockCache.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("succeeds when caller is authenticated as admin via session", async () => {
    mockAuth.requireAdmin.mockResolvedValue({ id: "admin-1", email: "admin@example.com" });

    const req = new Request("https://example.com/api/admin/revalidate-catalog", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockCache.updateTag).toHaveBeenCalledWith("catalog-public");
    expect(mockCache.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("returns 500 when cache invalidation fails", async () => {
    mockAuth.requireAdmin.mockResolvedValue({ id: "admin-1" });
    mockCache.updateTag.mockImplementation(() => {
      throw new Error("Cache backend connection failed");
    });

    const req = new Request("https://example.com/api/admin/revalidate-catalog", {
      method: "POST",
      headers: {
        "x-admin-secret": "test-secret-key",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Cache backend connection failed");
  });
});
