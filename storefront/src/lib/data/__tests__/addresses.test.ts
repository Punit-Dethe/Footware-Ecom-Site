import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookies = {
  getAll: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookies),
}));

const mockSupabase = {
  auth: {
    getClaims: vi.fn(),
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

const mockDbListAddresses = vi.fn();
const mockDbGetAddress = vi.fn();
const mockDbCreateAddress = vi.fn();
const mockDbUpdateAddress = vi.fn();
const mockDbDeleteAddress = vi.fn();

vi.mock("@/lib/db/address", () => ({
  listAddresses: (userId: string) => mockDbListAddresses(userId),
  getAddress: (userId: string, id: string) => mockDbGetAddress(userId, id),
  createAddress: (userId: string, input: unknown) =>
    mockDbCreateAddress(userId, input),
  updateAddress: (userId: string, id: string, input: unknown) =>
    mockDbUpdateAddress(userId, id, input),
  deleteAddress: (userId: string, id: string) =>
    mockDbDeleteAddress(userId, id),
}));

import { adaptDbAddressToSpree } from "../address-adapter";
import {
  createAddress,
  deleteAddress,
  getAddress,
  getAddresses,
  updateAddress,
} from "../addresses";

describe("Addresses Data Access Layer (B4)", () => {
  const sampleDbRow = {
    id: "addr-123",
    user_id: "user-A",
    first_name: "Alice",
    last_name: "Smith",
    company: "Acme Corp",
    address1: "100 Broadway",
    address2: "Floor 4",
    city: "New York",
    state: "New York",
    state_abbr: "NY",
    postal_code: "10001",
    country_iso: "US",
    phone: "+1-555-0199",
    is_default_shipping: true,
    is_default_billing: false,
    created_at: new Date("2026-01-01T00:00:00Z"),
    updated_at: new Date("2026-01-02T00:00:00Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies.getAll.mockReturnValue([
      { name: "sb-cleanproject-auth-token", value: "valid-session" },
    ]);
  });

  describe("Compatibility Adapter (adaptDbAddressToSpree)", () => {
    it("adapts DB row into Spree SDK Address contract with derived fields", () => {
      const adapted = adaptDbAddressToSpree(sampleDbRow);

      expect(adapted.id).toBe("addr-123");
      expect(adapted.first_name).toBe("Alice");
      expect(adapted.last_name).toBe("Smith");
      expect(adapted.full_name).toBe("Alice Smith");
      expect(adapted.company).toBe("Acme Corp");
      expect(adapted.address1).toBe("100 Broadway");
      expect(adapted.address2).toBe("Floor 4");
      expect(adapted.city).toBe("New York");
      expect(adapted.postal_code).toBe("10001");
      expect(adapted.country_iso).toBe("US");
      expect(adapted.country_name).toBe("United States");
      expect(adapted.state_name).toBe("New York");
      expect(adapted.state_abbr).toBe("NY");
      expect(adapted.state_text).toBe("NY");
      expect(adapted.is_default_shipping).toBe(true);
      expect(adapted.is_default_billing).toBe(false);
    });

    it("derives country_name for arbitrary countries via Intl.DisplayNames", () => {
      const ukRow = {
        ...sampleDbRow,
        country_iso: "GB",
        state: "London",
        state_abbr: null,
      };
      const adapted = adaptDbAddressToSpree(ukRow);
      expect(adapted.country_iso).toBe("GB");
      expect(adapted.country_name).toBe("United Kingdom");
      expect(adapted.state_text).toBe("London");
    });
  });

  describe("getAddresses", () => {
    it("fast-paths anonymous visitor (no auth cookie) to { data: [] } without calling Supabase", async () => {
      mockCookies.getAll.mockReturnValue([]);

      const result = await getAddresses();

      expect(result).toEqual({ data: [] });
      expect(mockSupabase.auth.getClaims).not.toHaveBeenCalled();
      expect(mockDbListAddresses).not.toHaveBeenCalled();
    });

    it("returns only authenticated user's addresses", async () => {
      mockSupabase.auth.getClaims.mockResolvedValueOnce({
        data: { claims: { sub: "user-A" } },
        error: null,
      });
      mockDbListAddresses.mockResolvedValueOnce([sampleDbRow]);

      const result = await getAddresses();

      expect(mockDbListAddresses).toHaveBeenCalledWith("user-A");
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("addr-123");
      expect(result.data[0].full_name).toBe("Alice Smith");
    });

    it("fails closed on Supabase auth 500+ infrastructure outage", async () => {
      mockSupabase.auth.getClaims.mockResolvedValueOnce({
        data: null,
        error: { status: 503, message: "Service Unavailable" },
      });

      const result = await getAddresses();
      // withFallback catches and returns fallback { data: [] }, but ensures error logged
      expect(result).toEqual({ data: [] });
      expect(mockDbListAddresses).not.toHaveBeenCalled();
    });
  });

  describe("getAddress (IDOR Isolation)", () => {
    it("returns null for anonymous caller", async () => {
      mockCookies.getAll.mockReturnValue([]);

      const result = await getAddress("addr-123");
      expect(result).toBeNull();
      expect(mockDbGetAddress).not.toHaveBeenCalled();
    });

    it("passes when User A queries their own address", async () => {
      mockSupabase.auth.getClaims.mockResolvedValueOnce({
        data: { claims: { sub: "user-A" } },
        error: null,
      });
      mockDbGetAddress.mockResolvedValueOnce(sampleDbRow);

      const result = await getAddress("addr-123");

      expect(mockDbGetAddress).toHaveBeenCalledWith("user-A", "addr-123");
      expect(result?.id).toBe("addr-123");
    });

    it("denies access (returns null) when User B queries User A's address UUID", async () => {
      mockSupabase.auth.getClaims.mockResolvedValueOnce({
        data: { claims: { sub: "user-B" } },
        error: null,
      });
      // DB query enforces WHERE id = $2 AND user_id = $1 -> returns null
      mockDbGetAddress.mockResolvedValueOnce(null);

      const result = await getAddress("addr-123");

      expect(mockDbGetAddress).toHaveBeenCalledWith("user-B", "addr-123");
      expect(result).toBeNull();
    });
  });

  describe("createAddress", () => {
    it("denies anonymous address creation", async () => {
      mockCookies.getAll.mockReturnValue([]);

      const result = await createAddress({
        first_name: "John",
        last_name: "Doe",
        address1: "123 Main St",
        city: "Austin",
        state_abbr: "TX",
        postal_code: "78701",
        country_iso: "US",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
      expect(mockDbCreateAddress).not.toHaveBeenCalled();
    });

    it("binds verified user ID and maps state cleanly", async () => {
      mockSupabase.auth.getClaims.mockResolvedValueOnce({
        data: { claims: { sub: "user-A" } },
        error: null,
      });
      mockDbCreateAddress.mockResolvedValueOnce(sampleDbRow);

      const result = await createAddress({
        first_name: "Alice",
        last_name: "Smith",
        address1: "100 Broadway",
        city: "New York",
        state_name: "New York",
        state_abbr: "NY",
        postal_code: "10001",
        country_iso: "US",
      });

      expect(result.success).toBe(true);
      expect(mockDbCreateAddress).toHaveBeenCalledWith("user-A", {
        first_name: "Alice",
        last_name: "Smith",
        company: undefined,
        address1: "100 Broadway",
        address2: undefined,
        city: "New York",
        state: "New York",
        state_abbr: "NY",
        postal_code: "10001",
        country_iso: "US",
        phone: undefined,
        is_default_shipping: undefined,
        is_default_billing: undefined,
      });
    });
  });

  describe("updateAddress", () => {
    it("denies anonymous address update", async () => {
      mockCookies.getAll.mockReturnValue([]);

      const result = await updateAddress("addr-123", {
        first_name: "Hacker",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
      expect(mockDbUpdateAddress).not.toHaveBeenCalled();
    });

    it("denies User B attempting to update User A's address", async () => {
      mockSupabase.auth.getClaims.mockResolvedValueOnce({
        data: { claims: { sub: "user-B" } },
        error: null,
      });
      mockDbUpdateAddress.mockRejectedValueOnce(
        new Error("Address not found or permission denied"),
      );

      const result = await updateAddress("addr-123", {
        first_name: "Hacked",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Address not found or permission denied");
      }
      expect(mockDbUpdateAddress).toHaveBeenCalledWith(
        "user-B",
        "addr-123",
        expect.anything(),
      );
    });

    it("allows User A to update their own address", async () => {
      mockSupabase.auth.getClaims.mockResolvedValueOnce({
        data: { claims: { sub: "user-A" } },
        error: null,
      });
      mockDbUpdateAddress.mockResolvedValueOnce({
        ...sampleDbRow,
        first_name: "Alicia",
      });

      const result = await updateAddress("addr-123", {
        first_name: "Alicia",
      });

      expect(result.success).toBe(true);
      if (result.success && result.address) {
        expect(result.address.first_name).toBe("Alicia");
        expect(result.address.full_name).toBe("Alicia Smith");
      }
    });
  });

  describe("deleteAddress", () => {
    it("denies anonymous address deletion", async () => {
      mockCookies.getAll.mockReturnValue([]);

      const result = await deleteAddress("addr-123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
      expect(mockDbDeleteAddress).not.toHaveBeenCalled();
    });

    it("denies User B attempting to delete User A's address", async () => {
      mockSupabase.auth.getClaims.mockResolvedValueOnce({
        data: { claims: { sub: "user-B" } },
        error: null,
      });
      mockDbDeleteAddress.mockRejectedValueOnce(
        new Error("Address not found or permission denied"),
      );

      const result = await deleteAddress("addr-123");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Address not found or permission denied");
      }
    });

    it("allows User A to delete their own address", async () => {
      mockSupabase.auth.getClaims.mockResolvedValueOnce({
        data: { claims: { sub: "user-A" } },
        error: null,
      });
      mockDbDeleteAddress.mockResolvedValueOnce(true);

      const result = await deleteAddress("addr-123");

      expect(result.success).toBe(true);
      expect(mockDbDeleteAddress).toHaveBeenCalledWith("user-A", "addr-123");
    });
  });
});
