import { createElement } from "react";
import { render } from "react-email";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DbOrder, DbOrderItem } from "@/lib/db/order";
import {
  OrderConfirmationEmail,
  resolveEmailAssetUrl,
  FONT_STACK_DISPLAY,
  FONT_STACK_EDITORIAL,
  FONT_STACK_SANS,
} from "../order-confirmation";
import {
  buildOrderConfirmationEmailProps,
  scheduleOrderConfirmationEmail,
  sendOrderConfirmationEmailSafe,
} from "../order-confirmation-flow";
import { sendEmail } from "../send";

// Mock resend
const mockResendSend = vi.fn();
vi.mock("resend", () => {
  return {
    Resend: class {
      emails = {
        send: mockResendSend,
      };
    },
  };
});

// Mock next/server after
const mockAfter = vi.fn();
vi.mock("next/server", () => ({
  after: (cb: () => Promise<void>) => mockAfter(cb),
}));

describe("Order Confirmation Email Suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const sampleOrder: DbOrder = {
    id: "ord-11111111-2222-3333-4444-555555555555",
    order_number: "MRZ-TEST-998877",
    user_id: "usr-123",
    email: "customer.real@domain.com",
    status: "placed",
    currency: "USD",
    subtotal_in_cents: 38500,
    shipping_in_cents: 0,
    tax_in_cents: 3080,
    total_in_cents: 41580,
    shipping_address_snapshot: {
      first_name: "Alexander",
      last_name: "Hamilton",
      address1: "57 Maiden Lane",
      city: "New York",
      state_abbr: "NY",
      postal_code: "10038",
      country_name: "United States",
      phone: "+1 212 555 0100",
    },
    billing_address_snapshot: {
      first_name: "Alexander",
      last_name: "Hamilton",
      address1: "57 Maiden Lane",
      city: "New York",
      state_abbr: "NY",
      postal_code: "10038",
      country_name: "United States",
    },
    source_cart_id: "cart-999",
    surface: "dtc",
    completed_at: new Date("2026-09-18T10:30:00Z"),
    created_at: new Date("2026-09-18T10:30:00Z"),
    updated_at: new Date("2026-09-18T10:30:00Z"),
  };

  const sampleItems: DbOrderItem[] = [
    {
      id: "item-1",
      order_id: sampleOrder.id,
      variant_id: "var-1",
      product_name: "The Sovereign Oxford",
      sku: "MIRZA-OFF-01",
      size_option: "42 EU / 9 US",
      price_in_cents: 38500,
      quantity: 1,
      total_in_cents: 38500,
      thumbnail_url: "https://example.com/shoe.webp",
      created_at: new Date("2026-09-18T10:30:00Z"),
    },
  ];

  describe("1. Template Rendering (HTML & Plain Text)", () => {
    it("renders rich editorial HTML matching Mirza branding", async () => {
      const props = buildOrderConfirmationEmailProps({
        order: sampleOrder,
        items: sampleItems,
      });

      const element = createElement(OrderConfirmationEmail, props);
      const html = await render(element);

      // Editorial brand identity
      expect(html).toContain("MIRZA");
      expect(html).toContain("FOOTWEAR");
      expect(html).toContain("ORDER CONFIRMATION");
      expect(html).toContain("Order Confirmed");

      // Customer and order details
      expect(html).toContain("Alexander");
      expect(html).toContain("MRZ-TEST-998877");
      expect(html).toContain("The Sovereign Oxford");
      expect(html).toContain("Size: 42 EU / 9 US");
      expect(html).toContain("$385.00");
      expect(html).toContain("Complimentary");
      expect(html).toContain("$30.80");
      expect(html).toContain("$415.80");

      // Delivery details
      expect(html).toContain("57 Maiden Lane");
      expect(html).toContain("New York");
      expect(html).toContain("10038");

      // Warm cream editorial background color
      expect(html).toContain("#f3efe8");
    });

    it("renders clean plain-text version without HTML tags", async () => {
      const props = buildOrderConfirmationEmailProps({
        order: sampleOrder,
        items: sampleItems,
      });

      const element = createElement(OrderConfirmationEmail, props);
      const plainText = await render(element, { plainText: true });

      expect(plainText).toContain("MIRZA");
      expect(plainText.toUpperCase()).toContain("ORDER CONFIRMED");
      expect(plainText).toContain("MRZ-TEST-998877");
      expect(plainText).toContain("The Sovereign Oxford");
      expect(plainText).toContain("$415.80");
      expect(plainText).not.toContain("<html");
      expect(plainText).not.toContain("</div>");
    });

    it("falls back gracefully when customer name is absent", async () => {
      const anonymousOrder = {
        ...sampleOrder,
        shipping_address_snapshot: {},
        email: "guest.buyer@domain.com",
      };

      const props = buildOrderConfirmationEmailProps({
        order: anonymousOrder,
        items: sampleItems,
      });

      const element = createElement(OrderConfirmationEmail, {
        ...props,
        customerName: "",
      });
      const html = await render(element);

      expect(html).toContain("Dear there");
    });
  });

  describe("2. Order Data Mapping", () => {
    it("maps all DbOrder and DbOrderItem fields accurately", () => {
      const props = buildOrderConfirmationEmailProps({
        order: sampleOrder,
        items: sampleItems,
      });

      expect(props.orderNumber).toBe("MRZ-TEST-998877");
      expect(props.customerName).toBe("Alexander Hamilton");
      expect(props.items).toHaveLength(1);
      expect(props.items[0]).toEqual({
        name: "The Sovereign Oxford",
        slug: "office-footwear-01",
        quantity: 1,
        options_text: "Size: 42 EU / 9 US",
        display_price: "$385.00",
        display_total: "$385.00",
        thumbnail_url: "https://example.com/shoe.webp",
      });
      expect(props.displayItemTotal).toBe("$385.00");
      expect(props.displayDeliveryTotal).toBe("Complimentary");
      expect(props.displayTaxTotal).toBe("$30.80");
      expect(props.displayTotal).toBe("$415.80");
      expect(props.shippingAddress?.city).toBe("New York");
    });
  });

  describe("3. Test Recipient Redirection & Testing Mode", () => {
    it("redirects delivery to EMAIL_TEST_RECIPIENT when configured in environment", async () => {
      process.env.RESEND_API_KEY = "re_test_dummy_key";
      process.env.EMAIL_FROM = "Mirza Footwear <onboarding@resend.dev>";
      process.env.EMAIL_TEST_RECIPIENT = "tester@verified-domain.com";

      mockResendSend.mockResolvedValueOnce({
        data: { id: "resend-msg-123" },
        error: null,
      });

      const result = await sendEmail({
        to: "customer.real@domain.com",
        subject: "Order Confirmation",
        react: createElement("div", null, "Order confirmation"),
        idempotencyKey: "test-key-1",
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe("resend-msg-123");

      // Verify the external Resend send was redirected to tester@verified-domain.com
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "tester@verified-domain.com",
          from: "Mirza Footwear <onboarding@resend.dev>",
        }),
        expect.objectContaining({
          idempotencyKey: "test-key-1",
        }),
      );
    });

    it("sends directly to original recipient when EMAIL_TEST_RECIPIENT is unset and domain is custom", async () => {
      process.env.RESEND_API_KEY = "re_test_dummy_key";
      process.env.EMAIL_FROM = "Mirza Footwear <orders@mirzafootwear.com>";
      delete process.env.EMAIL_TEST_RECIPIENT;

      mockResendSend.mockResolvedValueOnce({
        data: { id: "resend-msg-456" },
        error: null,
      });

      const result = await sendEmail({
        to: "customer.real@domain.com",
        subject: "Order Confirmation",
        react: createElement("div", null, "Order confirmation"),
      });

      expect(result.success).toBe(true);
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "customer.real@domain.com",
          from: "Mirza Footwear <orders@mirzafootwear.com>",
        }),
        undefined,
      );
    });

    it("fails safely if onboarding@resend.dev is used without EMAIL_TEST_RECIPIENT", async () => {
      process.env.RESEND_API_KEY = "re_test_dummy_key";
      process.env.EMAIL_FROM = "Mirza Footwear <onboarding@resend.dev>";
      delete process.env.EMAIL_TEST_RECIPIENT;

      const result = await sendEmail({
        to: "random.customer@domain.com",
        subject: "Order Confirmation",
        react: createElement("div", null, "Order confirmation"),
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("EMAIL_TEST_RECIPIENT is required");
      expect(mockResendSend).not.toHaveBeenCalled();
    });
  });

  describe("4. Duplicate Protection & Idempotency Key", () => {
    it("generates deterministic idempotencyKey 'order-confirmation/<order-id>'", async () => {
      process.env.RESEND_API_KEY = "re_test_dummy_key";
      process.env.EMAIL_TEST_RECIPIENT = "tester@verified-domain.com";

      mockResendSend.mockResolvedValueOnce({
        data: { id: "resend-msg-789" },
        error: null,
      });

      await sendOrderConfirmationEmailSafe({
        order: sampleOrder,
        items: sampleItems,
      });

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.anything(),
        {
          idempotencyKey: `order-confirmation/${sampleOrder.id}`,
        },
      );
    });
  });

  describe("5. Post-Response Execution & Error Isolation", () => {
    it("schedules delivery using next/server after() so checkout response is immediate", () => {
      scheduleOrderConfirmationEmail({
        order: sampleOrder,
        items: sampleItems,
      });

      expect(mockAfter).toHaveBeenCalledTimes(1);
    });

    it("absorbs Resend errors gracefully without throwing to caller", async () => {
      process.env.RESEND_API_KEY = "re_test_dummy_key";
      process.env.EMAIL_TEST_RECIPIENT = "tester@verified-domain.com";

      mockResendSend.mockResolvedValueOnce({
        data: null,
        error: { message: "Resend API quota exceeded" },
      });

      const result = await sendOrderConfirmationEmailSafe({
        order: sampleOrder,
        items: sampleItems,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Resend API quota exceeded");
    });

    it("absorbs unexpected transport exceptions without crashing", async () => {
      process.env.RESEND_API_KEY = "re_test_dummy_key";
      process.env.EMAIL_TEST_RECIPIENT = "tester@verified-domain.com";

      mockResendSend.mockRejectedValueOnce(new Error("Network connection dropped"));

      const result = await sendOrderConfirmationEmailSafe({
        order: sampleOrder,
        items: sampleItems,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network connection dropped");
    });
  });

  describe("6. Server-Only Boundary", () => {
    it("enforces server-only boundary in send.ts and order-confirmation-flow.ts", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");

      const sendContent = fs.readFileSync(
        path.resolve(__dirname, "../send.ts"),
        "utf8",
      );
      expect(sendContent.startsWith('import "server-only";')).toBe(true);

      const flowContent = fs.readFileSync(
        path.resolve(__dirname, "../order-confirmation-flow.ts"),
        "utf8",
      );
      expect(flowContent.startsWith('import "server-only";')).toBe(true);
    });
  });

  describe("7. Email Asset URL Resolution", () => {
    it("converts root-relative catalog image path to absolute canonical URL", () => {
      const resolved = resolveEmailAssetUrl("/catalog-shoes/shoe-01.webp");
      expect(resolved).toBe("https://mirzafootwear.vercel.app/catalog-shoes/shoe-01.webp");
    });

    it("converts relative catalog image path without leading slash", () => {
      const resolved = resolveEmailAssetUrl("catalog-shoes/shoe-02.webp");
      expect(resolved).toBe("https://mirzafootwear.vercel.app/catalog-shoes/shoe-02.webp");
    });

    it("preserves valid public absolute HTTPS URLs unchanged", () => {
      const externalUrl = "https://cdn.example.com/products/oxford.webp";
      const resolved = resolveEmailAssetUrl(externalUrl);
      expect(resolved).toBe(externalUrl);
    });

    it("returns null safely for null, undefined, or empty string", () => {
      expect(resolveEmailAssetUrl(null)).toBeNull();
      expect(resolveEmailAssetUrl(undefined)).toBeNull();
      expect(resolveEmailAssetUrl("")).toBeNull();
      expect(resolveEmailAssetUrl("   ")).toBeNull();
    });

    it("prevents localhost URLs from reaching outbound production emails", () => {
      // Localhost passed directly as URL
      const resolvedLocalhost = resolveEmailAssetUrl("http://localhost:3000/catalog-shoes/shoe-01.webp");
      expect(resolvedLocalhost).toBe("https://mirzafootwear.vercel.app/catalog-shoes/shoe-01.webp");

      const resolvedIp = resolveEmailAssetUrl("http://127.0.0.1:3001/catalog-shoes/shoe-01.webp");
      expect(resolvedIp).toBe("https://mirzafootwear.vercel.app/catalog-shoes/shoe-01.webp");

      // Localhost configured in store URL env
      process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
      const resolvedWithEnv = resolveEmailAssetUrl("/catalog-shoes/shoe-01.webp");
      expect(resolvedWithEnv).toBe("https://mirzafootwear.vercel.app/catalog-shoes/shoe-01.webp");
    });

    it("uses NEXT_PUBLIC_SITE_URL when configured to a public domain", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://custom.mirzafootwear.com";
      const resolved = resolveEmailAssetUrl("/catalog-shoes/shoe-01.webp");
      expect(resolved).toBe("https://custom.mirzafootwear.com/catalog-shoes/shoe-01.webp");
    });
  });

  describe("8. Rendered Order Email Image URLs", () => {
    it("renders fully qualified absolute image URLs in the email HTML", async () => {
      const orderWithRelativeImage: DbOrderItem[] = [
        {
          ...sampleItems[0],
          thumbnail_url: "/catalog-shoes/shoe-01.webp",
        },
      ];

      const props = buildOrderConfirmationEmailProps({
        order: sampleOrder,
        items: orderWithRelativeImage,
      });

      // Mapping should resolve relative path
      expect(props.items[0].thumbnail_url).toBe(
        "https://mirzafootwear.vercel.app/catalog-shoes/shoe-01.webp",
      );

      const element = createElement(OrderConfirmationEmail, props);
      const html = await render(element);

      expect(html).toContain('src="https://mirzafootwear.vercel.app/catalog-shoes/shoe-01.webp"');
      expect(html).not.toContain('src="/catalog-shoes/shoe-01.webp"');
    });

    it("renders defensive absolute URL even if unmapped relative path is passed directly to component", async () => {
      const element = createElement(OrderConfirmationEmail, {
        orderNumber: "MRZ-TEST-001",
        customerName: "Test Customer",
        items: [
          {
            name: "Direct Oxford",
            quantity: 1,
            display_price: "$385.00",
            display_total: "$385.00",
            thumbnail_url: "/catalog-shoes/shoe-01.webp",
          },
        ],
        displayItemTotal: "$385.00",
        displayDeliveryTotal: "Complimentary",
        displayTaxTotal: "$0.00",
        displayTotal: "$385.00",
      });

      const html = await render(element);
      expect(html).toContain('src="https://mirzafootwear.vercel.app/catalog-shoes/shoe-01.webp"');
      expect(html).not.toContain('src="/catalog-shoes/shoe-01.webp"');
    });

    it("renders intentional placeholder when thumbnail_url is null", async () => {
      const itemsWithoutImage: DbOrderItem[] = [
        {
          ...sampleItems[0],
          thumbnail_url: null,
        },
      ];

      const props = buildOrderConfirmationEmailProps({
        order: sampleOrder,
        items: itemsWithoutImage,
      });

      const element = createElement(OrderConfirmationEmail, props);
      const html = await render(element);

      // Should render placeholder div, not broken img tag
      expect(html).not.toContain("<img");
      expect(html).toContain("background-color:#f3efe8");
    });
  });

  describe("9. Typography Progressive Enhancement & Fallback Stacks", () => {
    it("embeds Google Fonts webfont @import in Head style for progressive enhancement", async () => {
      const props = buildOrderConfirmationEmailProps({
        order: sampleOrder,
        items: sampleItems,
      });

      const element = createElement(OrderConfirmationEmail, props);
      const html = await render(element);

      expect(html).toContain("fonts.googleapis.com/css2?family=Cormorant+Garamond");
      expect(html).toContain("EB+Garamond");
      expect(html).toContain("Geist");
    });

    it("defines robust cross-client fallback stacks for all typography roles", () => {
      expect(FONT_STACK_DISPLAY).toBe('"Cormorant Garamond", Georgia, "Times New Roman", serif');
      expect(FONT_STACK_EDITORIAL).toBe('"EB Garamond", Georgia, "Times New Roman", serif');
      expect(FONT_STACK_SANS).toBe("Geist, Arial, Helvetica, sans-serif");
    });

    it("applies intended font family stacks into rendered HTML", async () => {
      const props = buildOrderConfirmationEmailProps({
        order: sampleOrder,
        items: sampleItems,
      });

      const element = createElement(OrderConfirmationEmail, props);
      const html = await render(element);

      // Display font in brand / header
      expect(html).toContain("Cormorant Garamond");
      // Editorial body font
      expect(html).toContain("EB Garamond");
      // Utility font
      expect(html).toContain("Geist");
      // Safe fallbacks always present
      expect(html).toContain("Georgia");
      expect(html).toContain("Arial");
    });
  });

  describe("10. Test CLI Script Contract", () => {
    it("exercises real catalog shoes and does not contain stale Supabase media URLs", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");

      const scriptContent = fs.readFileSync(
        path.resolve(__dirname, "../../../../scripts/send-test-order-email.ts"),
        "utf8",
      );

      expect(scriptContent).not.toContain("variants/640.webp");
      expect(scriptContent).not.toContain("hkncfdsvgjopkujmmxem.supabase.co");
      expect(scriptContent).toContain("/catalog-shoes/shoe-01.webp");
      expect(scriptContent).toContain("resolveEmailAssetUrl");
    });
  });
});
