import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductProfile } from "@/components/product/product-profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Product profile route — R1 (Blocker 1).
 * Live data from Neon. No mock data.
 */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8" role="main">
        <ProductProfile slug={slug} />
      </main>
      <SiteFooter />
    </>
  );
}
