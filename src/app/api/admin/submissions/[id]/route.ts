/**
 * /api/admin/submissions/[id] — P6.3, P6.4
 *
 * Admin actions on submissions:
 *   POST action=approve → creates product + agent_version, enqueues trial
 *   POST action=reject  → records reason, hides from queue
 */

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body.action as string;
  const reason = body.reason as string | undefined;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  const sql = neon(databaseUrl);

  if (action === "approve") {
    // ─── P6.3: Approve → enqueue → trial executes ────────────────────────
    // 1. Get the submission
    const submissions = await sql`
      SELECT * FROM submission WHERE id = ${id} LIMIT 1
    `;
    if (submissions.length === 0) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    const submission = submissions[0];
    const payload = submission.adapter_payload as Record<string, unknown>;

    // 2. Create product (or update if exists)
    const existingProducts = await sql`
      SELECT id FROM product WHERE adapter_key = ${String(payload.adapterKey)}
    `;
    let productId: string;

    if (existingProducts.length > 0) {
      productId = existingProducts[0].id as string;
      await sql`
        UPDATE product SET status = 'approved', updated_at = now()
        WHERE id = ${productId}
      `;
    } else {
      const newProduct = await sql`
        INSERT INTO product (name, vendor, homepage, adapter_key, status, description)
        VALUES (
          ${String(payload.productName)},
          ${String(payload.vendor)},
          ${String(payload.homepage)},
          ${String(payload.adapterKey)},
          'approved',
          ${String(payload.description ?? "")}
        )
        RETURNING id
      `;
      productId = newProduct[0].id as string;
    }

    // 3. Create agent_version
    const versionRows = await sql`
      INSERT INTO agent_version (product_id, label, adapter_config)
      VALUES (
        ${productId},
        ${String(payload.versionLabel ?? "v1.0.0")},
        ${JSON.stringify(payload.adapterConfig ?? {})}::jsonb
      )
      RETURNING id
    `;
    const agentVersionId = versionRows[0].id as string;

    // 4. Enqueue trials for each scenario
    const scenarioSlugs = (payload.scenarios as string[]) ?? [];
    const trialIds: string[] = [];

    for (const slug of scenarioSlugs) {
      const scenarioRows = await sql`
        SELECT id FROM scenario WHERE slug = ${slug} AND active = true LIMIT 1
      `;
      if (scenarioRows.length === 0) continue;

      const scenarioId = scenarioRows[0].id as string;
      const trialRows = await sql`
        INSERT INTO trial (agent_version_id, scenario_id, status)
        VALUES (${agentVersionId}, ${scenarioId}, 'queued')
        RETURNING id
      `;
      trialIds.push(trialRows[0].id as string);
    }

    // 5. Update submission status
    await sql`
      UPDATE submission SET status = 'approved', reviewed_at = now()
      WHERE id = ${id}
    `;

    return NextResponse.json({
      action: "approved",
      productId,
      agentVersionId,
      enqueuedTrials: trialIds,
      message: `Approved and enqueued ${trialIds.length} trial(s)`,
    });
  } else if (action === "reject") {
    // ─── P6.4: Reject path records reason and hides from queue ───────────
    await sql`
      UPDATE submission
      SET status = 'rejected', notes = ${reason ?? "Rejected by admin"}, reviewed_at = now()
      WHERE id = ${id}
    `;

    return NextResponse.json({
      action: "rejected",
      message: "Submission rejected and hidden from queue",
    });
  } else {
    return NextResponse.json(
      { error: "Invalid action. Use 'approve' or 'reject'." },
      { status: 400 }
    );
  }
}
