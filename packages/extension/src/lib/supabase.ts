import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { LocalBookmark } from '@bookmarx/shared';

// Get environment variables (Vite injects these at build time)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseClient) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      // Return null instead of throwing for testing without credentials
      return null;
    }

    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // Store auth state in chrome.storage for extension persistence
        storage: {
          getItem: async (key: string) => {
            const result = await chrome.storage.local.get(key);
            return result[key] || null;
          },
          setItem: async (key: string, value: string) => {
            await chrome.storage.local.set({ [key]: value });
          },
          removeItem: async (key: string) => {
            await chrome.storage.local.remove(key);
          },
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseClient;
}

// =============================================================================
// Auth Functions
// =============================================================================

export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase credentials not configured');
  }
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase credentials not configured');
  }
  return supabase.auth.signUp({ email, password });
}

export async function signInWithMagicLink(email: string) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase credentials not configured');
  }
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: import.meta.env.VITE_WEB_APP_URL || 'http://localhost:3000',
    },
  });
}

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: null };
  }
  return supabase.auth.signOut();
}

export async function getUser(): Promise<User | null> {
  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: { session: null }, error: null };
  }
  return supabase.auth.getSession();
}

// =============================================================================
// Bookmark Sync Functions
// =============================================================================

interface BookmarkInsert {
  user_id: string;
  tweet_id: string;
  author_handle: string;
  author_name: string | null;
  author_avatar_url: string | null;
  content: string;
  media_urls: string[];
  external_urls: string[];
  tweet_created_at: string | null;
  bookmarked_at: string;
  is_thread: boolean;
  thread_id: string | null;
  thread_position: number;
  category: string;
  has_video: boolean;
  // Article fields
  is_article: boolean;
  article_content: string | null;
  article_title: string | null;
  estimated_read_time: number | null;
}

export async function syncBookmarksToSupabase(
  bookmarks: LocalBookmark[]
): Promise<{ synced: number; errors: { tweetId: string; error: string }[] }> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase credentials not configured');
  }
  const user = await getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const errors: { tweetId: string; error: string }[] = [];
  let synced = 0;

  // Convert local bookmarks to Supabase format
  const bookmarksToInsert: BookmarkInsert[] = bookmarks.map((b) => ({
    user_id: user.id,
    tweet_id: b.tweetId,
    author_handle: b.authorHandle,
    author_name: b.authorName,
    author_avatar_url: b.authorAvatarUrl,
    content: b.content,
    media_urls: b.mediaUrls,
    external_urls: b.externalUrls,
    tweet_created_at: b.tweetCreatedAt,
    bookmarked_at: b.bookmarkedAt,
    is_thread: b.isThread,
    thread_id: b.threadId,
    thread_position: b.threadPosition,
    category: b.category,
    has_video: b.hasVideo,
    // Article fields
    is_article: b.isArticle,
    article_content: b.articleContent,
    article_title: b.articleTitle,
    estimated_read_time: b.estimatedReadTime,
  }));

  // Upsert bookmarks (insert or update if tweet_id already exists)
  const { data, error } = await supabase
    .from('bookmarks')
    .upsert(bookmarksToInsert, {
      onConflict: 'user_id,tweet_id',
      ignoreDuplicates: false,
    })
    .select();

  if (error) {
    console.error('[BookmarX] Sync error:', error);
    bookmarks.forEach((b) => {
      errors.push({ tweetId: b.tweetId, error: error.message });
    });
  } else {
    synced = data?.length || 0;
  }

  return { synced, errors };
}

export async function fetchBookmarksFromSupabase(options?: {
  category?: string;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase credentials not configured');
  }
  const user = await getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.rpc('get_bookmarks_with_state', {
    p_user_id: user.id,
    p_category: options?.category || null,
    p_is_read: options?.isRead ?? null,
    p_limit: options?.limit || 50,
    p_offset: options?.offset || 0,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function markBookmarkAsRead(bookmarkId: string, isRead: boolean) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase credentials not configured');
  }
  const user = await getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('reading_state')
    .upsert({
      user_id: user.id,
      bookmark_id: bookmarkId,
      is_read: isRead,
      read_at: isRead ? new Date().toISOString() : null,
    }, {
      onConflict: 'user_id,bookmark_id',
    });

  if (error) {
    throw error;
  }
}
