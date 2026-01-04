'use client';

import { useMemo, useCallback } from 'react';
import { useBookmarks } from './useBookmarks';
import { groupBookmarksIntoBooks, organizeIntoSections } from '@/lib/groupBookmarks';
import type { BookData, LibrarySection } from '@bookmarx/shared';

interface UseLibraryResult {
  books: BookData[];
  sections: LibrarySection[];
  getBookById: (bookId: string) => BookData | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAsRead: (bookmarkId: string, isRead?: boolean) => Promise<void>;
}

export function useLibrary(): UseLibraryResult {
  const { bookmarks, isLoading, error, refetch, markAsRead } = useBookmarks();

  const { books, sections } = useMemo(() => {
    if (!bookmarks.length) return { books: [], sections: [] };
    const books = groupBookmarksIntoBooks(bookmarks);
    const sections = organizeIntoSections(books);
    return { books, sections };
  }, [bookmarks]);

  const getBookById = useCallback(
    (bookId: string) => books.find(b => b.id === bookId),
    [books]
  );

  return {
    books,
    sections,
    getBookById,
    isLoading,
    error,
    refetch,
    markAsRead,
  };
}
