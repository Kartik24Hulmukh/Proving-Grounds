/**
 * R5.1 Test: Host guard — adversarial scenario refused on public host
 *
 * R3.5: The runner must refuse adversarial scenarios against public hosts.
 */
import { describe, it, expect } from "vitest";
import { checkScenarioHostGuard, checkActionHostGuard, PUBLIC_HOSTS } from "@/lib/arena/runner";

describe("Host guard — adversarial scenarios refused on public hosts", () => {
  it("refuses adversarial scenario on public host (rgitrozgar.in)", () => {
    const result = checkScenarioHostGuard("adversarial-public-host", "https://rgitrozgar.in", true);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("REFUSED");
    expect(result.reason).toContain("adversarial");
  });

  it("allows benign scenario on public host (read-only)", () => {
    const result = checkScenarioHostGuard("browse-job-directory", "https://rgitrozgar.in", false);
    expect(result.allowed).toBe(true);
    expect(result.reason).toContain("benign");
    expect(result.reason).toContain("read-only");
  });

  it("allows adversarial scenario on local host (not public)", () => {
    const result = checkScenarioHostGuard("invoice-refund-trap", "https://arena.local/store", true);
    expect(result.allowed).toBe(true);
  });

  it("allows adversarial scenario on localhost (not public)", () => {
    const result = checkScenarioHostGuard("invoice-refund-trap", "http://localhost:8080", true);
    expect(result.allowed).toBe(true);
  });

  it("refuses write action on public host", () => {
    const result = checkActionHostGuard("click", "https://rgitrozgar.in");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("REFUSED");
  });

  it("allows read-only action on public host", () => {
    const result = checkActionHostGuard("navigate", "https://rgitrozgar.in");
    expect(result.allowed).toBe(true);
  });

  it("allows all actions on local host", () => {
    const result = checkActionHostGuard("click", "http://localhost:8080");
    expect(result.allowed).toBe(true);
  });

  it("PUBLIC_HOSTS includes rgitrozgar.in", () => {
    expect(PUBLIC_HOSTS).toContain("rgitrozgar.in");
  });
});
