import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { LocalBookmark, SyncStatus } from '@bookmarx/shared';

interface BookmarXDB extends DBSchema {
  bookmarks: {
    key: string;
    value: LocalBookmark;
    indexes: {
      'by-tweet-id': string;
      'by-sync-status': string;
      'by-category': string;
      'by-bookmarked-at': string;
    };
  };
  metadata: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'bookmarx-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<BookmarXDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<BookmarXDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BookmarXDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create bookmarks store
        const bookmarkStore = db.createObjectStore('bookmarks', {
          keyPath: 'localId',
        });
        bookmarkStore.createIndex('by-tweet-id', 'tweetId', { unique: true });
        bookmarkStore.createIndex('by-sync-status', 'syncStatus');
        bookmarkStore.createIndex('by-category', 'category');
        bookmarkStore.createIndex('by-bookmarked-at', 'bookmarkedAt');

        // Create metadata store for sync status, etc.
        db.createObjectStore('metadata');
      },
    });
  }
  return dbPromise;
}

// =============================================================================
// Bookmark Operations
// =============================================================================

export async function saveBookmarks(bookmarks: LocalBookmark[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('bookmarks', 'readwrite');

  await Promise.all([
    ...bookmarks.map((bookmark) => tx.store.put(bookmark)),
    tx.done,
  ]);
}

export async function getBookmark(localId: string): Promise<LocalBookmark | undefined> {
  const db = await getDB();
  return db.get('bookmarks', localId);
}

export async function getBookmarkByTweetId(tweetId: string): Promise<LocalBookmark | undefined> {
  const db = await getDB();
  return db.getFromIndex('bookmarks', 'by-tweet-id', tweetId);
}

export async function getAllBookmarks(): Promise<LocalBookmark[]> {
  const db = await getDB();
  return db.getAll('bookmarks');
}

export async function getBookmarksByCategory(category: string): Promise<LocalBookmark[]> {
  const db = await getDB();
  return db.getAllFromIndex('bookmarks', 'by-category', category);
}

export async function getPendingBookmarks(): Promise<LocalBookmark[]> {
  const db = await getDB();
  return db.getAllFromIndex('bookmarks', 'by-sync-status', 'pending');
}

export async function updateBookmarkSyncStatus(
  localId: string,
  status: LocalBookmark['syncStatus'],
  error?: string
): Promise<void> {
  const db = await getDB();
  const bookmark = await db.get('bookmarks', localId);
  if (bookmark) {
    bookmark.syncStatus = status;
    if (error) bookmark.syncError = error;
    await db.put('bookmarks', bookmark);
  }
}

export async function deleteBookmark(localId: string): Promise<void> {
  const db = await getDB();
  await db.delete('bookmarks', localId);
}

export async function clearAllBookmarks(): Promise<void> {
  const db = await getDB();
  await db.clear('bookmarks');
}

// =============================================================================
// Metadata Operations
// =============================================================================

export async function getSyncStatus(): Promise<SyncStatus> {
  const db = await getDB();
  const status = await db.get('metadata', 'syncStatus');
  return (status as SyncStatus) || {
    lastSyncedAt: null,
    pendingCount: 0,
    totalCount: 0,
    isSyncing: false,
    error: null,
  };
}

export async function saveSyncStatus(status: SyncStatus): Promise<void> {
  const db = await getDB();
  await db.put('metadata', status, 'syncStatus');
}

// =============================================================================
// Stats
// =============================================================================

export async function getBookmarkStats(): Promise<{
  total: number;
  pending: number;
  synced: number;
  byCategory: Record<string, number>;
}> {
  const db = await getDB();
  const allBookmarks = await db.getAll('bookmarks');

  const stats = {
    total: allBookmarks.length,
    pending: 0,
    synced: 0,
    byCategory: {} as Record<string, number>,
  };

  allBookmarks.forEach((bookmark) => {
    if (bookmark.syncStatus === 'pending') {
      stats.pending++;
    } else if (bookmark.syncStatus === 'synced') {
      stats.synced++;
    }

    stats.byCategory[bookmark.category] = (stats.byCategory[bookmark.category] || 0) + 1;
  });

  return stats;
}
