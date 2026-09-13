import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string): string[] {
  let files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name !== "node_modules" &&
        entry.name !== ".next" &&
        entry.name !== "__tests__"
      ) {
        files = files.concat(walk(full));
      }
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".test.tsx")
    ) {
      files.push(full);
    }
  }
  return files;
}

describe("B8 Architecture Audit — Zero Spree SDK / BFF Runtime Dependency", () => {
  const srcDir = path.resolve(__dirname, "../../");
  const productionFiles = walk(srcDir);

  it("proves 0 imports from @spree/sdk in production source", () => {
    const offendingFiles: string[] = [];
    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (/from\s+["']@spree\/sdk["']/.test(content)) {
        offendingFiles.push(path.relative(srcDir, file));
      }
    }
    expect(offendingFiles).toEqual([]);
  });

  it("proves 0 imports from @spree/sdk/webhooks in production source", () => {
    const offendingFiles: string[] = [];
    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (/from\s+["']@spree\/sdk\/webhooks["']/.test(content)) {
        offendingFiles.push(path.relative(srcDir, file));
      }
    }
    expect(offendingFiles).toEqual([]);
  });

  it("proves 0 calls to getClient() in production source", () => {
    const offendingFiles: string[] = [];
    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (/\bgetClient\s*\(/.test(content)) {
        offendingFiles.push(path.relative(srcDir, file));
      }
    }
    expect(offendingFiles).toEqual([]);
  });

  it("proves 0 calls to getClientForSurface() in production source", () => {
    const offendingFiles: string[] = [];
    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (/\bgetClientForSurface\s*\(/.test(content)) {
        offendingFiles.push(path.relative(srcDir, file));
      }
    }
    expect(offendingFiles).toEqual([]);
  });

  it("proves 0 calls to withAuthRefresh in production source", () => {
    const offendingFiles: string[] = [];
    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (/\bwithAuthRefresh\s*\(/.test(content)) {
        offendingFiles.push(path.relative(srcDir, file));
      }
    }
    expect(offendingFiles).toEqual([]);
  });

  it("proves 0 runtime references to /api/v3/store in production source", () => {
    const offendingFiles: string[] = [];
    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("/api/v3/store")) {
        offendingFiles.push(path.relative(srcDir, file));
      }
    }
    expect(offendingFiles).toEqual([]);
  });

  it("proves fake Spree BFF route is deleted", () => {
    const bffRoute = path.resolve(srcDir, "app/api/v3/store/[...spree]/route.ts");
    expect(fs.existsSync(bffRoute)).toBe(false);
  });

  it("proves fake Spree webhooks route and handlers are deleted", () => {
    const webhookRoute = path.resolve(srcDir, "app/api/webhooks/spree/route.ts");
    const webhookHandlers = path.resolve(srcDir, "lib/webhooks/handlers.ts");
    expect(fs.existsSync(webhookRoute)).toBe(false);
    expect(fs.existsSync(webhookHandlers)).toBe(false);
  });
});

describe("B8.1 Architecture Audit — Zero Fake Checkout Successes", () => {
  const srcDir = path.resolve(__dirname, "../../");
  const productionFiles = walk(srcDir);

  it("proves 0 references to direct_payment_session in production source", () => {
    const offendingFiles: string[] = [];
    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("direct_payment_session")) {
        offendingFiles.push(path.relative(srcDir, file));
      }
    }
    expect(offendingFiles).toEqual([]);
  });

  it("proves 0 references to fake direct_payment sentinel in production source", () => {
    const offendingFiles: string[] = [];
    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("direct_payment")) {
        offendingFiles.push(path.relative(srcDir, file));
      }
    }
    expect(offendingFiles).toEqual([]);
  });

  it("proves 0 references to paymentSessions in production source", () => {
    const offendingFiles: string[] = [];
    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("paymentSessions")) {
        offendingFiles.push(path.relative(srcDir, file));
      }
    }
    expect(offendingFiles).toEqual([]);
  });

  it("proves 0 references to selectDeliveryRate in production source", () => {
    const offendingFiles: string[] = [];
    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("selectDeliveryRate")) {
        offendingFiles.push(path.relative(srcDir, file));
      }
    }
    expect(offendingFiles).toEqual([]);
  });

  it("proves 0 references to confirmPaymentAndCompleteCart in production source", () => {
    const offendingFiles: string[] = [];
    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("confirmPaymentAndCompleteCart")) {
        offendingFiles.push(path.relative(srcDir, file));
      }
    }
    expect(offendingFiles).toEqual([]);
  });

  it("proves 0 references to createCheckoutPaymentSession in production source", () => {
    const offendingFiles: string[] = [];
    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("createCheckoutPaymentSession")) {
        offendingFiles.push(path.relative(srcDir, file));
      }
    }
    expect(offendingFiles).toEqual([]);
  });

  it("proves 0 references to updateCheckoutPaymentSession in production source", () => {
    const offendingFiles: string[] = [];
    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("updateCheckoutPaymentSession")) {
        offendingFiles.push(path.relative(srcDir, file));
      }
    }
    expect(offendingFiles).toEqual([]);
  });

  it("proves 0 references to completeCheckoutPaymentSession in production source", () => {
    const offendingFiles: string[] = [];
    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("completeCheckoutPaymentSession")) {
        offendingFiles.push(path.relative(srcDir, file));
      }
    }
    expect(offendingFiles).toEqual([]);
  });

  it("proves 0 references to createDirectPayment in production source", () => {
    const offendingFiles: string[] = [];
    for (const file of productionFiles) {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes("createDirectPayment")) {
        offendingFiles.push(path.relative(srcDir, file));
      }
    }
    expect(offendingFiles).toEqual([]);
  });

  it("proves legacy gateway callback route (confirm-payment) is deleted", () => {
    const callbackRoute = path.resolve(
      srcDir,
      "app/[country]/[locale]/(checkout)/confirm-payment",
    );
    expect(fs.existsSync(callbackRoute)).toBe(false);
  });
});
