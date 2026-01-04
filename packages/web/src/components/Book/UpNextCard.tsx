'use client';

import { motion } from 'framer-motion';
import type { BookData } from '@bookmarx/shared';

interface UpNextCardProps {
  currentBook: BookData;
  nextBook: BookData;
  onReadNext: () => void;
  onBackToLibrary: () => void;
}

// Category display names
const CATEGORY_LABELS: Record<string, string> = {
  thread: 'Thread',
  article: 'Article',
  quick_take: 'Quick Take',
  media: 'Video',
};

// Color palettes matching the Library BookCard
const CATEGORY_PALETTES: Record<string, { primary: string; secondary: string; accent: string }> = {
  thread: {
    primary: '#1a3a52',
    secondary: '#2d5a7b',
    accent: '#c9a962',
  },
  article: {
    primary: '#4a2c2a',
    secondary: '#6b3d3a',
    accent: '#d4af37',
  },
  quick_take: {
    primary: '#2d4a3e',
    secondary: '#3d6354',
    accent: '#b8860b',
  },
  media: {
    primary: '#3d2d4a',
    secondary: '#5a4270',
    accent: '#daa520',
  },
};

export function UpNextCard({ currentBook, nextBook, onReadNext, onBackToLibrary }: UpNextCardProps) {
  const nextPalette = CATEGORY_PALETTES[nextBook.category] || CATEGORY_PALETTES.thread;
  const previewText = nextBook.bookmarks[0]?.content.slice(0, 100) || '';
  const isSameCategory = currentBook.category === nextBook.category;

  return (
    <div className="book-page paper-texture flex flex-col h-full">
      {/* Completion message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center pt-8 pb-6 px-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center"
        >
          <CheckCircleIcon />
        </motion.div>
        <h2
          className="text-xl font-semibold text-[var(--text-primary)] mb-1"
          style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
        >
          Finished reading
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          @{currentBook.authorHandle}'s {CATEGORY_LABELS[currentBook.category]?.toLowerCase() || 'post'}
        </p>
      </motion.div>

      {/* Divider */}
      <div className="flex items-center gap-4 px-8 py-2">
        <div className="flex-1 h-px bg-[var(--border-light)]" />
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Up Next</span>
        <div className="flex-1 h-px bg-[var(--border-light)]" />
      </div>

      {/* Next book preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex-1 px-6 py-4"
      >
        <button
          onClick={onReadNext}
          className="w-full h-full rounded-xl overflow-hidden text-left transition-transform hover:scale-[1.02] active:scale-[0.99]"
          style={{
            background: `linear-gradient(135deg, ${nextPalette.secondary} 0%, ${nextPalette.primary} 100%)`,
          }}
        >
          <div className="relative h-full p-5 flex flex-col">
            {/* Texture overlay */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Category badge */}
            {!isSameCategory && (
              <div
                className="inline-flex self-start px-2 py-0.5 rounded text-xs font-medium mb-3"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.9)'
                }}
              >
                {CATEGORY_LABELS[nextBook.category] || 'Post'}
              </div>
            )}

            {/* Author info */}
            <div className="flex items-center gap-3 mb-3">
              {nextBook.authorAvatarUrl ? (
                <img
                  src={nextBook.authorAvatarUrl}
                  alt=""
                  className="w-10 h-10 rounded-full border-2"
                  style={{ borderColor: nextPalette.accent }}
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: nextPalette.accent
                  }}
                >
                  {nextBook.authorHandle.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  @{nextBook.authorHandle}
                </p>
                {nextBook.pageCount > 1 && (
                  <p className="text-xs" style={{ color: `${nextPalette.accent}` }}>
                    {nextBook.pageCount} pages
                  </p>
                )}
              </div>
            </div>

            {/* Preview text */}
            <p
              className="flex-1 text-sm leading-relaxed text-white/90 line-clamp-4"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
            >
              {previewText}...
            </p>

            {/* Read button hint */}
            <div className="mt-4 flex items-center justify-between">
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: nextPalette.accent }}
              >
                Continue Reading
              </span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRightIcon color={nextPalette.accent} />
              </motion.div>
            </div>
          </div>
        </button>
      </motion.div>

      {/* Back to library button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="px-6 pb-6 pt-2"
      >
        <button
          onClick={onBackToLibrary}
          className="w-full py-3 rounded-full text-sm font-medium border border-[var(--border-medium)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Back to Library
        </button>
      </motion.div>
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ArrowRightIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
