import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProgressService } from '../services/progressService';
import { QuizSession } from '../types/progress';

const sb = vi.hoisted(() => ({ client: null as null | Record<string, unknown> }));
vi.mock('../services/supabaseClient', () => ({
  get supabase() {
    return sb.client;
  },
}));

type Result = { data?: unknown; error?: unknown };
const makeChain = (result: Result) => {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'gte', 'order', 'limit']) c[m] = vi.fn(() => c);
  c.upsert = vi.fn(() => c);
  c.insert = vi.fn(() => c);
  c.single = vi.fn(() => Promise.resolve(result));
  c.then = (res: (v: Result) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(result).then(res, rej);
  return c;
};

const mockSignedIn = (
  tables: Record<string, Result | Result[]>,
  user: { id: string } | null = { id: 'user-ru-1' }
) => {
  const chains: Record<string, ReturnType<typeof makeChain>[]> = {};
  const from = vi.fn((table: string) => {
    const cfg = tables[table] ?? { data: null, error: null };
    const results = Array.isArray(cfg) ? cfg : [cfg];
    const idx = Math.min((chains[table] ?? []).length, results.length - 1);
    const created = makeChain(results[idx]);
    (chains[table] ??= []).push(created);
    return created;
  });
  sb.client = {
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user } })) },
    from,
  };
  return { from, chains };
};

