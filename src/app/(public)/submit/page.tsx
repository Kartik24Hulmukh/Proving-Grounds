import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SubmitForm } from "@/components/intake/submit-form";

/**
 * Submit-your-agent route — P6.1
 * Real intake form with adapter payload validation.
 */
export default function SubmitPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-2xl px-4 py-8" role="main">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Submit Your Agent</h1>
          <p className="mt-2 text-[var(--color-text-dim)]">
            Want your agent product on the Proving Grounds leaderboard? Fill out the adapter
            payload below. Our team will review it and run trials against our adversarial scenarios.
          </p>
        </div>
        <SubmitForm />
      </main>
      <SiteFooter />
    </>
  );
}
