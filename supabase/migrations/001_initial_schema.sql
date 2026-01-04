-- BookmarX Database Schema
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Bookmarks Table
-- =============================================================================
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tweet_id TEXT NOT NULL,
  author_handle TEXT NOT NULL,
  author_name TEXT,
  author_avatar_url TEXT,
  content TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  external_urls JSONB DEFAULT '[]'::jsonb,
  tweet_created_at TIMESTAMPTZ,
  bookmarked_at TIMESTAMPTZ DEFAULT NOW(),
  is_thread BOOLEAN DEFAULT FALSE,
  thread_id UUID REFERENCES bookmarks(id) ON DELETE SET NULL,
  thread_position INTEGER DEFAULT 0,
  category TEXT DEFAULT 'quick_take' CHECK (category IN ('quick_take', 'thread', 'article', 'media')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only bookmark a tweet once
  UNIQUE(user_id, tweet_id)
);

-- Indexes for performance
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_user_category ON bookmarks(user_id, category);
CREATE INDEX idx_bookmarks_user_bookmarked_at ON bookmarks(user_id, bookmarked_at DESC);
CREATE INDEX idx_bookmarks_thread_id ON bookmarks(thread_id) WHERE thread_id IS NOT NULL;

-- =============================================================================
-- Reading State Table
-- =============================================================================
CREATE TABLE reading_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bookmark_id UUID NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user has one reading state per bookmark
  UNIQUE(user_id, bookmark_id)
);

-- Indexes for performance
CREATE INDEX idx_reading_state_user_id ON reading_state(user_id);
CREATE INDEX idx_reading_state_user_read ON reading_state(user_id, is_read);

-- =============================================================================
-- User Preferences Table (for settings like theme)
-- =============================================================================
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'sepia')),
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  last_read_bookmark_id UUID REFERENCES bookmarks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Bookmarks: Users can only access their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON bookmarks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Reading State: Users can only access their own reading state
CREATE POLICY "Users can view own reading state"
  ON reading_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading state"
  ON reading_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading state"
  ON reading_state FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading state"
  ON reading_state FOR DELETE
  USING (auth.uid() = user_id);

-- User Preferences: Users can only access their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================================================
-- Functions
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_bookmarks_updated_at
  BEFORE UPDATE ON bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Helper function to get bookmarks with reading state
-- =============================================================================
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
