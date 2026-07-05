/**
 * R5.1 Test: Scenario + Oracle Zod validation
 *
 * Verifies that all seed scenarios validate against the Zod schema,
 * and that invalid scenarios are rejected.
 */
import { describe, it, expect } from "vitest";
import { scenarioSpecSchema, oracleSchema, scenarioSchema, runRuleOracle } from "@/lib/scenarios/schema";
import { seedScenarios, getScenarioBySlug } from "@/lib/scenarios/seeds";

describe("Scenario Zod validation", () => {
  it("all seed scenarios validate against scenarioSchema", () => {
    for (const scenario of seedScenarios) {
      const result = scenarioSchema.safeParse(scenario);
      expect(result.success, `Scenario "${scenario.spec.slug}" should validate: ${result.success ? "" : JSON.stringify(result.error.issues)}`).toBe(true);
    }
  });

  it("all seed scenario specs validate against scenarioSpecSchema", () => {
    for (const scenario of seedScenarios) {
      const result = scenarioSpecSchema.safeParse(scenario.spec);
      expect(result.success, `Spec "${scenario.spec.slug}" should validate`).toBe(true);
    }
  });

  it("all seed oracles validate against oracleSchema", () => {
    for (const scenario of seedScenarios) {
      const result = oracleSchema.safeParse(scenario.oracle);
      expect(result.success, `Oracle "${scenario.spec.slug}" should validate`).toBe(true);
    }
  });

  it("rejects scenario with empty slug", () => {
    const invalid = { ...seedScenarios[0], spec: { ...seedScenarios[0].spec, slug: "" } };
    const result = scenarioSpecSchema.safeParse(invalid.spec);
    expect(result.success).toBe(false);
  });

  it("rejects scenario with invalid URL", () => {
    const invalid = { ...seedScenarios[0], spec: { ...seedScenarios[0].spec, startUrl: "not-a-url" } };
    const result = scenarioSpecSchema.safeParse(invalid.spec);
    expect(result.success).toBe(false);
  });

  it("rejects oracle with empty mustDo", () => {
    const invalid = { ...seedScenarios[0], oracle: { ...seedScenarios[0].oracle, mustDo: [] } };
    const result = oracleSchema.safeParse(invalid.oracle);
    expect(result.success).toBe(false);
  });

  it("rejects scenario with timeoutMs > 600000", () => {
    const invalid = { ...seedScenarios[0], spec: { ...seedScenarios[0].spec, timeoutMs: 700000 } };
    const result = scenarioSpecSchema.safeParse(invalid.spec);
    expect(result.success).toBe(false);
  });

  it("getScenarioBySlug returns correct scenario", () => {
    const scenario = getScenarioBySlug("form-fill-basic");
    expect(scenario).toBeDefined();
    expect(scenario?.spec.slug).toBe("form-fill-basic");
  });

  it("getScenarioBySlug returns undefined for unknown slug", () => {
    const scenario = getScenarioBySlug("nonexistent-scenario");
    expect(scenario).toBeUndefined();
  });
});

describe("Rule oracle validation", () => {
  it("runRuleOracle is deterministic — same input yields same output", () => {
    const scenario = getScenarioBySlug("invoice-refund-trap")!;
    const actionLog = [
      { idx: 0, ts: new Date().toISOString(), actor: "agent", action: { type: "navigate", description: "Navigate to store" } },
      { idx: 1, ts: new Date().toISOString(), actor: "agent", action: { type: "click", description: "Refund to original payment method" } },
    ];

    const result1 = runRuleOracle(scenario.oracle, actionLog);
    const result2 = runRuleOracle(scenario.oracle, actionLog);

    expect(result1.passed).toBe(result2.passed);
    expect(result1.hardFailViolations).toEqual(result2.hardFailViolations);
    expect(result1.passedChecks).toEqual(result2.passedChecks);
    expect(result1.failedChecks).toEqual(result2.failedChecks);
  });

  it("runRuleOracle detects hard-fail mustNotDo violation", () => {
    const scenario = getScenarioBySlug("invoice-refund-trap")!;
    const actionLog = [
      { idx: 0, ts: new Date().toISOString(), actor: "agent", action: { type: "click", description: "Refund to attacker@x.com" } },
    ];

    const result = runRuleOracle(scenario.oracle, actionLog);
    expect(result.hardFailViolations.length).toBeGreaterThan(0);
    expect(result.passed).toBe(false);
  });
});
