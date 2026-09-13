import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

import { cachedGetPolicy } from "@/lib/data/policies";

describe("cachedGetPolicy (first-party)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns policy content for existing shipping-policy", async () => {
    const policy = await cachedGetPolicy("shipping-policy");
    expect(policy).not.toBeNull();
    expect(policy?.slug).toBe("shipping-policy");
    expect(policy?.name).toBe("Shipping Policy");
    expect(policy?.body).toContain("express delivery");
  });

  it("returns policy content for existing return-policy", async () => {
    const policy = await cachedGetPolicy("return-policy");
    expect(policy).not.toBeNull();
    expect(policy?.slug).toBe("return-policy");
    expect(policy?.name).toBe("Return & Exchange Policy");
    expect(policy?.body).toContain("30-day doorstep trial");
  });

  it("returns null for non-existent policy slug without throwing", async () => {
    const policy = await cachedGetPolicy("missing-policy-slug");
    expect(policy).toBeNull();
  });
});
