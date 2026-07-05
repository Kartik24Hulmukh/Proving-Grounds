import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TrialReplayReal } from "@/components/trial/trial-replay-real";
import { getTrialDetail, getTrialSteps, getTrialEvidence } from "@/lib/db/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Trial replay viewer route — R1 (Blocker 1) / P4.3.
 * Live data from Neon via shared queries module. No mock data.
 */
export default async function TrialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trial = await getTrialDetail(id);

  if (!trial) {
    return (
      <>
        <SiteHeader />
        <main id="main-content" className="mx-auto max-w-6xl px-4 py-8" role="main">
          <div className="surface p-8 text-center">
            <p className="text-[var(--color-text-dim)]">Trial not found.</p>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const [steps, evidence] = await Promise.all([
    getTrialSteps(id),
    getTrialEvidence(id),
  ]);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8" role="main">
        <TrialReplayReal trialId={id} trial={trial} steps={steps} evidence={evidence} />
      </main>
      <SiteFooter />
    </>
  );
}
