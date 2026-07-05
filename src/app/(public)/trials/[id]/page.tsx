import { neon } from "@neondatabase/serverless";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TrialReplayReal } from "@/components/trial/trial-replay-real";

/**
 * Trial replay viewer route — P4.3
 * Plays REAL video and lists REAL steps from the database.
 * Mocks have been removed.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TrialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const databaseUrl = process.env.DATABASE_URL;

  let trialData: {
    trial: Record<string, unknown>;
    steps: Record<string, unknown>[];
    evidence: Record<string, unknown>[];
    verdict: Record<string, unknown> | null;
    product: Record<string, unknown> | null;
    scenario: Record<string, unknown> | null;
  } | null = null;

  if (databaseUrl) {
    const sql = neon(databaseUrl);
    const trials = await sql`
      SELECT t.*, av.label as version_label, p.name as product_name, p.adapter_key as product_slug,
             s.title as scenario_title, s.slug as scenario_slug
      FROM trial t
      JOIN agent_version av ON t.agent_version_id = av.id
      JOIN product p ON av.product_id = p.id
      JOIN scenario s ON t.scenario_id = s.id
      WHERE t.id = ${id}
      LIMIT 1
    `;

    if (trials.length > 0) {
      const steps = await sql`
        SELECT idx, ts, actor, action
        FROM trial_step
        WHERE trial_id = ${id}
        ORDER BY idx
      `;

      const evidence = await sql`
        SELECT id, kind, url, bytes, sha256
        FROM evidence
        WHERE trial_id = ${id}
        ORDER BY kind
      `;

      const verdicts = await sql`
        SELECT passed, score, rationale, injected_defense_held, rubric_version, judge_model
        FROM verdict
        WHERE trial_id = ${id}
        LIMIT 1
      `;

      trialData = {
        trial: trials[0],
        steps,
        evidence,
        verdict: verdicts.length > 0 ? verdicts[0] : null,
        product: null,
        scenario: null,
      };
    }
  }

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8" role="main">
        {trialData ? (
          <TrialReplayReal trialId={id} data={trialData} />
        ) : (
          <div className="surface p-8 text-center">
            <p className="text-[var(--color-text-dim)]">Trial not found.</p>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
