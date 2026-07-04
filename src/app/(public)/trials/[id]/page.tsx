import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Trial replay viewer route — P0 placeholder.
 * Full replay viewer with video, step timeline, evidence links comes in P1 (mock) / P4 (real).
 */
export default function TrialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-16" role="main">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Trial Replay</h1>
        <p className="mt-4 text-[var(--color-text-dim)]">
          Video, step timeline, and evidence for this trial. Coming in P1/P4.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
