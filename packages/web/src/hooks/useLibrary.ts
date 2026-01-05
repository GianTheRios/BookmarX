'use client';

import { useMemo, useCallback } from 'react';
import { useBookmarks } from './useBookmarks';
import { groupBookmarksIntoBooks, organizeIntoSections } from '@/lib/groupBookmarks';
import type { BookData, LibrarySection, BookmarkCategory } from '@bookmarx/shared';

interface UseLibraryResult {
  books: BookData[];
  sections: LibrarySection[];
  getBookById: (bookId: string) => BookData | undefined;
  getNextBook: (currentBookId: string) => BookData | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAsRead: (bookmarkId: string, isRead?: boolean) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  updateBookCategory: (bookId: string, newCategory: BookmarkCategory) => Promise<void>;
}

export function useLibrary(): UseLibraryResult {
  const { bookmarks, isLoading, error, refetch, markAsRead, deleteBookmark, updateCategory } = useBookmarks();

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

  // Get the next book in the same category
  const getNextBook = useCallback(
    (currentBookId: string): BookData | undefined => {
      const currentBook = books.find(b => b.id === currentBookId);
      if (!currentBook) return undefined;

      // Find the section for this category
      const section = sections.find(s => s.id === currentBook.category);
      if (!section) return undefined;

      // Find the index of the current book in the section
      const currentIndex = section.books.findIndex(b => b.id === currentBookId);
      if (currentIndex === -1) return undefined;

      // Return the next book, or the first book if we're at the end
      if (currentIndex < section.books.length - 1) {
        return section.books[currentIndex + 1];
      }

      // If at the end of this category, try to find a book from another category
      for (const s of sections) {
        if (s.id !== currentBook.category && s.books.length > 0) {
          return s.books[0];
        }
      }

      return undefined;
    },
    [books, sections]
  );

  // Delete a book and all its bookmarks (for threads, deletes all pages)
  const deleteBook = useCallback(
    async (bookId: string): Promise<void> => {
      const book = books.find(b => b.id === bookId);
      if (!book) return;

      // Delete all bookmarks in the book
      // For threads, this deletes all tweets in the thread
      // For single bookmarks, this just deletes the one bookmark
      await Promise.all(book.bookmarks.map(bookmark => deleteBookmark(bookmark.id)));
    },
    [books, deleteBookmark]
  );

  // Update a book's category (only for single-bookmark books)
  const updateBookCategory = useCallback(
    async (bookId: string, newCategory: BookmarkCategory): Promise<void> => {
      const book = books.find(b => b.id === bookId);
      if (!book) return;

      // Only allow updating single-bookmark books (not threads)
      if (book.bookmarks.length !== 1) {
        console.warn('[BookmarX] Cannot change category of multi-bookmark books (threads)');
        return;
      }

      // Update the single bookmark's category
      await updateCategory(book.bookmarks[0].id, newCategory);
    },
    [books, updateCategory]
  );

  return {
    books,
    sections,
    getBookById,
    getNextBook,
    isLoading,
    error,
    refetch,
    markAsRead,
    deleteBook,
    updateBookCategory,
  };
}
