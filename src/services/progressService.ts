import { QuizSession, WordProgress, UserStats } from '../types/progress';
import { supabase } from './supabaseClient';

const LOCAL_STORAGE_SESSIONS_KEY = 'russian_quiz_sessions';
const LOCAL_STORAGE_WORDS_KEY = 'russian_word_progress';

const getGuestUserId = (): string => 'guest_user';

// ==========================================
// LOCAL STORAGE HELPERS
// ==========================================

const getLocalSessions = (): QuizSession[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to parse local quiz sessions:', err);
    return [];
  }
};

const saveLocalSessions = (sessions: QuizSession[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.warn('Failed to save local quiz sessions:', err);
  }
};

const getLocalWordProgress = (): Record<string, WordProgress> => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_WORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Failed to parse local word progress:', err);
    return {};
  }
};

const saveLocalWordProgress = (words: Record<string, WordProgress>) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_WORDS_KEY, JSON.stringify(words));
  } catch (err) {
    console.warn('Failed to save local word progress:', err);
  }
};

// ==========================================
// PROGRESS SERVICE CORE
// ==========================================

export class ProgressService {
  /**
   * Record an attempt on an individual word during a quiz
   */
  static async recordWordAttempt(params: {
    category: string;
    wordId: string;
    prompt: string;
    answer: string;
    isCorrect: boolean;
  }): Promise<WordProgress> {
    const { category, wordId, prompt, answer, isCorrect } = params;
    const now = new Date().toISOString();

    // 1. Try Supabase if authenticated
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch existing word progress
          const { data: existing } = await supabase
            .from('word_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('word_id', wordId)
            .single();

          const timesCorrect = (existing?.times_correct || 0) + (isCorrect ? 1 : 0);
          const timesIncorrect = (existing?.times_incorrect || 0) + (isCorrect ? 0 : 1);
          // Mastery formula: each correct adds 1, incorrect resets by 1 (clamped 0 to 5)
          const currentMastery = existing?.mastery_level || 0;
          const masteryLevel = Math.max(0, Math.min(5, currentMastery + (isCorrect ? 1 : -1)));

          const { data, error } = await supabase
            .from('word_progress')
            .upsert({
              user_id: user.id,
              category,
              word_id: wordId,
              prompt,
              answer,
              times_correct: timesCorrect,
              times_incorrect: timesIncorrect,
              last_tested_at: now,
              mastery_level: masteryLevel
            }, { onConflict: 'user_id,word_id' })
            .select()
            .single();

          if (!error && data) {
            return {
              id: data.id,
              userId: data.user_id,
              category: data.category,
              wordId: data.word_id,
              prompt: data.prompt,
              answer: data.answer,
              timesCorrect: data.times_correct,
              timesIncorrect: data.times_incorrect,
              lastTestedAt: data.last_tested_at,
              masteryLevel: data.mastery_level
            };
          }
        }
      } catch (err) {
        console.warn('Error saving word progress to Supabase, falling back to local:', err);
      }
    }

    // 2. Fallback to LocalStorage (Guest Mode)
    const localWords = getLocalWordProgress();
    const existing = localWords[wordId] || {
      userId: getGuestUserId(),
      category,
      wordId,
      prompt,
      answer,
      timesCorrect: 0,
      timesIncorrect: 0,
      lastTestedAt: now,
      masteryLevel: 0
    };

    const timesCorrect = existing.timesCorrect + (isCorrect ? 1 : 0);
    const timesIncorrect = existing.timesIncorrect + (isCorrect ? 0 : 1);
    const masteryLevel = Math.max(0, Math.min(5, existing.masteryLevel + (isCorrect ? 1 : -1)));

    const updated: WordProgress = {
      ...existing,
      prompt,
      answer,
      timesCorrect,
      timesIncorrect,
      lastTestedAt: now,
      masteryLevel
    };

    localWords[wordId] = updated;
    saveLocalWordProgress(localWords);
    return updated;
  }

  /**
   * Return all word IDs that have reached full mastery (masteryLevel >= 5)
   */
  static async getMasteredWordIds(): Promise<Set<string>> {
    const mastered = new Set<string>();

    const localWords = getLocalWordProgress();
    for (const [id, word] of Object.entries(localWords)) {
      if (word.masteryLevel >= 5) {
        mastered.add(id);
      }
    }

    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('word_progress')
            .select('word_id')
            .eq('user_id', user.id)
            .gte('mastery_level', 5);
          if (data) {
            data.forEach((row: any) => mastered.add(row.word_id));
          }
        }
      } catch (err) {
        console.warn('Could not fetch mastered word ids from Supabase:', err);
      }
    }

    return mastered;
  }

  /**
   * Record a completed quiz session
   */
  static async recordQuizSession(params: {
    category: string;
    score: number;
    totalQuestions: number;
  }): Promise<QuizSession> {
    const { category, score, totalQuestions } = params;
    const now = new Date().toISOString();
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Try Supabase if authenticated
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('quiz_sessions')
            .insert({
              user_id: user.id,
              category,
              score,
              total_questions: totalQuestions,
              completed_at: now
            })
            .select()
            .single();

          if (!error && data) {
            return {
              id: data.id,
              userId: data.user_id,
              category: data.category,
              score: data.score,
              totalQuestions: data.total_questions,
              percentage: Number(data.percentage || percentage),
              completedAt: data.completed_at
            };
          }
        }
      } catch (err) {
        console.warn('Error saving quiz session to Supabase, falling back to local:', err);
      }
    }

    // 2. Fallback to LocalStorage (Guest Mode)
    const session: QuizSession = {
      id,
      userId: getGuestUserId(),
      category,
      score,
      totalQuestions,
      percentage,
      completedAt: now
    };

    const sessions = getLocalSessions();
    sessions.unshift(session);
    // Keep last 100 sessions locally
    saveLocalSessions(sessions.slice(0, 100));
    return session;
  }

  /**
   * Get overall user statistics (accuracy, totals, words to review)
   */
  static async getUserStats(): Promise<UserStats> {
    // 1. Try Supabase if authenticated
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const [sessionsRes, wordsRes] = await Promise.all([
            supabase
              .from('quiz_sessions')
              .select('*')
              .eq('user_id', user.id)
              .order('completed_at', { ascending: false })
              .limit(50),
            supabase
              .from('word_progress')
              .select('*')
              .eq('user_id', user.id)
          ]);

          const sessions: QuizSession[] = (sessionsRes.data || []).map((s: any) => ({
            id: s.id,
            userId: s.user_id,
            category: s.category,
            score: s.score,
            totalQuestions: s.total_questions,
            percentage: Number(s.percentage || Math.round((s.score / s.total_questions) * 100)),
            completedAt: s.completed_at
          }));

          const words: WordProgress[] = (wordsRes.data || []).map((w: any) => ({
            id: w.id,
            userId: w.user_id,
            category: w.category,
            wordId: w.word_id,
            prompt: w.prompt,
            answer: w.answer,
            timesCorrect: w.times_correct,
            timesIncorrect: w.times_incorrect,
            lastTestedAt: w.last_tested_at,
            masteryLevel: w.mastery_level
          }));

          return this.aggregateStats(sessions, words);
        }
      } catch (err) {
        console.warn('Error fetching stats from Supabase, falling back to local:', err);
      }
    }

    // 2. Fallback to LocalStorage (Guest Mode)
    const localSessions = getLocalSessions();
    const localWords = Object.values(getLocalWordProgress());
    return this.aggregateStats(localSessions, localWords);
  }

  /**
   * Sync guest progress to Supabase when user logs in
   */
  static async syncGuestDataToCloud(): Promise<void> {
    if (!supabase) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const localSessions = getLocalSessions();
      const localWords = Object.values(getLocalWordProgress());

      // If no local data, nothing to sync
      if (localSessions.length === 0 && localWords.length === 0) return;

      // Sync word progress
      if (localWords.length > 0) {
        const payload = localWords.map(w => ({
          user_id: user.id,
          category: w.category,
          word_id: w.wordId,
          prompt: w.prompt,
          answer: w.answer,
          times_correct: w.timesCorrect,
          times_incorrect: w.timesIncorrect,
          last_tested_at: w.lastTestedAt,
          mastery_level: w.masteryLevel
        }));

        await supabase
          .from('word_progress')
          .upsert(payload, { onConflict: 'user_id,word_id' });
      }

      // Sync quiz sessions
      if (localSessions.length > 0) {
        const sessionPayload = localSessions.slice(0, 20).map(s => ({
          user_id: user.id,
          category: s.category,
          score: s.score,
          total_questions: s.totalQuestions,
          completed_at: s.completedAt
        }));

        await supabase
          .from('quiz_sessions')
          .insert(sessionPayload);
      }

      console.info('Successfully synced guest progress to Supabase account.');
    } catch (err) {
      console.warn('Could not sync guest progress to cloud:', err);
    }
  }

  private static aggregateStats(sessions: QuizSession[], words: WordProgress[]): UserStats {
    const totalQuizzesTaken = sessions.length;
    const averageScore = totalQuizzesTaken > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.percentage, 0) / totalQuizzesTaken)
      : 0;

    const wordsMasteredCount = words.filter(w => w.masteryLevel >= 5).length;
    const wordsLearningCount = words.filter(w => w.masteryLevel < 5).length;

    // Words to review: answered incorrectly and not yet cleared (clears after 2 knowns / masteryLevel >= 2)
    const wordsToReview = words
      .filter(w => w.timesIncorrect > 0 && w.masteryLevel < 2)
      .sort((a, b) => b.timesIncorrect - a.timesIncorrect)
      .slice(0, 10);

    return {
      totalQuizzesTaken,
      averageScore,
      wordsMasteredCount,
      wordsLearningCount,
      wordsToReview,
      recentSessions: sessions.slice(0, 10)
    };
  }
}
