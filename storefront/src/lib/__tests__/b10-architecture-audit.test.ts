import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function walkAll(dir: string): string[] {
  let files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name !== "node_modules" &&
        entry.name !== ".next" &&
        entry.name !== "coverage"
      ) {
        files = files.concat(walkAll(full));
      }
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))
    ) {
      files.push(full);
    }
  }
  return files;
}

function walkProduction(dir: string): string[] {
  return walkAll(dir).filter(
    (file) =>
      !file.includes("__tests__") &&
      !file.endsWith(".test.ts") &&
      !file.endsWith(".test.tsx"),
  );
}

describe("B10 Architecture Audit — Final Migration Cleanup & Neutral Naming", () => {
  const storefrontDir = path.resolve(__dirname, "../../../");
  const repoRootDir = path.resolve(storefrontDir, "..");
  const srcDir = path.resolve(storefrontDir, "src");
  const thisTestFile = path.resolve(__dirname, "b10-architecture-audit.test.ts");
  const allSourceFiles = walkAll(srcDir).filter(
    (file) => path.resolve(file) !== thisTestFile,
  );
  const productionFiles = walkProduction(srcDir);

  describe("1. Legacy Spree directory & import elimination", () => {
    it("proves src/lib/spree directory is completely absent", () => {
      const spreeDir = path.resolve(srcDir, "lib/spree");
      expect(fs.existsSync(spreeDir)).toBe(false);
    });

    it("proves 0 imports from @/lib/spree across all source and test files", () => {
      const offendingFiles: string[] = [];
      for (const file of allSourceFiles) {
        const content = fs.readFileSync(file, "utf8");
        if (/@\/lib\/spree\b/.test(content)) {
          offendingFiles.push(path.relative(srcDir, file));
        }
      }
      expect(offendingFiles).toEqual([]);
    });

    it("proves 0 relative imports from lib/spree across all source and test files", () => {
      const offendingFiles: string[] = [];
      for (const file of allSourceFiles) {
        const content = fs.readFileSync(file, "utf8");
        if (/from\s+["'][^"']*\/lib\/spree["']/.test(content)) {
          offendingFiles.push(path.relative(srcDir, file));
        }
      }
      expect(offendingFiles).toEqual([]);
    });
  });

  describe("2. Elimination of legacy types and functions", () => {
    it("proves 0 references to SpreeMiddleware in all source and test files", () => {
      const offendingFiles: string[] = [];
      for (const file of allSourceFiles) {
        const content = fs.readFileSync(file, "utf8");
        if (/\bSpreeMiddleware[A-Za-z0-9_]*\b/.test(content)) {
          offendingFiles.push(path.relative(srcDir, file));
        }
      }
      expect(offendingFiles).toEqual([]);
    });

    it("proves 0 references to SpreeNext in all source and test files", () => {
      const offendingFiles: string[] = [];
      for (const file of allSourceFiles) {
        const content = fs.readFileSync(file, "utf8");
        if (/\bSpreeNext[A-Za-z0-9_]*\b/.test(content)) {
          offendingFiles.push(path.relative(srcDir, file));
        }
      }
      expect(offendingFiles).toEqual([]);
    });

    it("proves 0 references to adaptDbOrderToSpree across codebase", () => {
      const offendingFiles: string[] = [];
      for (const file of allSourceFiles) {
        const content = fs.readFileSync(file, "utf8");
        if (/\badaptDbOrderToSpree\b/.test(content)) {
          offendingFiles.push(path.relative(srcDir, file));
        }
      }
      expect(offendingFiles).toEqual([]);
    });

    it("proves 0 references to adaptDbCartToSpreeCart across codebase", () => {
      const offendingFiles: string[] = [];
      for (const file of allSourceFiles) {
        const content = fs.readFileSync(file, "utf8");
        if (/\badaptDbCartToSpreeCart\b/.test(content)) {
          offendingFiles.push(path.relative(srcDir, file));
        }
      }
      expect(offendingFiles).toEqual([]);
    });

    it("proves 0 references to adaptDbAddressToSpree across codebase", () => {
      const offendingFiles: string[] = [];
      for (const file of allSourceFiles) {
        const content = fs.readFileSync(file, "utf8");
        if (/\badaptDbAddressToSpree\b/.test(content)) {
          offendingFiles.push(path.relative(srcDir, file));
        }
      }
      expect(offendingFiles).toEqual([]);
    });

    it("proves 0 references to spreeToken identifier in production source", () => {
      const offendingFiles: string[] = [];
      for (const file of productionFiles) {
        const content = fs.readFileSync(file, "utf8");
        if (/\bspreeToken\b/.test(content)) {
          offendingFiles.push(path.relative(srcDir, file));
        }
      }
      expect(offendingFiles).toEqual([]);
    });
  });

  describe("3. Elimination of legacy JWT authentication calls", () => {
    it("proves 0 runtime calls to legacy JWT cookie/auth helpers", () => {
      const jwtHelperRegex = /\b(getAccessToken|setAccessToken|getRefreshToken|setRefreshToken|isJwtExpired)\b/;
      const offendingFiles: string[] = [];
      for (const file of productionFiles) {
        const content = fs.readFileSync(file, "utf8");
        if (jwtHelperRegex.test(content)) {
          offendingFiles.push(path.relative(srcDir, file));
        }
      }
      expect(offendingFiles).toEqual([]);
    });
  });

  describe("4. Operational environment variable cleanup", () => {
    it("proves 0 operational references to retired SPREE environment variables", () => {
      const envExamplePath = path.resolve(storefrontDir, ".env.example");
      const envExampleContent = fs.readFileSync(envExamplePath, "utf8");

      expect(envExampleContent).not.toContain("SPREE_WHOLESALE_CHANNEL");
      expect(envExampleContent).not.toContain("SPREE_WHOLESALE_PUBLISHABLE_KEY");
      expect(envExampleContent).not.toContain("SPREE_WEBHOOK_SECRET");
      expect(envExampleContent).not.toContain("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
    });

    it("proves .env.local.example contains no retired payment or spree keys", () => {
      const envLocalExamplePath = path.resolve(
        storefrontDir,
        ".env.local.example",
      );
      if (fs.existsSync(envLocalExamplePath)) {
        const content = fs.readFileSync(envLocalExamplePath, "utf8");
        expect(content).not.toContain("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
        expect(content).not.toContain("SPREE_");
      }
    });

    it("proves production source contains 0 references to SPREE_WHOLESALE_CHANNEL", () => {
      const offendingFiles: string[] = [];
      for (const file of productionFiles) {
        const content = fs.readFileSync(file, "utf8");
        if (content.includes("SPREE_WHOLESALE_CHANNEL")) {
          offendingFiles.push(path.relative(srcDir, file));
        }
      }
      expect(offendingFiles).toEqual([]);
    });
  });

  describe("5. Dead payment gateway package removal", () => {
    it("proves package.json contains 0 dead gateway dependencies", () => {
      const packageJsonPath = path.resolve(storefrontDir, "package.json");
      const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
      const pkg = JSON.parse(packageJsonContent);

      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      expect(allDeps["@adyen/adyen-web"]).toBeUndefined();
      expect(allDeps["@paypal/react-paypal-js"]).toBeUndefined();
      expect(allDeps["@stripe/react-stripe-js"]).toBeUndefined();
      expect(allDeps["@stripe/stripe-js"]).toBeUndefined();
      expect(allDeps["react-svg-credit-card-payment-icons"]).toBeUndefined();
    });

    it("proves production source imports 0 dead gateway packages", () => {
      const gatewayRegex = /from\s+["'](@adyen\/adyen-web|@paypal\/react-paypal-js|@stripe\/react-stripe-js|@stripe\/stripe-js|react-svg-credit-card-payment-icons)["']/;
      const offendingFiles: string[] = [];
      for (const file of productionFiles) {
        const content = fs.readFileSync(file, "utf8");
        if (gatewayRegex.test(content)) {
          offendingFiles.push(path.relative(srcDir, file));
        }
      }
      expect(offendingFiles).toEqual([]);
    });
  });

  describe("6. Obsolete static assets & seed scripts", () => {
    it("proves public/products directory is absent", () => {
      const publicProducts = path.resolve(storefrontDir, "public/products");
      expect(fs.existsSync(publicProducts)).toBe(false);
    });

    it("proves public/spree.png is absent", () => {
      const spreePng = path.resolve(storefrontDir, "public/spree.png");
      expect(fs.existsSync(spreePng)).toBe(false);
    });

    it("proves scripts/seeds directory is absent", () => {
      const seedsDir = path.resolve(repoRootDir, "scripts/seeds");
      expect(fs.existsSync(seedsDir)).toBe(false);
    });

    it("proves 0 production source references to /products/ static media", () => {
      const offendingFiles: string[] = [];
      for (const file of productionFiles) {
        const content = fs.readFileSync(file, "utf8");
        if (/\/products\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)/i.test(content)) {
          offendingFiles.push(path.relative(srcDir, file));
        }
      }
      expect(offendingFiles).toEqual([]);
    });
  });

  describe("7. Legacy cookie literal isolation", () => {
    const legacyCookieLiterals = [
      "_spree_cart_id",
      "_spree_cart_token",
      "_spree_wholesale_cart_id",
      "_spree_wholesale_cart_token",
      "spree_country",
      "spree_locale",
      "_spree_jwt",
      "_spree_refresh_token",
    ];

    it("proves legacy cookie names appear strictly in legacy-cookie-migration.ts and its tests", () => {
      const allowedRelativePaths = new Set([
        path.normalize("lib/storefront/legacy-cookie-migration.ts"),
        path.normalize("lib/storefront/__tests__/legacy-cookie-migration.test.ts"),
      ]);

      const offendingOccurrences: { file: string; literal: string }[] = [];

      for (const file of allSourceFiles) {
        const relPath = path.normalize(path.relative(srcDir, file));
        if (allowedRelativePaths.has(relPath)) {
          continue;
        }

        const content = fs.readFileSync(file, "utf8");
        for (const literal of legacyCookieLiterals) {
          if (content.includes(literal)) {
            offendingOccurrences.push({ file: relPath, literal });
          }
        }
      }

      expect(offendingOccurrences).toEqual([]);
    });

    it("proves 0 references to LEGACY_* cookie constants in production source outside legacy-cookie-migration.ts", () => {
      const legacyConstRegex = /\bLEGACY_[A-Z0-9_]*\b/;
      const bridgeFile = path.normalize("lib/storefront/legacy-cookie-migration.ts");
      const offendingFiles: string[] = [];
      for (const file of productionFiles) {
        const relPath = path.normalize(path.relative(srcDir, file));
        if (relPath === bridgeFile) continue;
        const content = fs.readFileSync(file, "utf8");
        if (legacyConstRegex.test(content)) {
          offendingFiles.push(relPath);
        }
      }
      expect(offendingFiles).toEqual([]);
    });

    it("proves 0 production source references to x-spree-request-* headers", () => {
      const offendingFiles: string[] = [];
      for (const file of productionFiles) {
        const content = fs.readFileSync(file, "utf8");
        if (/x-spree-request-/i.test(content)) {
          offendingFiles.push(path.relative(srcDir, file));
        }
      }
      expect(offendingFiles).toEqual([]);
    });
  });
});
