'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useLibrary } from '@/hooks/useLibrary';
import { LibrarySection } from './LibrarySection';

export function Library() {
  const router = useRouter();
  const { sections, isLoading, error } = useLibrary();

  const handleBookClick = (bookId: string) => {
    router.push('/reader/' + encodeURIComponent(bookId));
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
    <div className="py-8">
      {sections.map((section, index) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
        >
          <LibrarySection
            section={section}
            onBookClick={handleBookClick}
          />
        </motion.div>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full"
      />
      <p className="mt-4 text-[var(--text-muted)]">Loading your library...</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <span className="text-2xl">!</span>
      </div>
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
        Something went wrong
      </h2>
      <p className="text-[var(--text-muted)] max-w-md">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-20 h-20 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center mb-6"
      >
        <span className="text-4xl">📚</span>
      </motion.div>
      <h2
        className="text-2xl font-bold text-[var(--text-primary)] mb-2"
        style={{ fontFamily: 'var(--font-literata), Georgia, serif' }}
      >
        Your library is empty
      </h2>
      <p className="text-[var(--text-secondary)] max-w-md mb-6">
        Install the BookmarX extension and sync your X bookmarks to start building your library.
      </p>
    </div>
  );
}
