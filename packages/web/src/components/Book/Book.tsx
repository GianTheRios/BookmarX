'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Page } from './Page';
import { ProgressBar } from './ProgressBar';
import type { BookmarkWithReadState } from '@bookmarx/shared';

interface BookProps {
  bookmarks: BookmarkWithReadState[];
  onPageChange?: (index: number) => void;
  onMarkAsRead?: (bookmarkId: string) => void;
}

export function Book({ bookmarks, onPageChange, onMarkAsRead }: BookProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const totalPages = bookmarks.length;
  const currentBookmark = bookmarks[currentPage];

  const goToPage = useCallback((newPage: number, dir: number) => {
    if (isAnimating || newPage < 0 || newPage >= totalPages) return;

    setIsAnimating(true);
    setDirection(dir);
    setCurrentPage(newPage);
    onPageChange?.(newPage);

    // Mark the previous page as read when moving forward
    if (dir > 0 && currentPage < totalPages) {
      const prevBookmark = bookmarks[currentPage];
      if (prevBookmark && !prevBookmark.isRead) {
        onMarkAsRead?.(prevBookmark.id);
      }
    }
  }, [isAnimating, totalPages, currentPage, bookmarks, onPageChange, onMarkAsRead]);

  const nextPage = useCallback(() => goToPage(currentPage + 1, 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1, -1), [currentPage, goToPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextPage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage]);

  // Page flip animation variants
  const pageVariants = {
    enter: (direction: number) => ({
      rotateY: direction > 0 ? 90 : -90,
      opacity: 0,
      scale: 0.95,
      x: direction > 0 ? 100 : -100,
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    exit: (direction: number) => ({
      rotateY: direction > 0 ? -90 : 90,
      opacity: 0,
      scale: 0.95,
      x: direction > 0 ? -100 : 100,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    }),
  };

  if (!currentBookmark) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[var(--text-muted)]">No bookmarks to display</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4">
      {/* Book container */}
      <div
        className="relative"
        style={{
          width: 'var(--page-width)',
          height: 'var(--page-height)',
          perspective: '1200px',
        }}
      >
        {/* Page shadow underneath */}
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: 'var(--bg-secondary)',
            transform: 'translateY(8px) scale(0.98)',
            filter: 'blur(8px)',
            opacity: 0.5,
          }}
        />

        {/* Animated pages */}
        <AnimatePresence
          initial={false}
          custom={direction}
          mode="wait"
          onExitComplete={() => setIsAnimating(false)}
        >
          <motion.div
            key={currentPage}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0"
            style={{
              transformStyle: 'preserve-3d',
              transformOrigin: direction > 0 ? 'left center' : 'right center',
            }}
          >
            <Page bookmark={currentBookmark} pageNumber={currentPage + 1} totalPages={totalPages} />
          </motion.div>
        </AnimatePresence>

        {/* Navigation zones */}
        <button
          onClick={prevPage}
          disabled={currentPage === 0 || isAnimating}
          className="absolute left-0 top-0 bottom-0 w-1/3 cursor-w-resize opacity-0 hover:opacity-100 transition-opacity z-10 disabled:cursor-default"
          aria-label="Previous page"
        >
          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[var(--bg-secondary)] shadow-lg opacity-0 hover:opacity-100 transition-opacity">
            <ChevronLeftIcon />
          </div>
        </button>

        <button
          onClick={nextPage}
          disabled={currentPage === totalPages - 1 || isAnimating}
          className="absolute right-0 top-0 bottom-0 w-1/3 cursor-e-resize opacity-0 hover:opacity-100 transition-opacity z-10 disabled:cursor-default"
          aria-label="Next page"
        >
          <div className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[var(--bg-secondary)] shadow-lg opacity-0 hover:opacity-100 transition-opacity">
            <ChevronRightIcon />
          </div>
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-8 w-full max-w-md">
        <ProgressBar current={currentPage + 1} total={totalPages} />
      </div>

      {/* Keyboard hint */}
      <p className="mt-4 text-xs text-[var(--text-muted)] opacity-60">
        Use ← → arrow keys or click page edges to navigate
      </p>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15l-5-5 5-5" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 5l5 5-5 5" />
    </svg>
  );
}
