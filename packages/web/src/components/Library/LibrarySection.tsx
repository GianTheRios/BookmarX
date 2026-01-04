'use client';

import { useRef } from 'react';
import { BookCard } from './BookCard';
import type { LibrarySection as LibrarySectionType } from '@bookmarx/shared';

interface LibrarySectionProps {
  section: LibrarySectionType;
  onBookClick: (bookId: string) => void;
}

const SECTION_ICONS: Record<string, string> = {
  thread: '',
  article: '',
  quick_take: '',
  media: '',
};

export function LibrarySection({ section, onBookClick }: LibrarySectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="library-section">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="library-section-title">
          <span className="mr-2">{SECTION_ICONS[section.id]}</span>
          {section.title}
          <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
            ({section.books.length})
          </span>
        </h2>

        {/* Scroll buttons */}
        {section.books.length > 4 && (
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--border-medium)] transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeftIcon />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--border-medium)] transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}
      </div>

      {/* Scrollable book row */}
      <div ref={scrollRef} className="library-scroll">
        {section.books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onClick={() => onBookClick(book.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
