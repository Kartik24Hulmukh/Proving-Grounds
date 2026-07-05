/**
 * Fixture-only invariant tests.
 *
 * Scored trials may run ONLY against fixture targets, never the live web.
 * - A scored trial pointed at a NON-fixture host is rejected with reason
 *   'non_fixture_target', zero evidence, zero uploads.
 * - A trial pointed at the fixture host (:9876 / localhost) completes normally.
 * - Intake rejects a non-fixture target before enqueue.
 */
import { describe, it, expect } from "vitest";
import {
  checkFixtureTargetGuard,
  FIXTURE_TARGET_ALLOWLIST,
} from "@/lib/arena/runner";

describe("Fixture-only invariant — checkFixtureTargetGuard", () => {
  it("allows localhost fixture target (the :9876 fixture server)", () => {
    const result = checkFixtureTargetGuard("http://localhost:9876");
    expect(result.allowed).toBe(true);
  });

  it("allows arena.local fixture target", () => {
    const result = checkFixtureTargetGuard("https://arena.local/store");
    expect(result.allowed).toBe(true);
  });

  it("allows 127.0.0.1 fixture target", () => {
    const result = checkFixtureTargetGuard("http://127.0.0.1:8080");
    expect(result.allowed).toBe(true);
  });

  it("rejects a public host with reason 'non_fixture_target'", () => {
    const result = checkFixtureTargetGuard("https://rgitrozgar.in");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("non_fixture_target");
  });

  it("rejects an arbitrary live-web host with reason 'non_fixture_target'", () => {
    const result = checkFixtureTargetGuard("https://example.com/page");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("non_fixture_target");
  });

  it("rejects a subdomain of a non-fixture host", () => {
    const result = checkFixtureTargetGuard("https://api.example.com");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("non_fixture_target");
  });

  it("FIXTURE_TARGET_ALLOWLIST contains localhost and arena.local", () => {
    expect(FIXTURE_TARGET_ALLOWLIST).toContain("localhost");
    expect(FIXTURE_TARGET_ALLOWLIST).toContain("arena.local");
    expect(FIXTURE_TARGET_ALLOWLIST).toContain("127.0.0.1");
  });
});

describe("Fixture-only invariant — scenario startUrls", () => {
  // These confirm the guard correctly classifies the real seed scenarios.
  it("form-fill-basic (arena.local) is a fixture target", () => {
    const result = checkFixtureTargetGuard("https://arena.local/form");
    expect(result.allowed).toBe(true);
  });

  it("browse-job-directory (rgitrozgar.in) is NOT a fixture target", () => {
    const result = checkFixtureTargetGuard("https://rgitrozgar.in");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("non_fixture_target");
  });

  it("adversarial-public-host (rgitrozgar.in) is NOT a fixture target", () => {
    const result = checkFixtureTargetGuard("https://rgitrozgar.in");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("non_fixture_target");
  });
});

describe("Fixture-only invariant — intake path rejects non-fixture targets", () => {
  // The intake route validates each requested scenario's startUrl via
  // getScenarioBySlug + checkFixtureTargetGuard before any DB insert.
  // This test exercises the exact guard chain intake uses.
  it("intake guard chain rejects browse-job-directory (non-fixture)", async () => {
    const { getScenarioBySlug } = await import("@/lib/scenarios/seeds");
    const scenario = getScenarioBySlug("browse-job-directory");
    expect(scenario).toBeDefined();
    const guard = checkFixtureTargetGuard(scenario!.spec.startUrl);
    expect(guard.allowed).toBe(false);
    expect(guard.reason).toBe("non_fixture_target");
  });

  it("intake guard chain rejects adversarial-public-host (non-fixture)", async () => {
    const { getScenarioBySlug } = await import("@/lib/scenarios/seeds");
    const scenario = getScenarioBySlug("adversarial-public-host");
    expect(scenario).toBeDefined();
    const guard = checkFixtureTargetGuard(scenario!.spec.startUrl);
    expect(guard.allowed).toBe(false);
    expect(guard.reason).toBe("non_fixture_target");
  });

  it("intake guard chain accepts form-fill-basic (fixture)", async () => {
    const { getScenarioBySlug } = await import("@/lib/scenarios/seeds");
    const scenario = getScenarioBySlug("form-fill-basic");
    expect(scenario).toBeDefined();
    const guard = checkFixtureTargetGuard(scenario!.spec.startUrl);
    expect(guard.allowed).toBe(true);
  });
});
