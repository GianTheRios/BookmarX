'use client';

import Image from 'next/image';
import type { BookmarkWithReadState } from '@bookmarx/shared';

interface PageProps {
  bookmark: BookmarkWithReadState;
  pageNumber: number;
  totalPages: number;
}

export function Page({ bookmark, pageNumber, totalPages }: PageProps) {
  const formattedDate = bookmark.tweetCreatedAt
    ? new Date(bookmark.tweetCreatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="book-page paper-texture w-full h-full flex flex-col" style={{ padding: 'var(--page-padding)' }}>
      {/* Page header */}
      <header className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-3">
          {bookmark.authorAvatarUrl && (
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-[var(--border-light)]">
              <Image
                src={bookmark.authorAvatarUrl}
                alt={bookmark.authorName || bookmark.authorHandle}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div>
            <p className="font-semibold text-[var(--text-primary)] text-sm">
              {bookmark.authorName || bookmark.authorHandle}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              @{bookmark.authorHandle}
            </p>
          </div>
        </div>

        {bookmark.isRead && (
          <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)]">
            Read
          </span>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <p className="reading-text text-[var(--text-primary)] whitespace-pre-wrap">
          {bookmark.content}
        </p>

        {/* Media */}
        {bookmark.mediaUrls && bookmark.mediaUrls.length > 0 && (
          <div className="mt-6 grid gap-2" style={{
            gridTemplateColumns: bookmark.mediaUrls.length === 1 ? '1fr' : 'repeat(2, 1fr)',
          }}>
            {bookmark.mediaUrls.slice(0, 4).map((url, index) => (
              <div
                key={index}
                className="relative aspect-video rounded-lg overflow-hidden bg-[var(--bg-secondary)]"
              >
                <Image
                  src={url}
                  alt={`Media ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}

        {/* External links */}
        {bookmark.externalUrls && bookmark.externalUrls.length > 0 && (
          <div className="mt-6">
            {bookmark.externalUrls.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg border border-[var(--border-light)] hover:border-[var(--border-medium)] transition-colors"
              >
                <span className="text-sm text-[var(--accent-primary)] break-all">
                  {url.length > 50 ? url.slice(0, 50) + '...' : url}
                </span>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* Page footer */}
      <footer className="mt-6 pt-4 border-t border-[var(--border-light)] flex items-center justify-between text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          {formattedDate && (
            <>
              <span>{formattedDate}</span>
              <span>•</span>
            </>
          )}
          <CategoryBadge category={bookmark.category} />
        </div>

        <span className="font-medium tabular-nums">
          {pageNumber} / {totalPages}
        </span>
      </footer>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const labels: Record<string, string> = {
    quick_take: 'Quick Take',
    thread: 'Thread',
    article: 'Article',
    media: 'Media',
  };

  const colors: Record<string, string> = {
    quick_take: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    thread: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    article: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    media: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[category] || ''}`}>
      {labels[category] || category}
    </span>
  );
}
