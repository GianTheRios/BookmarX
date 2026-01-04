'use client';

import { useParams, useRouter } from 'next/navigation';
import { Book } from '@/components/Book';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useLibrary } from '@/hooks/useLibrary';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function BookReaderPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = decodeURIComponent(params.bookId as string);
  const { getBookById, isLoading, error, markAsRead } = useLibrary();

  const book = getBookById(bookId);

  const handlePageChange = (index: number) => {
    console.log('Page changed to:', index);
  };

  const handleMarkAsRead = async (bookmarkId: string) => {
    try {
      await markAsRead(bookmarkId);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleBack = () => {
    router.push('/reader');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Header onBack={handleBack} />
        <main className="pt-20">
          <LoadingState />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Header onBack={handleBack} />
        <main className="pt-20">
          <ErrorState message={error} onBack={handleBack} />
        </main>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Header onBack={handleBack} />
        <main className="pt-20">
          <NotFoundState onBack={handleBack} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header onBack={handleBack} authorHandle={book.authorHandle} />
      <main className="pt-20">
        <Book
          bookmarks={book.bookmarks}
          onPageChange={handlePageChange}
          onMarkAsRead={handleMarkAsRead}
        />
      </main>
    </div>
  );
}

function Header({ onBack, authorHandle }: { onBack: () => void; authorHandle?: string }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-light)]">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Library</span>
        </button>
        {authorHandle && (
          <>
            <span className="text-[var(--text-muted)]">/</span>
            <span className="text-[var(--text-primary)] text-sm font-medium">@{authorHandle}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    </header>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full"
      />
      <p className="mt-4 text-[var(--text-muted)]">Loading book...</p>
    </div>
  );
}

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <span className="text-2xl">!</span>
      </div>
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
        Something went wrong
      </h2>
      <p className="text-[var(--text-muted)] max-w-md mb-6">{message}</p>
      <button
        onClick={onBack}
        className="px-6 py-2.5 rounded-full font-medium border border-[var(--border-medium)] hover:bg-[var(--bg-secondary)] transition-colors"
        style={{ color: 'var(--text-primary)' }}
      >
        Back to Library
      </button>
    </div>
  );
}

function NotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-20 h-20 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center mb-6"
      >
        <span className="text-4xl">📖</span>
      </motion.div>
      <h2
        className="text-2xl font-bold text-[var(--text-primary)] mb-2"
        style={{ fontFamily: 'var(--font-literata), Georgia, serif' }}
      >
        Book not found
      </h2>
      <p className="text-[var(--text-secondary)] max-w-md mb-6">
        This book may have been removed or the link is invalid.
      </p>
      <button
        onClick={onBack}
        className="px-6 py-2.5 rounded-full font-medium transition-colors"
        style={{ backgroundColor: 'var(--accent-primary)', color: '#1a1612' }}
      >
        Back to Library
      </button>
    </div>
  );
}
