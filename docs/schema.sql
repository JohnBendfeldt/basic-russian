-- ==============================================================================
-- BASIC RUSSIAN: SUPABASE POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Copy and paste this script into your Supabase Dashboard:
-- Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create quiz_sessions table
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language_id VARCHAR(10) NOT NULL DEFAULT 'ru' CHECK (char_length(language_id) BETWEEN 2 AND 10),
  category VARCHAR(50) NOT NULL CHECK (char_length(category) BETWEEN 1 AND 50), -- 'alphabet', 'numbers', 'time', 'basicPhrases', 'commonWords', 'mixed'
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= total_questions),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0 AND total_questions <= 500),
  percentage NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_questions > 0 THEN ROUND((score::numeric / total_questions) * 100, 2)
      ELSE 0
    END
  ) STORED,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completed_at ON public.quiz_sessions(completed_at DESC);

-- 2. Create word_progress table (spaced-repetition tracking)
CREATE TABLE IF NOT EXISTS public.word_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language_id VARCHAR(10) NOT NULL DEFAULT 'ru' CHECK (char_length(language_id) BETWEEN 2 AND 10),
  category VARCHAR(50) NOT NULL CHECK (char_length(category) BETWEEN 1 AND 50),
  word_id VARCHAR(150) NOT NULL CHECK (char_length(word_id) BETWEEN 1 AND 150), -- e.g. 'alphabet-А', 'phrases-Привет'
  prompt TEXT NOT NULL CHECK (char_length(prompt) <= 500),
  answer TEXT NOT NULL CHECK (char_length(answer) <= 500),
  target TEXT CHECK (target IS NULL OR char_length(target) <= 500),
  times_correct INTEGER NOT NULL DEFAULT 0 CHECK (times_correct >= 0),
  times_incorrect INTEGER NOT NULL DEFAULT 0 CHECK (times_incorrect >= 0),
  last_tested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mastery_level INTEGER NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5), -- 0 (learning) to 5 (mastered)
  CONSTRAINT unique_user_lang_word UNIQUE (user_id, language_id, word_id)
);

-- Idempotent migration for pre-existing installations consolidating into the shared database
ALTER TABLE public.quiz_sessions ADD COLUMN IF NOT EXISTS language_id VARCHAR(10) NOT NULL DEFAULT 'ru' CHECK (char_length(language_id) BETWEEN 2 AND 10);
ALTER TABLE public.word_progress ADD COLUMN IF NOT EXISTS language_id VARCHAR(10) NOT NULL DEFAULT 'ru' CHECK (char_length(language_id) BETWEEN 2 AND 10);
ALTER TABLE public.word_progress ADD COLUMN IF NOT EXISTS target TEXT;
ALTER TABLE public.word_progress DROP CONSTRAINT IF EXISTS unique_user_word;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_lang_word'
  ) THEN
    ALTER TABLE public.word_progress
      ADD CONSTRAINT unique_user_lang_word UNIQUE (user_id, language_id, word_id);
  END IF;
END $$;

-- Index for fast lookup by user and category
CREATE INDEX IF NOT EXISTS idx_word_progress_user_id ON public.word_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_word_progress_mastery ON public.word_progress(user_id, mastery_level);

-- ==============================================================================
-- 3. PRIVILEGE HARDENING & ROW LEVEL SECURITY (RLS)
-- Unauthenticated (anon) requests have zero table access; authenticated users
-- can strictly ONLY read, insert, update, and delete their OWN rows.
-- ==============================================================================

REVOKE ALL ON public.quiz_sessions FROM anon;
REVOKE ALL ON public.word_progress FROM anon;
GRANT SELECT, INSERT, DELETE ON public.quiz_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.word_progress TO authenticated;

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_progress ENABLE ROW LEVEL SECURITY;

-- Policies for quiz_sessions
DROP POLICY IF EXISTS "Users can view their own quiz sessions" ON public.quiz_sessions;
CREATE POLICY "Users can view their own quiz sessions"
  ON public.quiz_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own quiz sessions" ON public.quiz_sessions;
CREATE POLICY "Users can insert their own quiz sessions"
  ON public.quiz_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own quiz sessions" ON public.quiz_sessions;
CREATE POLICY "Users can delete their own quiz sessions"
  ON public.quiz_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for word_progress
DROP POLICY IF EXISTS "Users can view their own word progress" ON public.word_progress;
CREATE POLICY "Users can view their own word progress"
  ON public.word_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own word progress" ON public.word_progress;
CREATE POLICY "Users can insert their own word progress"
  ON public.word_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own word progress" ON public.word_progress;
CREATE POLICY "Users can update their own word progress"
  ON public.word_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own word progress" ON public.word_progress;
CREATE POLICY "Users can delete their own word progress"
  ON public.word_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
