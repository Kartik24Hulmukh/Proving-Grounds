import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Shield, Zap, Eye, Scale } from "lucide-react";

/**
 * Landing page — P0 minimal shell.
 * Feature UI comes in P1; this just confirms the app boots and renders.
 */
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto max-w-6xl px-4 py-16"
        role="main"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-sm text-[var(--color-text-dim)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-accent)]" />
            <span className="mono">SYSTEM_ONLINE</span>
          </div>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-[var(--color-text)] sm:text-5xl md:text-6xl">
            Adversarial testing for{" "}
            <span className="text-[var(--color-accent)]">AI agent products</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--color-text-dim)]">
            Real tasks. Hidden traps. Full evidence. Reproducible verdicts.
            We put shipping agents through nasty, real-world scenarios and publish the footage.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Zap, title: "Adversarial Scenarios", desc: "Prompt-injection traps, refusal cases, real-world nastiness" },
            { icon: Eye, title: "Full Evidence", desc: "Video, trace, HAR, DOM snapshots — all captured, all public" },
            { icon: Scale, title: "Reproducible Verdicts", desc: "Pinned model, temperature 0, published rubric, rule-oracle first" },
            { icon: Shield, title: "Independent Lab", desc: "No gaming. Hidden oracle variants. Rotating scenario seeds" },
          ].map((f) => (
            <div
              key={f.title}
              className="surface surface-hover p-6"
            >
              <f.icon
                className="mb-4 h-6 w-6 text-[var(--color-accent)]"
                aria-hidden="true"
              />
              <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">
                {f.title}
              </h3>
              <p className="text-sm text-[var(--color-muted)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
