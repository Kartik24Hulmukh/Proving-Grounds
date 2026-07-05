/**
 * R5.1 Test: Intake adapter-payload contract
 *
 * Verifies that valid submissions pass validation and invalid ones are rejected.
 */
import { describe, it, expect } from "vitest";
import { adapterPayloadSchema, validateSubmission, safeValidateSubmission } from "@/lib/adapters/payload-schema";

const validPayload = {
  productName: "Test Agent",
  vendor: "Test Vendor",
  homepage: "https://example.com",
  adapterKey: "test-agent",
  description: "A test agent for validation testing purposes.",
  contactEmail: "test@example.com",
  versionLabel: "v1.0.0",
  adapterConfig: {
    runtime: "browser" as const,
    entrypoint: "node dist/main.js",
    envVars: ["API_KEY"],
    capabilities: ["browse", "click"],
  },
  scenarios: ["form-fill-basic"],
};

describe("Intake adapter-payload contract", () => {
  it("validates a correct payload", () => {
    const result = safeValidateSubmission(validPayload);
    expect(result.success).toBe(true);
  });

  it("validateSubmission returns parsed data for valid payload", () => {
    const data = validateSubmission(validPayload);
    expect(data.productName).toBe("Test Agent");
    expect(data.adapterConfig.runtime).toBe("browser");
  });

  it("rejects payload with short product name", () => {
    const invalid = { ...validPayload, productName: "A" };
    const result = safeValidateSubmission(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects payload with invalid homepage URL", () => {
    const invalid = { ...validPayload, homepage: "not-a-url" };
    const result = safeValidateSubmission(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects payload with invalid adapter key (uppercase)", () => {
    const invalid = { ...validPayload, adapterKey: "TestAgent" };
    const result = safeValidateSubmission(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects payload with invalid email", () => {
    const invalid = { ...validPayload, contactEmail: "not-an-email" };
    const result = safeValidateSubmission(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects payload with short description", () => {
    const invalid = { ...validPayload, description: "short" };
    const result = safeValidateSubmission(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects payload with no scenarios", () => {
    const invalid = { ...validPayload, scenarios: [] };
    const result = safeValidateSubmission(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects payload with invalid runtime enum", () => {
    const invalid = {
      ...validPayload,
      adapterConfig: { ...validPayload.adapterConfig, runtime: "invalid" },
    };
    const result = safeValidateSubmission(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects payload with missing versionLabel", () => {
    const { versionLabel, ...invalid } = validPayload;
    const result = safeValidateSubmission(invalid);
    expect(result.success).toBe(false);
  });

  it("accepts all valid runtime values", () => {
    for (const runtime of ["browser", "cli", "api"] as const) {
      const payload = { ...validPayload, adapterConfig: { ...validPayload.adapterConfig, runtime } };
      const result = safeValidateSubmission(payload);
      expect(result.success).toBe(true);
    }
  });
});
