import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 text-center">
      <p className="mono text-sm text-[var(--color-accent)]">ERROR_404</p>
      <h1 className="mt-4 text-4xl font-bold text-[var(--color-text)]">Not Found</h1>
      <p className="mt-4 text-[var(--color-text-dim)]">
        This page doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text)] transition-colors hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)]"
      >
        Back to home
      </Link>
    </main>
  );
}
