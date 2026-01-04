'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-[var(--border-light)]">
        <h1 className="text-xl font-bold text-[var(--accent-primary)]" style={{ fontFamily: 'var(--font-literata), Georgia, serif' }}>
          BookmarX
        </h1>
        <ThemeToggle />
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-2xl text-center space-y-8">
          {/* Animated book icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="mx-auto w-24 h-24 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center"
          >
            <span className="text-5xl">📚</span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <h2
              className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] leading-tight"
              style={{ fontFamily: 'var(--font-literata), Georgia, serif' }}
            >
              Your Bookmarks,<br />Beautifully Read
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-md mx-auto">
              Transform your X bookmarks into a Kindle-style reading experience
              with page-turn animations and distraction-free focus.
            </p>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/reader"
              className="px-8 py-3 rounded-full text-base font-semibold bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-lg hover:shadow-xl"
            >
              Try Demo Reader
            </Link>
            <button className="px-8 py-3 rounded-full text-base font-semibold border-2 border-[var(--border-medium)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
              Install Extension
            </button>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left"
          >
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)]">
              <span className="text-2xl mb-2 block">📖</span>
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">Page-Turn Animation</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Satisfying 3D page flips that feel like a real book
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)]">
              <span className="text-2xl mb-2 block">🎨</span>
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">Reading Themes</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Light, dark, and sepia modes for comfortable reading
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)]">
              <span className="text-2xl mb-2 block">📊</span>
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">Track Progress</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Never lose your place with read/unread tracking
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-sm text-[var(--text-muted)] border-t border-[var(--border-light)]">
        <p>Built with care for the bookmark hoarders among us</p>
      </footer>
    </div>
  );
}
