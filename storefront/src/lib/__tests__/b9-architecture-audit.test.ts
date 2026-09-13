import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("B9 Architecture Audit — Zero Operational Render / Rails / Spree Backend Infrastructure", () => {
  const storefrontDir = path.resolve(__dirname, "../../../");
  const repoRootDir = path.resolve(storefrontDir, "..");

  describe("1. next.config.ts configuration guards", () => {
    const nextConfigPath = path.resolve(storefrontDir, "next.config.ts");
    const nextConfigContent = fs.readFileSync(nextConfigPath, "utf8");

    it("proves 0 references to SPREE_API_URL in next.config.ts", () => {
      expect(nextConfigContent).not.toContain("SPREE_API_URL");
    });

    it("proves 0 references to SPREE_IMAGES_URL in next.config.ts", () => {
      expect(nextConfigContent).not.toContain("SPREE_IMAGES_URL");
    });

    it("proves 0 references to /rails/active_storage in next.config.ts", () => {
      expect(nextConfigContent).not.toContain("/rails/active_storage");
    });

    it("proves 0 references to spreeImagePatterns in next.config.ts", () => {
      expect(nextConfigContent).not.toContain("spreeImagePatterns");
    });

    it("proves @spree/sdk is not in transpilePackages", () => {
      expect(nextConfigContent).not.toContain("@spree/sdk");
    });

    it("proves dangerouslyAllowLocalIP is removed", () => {
      expect(nextConfigContent).not.toContain("dangerouslyAllowLocalIP");
    });
  });

  describe("2. DocumentShell preconnect guards", () => {
    const documentShellPath = path.resolve(
      storefrontDir,
      "src/components/layout/DocumentShell.tsx",
    );
    const documentShellContent = fs.readFileSync(documentShellPath, "utf8");

    it("proves DocumentShell does not read SPREE_API_URL", () => {
      expect(documentShellContent).not.toContain("SPREE_API_URL");
    });

    it("proves DocumentShell has 0 spree preconnect or dns-prefetch links", () => {
      expect(documentShellContent).not.toContain("spreeApiOrigin");
      expect(documentShellContent).not.toContain("preconnect");
      expect(documentShellContent).not.toContain("dns-prefetch");
    });
  });

  describe("3. Dockerfile build configuration guards", () => {
    const dockerfilePath = path.resolve(storefrontDir, "Dockerfile");
    const dockerfileContent = fs.readFileSync(dockerfilePath, "utf8");

    it("proves 0 references to SPREE_API_URL in Dockerfile", () => {
      expect(dockerfileContent).not.toContain("SPREE_API_URL");
    });

    it("proves 0 references to SPREE_PUBLISHABLE_KEY in Dockerfile", () => {
      expect(dockerfileContent).not.toContain("SPREE_PUBLISHABLE_KEY");
    });
  });

  describe("4. Environment template guards", () => {
    const envExamplePath = path.resolve(storefrontDir, ".env.example");
    const envLocalExamplePath = path.resolve(
      storefrontDir,
      ".env.local.example",
    );

    it("proves .env.example contains 0 SPREE_API_URL or SPREE_PUBLISHABLE_KEY", () => {
      const content = fs.readFileSync(envExamplePath, "utf8");
      expect(content).not.toMatch(/^SPREE_API_URL=/m);
      expect(content).not.toMatch(/^SPREE_PUBLISHABLE_KEY=/m);
      expect(content).not.toMatch(/^SPREE_IMAGES_URL=/m);
    });

    it("proves .env.local.example contains 0 SPREE_API_URL or SPREE_PUBLISHABLE_KEY", () => {
      const content = fs.readFileSync(envLocalExamplePath, "utf8");
      expect(content).not.toMatch(/^SPREE_API_URL=/m);
      expect(content).not.toMatch(/^SPREE_PUBLISHABLE_KEY=/m);
      expect(content).not.toMatch(/^SPREE_IMAGES_URL=/m);
    });
  });

  describe("5. CI and workflow guards", () => {
    const lighthouseWorkflowPath = path.resolve(
      repoRootDir,
      ".github/workflows/lighthouse-ci.yml",
    );
    const nestedCiWorkflowPath = path.resolve(
      storefrontDir,
      ".github/workflows/ci.yml",
    );

    it("proves lighthouse CI workflow does not pass SPREE_API_URL or SPREE_PUBLISHABLE_KEY", () => {
      const content = fs.readFileSync(lighthouseWorkflowPath, "utf8");
      expect(content).not.toContain("SPREE_API_URL");
      expect(content).not.toContain("SPREE_PUBLISHABLE_KEY");
    });

    it("proves inactive nested Spree CI workflow is deleted", () => {
      expect(fs.existsSync(nestedCiWorkflowPath)).toBe(false);
    });
  });

  describe("6. Local Docker Compose and Spree scripts guards", () => {
    const e2eBackendDir = path.resolve(storefrontDir, "e2e-backend");
    const bootstrapSpreeScript = path.resolve(
      storefrontDir,
      "scripts/e2e/bootstrap-spree.sh",
    );
    const devWithEnvScript = path.resolve(
      storefrontDir,
      "scripts/e2e/dev-with-env.sh",
    );
    const packageJsonPath = path.resolve(storefrontDir, "package.json");
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");

    it("proves e2e-backend directory is deleted", () => {
      expect(fs.existsSync(e2eBackendDir)).toBe(false);
    });

    it("proves bootstrap-spree.sh script is deleted", () => {
      expect(fs.existsSync(bootstrapSpreeScript)).toBe(false);
    });

    it("proves dev-with-env.sh script is deleted", () => {
      expect(fs.existsSync(devWithEnvScript)).toBe(false);
    });

    it("proves package.json contains 0 e2e:up or e2e:down scripts", () => {
      expect(packageJsonContent).not.toContain('"e2e:up"');
      expect(packageJsonContent).not.toContain('"e2e:down"');
    });

    it("proves @spree/cli is removed from package.json", () => {
      expect(packageJsonContent).not.toContain('"@spree/cli"');
    });
  });

  describe("7. E2E Test Suite Alignment", () => {
    const legacyCheckoutSpec = path.resolve(
      storefrontDir,
      "e2e/checkout.spec.ts",
    );
    const playwrightConfigPath = path.resolve(
      storefrontDir,
      "playwright.config.ts",
    );
    const playwrightConfigContent = fs.readFileSync(
      playwrightConfigPath,
      "utf8",
    );

    it("proves legacy Spree/Stripe checkout.spec.ts is deleted", () => {
      expect(fs.existsSync(legacyCheckoutSpec)).toBe(false);
    });

    it("proves playwright.config.ts does not rely on dev-with-env or .env.e2e", () => {
      expect(playwrightConfigContent).not.toContain("dev-with-env.sh");
      expect(playwrightConfigContent).not.toContain(".env.e2e");
      expect(playwrightConfigContent).not.toContain("@spree/cli");
    });
  });
});
