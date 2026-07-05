import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductProfile } from "@/components/product/product-profile";

/**
 * Product profile route — P1.1
 * Shows product info, versions, pass rate, recent trials.
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
