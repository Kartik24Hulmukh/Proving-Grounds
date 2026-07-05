/**
 * Fixture Arena Server — serves all scenario fixture pages on :9876.
 *
 * This is the SINGLE fixture target for all scored trials. Every scenario's
 * startUrl (https://arena.local/<path>) is routed here via Playwright request
 * interception in the adapter. The server serves deterministic HTML for each
 * path, including injected content for adversarial scenarios.
 *
 * Port: 9876
 * Host: localhost (arena.local via /etc/hosts or adapter interception)
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { getScenarioBySlug } from "@/lib/scenarios/seeds";

export interface FixtureServer {
  port: number;
  close(): Promise<void>;
}

/**
 * Build the HTML for a fixture path by looking up the scenario's fixture pages.
 * Falls back to a default page if no scenario matches the path.
 */
function getFixtureHtml(path: string): string {
  // Normalize path
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Search all scenarios for a matching fixture page
  // We import the full seed list and check each scenario's fixtures
  const allSlugs = [
    "invoice-refund-trap",
    "prompt-injection-email",
    "api-key-leak",
    "refuse-harmful-task",
    "form-fill-basic",
    "multi-page-nav",
    "code-fix-bug",
    "data-exfil-block",
    // New scenarios
    "job-search-filter",
    "cart-checkout-happy",
    "support-ticket-triage",
    "data-extract-paginated",
    "prompt-injection-canary",
    "refund-trap-darkpattern",
    "delegation-exfil",
  ];

  for (const slug of allSlugs) {
    const scenario = getScenarioBySlug(slug);
    if (!scenario) continue;

    for (const page of scenario.spec.fixtures.pages) {
      if (page.path === normalizedPath) {
        // Inject injectedContent into the HTML (for adversarial scenarios)
        let html = page.html;
        for (const injected of page.injectedContent) {
          // Insert before </body>
          if (html.includes("</body>")) {
            html = html.replace("</body>", `${injected}</body>`);
          } else {
            html = html + injected;
          }
        }
        return html;
      }
    }
  }

  // Default fallback page
  return `<!DOCTYPE html><html><body><h1>Fixture Page</h1><p>Path: ${normalizedPath}</p></body></html>`;
}

/**
 * Start the fixture server on port 9876.
 * Returns a handle that can be used to close the server.
 */
export async function startFixtureServer(port: number = 9876): Promise<FixtureServer> {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? "/";
    const path = url.split("?")[0]; // strip query params

    const html = getFixtureHtml(path);

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(html);
  });

  await new Promise<void>((resolve) => server.listen(port, resolve));
  console.log(`[fixture-server] Listening on http://localhost:${port}`);

  return {
    port,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
