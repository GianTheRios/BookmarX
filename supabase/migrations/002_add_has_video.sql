-- BookmarX Database Migration
-- Migration: 002_add_has_video.sql
-- Description: Add has_video column to bookmarks table for video content detection

-- Add has_video column (nullable, defaults to false for existing records)
ALTER TABLE bookmarks ADD COLUMN has_video BOOLEAN DEFAULT FALSE;

-- Update the helper function to include has_video
CREATE OR REPLACE FUNCTION get_bookmarks_with_state(
  p_user_id UUID,
  p_category TEXT DEFAULT NULL,
  p_is_read BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  tweet_id TEXT,
  author_handle TEXT,
  author_name TEXT,
  author_avatar_url TEXT,
  content TEXT,
  media_urls JSONB,
  external_urls JSONB,
  tweet_created_at TIMESTAMPTZ,
  bookmarked_at TIMESTAMPTZ,
  is_thread BOOLEAN,
  thread_id UUID,
  thread_position INTEGER,
  category TEXT,
  has_video BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_read BOOLEAN,
  read_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.tweet_id,
    b.author_handle,
    b.author_name,
    b.author_avatar_url,
    b.content,
    b.media_urls,
    b.external_urls,
    b.tweet_created_at,
    b.bookmarked_at,
    b.is_thread,
    b.thread_id,
    b.thread_position,
    b.category,
    b.has_video,
    b.created_at,
    b.updated_at,
    COALESCE(rs.is_read, FALSE) AS is_read,
    rs.read_at
  FROM bookmarks b
  LEFT JOIN reading_state rs ON b.id = rs.bookmark_id AND rs.user_id = p_user_id
  WHERE b.user_id = p_user_id
    AND (p_category IS NULL OR b.category = p_category)
    AND (p_is_read IS NULL OR COALESCE(rs.is_read, FALSE) = p_is_read)
  ORDER BY b.bookmarked_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
