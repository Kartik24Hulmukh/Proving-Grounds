/**
 * Site footer — minimal, with links.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-[var(--color-muted)] sm:flex-row">
        <p className="mono">PROVING_GROUNDS — independent adversarial testing lab</p>
        <div className="flex gap-6">
          <span>Reproducible evidence</span>
          <span>Public verdicts</span>
        </div>
      </div>
    </footer>
  );
}
