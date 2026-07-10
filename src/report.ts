import type { Capsule } from './domain.js';
import { escapeHtml } from './utils.js';

function summaryRow(label: string, value: number): string {
  return `<tr><th>${escapeHtml(label)}</th><td>${value}</td></tr>`;
}

export function renderReport(capsule: Omit<Capsule, 'integrity'>): string {
  const claimRows = capsule.claims
    .map(
      (claim) => `
        <tr>
          <td>${escapeHtml(claim.id)}</td>
          <td>${escapeHtml(claim.type)}</td>
          <td>${escapeHtml(claim.base)}</td>
          <td>${escapeHtml(claim.head)}</td>
          <td>${escapeHtml(claim.verdict)}</td>
          <td>${escapeHtml(claim.statement)}</td>
        </tr>`,
    )
    .join('');

  const artifactRows = Object.entries(capsule.artifacts)
    .filter(([name]) => name !== 'report')
    .map(
      ([name, artifact]) => `
        <tr>
          <td>${escapeHtml(name)}</td>
          <td><code>${escapeHtml(artifact.path)}</code></td>
          <td><code>${escapeHtml(artifact.sha256)}</code></td>
        </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Evidence Report</title>
<style>
  :root { color-scheme: light; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; }
  body { margin: 0; background: #f6f7fb; color: #121826; }
  main { max-width: 1180px; margin: 0 auto; padding: 32px 20px 48px; }
  .hero { background: linear-gradient(135deg, #101828, #3b82f6); color: white; border-radius: 20px; padding: 28px; box-shadow: 0 18px 60px rgba(15, 23, 42, 0.18); }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-top: 16px; }
  .card { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.16); border-radius: 16px; padding: 14px 16px; }
  .card label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; opacity: .78; }
  .card strong { display: block; font-size: 24px; margin-top: 8px; }
  section { margin-top: 28px; background: white; border-radius: 18px; padding: 18px; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  th { background: #f9fafb; font-weight: 600; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
  .meta { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
  .meta div { background: #f9fafb; border-radius: 12px; padding: 12px 14px; }
  .muted { color: #667085; }
</style>
</head>
<body>
<main>
  <div class="hero">
    <div class="muted">Evidence Compiler</div>
    <h1 style="margin: 8px 0 0;">${escapeHtml(capsule.repository.baseSha.slice(0, 12))} → ${escapeHtml(
      capsule.repository.headSha.slice(0, 12),
    )}</h1>
    <div class="grid">
      <div class="card"><label>Demonstrated</label><strong>${capsule.summary.demonstrated}</strong></div>
      <div class="card"><label>Regression</label><strong>${capsule.summary.regression}</strong></div>
      <div class="card"><label>Vacuous</label><strong>${capsule.summary.vacuous}</strong></div>
      <div class="card"><label>Inconclusive</label><strong>${capsule.summary.inconclusive}</strong></div>
    </div>
  </div>

  <section>
    <h2>Repository</h2>
    <div class="meta">
      <div><strong>Root</strong><br /><code>${escapeHtml(capsule.repository.root)}</code></div>
      <div><strong>Claims</strong><br /><code>${escapeHtml(capsule.repository.claimsPath)}</code></div>
      <div><strong>Replay</strong><br /><code>${escapeHtml(capsule.replay.command.join(' '))}</code></div>
    </div>
  </section>

  <section>
    <h2>Claims</h2>
    <table>
      <thead>
        <tr><th>Id</th><th>Type</th><th>Base</th><th>Head</th><th>Verdict</th><th>Statement</th></tr>
      </thead>
      <tbody>${claimRows}</tbody>
    </table>
  </section>

  <section>
    <h2>Artifacts</h2>
    <table>
      <thead>
        <tr><th>Name</th><th>Path</th><th>Sha256</th></tr>
      </thead>
      <tbody>${artifactRows}</tbody>
    </table>
  </section>
</main>
</body>
</html>`;
}
