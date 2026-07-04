import Link from "next/link";
import { Shield } from "lucide-react";

/**
 * Site header — public navigation with brand identity.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-sm">
      <nav
        className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]"
        >
          <Shield
            className="h-5 w-5 text-[var(--color-accent)]"
            aria-hidden="true"
          />
          <span className="mono">PROVING_GROUNDS</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link
            href="/leaderboard"
            className="text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)]"
          >
            Leaderboard
          </Link>
          <Link
            href="/methodology"
            className="text-[var(--color-text-dim)] transition-colors hover:text-[var(--color-text)]"
          >
            Methodology
          </Link>
          <Link
            href="/submit"
            className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[var(--color-text)] transition-colors hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)]"
          >
            Submit Agent
          </Link>
        </div>
      </nav>
    </header>
  );
}
