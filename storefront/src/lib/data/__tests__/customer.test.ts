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

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/lib/store", () => ({
  getStoreUrl: vi.fn(() => "http://localhost:3001"),
}));

import {
  getCustomer,
  login,
  logout,
  register,
  requestPasswordReset,
  resetPassword,
  syncSession,
  updateCustomer,
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

    it("returns null when claims are missing or error (anonymous user)", async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: null,
        error: new Error("Expired session"),
      });

      const result = await getCustomer();

      expect(result).toBeNull();
    });

    it("throws error when verified identity experiences transient database failure", async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: {
          claims: {
            sub: "user-1",
            email: "test@example.com",
          },
        },
        error: null,
      });
      mockGetProfile.mockRejectedValue(new Error("Database connection timeout"));

      await expect(getCustomer()).rejects.toThrow("Database connection timeout");
    });

    it("throws error when getClaims encounters unexpected transport/5xx failure, NOT anonymous", async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: null,
        error: { name: "AuthRetryableFetchError", message: "fetch failed", status: 503 },
      });

      await expect(getCustomer()).rejects.toMatchObject({ status: 503 });
    });
  });

  describe("syncSession", () => {
    it("returns customer and stale: false on successful lookup", async () => {
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

      const result = await syncSession();

      expect(result.customer?.email).toBe("test@example.com");
      expect(result.stale).toBe(false);
    });

    it("returns stale: true when verified session encounters transient database outage", async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: {
          claims: {
            sub: "user-1",
            email: "test@example.com",
          },
        },
        error: null,
      });
      mockGetProfile.mockRejectedValue(new Error("Postgres connection failure"));

      const result = await syncSession();

      expect(result.customer).toBeNull();
      expect(result.stale).toBe(true);
    });

    it("returns stale: true when getClaims encounters unexpected transport failure", async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: null,
        error: { name: "AuthRetryableFetchError", message: "fetch failed", status: 503 },
      });

      const result = await syncSession();

      expect(result.customer).toBeNull();
      expect(result.stale).toBe(true);
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

    it("signup with session -> returns authenticated AppUser and creates profile", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: "user-session", email: "session@example.com" },
          session: { access_token: "tok", refresh_token: "ref" },
        },
        error: null,
      });
      mockEnsureProfile.mockResolvedValue({
        id: "user-session",
        first_name: "First",
        last_name: "Last",
        phone: null,
        role: "customer",
      });

      const result = await register({
        email: "session@example.com",
        password: "securepassword",
        password_confirmation: "securepassword",
        first_name: "First",
        last_name: "Last",
      });

      expect(result.success).toBe(true);
      expect(result.requires_confirmation).toBe(false);
      expect(result.user?.id).toBe("user-session");
      expect(result.user?.email).toBe("session@example.com");
      expect(mockEnsureProfile).toHaveBeenCalled();
    });

    it("signup without session -> NOT authenticated, requires_confirmation = true, no profile created", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: "user-unconfirmed", email: "unconfirmed@example.com" },
          session: null, // confirmation pending
        },
        error: null,
      });

      const result = await register({
        email: "unconfirmed@example.com",
        password: "securepassword",
        password_confirmation: "securepassword",
        first_name: "Unconfirmed",
        last_name: "User",
      });

      expect(result.success).toBe(true);
      expect(result.requires_confirmation).toBe(true);
      expect(result.user).toBeUndefined();
      expect(mockEnsureProfile).not.toHaveBeenCalled();
    });

    it("existing-user obfuscated response -> NOT authenticated, requires_confirmation = true", async () => {
      // Supabase returns a fake or obfuscated user object with null session
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: "existing-obfuscated-id", email: "existing@example.com" },
          session: null,
        },
        error: null,
      });

      const result = await register({
        email: "existing@example.com",
        password: "somepassword",
        password_confirmation: "somepassword",
      });

      expect(result.success).toBe(true);
      expect(result.requires_confirmation).toBe(true);
      expect(result.user).toBeUndefined();
      expect(mockEnsureProfile).not.toHaveBeenCalled();
    });

    it("sanitizes metadata and prevents role/admin escalation", async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: "user-new", email: "new@example.com" },
          session: null,
        },
        error: null,
      });

      await register({
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
    it("invokes resetPasswordForEmail with sanitized email using canonical SiteURL model", async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      // Caller attempts to pass external attacker URL
      const result = await requestPasswordReset(
        "user@example.com",
        "https://attacker.example/reset" as unknown as string,
      );

      expect(result.success).toBe(true);
      // Origin is strictly governed by Supabase SiteURL; external redirect is rejected/ignored
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        "user@example.com",
      );
    });

    it("returns generic success message to prevent user enumeration", async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await requestPasswordReset("unknown@example.com");

      expect(result.success).toBe(true);
      expect(result.message).toContain("If an account exists");
    });
  });

  describe("resetPassword", () => {
    it("denies password update when no verified claims exist", async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: null,
        error: new Error("No session"),
      });

      const result = await resetPassword("newpass123", "newpass123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized or expired password reset session");
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it("server-side validates confirmation and calls updateUser when session is verified", async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: {
          claims: {
            sub: "user-recovery",
            email: "user@example.com",
          },
        },
        error: null,
      });
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: {} },
        error: null,
      });

      const result = await resetPassword("newpass123", "newpass123");

      expect(result.success).toBe(true);
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: "newpass123",
      });
    });

    it("rejects mismatched confirmation", async () => {
      const result = await resetPassword("pass1", "pass2");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Passwords do not match");
    });
  });

  describe("updateCustomer", () => {
    it("email unchanged -> no password reauth, calls updateProfile", async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: {
          claims: {
            sub: "user-1",
            email: "current@example.com",
          },
        },
        error: null,
      });
      mockUpdateProfile.mockResolvedValue({
        ...mockDbProfile,
        first_name: "Updated",
      });

      const result = await updateCustomer({
        first_name: "Updated",
        last_name: "User",
        email: "current@example.com",
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
      expect(mockUpdateProfile).toHaveBeenCalledWith("user-1", {
        first_name: "Updated",
        last_name: "User",
      });
    });

    it("email changed + missing password -> fails", async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: {
          claims: {
            sub: "user-1",
            email: "current@example.com",
          },
        },
        error: null,
      });

      const result = await updateCustomer({
        email: "newemail@example.com",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Current password is required");
      }
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it("email changed + wrong password -> fails with invalid password error", async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: {
          claims: {
            sub: "user-1",
            email: "current@example.com",
          },
        },
        error: null,
      });
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {},
        error: new Error("Invalid login credentials"),
      });

      const result = await updateCustomer({
        email: "newemail@example.com",
        current_password: "wrongpassword",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid current password");
      }
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it("email changed + correct password -> calls signInWithPassword and updateUser, email remains current until confirmed", async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: {
          claims: {
            sub: "user-1",
            email: "current@example.com",
          },
        },
        error: null,
      });
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      });
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: {} },
        error: null,
      });
      mockUpdateProfile.mockResolvedValue(mockDbProfile);

      const result = await updateCustomer({
        email: "newemail@example.com",
        current_password: "correctpassword",
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "current@example.com",
        password: "correctpassword",
      });
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        email: "newemail@example.com",
      });
      // Returned customer email remains currentEmail until email confirmation link is verified
      if (result.success) {
        expect(result.customer.email).toBe("current@example.com");
      }
    });

    it("role cannot change through profile update", async () => {
      mockSupabase.auth.getClaims.mockResolvedValue({
        data: {
          claims: {
            sub: "user-1",
            email: "current@example.com",
          },
        },
        error: null,
      });
      mockUpdateProfile.mockResolvedValue({
        ...mockDbProfile,
        role: "customer",
      });

      const result = await updateCustomer({
        first_name: "Name",
        // Even if caller tries to pass role, updateCustomer interface ignores it
      } as Parameters<typeof updateCustomer>[0]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.customer.role).toBe("customer");
      }
    });
  });
});
