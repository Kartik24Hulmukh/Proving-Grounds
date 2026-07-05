import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MethodologyView } from "@/components/methodology/methodology-view";

/**
 * Methodology route — P1.1
 * Renders the published rubric + scoring explanation.
 */
export default function MethodologyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8" role="main">
        <MethodologyView />
      </main>
      <SiteFooter />
    </>
  );
}
