import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getClaims: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

const mockEnsureProfile = vi.fn();
const mockGetProfile = vi.fn();
const mockUpdateProfile = vi.fn();

vi.mock("@/lib/db/profile", () => ({
  ensureProfile: (user: unknown) => mockEnsureProfile(user),
  getProfile: (id: string) => mockGetProfile(id),
  updateProfile: (id: string, data: unknown) => mockUpdateProfile(id, data),
}));

vi.mock("@/lib/spree", () => ({
  clearAuthCookies: vi.fn(),
  clearAllCartCookies: vi.fn(),
  cacheTagSuffix: (surface: string) =>
    surface === "wholesale" ? "-wholesale" : "",
  SURFACES: ["dtc", "wholesale"] as const,
}));

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
}));

import {
  getCustomer,
  login,
  logout,
  register,
  requestPasswordReset,
  resetPassword,
} from "@/lib/data/customer";

const mockDbProfile = {
  id: "user-1",
  first_name: "Test",
  last_name: "User",
  phone: "555-1234",
  role: "customer" as const,
};

describe("customer server actions (Supabase Auth)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCustomer", () => {
    it("fetches current user via Supabase getClaims and PostgreSQL profiles", async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: {
          claims: {
            sub: "user-1",
            email: "test@example.com",
          },
        },
        error: null,
      });
      mockGetProfile.mockResolvedValue(mockDbProfile);

      const result = await getCustomer();

      expect(mockSupabase.auth.getClaims).toHaveBeenCalledTimes(1);
      expect(mockGetProfile).toHaveBeenCalledWith("user-1");
      expect(result).toEqual({
        id: "user-1",
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        phone: "555-1234",
        role: "customer",
      });
    });

    it("idempotently heals missing profile record for genuine verified user", async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: {
          claims: {
            sub: "user-2",
            email: "healed@example.com",
            user_metadata: { first_name: "Healed", last_name: "Guy" },
          },
        },
        error: null,
      });
      mockGetProfile.mockResolvedValue(null);
      mockEnsureProfile.mockResolvedValue({
        id: "user-2",
        first_name: "Healed",
        last_name: "Guy",
        phone: null,
        role: "customer",
      });

      const result = await getCustomer();

      expect(mockEnsureProfile).toHaveBeenCalledWith({
        id: "user-2",
        first_name: "Healed",
        last_name: "Guy",
        phone: null,
      });
      expect(result?.role).toBe("customer");
    });

    it("returns null when claims are missing or error", async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: null,
        error: new Error("Expired session"),
      });

      const result = await getCustomer();

      expect(result).toBeNull();
    });
  });

  describe("login", () => {
    it("logs in with email and password via Supabase and ensures profile", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: "user-1",
            email: "test@example.com",
            user_metadata: { first_name: "Test", last_name: "User" },
          },
        },
        error: null,
      });
      mockEnsureProfile.mockResolvedValue(mockDbProfile);

      const result = await login("test@example.com", "secret123");

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "secret123",
      });
      expect(mockEnsureProfile).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.user?.email).toBe("test@example.com");
      expect(result.user?.role).toBe("customer");
    });

    it("returns generic error on failed login to prevent credential disclosure", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: new Error("Invalid login credentials"),
      });

      const result = await login("test@example.com", "wrong-password");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid email or password");
    });
  });

  describe("register", () => {
    it("rejects mismatched password confirmation server-side", async () => {
      const result = await register({
        email: "new@example.com",
        password: "password123",
        password_confirmation: "different123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Passwords do not match");
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it("rejects password shorter than 6 characters server-side", async () => {
      const result = await register({
        email: "new@example.com",
        password: "123",
        password_confirmation: "123",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Password must be at least 6 characters");
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
    });

    it("sanitizes metadata and prevents role/admin escalation", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: "user-new", email: "new@example.com" },
          session: null, // email confirmation pending
        },
        error: null,
      });

      const result = await register({
        email: "new@example.com",
        password: "securepassword",
        password_confirmation: "securepassword",
        first_name: "Shopper",
        last_name: "One",
        metadata: {
          company: "Mirza Ltd",
          role: "admin", // Attacker attempt to escalate
          is_admin: true,
          wholesale_approved: true,
        },
      });

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "securepassword",
        options: {
          data: {
            first_name: "Shopper",
            last_name: "One",
            company: "Mirza Ltd",
            // Notice: role, is_admin, wholesale_approved are stripped!
          },
        },
      });

      expect(result.success).toBe(true);
      expect(result.user?.role).toBe("customer");
      // Since session was not returned, profile is not pre-created
      expect(mockEnsureProfile).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("signs out via Supabase and clears legacy auth cookies defensively", async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      await logout();

      expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
    });
  });

  describe("requestPasswordReset", () => {
    it("returns generic success message to prevent user enumeration", async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await requestPasswordReset("unknown@example.com");

      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        "unknown@example.com",
        { redirectTo: undefined },
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain("If an account exists");
    });
  });

  describe("resetPassword", () => {
    it("server-side validates confirmation and calls updateUser", async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: {} },
        error: null,
      });

      const result = await resetPassword(
        "",
        "newpass123",
        "newpass123",
      );

      expect(result.success).toBe(true);
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: "newpass123",
      });
    });

    it("rejects mismatched confirmation", async () => {
      const result = await resetPassword("", "pass1", "pass2");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Passwords do not match");
    });
  });
});
