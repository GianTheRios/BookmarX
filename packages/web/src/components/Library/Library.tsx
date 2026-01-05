'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useLibrary } from '@/hooks/useLibrary';
import { LibrarySection } from './LibrarySection';
import type { BookmarkCategory } from '@bookmarx/shared';

export function Library() {
  const router = useRouter();
  const { sections, isLoading, error, deleteBook, updateBookCategory } = useLibrary();

  const handleBookClick = (bookId: string) => {
    router.push('/reader/' + encodeURIComponent(bookId));
  };

  const handleBookDelete = async (bookId: string) => {
    try {
      await deleteBook(bookId);
    } catch (err) {
      console.error('[BookmarX] Failed to delete book:', err);
    }
  };

  const handleBookCategoryChange = async (bookId: string, newCategory: BookmarkCategory) => {
    try {
      await updateBookCategory(bookId, newCategory);
    } catch (err) {
      console.error('[BookmarX] Failed to update book category:', err);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (sections.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="library-container">
      {/* Atmospheric header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="library-welcome"
      >
        <h1 className="library-title">Your Library</h1>
        <p className="library-subtitle">
          {sections.reduce((acc, s) => acc + s.books.length, 0)} volumes awaiting your attention
        </p>
      </motion.div>

      {/* Sections */}
      <div className="library-sections">
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <LibrarySection
              section={section}
              onBookClick={handleBookClick}
              onBookDelete={handleBookDelete}
              onBookCategoryChange={handleBookCategoryChange}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="library-state">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="library-state-content"
      >
        {/* Animated book stack */}
        <div className="loading-books">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="loading-book"
              style={{
                background: ['#1a3a52', '#4a2c2a', '#2d4a3e'][i],
                zIndex: 3 - i,
              }}
              animate={{
                y: [0, -8, 0],
                rotateZ: [0, -2, 0],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        <motion.p
          className="library-state-text"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Arranging your collection...
        </motion.p>
      </motion.div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="library-state">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="library-state-content"
      >
        <div className="error-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>

        <h2 className="library-state-title">Something went awry</h2>
        <p className="library-state-message">{message}</p>

        <button
          onClick={() => window.location.reload()}
          className="library-state-button"
        >
          Try again
        </button>
      </motion.div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="library-state">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="library-state-content"
      >
        {/* Decorative empty bookshelf illustration */}
        <motion.div
          className="empty-shelf"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="shelf-back" />
          <div className="shelf-bottom" />
          <div className="shelf-dust">
            {[...Array(5)].map((_, i) => (
              <motion.span
                key={i}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  y: [0, -2, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              />
            ))}
          </div>
        </motion.div>

        <h2 className="library-state-title">Your shelves await</h2>
        <p className="library-state-message">
          Install the BookmarX extension and sync your X bookmarks to begin curating your personal library.
        </p>

        <div className="empty-actions">
          <button className="library-state-button library-state-button--primary">
            <ExtensionIcon />
            Install Extension
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ExtensionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
