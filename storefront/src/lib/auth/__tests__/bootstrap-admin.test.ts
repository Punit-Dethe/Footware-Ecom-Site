import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const scriptPath = path.resolve(process.cwd(), "../scripts/bootstrap_admin.mjs");

describe("Admin Bootstrap Script Security & TLS Verification", () => {
  it("does not contain any hard-coded credentials, passwords, or secrets", () => {
    const scriptContent = fs.readFileSync(scriptPath, "utf8");
    expect(scriptContent).not.toMatch(/password\s*[:=]\s*["'][^"']+["']/i);
    expect(scriptContent).not.toMatch(/postgres:\/\/[^:]+:[^@]+@/i);
    expect(scriptContent).not.toMatch(/eyJ[a-zA-Z0-9_-]{20,}/); // JWT tokens
  });

  it("requires DATABASE_URL environment variable", async () => {
    try {
      await execFileAsync("node", [scriptPath, "11111111-1111-4111-8111-111111111111"], {
        env: { ...process.env, DATABASE_URL: "" },
      });
      expect.fail("Script should have exited with non-zero");
    } catch (err: any) {
      expect(err.stderr || err.stdout).toContain("DATABASE_URL environment variable is required");
    }
  });

  it("requires a valid UUID argument", async () => {
    try {
      await execFileAsync("node", [scriptPath, "not-a-uuid"], {
        env: { ...process.env, DATABASE_URL: "postgresql://localhost:5432/postgres" },
      });
      expect.fail("Script should have exited with non-zero");
    } catch (err: any) {
      expect(err.stderr || err.stdout).toContain("not a valid UUID");
    }
  });

  it("requires SUPABASE_DB_CA_CERT_BASE64 for cloud database URLs", async () => {
    try {
      await execFileAsync(
        "node",
        [scriptPath, "11111111-1111-4111-8111-111111111111"],
        {
          env: {
            ...process.env,
            DATABASE_URL: "postgresql://postgres.hkncfdsvgjopkujmmxem:5432/postgres",
            SUPABASE_DB_CA_CERT_BASE64: "",
          },
        },
      );
      expect.fail("Script should have exited with non-zero");
    } catch (err: any) {
      expect(err.stderr || err.stdout).toContain(
        "SUPABASE_DB_CA_CERT_BASE64 environment variable is required for cloud database connections",
      );
    }
  });

  it("verifies script configures rejectUnauthorized: true and ca for cloud DB", () => {
    const scriptContent = fs.readFileSync(scriptPath, "utf8");
    expect(scriptContent).toContain("rejectUnauthorized: true");
    expect(scriptContent).toContain("ca: pem");
    expect(scriptContent).not.toContain("rejectUnauthorized: false");
  });
});
