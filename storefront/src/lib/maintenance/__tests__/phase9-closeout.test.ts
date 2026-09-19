import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(__dirname, "../../../../../");
const STOREFRONT_DIR = path.resolve(__dirname, "../../../../");

describe("Phase 9 Final Supervisor Closeout Invariants", () => {
  /* --------------------------------------------------------------------------
   * 1. Safe Cart Policy & Cleanup Maintenance Scripts
   * -------------------------------------------------------------------------- */
  describe("1. Safe Cart Policy & Cleanup Scripts", () => {
    const cleanupScriptPath = path.join(
      ROOT_DIR,
      "scripts/maintenance/cleanup-legacy-catalog.mjs",
    );
    const restoreScriptPath = path.join(
      ROOT_DIR,
      "scripts/maintenance/restore-active-carts.mjs",
    );

    it("ensures cleanup script enforces Safe Cart Policy without destructive cart mutations", () => {
      expect(fs.existsSync(cleanupScriptPath)).toBe(true);
      const content = fs.readFileSync(cleanupScriptPath, "utf-8");

      // Active cart deletion path must be strictly absent
      expect(content).not.toMatch(/DELETE\s+FROM\s+public\.cart_items/i);
      expect(content).not.toMatch(/DELETE\s+FROM\s+cart_items/i);

      // Active -> abandoned mutation path must be strictly absent
      expect(content).not.toMatch(/UPDATE\s+.*carts\s+SET\s+status\s*=\s*'abandoned'/i);

      // Checks and protects active cart referenced items
      expect(content).toContain("cart_items");
      expect(content).toContain("status = 'active'");
      expect(content).toContain("protectedProductIds");

      // Does NOT assert legacy products = 0 (production intentionally retains 2 for active carts)
      expect(content).not.toContain("Assertion failed: legacy products remain");
      expect(content).toMatch(/SAFE CART POLICY/i);
    });

    it("ensures one-shot recovery script restore-active-carts.mjs has been removed", () => {
      expect(fs.existsSync(restoreScriptPath)).toBe(false);
    });
  });

  /* --------------------------------------------------------------------------
   * 2. Final legacy_public Runtime Logic Removal
   * -------------------------------------------------------------------------- */
  describe("2. Final legacy_public & Rollback Window Removal", () => {
    it("proves catalog.ts has zero legacy_public fallback or storage_provider filtering", () => {
      const content = fs.readFileSync(
        path.join(STOREFRONT_DIR, "src/lib/db/catalog.ts"),
        "utf-8",
      );
      expect(content).not.toContain("legacy_public");
      expect(content).not.toContain("storage_provider !=");
    });

    it("proves order.ts has zero legacy_public fallback or storage_provider filtering", () => {
      const content = fs.readFileSync(
        path.join(STOREFRONT_DIR, "src/lib/db/order.ts"),
        "utf-8",
      );
      expect(content).not.toContain("legacy_public");
      expect(content).not.toContain("storage_provider !=");
    });

    it("proves admin-catalog.ts has zero legacy_public filtering in active runtime queries", () => {
      const content = fs.readFileSync(
        path.join(STOREFRONT_DIR, "src/lib/db/admin-catalog.ts"),
        "utf-8",
      );
      expect(content).not.toContain("storage_provider != 'legacy_public'");
      expect(content).not.toContain("storage_provider !=");
    });

    it("proves media-v1.ts defaults to supabase and has no legacy fallback classification", () => {
      const content = fs.readFileSync(
        path.join(STOREFRONT_DIR, "src/lib/db/media-v1.ts"),
        "utf-8",
      );
      expect(content).not.toContain("/catalog-shoes/");
      expect(content).toContain('provider = input.storageProvider || "supabase"');
    });

    it("proves admin-media-library.ts has zero rollback-window branches or error strings", () => {
      const content = fs.readFileSync(
        path.join(STOREFRONT_DIR, "src/lib/actions/admin-media-library.ts"),
        "utf-8",
      );
      expect(content).not.toContain("Legacy rollback assets are read-only");
      expect(content).not.toContain("during the rollback window");
      expect(content).not.toContain("Legacy rollback assets cannot be set as hero");
      expect(content).not.toContain("Legacy rollback assets cannot be reordered");
      expect(content).not.toContain("Legacy assets are read-only");
      expect(content).not.toContain("storage_provider != 'legacy_public'");
    });

    it("proves media UI components have zero rollback badges, copy, or provider filters", () => {
      const clientContent = fs.readFileSync(
        path.join(
          STOREFRONT_DIR,
          "src/components/admin/media/MediaLibraryClient.tsx",
        ),
        "utf-8",
      );
      const drawerContent = fs.readFileSync(
        path.join(
          STOREFRONT_DIR,
          "src/components/admin/media/MediaDetailDrawer.tsx",
        ),
        "utf-8",
      );
      const pageContent = fs.readFileSync(
        path.join(
          STOREFRONT_DIR,
          "src/app/[country]/[locale]/(admin)/admin/media/page.tsx",
        ),
        "utf-8",
      );

      // MediaLibraryClient
      expect(clientContent).not.toContain("isLegacy");
      expect(clientContent).not.toContain("admin-badge--legacy");
      expect(clientContent).not.toContain("Rollback");
      expect(clientContent).not.toContain("filter-provider");

      // MediaDetailDrawer
      expect(drawerContent).not.toContain("isLegacy");
      expect(drawerContent).not.toContain("Read-only rollback asset");
      expect(drawerContent).not.toContain("during the rollback window");

      // page.tsx
      expect(pageContent).not.toContain("provider");
    });

    it("proves ProductMediaManager.tsx has zero legacy_public filtering or rollback handling", () => {
      const pmmContent = fs.readFileSync(
        path.join(
          STOREFRONT_DIR,
          "src/components/admin/ProductMediaManager.tsx",
        ),
        "utf-8",
      );
      expect(pmmContent).not.toContain("legacy_public");
      expect(pmmContent).not.toContain("legacy");
    });

    it("proves active runtime source across storefront/src has zero legacy_public occurrences", () => {
      const srcDir = path.join(STOREFRONT_DIR, "src");
      const files = getAllFiles(srcDir, [".tsx", ".ts", ".css"]);

      const runtimeFiles = files.filter(
        (f) =>
          !f.includes("__tests__") &&
          !f.endsWith(".test.ts") &&
          !f.endsWith(".test.tsx"),
      );

      expect(runtimeFiles.length).toBeGreaterThan(50);

      for (const file of runtimeFiles) {
        const content = fs.readFileSync(file, "utf-8");
        expect(
          content,
          `Found legacy_public in active runtime file: ${file}`,
        ).not.toContain("legacy_public");
      }
    });
  });

  /* --------------------------------------------------------------------------
   * 3. Typography Hard Rules & Navigation Cleanup
   * -------------------------------------------------------------------------- */
  describe("3. Typography Hard Rules & Navigation Invariants", () => {
    it("proves .admin-mono has been completely eliminated from entire src", () => {
      const srcDir = path.join(STOREFRONT_DIR, "src");
      const files = getAllFiles(srcDir, [".tsx", ".ts", ".css"]);

      for (const file of files) {
        // Skip this test file itself
        if (file.includes("phase9-closeout.test.ts")) continue;
        const content = fs.readFileSync(file, "utf-8");
        expect(content, `Found .admin-mono in ${file}`).not.toContain("admin-mono");
      }
    });

    it("proves font-mono and editorial-text are absent from admin runtime", () => {
      const adminAppDir = path.join(
        STOREFRONT_DIR,
        "src/app/[country]/[locale]/(admin)",
      );
      const adminCompDir = path.join(
        STOREFRONT_DIR,
        "src/components/admin",
      );

      const files = [
        ...getAllFiles(adminAppDir, [".tsx", ".ts", ".css"]),
        ...getAllFiles(adminCompDir, [".tsx", ".ts", ".css"]),
      ];

      for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        expect(content, `Found font-mono in ${file}`).not.toContain("font-mono");
        expect(content, `Found editorial-text in ${file}`).not.toContain(
          "--font-editorial-text",
        );
        expect(content, `Found font-editorial-text in ${file}`).not.toContain(
          "font-editorial-text",
        );
      }
    });

    it("proves --font-editorial-display in admin is ONLY used in .admin-brand containing MIRZA", () => {
      const adminCss = fs.readFileSync(
        path.join(STOREFRONT_DIR, "src/app/admin.css"),
        "utf-8",
      );

      // Check editorial-display matches in admin.css
      const matches = adminCss.match(/--font-editorial-display/g) || [];
      // Should only be defined on .admin-brand
      expect(matches.length).toBe(1);
      expect(adminCss).toContain(".admin-brand");
      expect(adminCss).toContain("font-family: var(--font-editorial-display), Georgia, serif;");

      // Verify AdminSidebar has literal MIRZA
      const sidebarContent = fs.readFileSync(
        path.join(STOREFRONT_DIR, "src/components/admin/AdminSidebar.tsx"),
        "utf-8",
      );
      expect(sidebarContent).toContain("admin-brand");
      expect(sidebarContent).toContain("MIRZA");
    });

    it("proves AdminTopNav is completely absent and stale top-nav CSS is removed", () => {
      // AdminTopNav component file must not exist
      const topNavPath = path.join(
        STOREFRONT_DIR,
        "src/components/admin/AdminTopNav.tsx",
      );
      expect(fs.existsSync(topNavPath)).toBe(false);

      // Must not be imported anywhere in src
      const srcDir = path.join(STOREFRONT_DIR, "src");
      const files = getAllFiles(srcDir, [".tsx", ".ts"]);
      for (const file of files) {
        if (file.includes("phase9-closeout.test.ts")) continue;
        const content = fs.readFileSync(file, "utf-8");
        expect(content, `Found AdminTopNav import in ${file}`).not.toContain(
          "AdminTopNav",
        );
      }

      // admin.css must not contain old top navigation classes
      const adminCss = fs.readFileSync(
        path.join(STOREFRONT_DIR, "src/app/admin.css"),
        "utf-8",
      );
      expect(adminCss).not.toContain(".admin-header");
      expect(adminCss).not.toContain(".admin-nav-item");
      expect(adminCss).not.toContain(".admin-nav-item--active");
      expect(adminCss).not.toContain(".admin-badge--legacy");
    });
  });
});

function getAllFiles(dir: string, extensions: string[]): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (item !== "node_modules" && item !== ".next") {
        results = results.concat(getAllFiles(fullPath, extensions));
      }
    } else if (extensions.some((ext) => item.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}
