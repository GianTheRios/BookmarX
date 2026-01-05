'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { BookmarkWithReadState } from '@bookmarx/shared';

interface PageProps {
  bookmark: BookmarkWithReadState;
  pageNumber: number;
  totalPages: number;
}

// Extend window type for Twitter widgets
declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void;
        createTweet: (tweetId: string, container: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLElement>;
      };
    };
  }
}

export function Page({ bookmark, pageNumber, totalPages }: PageProps) {
  const [showVideoEmbed, setShowVideoEmbed] = useState(false);
  const tweetContainerRef = useRef<HTMLDivElement>(null);

  // Load Twitter widget when video embed is shown
  useEffect(() => {
    if (showVideoEmbed && bookmark.hasVideo && tweetContainerRef.current) {
      // Clear the container first
      tweetContainerRef.current.innerHTML = '';

      const createEmbed = () => {
        window.twttr?.widgets.createTweet(bookmark.tweetId, tweetContainerRef.current!, {
          theme: 'dark',
          conversation: 'none',
          dnt: true,
        });
      };

      // Load Twitter widgets.js if not already loaded
      if (!window.twttr) {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.onload = createEmbed;
        document.body.appendChild(script);
      } else {
        createEmbed();
      }
    }
  }, [showVideoEmbed, bookmark.hasVideo, bookmark.tweetId]);

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
        {/* Hide text content when video embed is shown since Twitter embed includes it */}
        {!(bookmark.hasVideo && showVideoEmbed) && (
          <p className="reading-text text-[var(--text-primary)] whitespace-pre-wrap">
            {bookmark.content}
          </p>
        )}

        {/* Media / Video */}
        {bookmark.mediaUrls && bookmark.mediaUrls.length > 0 && (
          <div className="mt-6">
            {bookmark.hasVideo && showVideoEmbed ? (
              // Embedded X tweet with video using official widget
              <div className="space-y-3">
                <div
                  ref={tweetContainerRef}
                  className="w-full rounded-lg overflow-hidden min-h-[300px]"
                />
                {/* Fallback link in case embed doesn't work */}
                <a
                  href={`https://x.com/${bookmark.authorHandle}/status/${bookmark.tweetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <XIcon />
                  Video not loading? View on X
                </a>
              </div>
            ) : bookmark.hasVideo ? (
              // Video thumbnail with play button
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVideoEmbed(true);
                }}
                className="relative w-full rounded-lg overflow-hidden bg-[var(--bg-secondary)] group cursor-pointer"
                style={{ aspectRatio: '16/9' }}
              >
                <Image
                  src={bookmark.mediaUrls[0]}
                  alt="Video thumbnail"
                  fill
                  className="object-cover"
                  unoptimized
                />
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <PlayIcon />
                  </div>
                </div>
                <span className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/70 text-white text-xs font-medium">
                  Click to play video
                </span>
              </button>
            ) : (
              // Regular image grid
              <div className="space-y-3">
                <div className="grid gap-2" style={{
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
                {/* Fallback link for media posts (in case it's a video we didn't detect) */}
                {bookmark.category === 'media' && (
                  <a
                    href={`https://x.com/${bookmark.authorHandle}/status/${bookmark.tweetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <XIcon />
                    View on X
                  </a>
                )}
              </div>
            )}
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

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#1a1a1a">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
