import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQuery = vi.fn();

vi.mock("../index", () => ({
  query: (text: string, params?: unknown[]) => mockQuery(text, params),
}));

import {
  createAddress,
  deleteAddress,
  getAddress,
  listAddresses,
  updateAddress,
} from "../address";

describe("Database Address Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listAddresses", () => {
    it("requires userId and fails if empty", async () => {
      await expect(listAddresses("")).rejects.toThrow(
        "User ID is required to list addresses",
      );
    });

    it("queries public.addresses strictly bound to user_id in SQL", async () => {
      const mockRows = [
        {
          id: "addr-1",
          user_id: "user-A",
          first_name: "A",
          last_name: "Customer",
          address1: "123 Main St",
          city: "New York",
          state: "New York",
          state_abbr: "NY",
          postal_code: "10001",
          country_iso: "US",
          is_default_shipping: true,
          is_default_billing: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockRows });

      const res = await listAddresses("user-A");

      expect(res).toEqual(mockRows);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("WHERE user_id = $1");
      expect(sql).toContain("ORDER BY is_default_shipping DESC, is_default_billing DESC, created_at DESC");
      expect(params).toEqual(["user-A"]);
    });
  });

  describe("getAddress (IDOR Prevention)", () => {
    it("returns null if userId or addressId is missing", async () => {
      expect(await getAddress("", "addr-1")).toBeNull();
      expect(await getAddress("user-1", "")).toBeNull();
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("enforces WHERE id = $2 AND user_id = $1 in SQL", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await getAddress("user-B", "user-A-addr-uuid");

      expect(res).toBeNull();
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("WHERE id = $2 AND user_id = $1");
      expect(params).toEqual(["user-B", "user-A-addr-uuid"]);
    });

    it("returns address when owned by caller", async () => {
      const mockRow = {
        id: "addr-1",
        user_id: "user-A",
        first_name: "Alice",
        last_name: "Smith",
        address1: "100 Broadway",
        city: "New York",
        state: "New York",
        state_abbr: "NY",
        postal_code: "10002",
        country_iso: "US",
      };
      mockQuery.mockResolvedValueOnce({ rows: [mockRow] });

      const res = await getAddress("user-A", "addr-1");

      expect(res).toEqual(mockRow);
      expect(mockQuery.mock.calls[0][1]).toEqual(["user-A", "addr-1"]);
    });
  });

  describe("createAddress", () => {
    it("requires userId", async () => {
      await expect(
        createAddress("", {
          first_name: "Jane",
          last_name: "Doe",
          address1: "123 St",
          city: "Metropolis",
          state: "NY",
          postal_code: "12345",
          country_iso: "US",
        }),
      ).rejects.toThrow("User ID is required to create an address");
    });

    it("validates required fields", async () => {
      const valid = {
        first_name: "Jane",
        last_name: "Doe",
        address1: "123 St",
        city: "Metropolis",
        state: "NY",
        postal_code: "12345",
        country_iso: "US",
      };

      await expect(createAddress("user-1", { ...valid, first_name: "  " })).rejects.toThrow("First name is required");
      await expect(createAddress("user-1", { ...valid, last_name: "" })).rejects.toThrow("Last name is required");
      await expect(createAddress("user-1", { ...valid, address1: "" })).rejects.toThrow("Street address is required");
      await expect(createAddress("user-1", { ...valid, city: "" })).rejects.toThrow("City is required");
      await expect(createAddress("user-1", { ...valid, state: "" })).rejects.toThrow("State is required");
      await expect(createAddress("user-1", { ...valid, postal_code: "" })).rejects.toThrow("Postal code is required");
      await expect(createAddress("user-1", { ...valid, country_iso: "USA" })).rejects.toThrow("Valid 2-character country ISO code is required");
    });

    it("binds user_id from verified parameter, ignoring any caller user_id", async () => {
      const createdRow = {
        id: "addr-new",
        user_id: "user-A",
        first_name: "Alice",
        last_name: "Smith",
      };
      mockQuery.mockResolvedValueOnce({ rows: [createdRow] });

      const res = await createAddress("user-A", {
        first_name: " Alice ",
        last_name: " Smith ",
        company: " Acme ",
        address1: " 100 Main St ",
        address2: " Suite 200 ",
        city: " New York ",
        state: " New York ",
        state_abbr: " ny ",
        postal_code: " 10001 ",
        country_iso: " us ",
        phone: " 555-1234 ",
        is_default_shipping: true,
        is_default_billing: false,
        // @ts-expect-error - testing client attempted injection of user_id
        user_id: "user-MALICIOUS",
      });

      expect(res).toEqual(createdRow);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("INSERT INTO public.addresses");
      expect(params[0]).toBe("user-A"); // verified userId bound to $1
      expect(params[1]).toBe("Alice");
      expect(params[2]).toBe("Smith");
      expect(params[3]).toBe("Acme");
      expect(params[4]).toBe("100 Main St");
      expect(params[5]).toBe("Suite 200");
      expect(params[6]).toBe("New York");
      expect(params[7]).toBe("New York");
      expect(params[8]).toBe("NY"); // normalized uppercase
      expect(params[9]).toBe("10001");
      expect(params[10]).toBe("US"); // normalized uppercase
      expect(params[11]).toBe("555-1234");
      expect(params[12]).toBe(true);
      expect(params[13]).toBe(false);
    });
  });

  describe("updateAddress", () => {
    it("fails if userId or addressId is missing", async () => {
      await expect(updateAddress("", "addr-1", {})).rejects.toThrow("User ID and Address ID are required");
      await expect(updateAddress("user-1", "", {})).rejects.toThrow("User ID and Address ID are required");
    });

    it("enforces WHERE id = $1 AND user_id = $2 in SQL", async () => {
      const updatedRow = { id: "addr-1", user_id: "user-A", first_name: "Updated" };
      mockQuery.mockResolvedValueOnce({ rows: [updatedRow] });

      const res = await updateAddress("user-A", "addr-1", {
        first_name: "Updated",
      });

      expect(res).toEqual(updatedRow);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("WHERE id = $1 AND user_id = $2");
      expect(params[0]).toBe("addr-1");
      expect(params[1]).toBe("user-A");
    });

    it("throws error if row not found or owned by another user (0 rows updated)", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(
        updateAddress("user-B", "user-A-addr", { first_name: "Hacked" }),
      ).rejects.toThrow("Address not found or permission denied");

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("WHERE id = $1 AND user_id = $2");
      expect(params[0]).toBe("user-A-addr");
      expect(params[1]).toBe("user-B");
    });
  });

  describe("deleteAddress", () => {
    it("fails if userId or addressId is missing", async () => {
      await expect(deleteAddress("", "addr-1")).rejects.toThrow("User ID and Address ID are required");
      await expect(deleteAddress("user-1", "")).rejects.toThrow("User ID and Address ID are required");
    });

    it("enforces WHERE id = $2 AND user_id = $1 in SQL", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: "addr-1" }] });

      const res = await deleteAddress("user-A", "addr-1");

      expect(res).toBe(true);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("DELETE FROM public.addresses");
      expect(sql).toContain("WHERE id = $2 AND user_id = $1");
      expect(params).toEqual(["user-A", "addr-1"]);
    });

    it("throws error if row not found or foreign address (0 rows deleted)", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0, rows: [] });

      await expect(deleteAddress("user-B", "user-A-addr")).rejects.toThrow(
        "Address not found or permission denied",
      );

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("DELETE FROM public.addresses");
      expect(params).toEqual(["user-B", "user-A-addr"]);
    });
  });
});
