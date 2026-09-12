import { describe, expect, it } from "vitest";
import { GET } from "../route";

describe("Root /admin Route Handler", () => {
  it("redirects internally to localized admin without external Render/Spree redirect", async () => {
    const req = new Request("https://storefront.example/admin");
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toBe("https://storefront.example/us/en/admin");
    expect(location).not.toContain("onrender.com");
    expect(location).not.toContain("mirza-spree-backend");
  });
});
