'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { BookmarkWithReadState } from '@bookmarx/shared';

interface UseBookmarksOptions {
  category?: string;
  isRead?: boolean;
  limit?: number;
}

interface UseBookmarksResult {
  bookmarks: BookmarkWithReadState[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAsRead: (bookmarkId: string, isRead?: boolean) => Promise<void>;
  deleteBookmark: (bookmarkId: string) => Promise<void>;
}

export function useBookmarks(options: UseBookmarksOptions = {}): UseBookmarksResult {
  const [bookmarks, setBookmarks] = useState<BookmarkWithReadState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBookmarks([]);
        setIsLoading(false);
        return;
      }

      // Build query
      let query = supabase
        .from('bookmarks')
        .select(`
          *,
          reading_state!left (
            is_read,
            read_at
          )
        `)
        .eq('user_id', user.id)
        .order('bookmarked_at', { ascending: false });

      // Apply filters
      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform data to match BookmarkWithReadState type
      const transformedBookmarks: BookmarkWithReadState[] = (data || []).map((bookmark) => {
        const readingState = Array.isArray(bookmark.reading_state)
          ? bookmark.reading_state[0]
          : bookmark.reading_state;

        return {
          id: bookmark.id,
          userId: bookmark.user_id,
          tweetId: bookmark.tweet_id,
          authorHandle: bookmark.author_handle,
          authorName: bookmark.author_name,
          authorAvatarUrl: bookmark.author_avatar_url,
          content: bookmark.content,
          mediaUrls: bookmark.media_urls || [],
          externalUrls: bookmark.external_urls || [],
          tweetCreatedAt: bookmark.tweet_created_at,
          bookmarkedAt: bookmark.bookmarked_at,
          isThread: bookmark.is_thread,
          threadId: bookmark.thread_id,
          threadPosition: bookmark.thread_position,
          category: bookmark.category,
          hasVideo: bookmark.has_video || false,
          createdAt: bookmark.created_at,
          updatedAt: bookmark.updated_at,
          isRead: readingState?.is_read || false,
          readAt: readingState?.read_at || null,
        };
      });

      // Filter by read status if specified (done client-side since it's a joined table)
      let filteredBookmarks = transformedBookmarks;
      if (options.isRead !== undefined) {
        filteredBookmarks = transformedBookmarks.filter(b => b.isRead === options.isRead);
      }

      setBookmarks(filteredBookmarks);
    } catch (err) {
      console.error('[BookmarX] Error fetching bookmarks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bookmarks');
    } finally {
      setIsLoading(false);
    }
  }, [options.category, options.isRead, options.limit]);

  const markAsRead = useCallback(async (bookmarkId: string, isRead: boolean = true) => {
    try {
      const supabase = getSupabaseClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: upsertError } = await supabase
        .from('reading_state')
        .upsert({
          user_id: user.id,
          bookmark_id: bookmarkId,
          is_read: isRead,
          read_at: isRead ? new Date().toISOString() : null,
        }, {
          onConflict: 'user_id,bookmark_id',
        });

      if (upsertError) throw upsertError;

      // Update local state
      setBookmarks(prev => prev.map(bookmark =>
        bookmark.id === bookmarkId
          ? { ...bookmark, isRead, readAt: isRead ? new Date().toISOString() : null }
          : bookmark
      ));
    } catch (err) {
      console.error('[BookmarX] Error marking bookmark as read:', err);
      throw err;
    }
  }, []);

  const deleteBookmark = useCallback(async (bookmarkId: string) => {
    try {
      const supabase = getSupabaseClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Update local state - remove the deleted bookmark
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId));
    } catch (err) {
      console.error('[BookmarX] Error deleting bookmark:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  return {
    bookmarks,
    isLoading,
    error,
    refetch: fetchBookmarks,
    markAsRead,
    deleteBookmark,
  };
}
