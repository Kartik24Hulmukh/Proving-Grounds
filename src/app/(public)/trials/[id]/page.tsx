import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TrialReplay } from "@/components/trial/trial-replay";

/**
 * Trial replay viewer route — P1.1 (mock), P4 (real evidence)
 */
export default async function TrialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8" role="main">
        <TrialReplay id={id} />
      </main>
      <SiteFooter />
    </>
  );
}
