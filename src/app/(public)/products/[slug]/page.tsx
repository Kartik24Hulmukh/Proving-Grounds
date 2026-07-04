import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/**
 * Product profile route — P0 placeholder.
 * Full product profile with versions, pass rate, recent trials comes in P1.
 */
export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-16" role="main">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Product Profile</h1>
        <p className="mt-4 text-[var(--color-text-dim)]">
          Agent product details, version history, and trial results. Coming in P1.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
