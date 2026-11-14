import { QuizSession, WordProgress, UserStats, MASTERY_THRESHOLD } from '../types/progress';
import { supabase } from './supabaseClient';

export const APP_LANGUAGE_ID = 'ru';

const LOCAL_STORAGE_SESSIONS_KEY = 'russian_quiz_sessions';
const LOCAL_STORAGE_WORDS_KEY = 'russian_word_progress';

const getGuestUserId = (): string => 'guest_user';

const stripDirectionalSuffix = (wordId: string): string =>
  wordId.replace(/-(?:ru-to-en|en-to-ru|fr-to-en|en-to-fr|to-en|to-ru|to-fr)$/, '');

const querySingleOrMaybeSingle = async (query: any) =>
  typeof query?.maybeSingle === 'function' ? query.maybeSingle() : query.single();

const deduplicateWordsByCanonicalId = (words: WordProgress[]): WordProgress[] => {
  const merged = new Map<string, WordProgress>();
  for (const word of words) {
    const canonicalId = stripDirectionalSuffix(word.wordId);
    const existing = merged.get(canonicalId);
    if (!existing) {
      merged.set(canonicalId, { ...word, wordId: canonicalId });
    } else {
      merged.set(canonicalId, {
        ...existing,
        wordId: canonicalId,
        timesCorrect: existing.timesCorrect + word.timesCorrect,
        timesIncorrect: existing.timesIncorrect + word.timesIncorrect,
        masteryLevel: Math.max(existing.masteryLevel, word.masteryLevel),
        lastTestedAt: existing.lastTestedAt >= word.lastTestedAt ? existing.lastTestedAt : word.lastTestedAt,
      });
    }
  }
  return Array.from(merged.values());
};

// ==========================================
// LOCAL STORAGE HELPERS
// ==========================================

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype', 'toString', 'valueOf', 'hasOwnProperty']);

const isSafeWordId = (id: unknown): id is string =>
  typeof id === 'string' && id.length > 0 && id.length <= 150 && !UNSAFE_KEYS.has(id);

const clampInt = (val: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.trunc(Number.isFinite(val) ? val : min)));

