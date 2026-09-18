import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";

// 1. Ensure environment variables from .env.local are loaded into process.env first
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, "");
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnvLocal();

// 2. Mock 'server-only' for direct CLI invocation outside Next.js bundling
try {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    filename: serverOnlyPath,
    loaded: true,
    exports: {},
  } as any;
} catch {}

async function main() {
  // Dynamically import after environment and server-only bypass are established
  const { OrderConfirmationEmail, resolveEmailAssetUrl } = await import(
    "../src/lib/emails/order-confirmation"
  );
  const { sendEmail } = await import("../src/lib/emails/send");

  console.log("------------------------------------------------------------");
  console.log("Mirza Footwear — Order Confirmation Test Email CLI");
  console.log("------------------------------------------------------------");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("ERROR: RESEND_API_KEY is not set in environment or .env.local.");
    process.exit(1);
  }

  const testRecipient = process.env.EMAIL_TEST_RECIPIENT;
  if (!testRecipient) {
    console.error("ERROR: EMAIL_TEST_RECIPIENT is not set in environment or .env.local.");
    process.exit(1);
  }

  const fromSender = process.env.EMAIL_FROM || "Mirza Footwear <onboarding@resend.dev>";

  console.log(`From:      ${fromSender}`);
  console.log(`To:        ${testRecipient}`);
  console.log("Key:       [CONFIGURED - SECRET]");

  const orderNumber = `MRZ-TEST-${Date.now().toString(36).toUpperCase()}`;

  const emailProps = {
    orderNumber,
    customerName: "Jane Smith",
    items: [
      {
        name: "The Sovereign Oxford in Patina Calfskin",
        slug: "office-footwear-01",
        quantity: 1,
        options_text: "Size: 42 EU / 9 US",
        display_price: "$385.00",
        display_total: "$385.00",
        thumbnail_url: resolveEmailAssetUrl("/catalog-shoes/shoe-01.webp"),
      },
      {
        name: "Artisanal Cedar Shoe Trees",
        quantity: 1,
        options_text: "Size: M (41-43 EU)",
        display_price: "$65.00",
        display_total: "$65.00",
        thumbnail_url: null,
      },
    ],
    displayItemTotal: "$450.00",
    displayDeliveryTotal: "Complimentary",
    displayTaxTotal: "$36.00",
    displayTotal: "$486.00",
    shippingAddress: {
      full_name: "Jane Smith",
      address1: "742 Evergreen Terrace",
      address2: "Suite 4B",
      city: "Springfield",
      state_text: "OR",
      postal_code: "97477",
      country_name: "United States",
      phone: "+1 (541) 555-0199",
    },
    deliveryMethodName: "White Glove Express Delivery",
  };

  const reactElement = createElement(OrderConfirmationEmail, emailProps);

  console.log(`Dispatching test order confirmation for order #${orderNumber}...`);

  const result = await sendEmail({
    to: testRecipient,
    subject: `Your Mirza order is confirmed — ${orderNumber}`,
    react: reactElement,
    from: fromSender,
    idempotencyKey: `test-order-${orderNumber}`,
  });

  if (!result.success) {
    console.error("FAIL: Could not send test email.");
    console.error(`Error details: ${result.error}`);
    process.exit(1);
  }

  console.log("------------------------------------------------------------");
  console.log("SUCCESS: Real test order confirmation email delivered.");
  console.log(`Provider:        Resend`);
  console.log(`Resend Email ID: ${result.id}`);
  console.log(`Delivered to:    ${testRecipient}`);
  console.log("------------------------------------------------------------");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
