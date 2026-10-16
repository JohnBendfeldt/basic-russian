-- ==============================================================================
-- RUSSIAN LEARNING APP: SUPABASE POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Copy and paste this script into your Supabase Dashboard:
-- Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create quiz_sessions table
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL, -- 'alphabet', 'numbers', 'basicPhrases', 'commonWords', 'mixed'
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_questions > 0 THEN ROUND((score::numeric / total_questions) * 100, 2)
      ELSE 0
    END
  ) STORED,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completed_at ON public.quiz_sessions(completed_at DESC);

-- 2. Create word_progress table (spaced-repetition tracking)
CREATE TABLE IF NOT EXISTS public.word_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  word_id VARCHAR(150) NOT NULL, -- e.g. 'alphabet-А', 'phrases-Привет'
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  times_correct INTEGER NOT NULL DEFAULT 0,
  times_incorrect INTEGER NOT NULL DEFAULT 0,
  last_tested_at TIMESTAMPTZ DEFAULT NOW(),
  mastery_level INTEGER NOT NULL DEFAULT 0, -- 0 (learning) to 5 (mastered)
  CONSTRAINT unique_user_word UNIQUE (user_id, word_id)
);

-- Index for fast lookup by user and category
CREATE INDEX IF NOT EXISTS idx_word_progress_user_id ON public.word_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_word_progress_mastery ON public.word_progress(user_id, mastery_level);

-- ==============================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- Users can strictly ONLY read, insert, and update their OWN rows!
-- ==============================================================================

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_progress ENABLE ROW LEVEL SECURITY;

-- Policies for quiz_sessions
CREATE POLICY "Users can view their own quiz sessions"
  ON public.quiz_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz sessions"
  ON public.quiz_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quiz sessions"
  ON public.quiz_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for word_progress
CREATE POLICY "Users can view their own word progress"
  ON public.word_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own word progress"
  ON public.word_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own word progress"
  ON public.word_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own word progress"
  ON public.word_progress
  FOR DELETE
  USING (auth.uid() = user_id);
