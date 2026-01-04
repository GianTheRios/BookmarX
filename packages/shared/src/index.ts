// BookmarX Shared Types and Utilities

// =============================================================================
// Core Types
// =============================================================================

export interface Bookmark {
  id: string;
  userId: string;
  tweetId: string;
  authorHandle: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  content: string;
  mediaUrls: string[];
  externalUrls: string[];
  tweetCreatedAt: string | null;
  bookmarkedAt: string;
  isThread: boolean;
  threadId: string | null;
  threadPosition: number;
  category: BookmarkCategory;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingState {
  id: string;
  userId: string;
  bookmarkId: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export type BookmarkCategory = 'quick_take' | 'thread' | 'article' | 'media';

export interface User {
  id: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  createdAt: string;
}

export type SubscriptionTier = 'free' | 'pro';

// =============================================================================
// Extension Types
// =============================================================================

export interface ScrapedTweet {
  tweetId: string;
  authorHandle: string;
  authorName: string;
  authorAvatarUrl: string;
  content: string;
  mediaUrls: string[];
  externalUrls: string[];
  tweetCreatedAt: string | null;
  isReply: boolean;
  replyToTweetId: string | null;
}

export interface SyncStatus {
  lastSyncedAt: string | null;
  pendingCount: number;
  totalCount: number;
  isSyncing: boolean;
  error: string | null;
}

export interface LocalBookmark extends Omit<Bookmark, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  localId: string;
  syncStatus: 'pending' | 'synced' | 'error';
  syncError?: string;
}

// =============================================================================
// API Types
// =============================================================================

export interface SyncBookmarksRequest {
  bookmarks: Omit<Bookmark, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[];
}

export interface SyncBookmarksResponse {
  synced: number;
  errors: { tweetId: string; error: string }[];
}

export interface GetBookmarksParams {
  category?: BookmarkCategory;
  isRead?: boolean;
  sortBy?: 'bookmarkedAt' | 'tweetCreatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface BookmarkWithReadState extends Bookmark {
  isRead: boolean;
  readAt: string | null;
}

// =============================================================================
// Reader Types
// =============================================================================

export type Theme = 'light' | 'dark' | 'sepia';

export interface ReaderSettings {
  theme: Theme;
  fontSize: 'small' | 'medium' | 'large';
}

export interface Chapter {
  id: string;
  bookmarks: BookmarkWithReadState[];
  title: string;
  isThread: boolean;
}

// =============================================================================
// Constants
// =============================================================================

export const CATEGORY_LABELS: Record<BookmarkCategory, string> = {
  quick_take: 'Quick Takes',
  thread: 'Threads',
  article: 'Articles',
  media: 'Media',
};

export const THEME_COLORS: Record<Theme, { bg: string; text: string; accent: string }> = {
  light: { bg: '#ffffff', text: '#1a1a1a', accent: '#1d9bf0' },
  dark: { bg: '#15202b', text: '#e7e9ea', accent: '#1d9bf0' },
  sepia: { bg: '#f4ecd8', text: '#5b4636', accent: '#8b4513' },
};

export const WEB_APP_URL = process.env.NODE_ENV === 'production'
  ? 'https://bookmarx.vercel.app'
  : 'http://localhost:3000';
