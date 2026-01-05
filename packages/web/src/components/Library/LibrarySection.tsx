'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookCard, type BookDragData } from './BookCard';
import type { LibrarySection as LibrarySectionType, BookmarkCategory } from '@bookmarx/shared';

interface LibrarySectionProps {
  section: LibrarySectionType;
  onBookClick: (bookId: string) => void;
  onBookDelete?: (bookId: string) => void;
  onBookCategoryChange?: (bookId: string, newCategory: BookmarkCategory) => void;
}

// Elegant section configurations with custom icons and styling
const SECTION_CONFIG: Record<string, {
  icon: React.ReactNode;
  subtitle: string;
  gradient: string;
}> = {
  thread: {
    icon: <ThreadIcon />,
    subtitle: 'Long-form conversations',
    gradient: 'from-[#1a3a52] to-[#2d5a7b]',
  },
  article: {
    icon: <ArticleIcon />,
    subtitle: 'Essays & deep dives',
    gradient: 'from-[#4a2c2a] to-[#6b3d3a]',
  },
  quick_take: {
    icon: <QuickTakeIcon />,
    subtitle: 'Brief insights',
    gradient: 'from-[#2d4a3e] to-[#3d6354]',
  },
  media: {
    icon: <MediaIcon />,
    subtitle: 'Videos & visuals',
    gradient: 'from-[#3d2d4a] to-[#5a4270]',
  },
};

export function LibrarySection({ section, onBookClick, onBookDelete, onBookCategoryChange }: LibrarySectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const config = SECTION_CONFIG[section.id] || SECTION_CONFIG.thread;

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Check if the dragged item is from a different category
    try {
      // Note: We can't read dataTransfer during dragover due to security restrictions
      // So we just show the drop indicator regardless
      setIsDragOver(true);
    } catch {
      // Ignore errors
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only set isDragOver to false if we're leaving the section entirely
    // (not just moving to a child element)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json')) as BookDragData;

      // Only update if dropping into a different category
      if (data.currentCategory !== section.id && onBookCategoryChange) {
        onBookCategoryChange(data.bookId, section.id as BookmarkCategory);
      }
    } catch (err) {
      console.error('[BookmarX] Failed to handle drop:', err);
    }
  };

  // Check scroll position to show/hide arrows
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        ref.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [section.books.length]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 420;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      className={`library-section ${isDragOver ? 'library-section--drop-target' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Section header */}
      <div className="section-header">
        <div className="section-header-left">
          {/* Icon with gradient background */}
          <div className={`section-icon bg-gradient-to-br ${config.gradient}`}>
            {config.icon}
          </div>

          <div className="section-titles">
            <h2 className="section-title">
              {section.title}
              <span className="section-count">{section.books.length}</span>
            </h2>
            <p className="section-subtitle">{config.subtitle}</p>
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="section-nav">
          <AnimatePresence>
            {canScrollLeft && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => scroll('left')}
                className="section-nav-btn"
                aria-label="Scroll left"
              >
                <ChevronLeftIcon />
              </motion.button>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {canScrollRight && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => scroll('right')}
                className="section-nav-btn"
                aria-label="Scroll right"
              >
                <ChevronRightIcon />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Decorative divider */}
      <div className="section-divider">
        <div className="section-divider-line" />
        <div className="section-divider-ornament">◆</div>
        <div className="section-divider-line" />
      </div>

      {/* Scrollable book row with gradient masks */}
      <div className="section-scroll-container">
        {/* Left fade mask */}
        <div className={`section-fade-left ${canScrollLeft ? 'active' : ''}`} />

        <div ref={scrollRef} className="section-scroll">
          {section.books.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <BookCard
                book={book}
                onClick={() => onBookClick(book.id)}
                onDelete={onBookDelete}
              />
            </motion.div>
          ))}
        </div>

        {/* Right fade mask */}
        <div className={`section-fade-right ${canScrollRight ? 'active' : ''}`} />
      </div>
    </section>
  );
}

// Custom SVG icons with an engraved/bookish aesthetic
function ThreadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 9h8M8 13h6" />
    </svg>
  );
}

function ArticleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h8M8 15h4" />
    </svg>
  );
}

function QuickTakeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function MediaIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <path d="M10 8l6 4-6 4V8z" />
    </svg>
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
