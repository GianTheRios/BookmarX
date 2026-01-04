'use client';

import { Book } from '@/components/Book';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { BookmarkWithReadState } from '@bookmarx/shared';

// Mock data for demo
const mockBookmarks: BookmarkWithReadState[] = [
  {
    id: '1',
    userId: 'demo',
    tweetId: '1234567890',
    authorHandle: 'naval',
    authorName: 'Naval',
    authorAvatarUrl: 'https://pbs.twimg.com/profile_images/1256841238298292232/ycqwaMI2_400x400.jpg',
    content: 'Seek wealth, not money or status.\n\nWealth is having assets that earn while you sleep.\n\nMoney is how we transfer time and wealth.\n\nStatus is your place in the social hierarchy.',
    mediaUrls: [],
    externalUrls: [],
    tweetCreatedAt: '2024-01-15T10:30:00Z',
    bookmarkedAt: '2024-01-16T08:00:00Z',
    isThread: false,
    threadId: null,
    threadPosition: 0,
    category: 'quick_take',
    createdAt: '2024-01-16T08:00:00Z',
    updatedAt: '2024-01-16T08:00:00Z',
    isRead: false,
    readAt: null,
  },
  {
    id: '2',
    userId: 'demo',
    tweetId: '1234567891',
    authorHandle: 'paulg',
    authorName: 'Paul Graham',
    authorAvatarUrl: 'https://pbs.twimg.com/profile_images/1824002576/pg-railsconf_400x400.jpg',
    content: 'The way to get startup ideas is not to try to think of startup ideas. It\'s to look for problems, preferably problems you have yourself.\n\nThe very best startup ideas tend to have three things in common: they\'re something the founders themselves want, that they themselves can build, and that few others realize are worth doing.',
    mediaUrls: [],
    externalUrls: ['https://paulgraham.com/startupideas.html'],
    tweetCreatedAt: '2024-01-14T15:45:00Z',
    bookmarkedAt: '2024-01-15T09:30:00Z',
    isThread: false,
    threadId: null,
    threadPosition: 0,
    category: 'article',
    createdAt: '2024-01-15T09:30:00Z',
    updatedAt: '2024-01-15T09:30:00Z',
    isRead: true,
    readAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '3',
    userId: 'demo',
    tweetId: '1234567892',
    authorHandle: 'sama',
    authorName: 'Sam Altman',
    authorAvatarUrl: 'https://pbs.twimg.com/profile_images/804990434455887872/BG0Xh7Oa_400x400.jpg',
    content: 'The most successful people I know are primarily internally driven; they do what they do to impress themselves and because they feel compelled to make something happen in the world.\n\nAfter you\'ve gotten yourself to a point where you have baseline financial needs covered, money starts to matter less and becomes primarily a way to keep score.',
    mediaUrls: [],
    externalUrls: [],
    tweetCreatedAt: '2024-01-13T12:00:00Z',
    bookmarkedAt: '2024-01-14T07:15:00Z',
    isThread: true,
    threadId: '3',
    threadPosition: 0,
    category: 'thread',
    createdAt: '2024-01-14T07:15:00Z',
    updatedAt: '2024-01-14T07:15:00Z',
    isRead: false,
    readAt: null,
  },
  {
    id: '4',
    userId: 'demo',
    tweetId: '1234567893',
    authorHandle: 'elikiako',
    authorName: 'Eli',
    authorAvatarUrl: 'https://pbs.twimg.com/profile_images/1683325380428390400/aYYYwHLL_400x400.jpg',
    content: 'I\'ve been building in public for 2 years now.\n\nHere\'s what I learned:\n\n1. Consistency beats intensity\n2. Share your failures, not just wins\n3. Engage genuinely with your community\n4. Document the journey, not just the destination\n5. Build relationships, not just followers',
    mediaUrls: [],
    externalUrls: [],
    tweetCreatedAt: '2024-01-12T18:20:00Z',
    bookmarkedAt: '2024-01-13T11:00:00Z',
    isThread: false,
    threadId: null,
    threadPosition: 0,
    category: 'quick_take',
    createdAt: '2024-01-13T11:00:00Z',
    updatedAt: '2024-01-13T11:00:00Z',
    isRead: false,
    readAt: null,
  },
  {
    id: '5',
    userId: 'demo',
    tweetId: '1234567894',
    authorHandle: 'dan_abramov',
    authorName: 'Dan Abramov',
    authorAvatarUrl: 'https://pbs.twimg.com/profile_images/1336281436685541376/fRSl8uJP_400x400.jpg',
    content: 'If you want to understand React deeply, try building it from scratch.\n\nNot to replace it—but to see why certain decisions were made.\n\nThe constraints become obvious when you\'re the one solving the problems.',
    mediaUrls: [],
    externalUrls: [],
    tweetCreatedAt: '2024-01-11T09:15:00Z',
    bookmarkedAt: '2024-01-12T14:30:00Z',
    isThread: false,
    threadId: null,
    threadPosition: 0,
    category: 'quick_take',
    createdAt: '2024-01-12T14:30:00Z',
    updatedAt: '2024-01-12T14:30:00Z',
    isRead: false,
    readAt: null,
  },
];

export default function ReaderPage() {
  const handlePageChange = (index: number) => {
    console.log('Page changed to:', index);
  };

  const handleMarkAsRead = (bookmarkId: string) => {
    console.log('Marking as read:', bookmarkId);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-light)]">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[var(--accent-primary)]" style={{ fontFamily: 'var(--font-literata), Georgia, serif' }}>
            BookmarX
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)]">
            Demo
          </span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          <button className="px-4 py-2 rounded-full text-sm font-medium bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] transition-colors">
            Install Extension
          </button>
        </div>
      </header>

      {/* Main reader area */}
      <main className="pt-20">
        <Book
          bookmarks={mockBookmarks}
          onPageChange={handlePageChange}
          onMarkAsRead={handleMarkAsRead}
        />
      </main>
    </div>
  );
}
