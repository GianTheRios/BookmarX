'use client';

import { motion } from 'framer-motion';
import type { BookData } from '@bookmarx/shared';

interface BookCardProps {
  book: BookData;
  onClick: () => void;
}

// Rich, distinguished color palettes for each category - like cloth bindings
const CATEGORY_PALETTES: Record<string, { primary: string; secondary: string; accent: string }> = {
  thread: {
    primary: '#1a3a52',      // Deep navy
    secondary: '#2d5a7b',    // Lighter navy
    accent: '#c9a962',       // Antique gold
  },
  article: {
    primary: '#4a2c2a',      // Burgundy leather
    secondary: '#6b3d3a',    // Lighter burgundy
    accent: '#d4af37',       // Rich gold
  },
  quick_take: {
    primary: '#2d4a3e',      // Forest green
    secondary: '#3d6354',    // Lighter green
    accent: '#b8860b',       // Dark goldenrod
  },
  media: {
    primary: '#3d2d4a',      // Deep plum
    secondary: '#5a4270',    // Lighter plum
    accent: '#daa520',       // Goldenrod
  },
};

export function BookCard({ book, onClick }: BookCardProps) {
  const previewText = book.bookmarks[0]?.content.slice(0, 80) || '';
  const palette = CATEGORY_PALETTES[book.category] || CATEGORY_PALETTES.thread;

  return (
    <motion.button
      onClick={onClick}
      className="book-card-wrapper"
      whileHover="hover"
      whileTap="tap"
      initial="rest"
    >
      {/* 3D Book container */}
      <motion.div
        className="book-card-3d"
        variants={{
          rest: {
            rotateY: 0,
            rotateX: 0,
            z: 0,
          },
          hover: {
            rotateY: -15,
            rotateX: 5,
            z: 50,
            transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
          },
          tap: {
            scale: 0.97,
            transition: { duration: 0.1 }
          }
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Book spine (left edge) */}
        <div
          className="book-spine"
          style={{
            background: `linear-gradient(to right, ${palette.primary}, ${palette.secondary})`,
          }}
        >
          <div className="spine-detail" />
        </div>

        {/* Main book cover */}
        <div
          className="book-cover"
          style={{
            background: `linear-gradient(135deg, ${palette.secondary} 0%, ${palette.primary} 100%)`,
          }}
        >
          {/* Embossed texture overlay */}
          <div className="book-texture" />

          {/* Decorative border frame */}
          <div className="book-frame">
            <div className="book-frame-corner book-frame-corner--tl" />
            <div className="book-frame-corner book-frame-corner--tr" />
            <div className="book-frame-corner book-frame-corner--bl" />
            <div className="book-frame-corner book-frame-corner--br" />
          </div>

          {/* Cover image or author avatar */}
          <div className="book-cover-content">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt=""
                className="book-cover-image"
              />
            ) : book.authorAvatarUrl ? (
              <div className="book-avatar-container">
                <img
                  src={book.authorAvatarUrl}
                  alt=""
                  className="book-avatar"
                />
                <div className="book-avatar-ring" style={{ borderColor: palette.accent }} />
              </div>
            ) : (
              <div className="book-monogram" style={{ color: palette.accent }}>
                {book.authorHandle.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Title area at bottom */}
          <div className="book-title-area">
            <span className="book-author" style={{ color: `${palette.accent}cc` }}>
              @{book.authorHandle}
            </span>
            <p className="book-preview">
              {previewText}
              {previewText.length >= 80 && '...'}
            </p>
          </div>

          {/* Page count - gold foil style badge */}
          {book.pageCount > 1 && (
            <div className="book-pages-badge" style={{ background: palette.accent }}>
              <span>{book.pageCount}</span>
              <small>pages</small>
            </div>
          )}

          {/* Progress ribbon bookmark */}
          {book.readProgress > 0 && book.readProgress < 100 && (
            <div className="book-ribbon" style={{ background: palette.accent }}>
              <span>{Math.round(book.readProgress)}%</span>
            </div>
          )}

          {/* Completed checkmark */}
          {book.isRead && (
            <motion.div
              className="book-completed"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <CheckIcon />
            </motion.div>
          )}

          {/* Shine effect on hover */}
          <motion.div
            className="book-shine"
            variants={{
              rest: { opacity: 0, x: '-100%' },
              hover: {
                opacity: 1,
                x: '200%',
                transition: { duration: 0.6, ease: 'easeInOut' }
              }
            }}
          />
        </div>

        {/* Book pages (right edge visible on hover) */}
        <div className="book-pages-edge" />
      </motion.div>

      {/* Shadow beneath book */}
      <motion.div
        className="book-shadow"
        variants={{
          rest: {
            scaleX: 1,
            opacity: 0.3,
          },
          hover: {
            scaleX: 1.1,
            opacity: 0.5,
            transition: { duration: 0.4 }
          }
        }}
      />
    </motion.button>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
