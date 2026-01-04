'use client';

import { Library } from '@/components/Library';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';

export default function ReaderPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-light)]">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-literata), Georgia, serif', color: 'var(--accent-primary)' }}
          >
            BookmarX
          </Link>
          <span className="text-[var(--text-muted)] text-sm">Library</span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      {/* Main library area */}
      <main className="pt-20 px-6 max-w-7xl mx-auto">
        <Library />
      </main>
    </div>
  );
}