describe('ProgressService - Storage Hardening & Signed-In Cloud Sync', () => {
  beforeEach(() => {
    sb.client = null;
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Guest Mode Storage Hardening', () => {
    it('strips prototype pollution keys and survives corrupted or wrong-shaped JSON in localStorage', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem('russian_quiz_sessions', '{"not":"an array"}');
      localStorage.setItem('russian_word_progress', '["array_instead_of_object"]');
      let stats = await ProgressService.getUserStats();
      expect(stats.totalQuizzesTaken).toBe(0);
      expect(stats.wordsLearningCount).toBe(0);

      localStorage.setItem('russian_quiz_sessions', '{corrupted json');
      localStorage.setItem('russian_word_progress', '{corrupted json');
      stats = await ProgressService.getUserStats();
      expect(stats.totalQuizzesTaken).toBe(0);

      localStorage.setItem(
        'russian_word_progress',
        '{"__proto__":{"masteryLevel":5},"constructor":{"masteryLevel":5},"words-вода":{"wordId":"words-вода","category":"words","prompt":"вода","answer":"water","timesCorrect":1,"timesIncorrect":0,"lastTestedAt":"t","masteryLevel":1}}'
      );
      const mastered = await ProgressService.getMasteredWordIds();
      expect(mastered.size).toBe(0);
      expect((await ProgressService.getUserStats()).wordsLearningCount).toBe(1);
    });

    it('caps stored local quiz sessions at 100 and handles 0-question edge case', async () => {
      const zero = await ProgressService.recordQuizSession({ category: 'alphabet', score: 0, totalQuestions: 0 });
      expect(zero.percentage).toBe(0);

      for (let i = 0; i < 105; i++) {
        await ProgressService.recordQuizSession({ category: `cat-${i}`, score: 5, totalQuestions: 10 });
      }
      const stored = JSON.parse(localStorage.getItem('russian_quiz_sessions')!) as QuizSession[];
      expect(stored).toHaveLength(100);
      expect(stored[0].category).toBe('cat-104');
    });
  });

  describe('Signed-In Supabase Mode', () => {
    it('upserts word progress with clamped mastery and falls back locally on error or exception', async () => {
      const savedRow = {
        id: 'row-1',
        user_id: 'user-ru-1',
        category: 'words',
        word_id: 'words-вода',
        prompt: 'вода',
        answer: 'water',
        times_correct: 5,
        times_incorrect: 1,
        last_tested_at: '2026-11-13T00:00:00Z',
        mastery_level: 5,
      };

      const { chains } = mockSignedIn({
        word_progress: [
          { data: { ...savedRow, times_correct: 4, mastery_level: 5 } },
          { data: savedRow, error: null },
        ],
      });

      const res = await ProgressService.recordWordAttempt({
        category: 'words',
        wordId: 'words-вода',
        prompt: 'вода',
        answer: 'water',
        isCorrect: true,
      });

      expect(chains.word_progress).toHaveLength(2);
      expect(res.userId).toBe('user-ru-1');
      expect(res.masteryLevel).toBe(5);
      expect(res.timesCorrect).toBe(5);

      vi.spyOn(console, 'warn').mockImplementation(() => {});
      sb.client = {
        auth: { getUser: () => Promise.reject(new Error('network offline')) },
        from: vi.fn(),
      };
      const localRes = await ProgressService.recordWordAttempt({
        category: 'words',
        wordId: 'words-хлеб',
        prompt: 'хлеб',
        answer: 'bread',
        isCorrect: false,
      });
      expect(localRes.userId).toBe('guest_user');
      expect(localRes.masteryLevel).toBe(0);
    });

    it('merges local and cloud mastered word IDs and survives cloud errors', async () => {
      localStorage.setItem(
        'russian_word_progress',
        JSON.stringify({
          'local-mastered': { wordId: 'local-mastered', masteryLevel: 5 },
          'local-learning': { wordId: 'local-learning', masteryLevel: 2 },
        })
      );
      mockSignedIn({
        word_progress: { data: [{ word_id: 'cloud-mastered' }] },
      });

      const ids = await ProgressService.getMasteredWordIds();
      expect([...ids].sort()).toEqual(['cloud-mastered', 'local-mastered']);

      vi.spyOn(console, 'warn').mockImplementation(() => {});
      sb.client = {
        auth: { getUser: () => Promise.reject(new Error('offline')) },
        from: vi.fn(),
      };
      expect([...(await ProgressService.getMasteredWordIds())]).toEqual(['local-mastered']);
    });

    it('records quiz sessions in Supabase and fetches aggregated cloud stats', async () => {
      mockSignedIn({
        quiz_sessions: {
          data: {
            id: 'cloud-s1',
            user_id: 'user-ru-1',
            category: 'time',
            score: 9,
            total_questions: 10,
            percentage: '90.00',
            completed_at: '2026-11-13T00:00:00Z',
          },
          error: null,
        },
      });

      const session = await ProgressService.recordQuizSession({
        category: 'time',
        score: 9,
        totalQuestions: 10,
      });
      expect(session.id).toBe('cloud-s1');
      expect(session.percentage).toBe(90);

      mockSignedIn({
        quiz_sessions: {
          data: [
            { id: 's1', user_id: 'user-ru-1', category: 'mixed', score: 8, total_questions: 10, percentage: null, completed_at: '2026-11-13T00:00:00Z' },
          ],
        },
        word_progress: {
          data: [
            { id: 'w1', user_id: 'user-ru-1', category: 'words', word_id: 'вода', prompt: 'вода', answer: 'water', times_correct: 5, times_incorrect: 0, last_tested_at: 't', mastery_level: 5 },
            { id: 'w2', user_id: 'user-ru-1', category: 'words', word_id: 'хлеб', prompt: 'хлеб', answer: 'bread', times_correct: 0, times_incorrect: 3, last_tested_at: 't', mastery_level: 0 },
          ],
        },
      });

      const stats = await ProgressService.getUserStats();
      expect(stats.totalQuizzesTaken).toBe(1);
      expect(stats.averageScore).toBe(80);
      expect(stats.wordsMasteredCount).toBe(1);
      expect(stats.wordsLearningCount).toBe(1);
      expect(stats.wordsToReview.map((w) => w.wordId)).toEqual(['хлеб']);
    });
  });

  describe('syncGuestDataToCloud', () => {
    const seedGuestData = () => {
      localStorage.setItem(
        'russian_word_progress',
        JSON.stringify({
          'words-кофе': {
            wordId: 'words-кофе',
            category: 'words',
            prompt: 'кофе',
            answer: 'coffee',
            timesCorrect: 2,
            timesIncorrect: 1,
            lastTestedAt: '2026-11-13T00:00:00Z',
            masteryLevel: 2,
          },
        })
      );
      const sessions = Array.from({ length: 25 }, (_, idx) => ({
        id: `s-${idx}`,
        userId: 'guest_user',
        category: 'words',
        score: 8,
        totalQuestions: 10,
        percentage: 80,
        completedAt: '2026-11-13T00:00:00Z',
      }));
      localStorage.setItem('russian_quiz_sessions', JSON.stringify(sessions));
    };

    it('uploads words and up to 20 sessions, clears localStorage on success, and deduplicates concurrent syncs', async () => {
      vi.spyOn(console, 'info').mockImplementation(() => {});
      seedGuestData();
      const { chains } = mockSignedIn({
        word_progress: { data: null, error: null },
        quiz_sessions: { data: null, error: null },
      });

      await Promise.all([
        ProgressService.syncGuestDataToCloud(),
        ProgressService.syncGuestDataToCloud(),
      ]);

      expect(chains.word_progress).toHaveLength(1);
      expect(chains.quiz_sessions).toHaveLength(1);
      const sessionPayload = (chains.quiz_sessions[0].insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(sessionPayload).toHaveLength(20);
      expect(localStorage.getItem('russian_word_progress')).toBeNull();
      expect(localStorage.getItem('russian_quiz_sessions')).toBeNull();
    });

    it('retains localStorage caches when Supabase returns an upload error or throws', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      seedGuestData();
      mockSignedIn({
        word_progress: { data: null, error: { message: 'db error' } },
        quiz_sessions: { data: null, error: { message: 'db error' } },
      });

      await ProgressService.syncGuestDataToCloud();
      expect(localStorage.getItem('russian_word_progress')).not.toBeNull();
      expect(localStorage.getItem('russian_quiz_sessions')).not.toBeNull();

      sb.client = {
        auth: { getUser: () => Promise.reject(new Error('network down')) },
        from: vi.fn(),
      };
      await expect(ProgressService.syncGuestDataToCloud()).resolves.toBeUndefined();
    });
  });
});
