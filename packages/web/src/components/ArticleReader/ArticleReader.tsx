'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { BookmarkWithReadState } from '@bookmarx/shared';
import Image from 'next/image';

interface ArticleReaderProps {
  bookmark: BookmarkWithReadState;
  onMarkAsRead?: (bookmarkId: string) => void;
  onBack?: () => void;
}

export function ArticleReader({ bookmark, onMarkAsRead, onBack }: ArticleReaderProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(bookmark.isRead);
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate scroll progress
  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const maxScroll = scrollHeight - clientHeight;
    const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 100;
    
    setScrollProgress(Math.min(progress, 100));

    // Mark as read when scrolled past 80%
    if (progress > 80 && !hasMarkedAsRead && onMarkAsRead) {
      onMarkAsRead(bookmark.id);
      setHasMarkedAsRead(true);
    }
  }, [bookmark.id, hasMarkedAsRead, onMarkAsRead]);

  useEffect(() => {
    const content = contentRef.current;
    if (content) {
      content.addEventListener('scroll', handleScroll);
      return () => content.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Get content to display
  const articleContent = bookmark.articleContent || bookmark.content;
  const title = bookmark.articleTitle || null;

  // Format content into paragraphs
  const paragraphs = articleContent.split(/\n\n+/).filter(p => p.trim());

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[var(--bg-secondary)]">
        <motion.div
          className="h-full bg-[var(--accent-primary)]"
          initial={{ width: 0 }}
          animate={{ width: `${scrollProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 px-6 py-4 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--border-light)]">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Back</span>
          </button>

          <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
            {bookmark.estimatedReadTime && (
              <span>{bookmark.estimatedReadTime} min read</span>
            )}
            <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
            <span>{Math.round(scrollProgress)}%</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-6 py-12"
      >
        <article className="max-w-3xl mx-auto">
          {/* Author info */}
          <div className="flex items-center gap-4 mb-8">
            {bookmark.authorAvatarUrl && (
              <Image
                src={bookmark.authorAvatarUrl}
                alt={bookmark.authorName || bookmark.authorHandle}
                width={48}
                height={48}
                className="rounded-full"
              />
            )}
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                {bookmark.authorName || bookmark.authorHandle}
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                @{bookmark.authorHandle}
              </p>
            </div>
          </div>

          {/* Title */}
          {title && (
            <h1
              className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-8 leading-tight"
              style={{ fontFamily: 'var(--font-literata), Georgia, serif' }}
            >
              {title}
            </h1>
          )}

          {/* Article content */}
          <div
            className="prose prose-lg max-w-none"
            style={{
              fontFamily: 'var(--font-literata), Georgia, serif',
              lineHeight: 1.8,
            }}
          >
            {paragraphs.map((paragraph, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="text-[var(--text-primary)] mb-6 text-lg leading-relaxed"
              >
                {paragraph}
              </motion.p>
            ))}
          </div>

          {/* Media */}
          {bookmark.mediaUrls && bookmark.mediaUrls.length > 0 && (
            <div className="mt-8 space-y-4">
              {bookmark.mediaUrls.map((url, index) => (
                <div key={index} className="rounded-xl overflow-hidden">
                  <Image
                    src={url}
                    alt={`Image ${index + 1}`}
                    width={800}
                    height={450}
                    className="w-full h-auto object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-[var(--border-light)]">
            <div className="flex items-center justify-between">
              <a
                href={`https://x.com/${bookmark.authorHandle}/status/${bookmark.tweetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                View on X
              </a>

              {hasMarkedAsRead && (
                <span className="text-sm text-[var(--accent-primary)] flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Read
                </span>
              )}
            </div>
          </footer>
        </article>

        {/* Bottom padding for scroll */}
        <div className="h-32" />
      </div>
    </div>
  );
}
