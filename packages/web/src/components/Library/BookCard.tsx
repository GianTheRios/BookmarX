'use client';

import { motion } from 'framer-motion';
import type { BookData } from '@bookmarx/shared';

interface BookCardProps {
  book: BookData;
  onClick: () => void;
}

export function BookCard({ book, onClick }: BookCardProps) {
  const previewText = book.bookmarks[0]?.content.slice(0, 100) || '';

  return (
    <motion.button
      onClick={onClick}
      className="book-card"
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Cover image or gradient */}
      <div className="book-card-cover">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-hover)] flex items-center justify-center">
            {book.authorAvatarUrl && (
              <img
                src={book.authorAvatarUrl}
                alt=""
                className="w-16 h-16 rounded-full border-2 border-white/20"
              />
            )}
          </div>
        )}
      </div>

      {/* Page count badge */}
      {book.pageCount > 1 && (
        <div className="book-card-badge">
          {book.pageCount} pages
        </div>
      )}

      {/* Progress indicator */}
      {book.readProgress > 0 && book.readProgress < 100 && (
        <div className="absolute bottom-16 left-0 right-0 h-1 bg-black/20">
          <div
            className="h-full bg-[var(--accent-primary)]"
            style={{ width: book.readProgress + '%' }}
          />
        </div>
      )}

      {/* Read indicator */}
      {book.isRead && (
        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <CheckIcon />
        </div>
      )}

      {/* Info overlay */}
      <div className="book-card-overlay">
        <div className="flex items-center gap-2 mb-1">
          {book.authorAvatarUrl && (
            <img
              src={book.authorAvatarUrl}
              alt=""
              className="w-5 h-5 rounded-full"
            />
          )}
          <span className="text-xs text-white/80 truncate">
            @{book.authorHandle}
          </span>
        </div>
        <p className="text-sm font-medium text-white line-clamp-2">
          {previewText}...
        </p>
      </div>
    </motion.button>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
