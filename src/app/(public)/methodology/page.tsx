import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Methodology route — P0 placeholder.
 * Full rubric publication + scoring explanation comes in P1.
 */
export default function MethodologyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-16" role="main">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Methodology</h1>
        <p className="mt-4 text-[var(--color-text-dim)]">
          How we score agents: published rubric, rule-oracle-first judging, reproducibility guarantees. Coming in P1.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