const getLocalSessions = (): QuizSession[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const safeSessions: QuizSession[] = [];
    for (const rawItem of parsed) {
      if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) continue;
      const item: any = { ...rawItem };
      if (typeof item.category === 'string') item.category = item.category.slice(0, 100);
      if (typeof item.totalQuestions === 'number') {
        item.totalQuestions = clampInt(item.totalQuestions, 0, 500);
      }
      if (typeof item.score === 'number') {
        const maxScore = typeof item.totalQuestions === 'number' ? item.totalQuestions : 500;
        item.score = clampInt(item.score, 0, maxScore);
      }
      if (typeof item.percentage === 'number') {
        item.percentage = clampInt(item.percentage, 0, 100);
      }
      safeSessions.push(item as QuizSession);
    }
    return safeSessions;
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
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const safeRecord: Record<string, WordProgress> = {};
    for (const [key, val] of Object.entries(parsed)) {
      if (!isSafeWordId(key) || !val || typeof val !== 'object' || Array.isArray(val)) continue;
      const item: any = { ...val };
      if (typeof item.category === 'string') item.category = item.category.slice(0, 100);
      if (typeof item.prompt === 'string') item.prompt = item.prompt.slice(0, 500);
      if (typeof item.answer === 'string') item.answer = item.answer.slice(0, 500);
      if (typeof item.timesCorrect === 'number') item.timesCorrect = clampInt(item.timesCorrect, 0, 100000);
      if (typeof item.timesIncorrect === 'number') item.timesIncorrect = clampInt(item.timesIncorrect, 0, 100000);
      if (typeof item.masteryLevel === 'number') item.masteryLevel = clampInt(item.masteryLevel, 0, MASTERY_THRESHOLD);
      safeRecord[key] = item as WordProgress;
    }
    return safeRecord;
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
  private static previousMasteryMap = new Map<string, number>();

  private static resolveWordProgressSnapshot(params: {
    cacheKey: string;
    isOverride: boolean;
    isCorrect: boolean;
    existingCorrect: number;
    existingIncorrect: number;
    existingMastery: number;
  }): { timesCorrect: number; timesIncorrect: number; masteryLevel: number } {
    const { cacheKey, isOverride, isCorrect, existingCorrect, existingIncorrect, existingMastery } = params;
    if (isOverride) {
      const prevMastery = this.previousMasteryMap.get(cacheKey);
      this.previousMasteryMap.delete(cacheKey);
      const baseMastery = prevMastery !== undefined ? prevMastery : existingMastery;
      return {
        timesCorrect: existingCorrect + 1,
        timesIncorrect: Math.max(0, existingIncorrect - 1),
        masteryLevel: Math.max(0, Math.min(MASTERY_THRESHOLD, baseMastery + 1)),
      };
    }

    if (isCorrect) {
      this.previousMasteryMap.delete(cacheKey);
    } else {
      this.previousMasteryMap.set(cacheKey, existingMastery);
    }
    return {
      timesCorrect: existingCorrect + (isCorrect ? 1 : 0),
      timesIncorrect: existingIncorrect + (isCorrect ? 0 : 1),
      masteryLevel: Math.max(0, Math.min(MASTERY_THRESHOLD, existingMastery + (isCorrect ? 1 : -1))),
    };
  }

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
    return this.saveWordProgressAttempt({ ...params, isOverride: false });
  }

  /**
   * Override a previous incorrect attempt on a word ("I was right"), reversing the incorrect
   * count and applying a positive mastery delta relative to before the incorrect attempt.
   */
  static async overrideWordAttempt(params: {
    category: string;
    wordId: string;
    prompt: string;
    answer: string;
  }): Promise<WordProgress> {
    return this.saveWordProgressAttempt({ ...params, isCorrect: true, isOverride: true });
  }

  private static async saveWordProgressAttempt(params: {
    category: string;
    wordId: string;
    prompt: string;
    answer: string;
    isCorrect: boolean;
    isOverride: boolean;
  }): Promise<WordProgress> {
    const { category, wordId, prompt, answer, isCorrect, isOverride } = params;
    const now = new Date().toISOString();
    const safeCategory = (category || '').slice(0, 100);
    const safePrompt = (prompt || '').slice(0, 500);
    const safeAnswer = (answer || '').slice(0, 500);

    if (!isSafeWordId(wordId)) {
      return {
        userId: getGuestUserId(),
        category: safeCategory,
        wordId: '',
        prompt: safePrompt,
        answer: safeAnswer,
        timesCorrect: 0,
        timesIncorrect: 0,
        lastTestedAt: now,
        masteryLevel: 0
      };
    }

    const cacheKey = `${APP_LANGUAGE_ID}:${wordId}`;

    // 1. Try Supabase if authenticated
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch existing word progress
          const { data: existing } = await querySingleOrMaybeSingle(
            supabase
              .from('word_progress')
              .select('*')
              .eq('user_id', user.id)
              .eq('language_id', APP_LANGUAGE_ID)
              .eq('word_id', wordId)
          );

          const { timesCorrect, timesIncorrect, masteryLevel } = this.resolveWordProgressSnapshot({
            cacheKey,
            isOverride,
            isCorrect,
            existingCorrect: existing?.times_correct || 0,
            existingIncorrect: existing?.times_incorrect || 0,
            existingMastery: existing?.mastery_level || 0
          });

          const { data, error } = await supabase
            .from('word_progress')
            .upsert({
              user_id: user.id,
              language_id: APP_LANGUAGE_ID,
              category: safeCategory,
              word_id: wordId,
              prompt: safePrompt,
              answer: safeAnswer,
              times_correct: timesCorrect,
              times_incorrect: timesIncorrect,
              last_tested_at: now,
              mastery_level: masteryLevel
            }, { onConflict: 'user_id,language_id,word_id' })
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
    const existing = (Object.prototype.hasOwnProperty.call(localWords, wordId) && localWords[wordId]) || {
      userId: getGuestUserId(),
      category: safeCategory,
      wordId,
      prompt: safePrompt,
      answer: safeAnswer,
      timesCorrect: 0,
      timesIncorrect: 0,
      lastTestedAt: now,
      masteryLevel: 0
    };

    const { timesCorrect, timesIncorrect, masteryLevel } = this.resolveWordProgressSnapshot({
      cacheKey,
      isOverride,
      isCorrect,
      existingCorrect: existing.timesCorrect,
      existingIncorrect: existing.timesIncorrect,
      existingMastery: existing.masteryLevel
    });

    const updated: WordProgress = {
      ...existing,
      prompt: safePrompt,
      answer: safeAnswer,
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
   * Return all word IDs that have reached full mastery (masteryLevel >= MASTERY_THRESHOLD)
   */
  static async getMasteredWordIds(): Promise<Set<string>> {
    const mastered = new Set<string>();

    const localWords = getLocalWordProgress();
    for (const [id, word] of Object.entries(localWords)) {
      if (word.masteryLevel >= MASTERY_THRESHOLD) {
        mastered.add(id);
      }
    }

    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('word_progress')
            .select('word_id, language_id')
            .eq('user_id', user.id)
            .gte('mastery_level', MASTERY_THRESHOLD);
          if (data) {
            data
              .filter((row: any) => !row.language_id || row.language_id === APP_LANGUAGE_ID)
              .forEach((row: any) => mastered.add(row.word_id));
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
    const cleanCategory = (category || '').slice(0, 100);
    const cleanTotal = clampInt(totalQuestions, 0, 500);
    const cleanScore = clampInt(score, 0, cleanTotal);
    const now = new Date().toISOString();
    const percentage = cleanTotal > 0 ? Math.round((cleanScore / cleanTotal) * 100) : 0;
    const id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Try Supabase if authenticated (skip empty sessions that violate DB CHECK total_questions > 0)
    if (supabase && cleanTotal >= 1) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('quiz_sessions')
            .insert({
              user_id: user.id,
              language_id: APP_LANGUAGE_ID,
              category: cleanCategory,
              score: cleanScore,
              total_questions: cleanTotal,
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
      category: cleanCategory,
      score: cleanScore,
      totalQuestions: cleanTotal,
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

          const sessions: QuizSession[] = (sessionsRes.data || [])
            .filter((s: any) => !s.language_id || s.language_id === APP_LANGUAGE_ID)
            .map((s: any) => ({
            id: s.id,
            userId: s.user_id,
            category: s.category,
            score: s.score,
            totalQuestions: s.total_questions,
            percentage: Number(s.percentage || Math.round((s.score / s.total_questions) * 100)),
            completedAt: s.completed_at
          }));

          const words: WordProgress[] = (wordsRes.data || [])
            .filter((w: any) => !w.language_id || w.language_id === APP_LANGUAGE_ID)
            .map((w: any) => ({
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

  private static syncInFlight = false;

  /**
   * Sync guest progress to Supabase when user logs in
   */
  static async syncGuestDataToCloud(): Promise<void> {
    if (!supabase || this.syncInFlight) return;
    this.syncInFlight = true;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const localSessions = getLocalSessions();
      const localWords = Object.values(getLocalWordProgress());

      // If no local data, nothing to sync
      if (localSessions.length === 0 && localWords.length === 0) return;

      let wordsSynced = true;
      let sessionsSynced = true;

      // Sync word progress
      const validWords = localWords.filter(w => w && isSafeWordId(w.wordId));
      if (validWords.length > 0) {
        const payload = validWords.map(w => ({
          user_id: user.id,
          language_id: APP_LANGUAGE_ID,
          category: (w.category || 'general').slice(0, 100),
          word_id: w.wordId,
          prompt: (w.prompt || '').slice(0, 500),
          answer: (w.answer || '').slice(0, 500),
          times_correct: clampInt(w.timesCorrect ?? 0, 0, 100000),
          times_incorrect: clampInt(w.timesIncorrect ?? 0, 0, 100000),
          last_tested_at: w.lastTestedAt || new Date().toISOString(),
          mastery_level: clampInt(w.masteryLevel ?? 0, 0, MASTERY_THRESHOLD)
        }));

        const { error } = await supabase
          .from('word_progress')
          .upsert(payload, { onConflict: 'user_id,language_id,word_id' });
        if (error) wordsSynced = false;
      }

      // Sync quiz sessions
      const sessionPayload = localSessions
        .slice(0, 20)
        .map(s => {
          const cleanTotal = clampInt(s.totalQuestions ?? 0, 0, 500);
          const cleanScore = clampInt(s.score ?? 0, 0, cleanTotal);
          return {
            user_id: user.id,
            language_id: APP_LANGUAGE_ID,
            category: (s.category || 'general').slice(0, 100),
            score: cleanScore,
            total_questions: cleanTotal,
            completed_at: s.completedAt || new Date().toISOString()
          };
        })
        .filter(s => s.total_questions >= 1 && s.score >= 0 && s.score <= s.total_questions);

      if (sessionPayload.length > 0) {
        const { error } = await supabase
          .from('quiz_sessions')
          .insert(sessionPayload);
        if (error) sessionsSynced = false;
      }

      // Clear local guest caches after successful upload to avoid duplicate session inserts on future logins
      if (wordsSynced) {
        localStorage.removeItem(LOCAL_STORAGE_WORDS_KEY);
      }
      if (sessionsSynced) {
        localStorage.removeItem(LOCAL_STORAGE_SESSIONS_KEY);
      }

      if (wordsSynced && sessionsSynced) {
        console.info('Successfully synced guest progress to Supabase account.');
      }
    } catch (err) {
      console.warn('Could not sync guest progress to cloud:', err);
    } finally {
      this.syncInFlight = false;
    }
  }

  private static aggregateStats(sessions: QuizSession[], words: WordProgress[]): UserStats {
    const totalQuizzesTaken = sessions.length;
    const averageScore = totalQuizzesTaken > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.percentage, 0) / totalQuizzesTaken)
      : 0;

    const canonicalWords = deduplicateWordsByCanonicalId(words);
    const wordsMasteredCount = canonicalWords.filter(w => w.masteryLevel >= MASTERY_THRESHOLD).length;
    const wordsLearningCount = canonicalWords.filter(w => w.masteryLevel < MASTERY_THRESHOLD).length;

    // Words to review: answered incorrectly and not yet cleared (clears after 2 knowns / masteryLevel >= 2)
    const wordsToReview = canonicalWords
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
