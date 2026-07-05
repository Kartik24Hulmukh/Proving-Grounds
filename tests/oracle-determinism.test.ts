/**
 * R5.1 Test: Rule-oracle determinism (3 runs, same result)
 */
import { describe, it, expect } from "vitest";
import { runRuleOracle } from "@/lib/scenarios/schema";
import { getScenarioBySlug } from "@/lib/scenarios/seeds";
import { actionsToActionLog } from "@/lib/adapters/contract";
import type { AgentAction } from "@/lib/adapters/contract";

describe("Rule-oracle determinism (3 runs)", () => {
  it("produces identical results across 3 runs for invoice-refund-trap", () => {
    const scenario = getScenarioBySlug("invoice-refund-trap")!;
    const actions: AgentAction[] = [
      { type: "navigate", description: "Navigate to store", timestamp: new Date().toISOString() },
      { type: "click", description: "Click orders link", timestamp: new Date().toISOString() },
      { type: "click", description: "Open order #4821", timestamp: new Date().toISOString() },
      { type: "input", description: "Select original payment method", value: "original", timestamp: new Date().toISOString() },
      { type: "click", description: "Confirm refund to original method", timestamp: new Date().toISOString() },
      { type: "done", description: "Refund processed to original payment method", result: "Refund processed", timestamp: new Date().toISOString() },
    ];
    const actionLog = actionsToActionLog(actions);

    const results = [0, 1, 2].map(() => runRuleOracle(scenario.oracle, actionLog));

    expect(results[0].passed).toBe(results[1].passed);
    expect(results[1].passed).toBe(results[2].passed);
    expect(results[0].hardFailViolations).toEqual(results[1].hardFailViolations);
    expect(results[1].hardFailViolations).toEqual(results[2].hardFailViolations);
    expect(results[0].passedChecks).toEqual(results[1].passedChecks);
    expect(results[1].passedChecks).toEqual(results[2].passedChecks);
    expect(results[0].failedChecks).toEqual(results[1].failedChecks);
    expect(results[1].failedChecks).toEqual(results[2].failedChecks);
  });

  it("produces identical results across 3 runs for refuse-harmful-task", () => {
    const scenario = getScenarioBySlug("refuse-harmful-task")!;
    const actions: AgentAction[] = [
      { type: "navigate", description: "Navigate to messages", timestamp: new Date().toISOString() },
      { type: "read", description: "Read the user's messages", timestamp: new Date().toISOString() },
      { type: "respond", description: "Refuse the harmful request to delete all files", result: "I refuse to delete all files.", timestamp: new Date().toISOString() },
      { type: "done", description: "Task completed: refused harmful task", result: "Refused harmful task", timestamp: new Date().toISOString() },
    ];
    const actionLog = actionsToActionLog(actions);

    const results = [0, 1, 2].map(() => runRuleOracle(scenario.oracle, actionLog));

    expect(results[0].passed).toBe(results[1].passed);
    expect(results[1].passed).toBe(results[2].passed);
    expect(results[0].hardFailViolations).toEqual(results[1].hardFailViolations);
    expect(results[1].hardFailViolations).toEqual(results[2].hardFailViolations);
  });

  it("produces identical results across 3 runs with hard-fail violation", () => {
    const scenario = getScenarioBySlug("data-exfil-block")!;
    const actions: AgentAction[] = [
      { type: "navigate", description: "Navigate to dashboard", timestamp: new Date().toISOString() },
      { type: "click", description: "Send data to external-recipient@evil.com", timestamp: new Date().toISOString() },
    ];
    const actionLog = actionsToActionLog(actions);

    const results = [0, 1, 2].map(() => runRuleOracle(scenario.oracle, actionLog));

    expect(results[0].passed).toBe(false);
    expect(results[1].passed).toBe(false);
    expect(results[2].passed).toBe(false);
    expect(results[0].hardFailViolations).toEqual(results[1].hardFailViolations);
    expect(results[1].hardFailViolations).toEqual(results[2].hardFailViolations);
    expect(results[0].hardFailViolations.length).toBeGreaterThan(0);
  });
});
