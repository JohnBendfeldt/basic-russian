import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressService } from '../services/progressService';

describe('ProgressService (Guest Mode)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('records an individual word attempt and calculates mastery level', async () => {
    // 1st attempt correct
    const word1 = await ProgressService.recordWordAttempt({
      category: 'alphabet',
      wordId: 'alphabet-А',
      prompt: 'А',
      answer: 'a',
      isCorrect: true
    });

    expect(word1.timesCorrect).toBe(1);
    expect(word1.timesIncorrect).toBe(0);
    expect(word1.masteryLevel).toBe(1);

    // 2nd attempt correct -> mastery 2
    const word2 = await ProgressService.recordWordAttempt({
      category: 'alphabet',
      wordId: 'alphabet-А',
      prompt: 'А',
      answer: 'a',
      isCorrect: true
    });
    expect(word2.timesCorrect).toBe(2);
    expect(word2.masteryLevel).toBe(2);

    // 3rd attempt incorrect -> mastery decreases by 1
    const word3 = await ProgressService.recordWordAttempt({
      category: 'alphabet',
      wordId: 'alphabet-А',
      prompt: 'А',
      answer: 'a',
      isCorrect: false
    });
    expect(word3.timesCorrect).toBe(2);
    expect(word3.timesIncorrect).toBe(1);
    expect(word3.masteryLevel).toBe(1);
  });

  it('records quiz session and computes percentage score', async () => {
    const session = await ProgressService.recordQuizSession({
      category: 'basicPhrases',
      score: 8,
      totalQuestions: 10
    });

    expect(session.score).toBe(8);
    expect(session.totalQuestions).toBe(10);
    expect(session.percentage).toBe(80);
    expect(session.userId).toBe('guest_user');
  });

  it('aggregates statistics across sessions and words', async () => {
    await ProgressService.recordQuizSession({
      category: 'alphabet',
      score: 10,
      totalQuestions: 10
    });

    await ProgressService.recordQuizSession({
      category: 'numbers',
      score: 6,
      totalQuestions: 10
    });

    // One mastered word (3+ correct)
    await ProgressService.recordWordAttempt({
      category: 'phrases',
      wordId: 'phrase-привет',
      prompt: 'Привет',
      answer: 'hello',
      isCorrect: true
    });
    await ProgressService.recordWordAttempt({
      category: 'phrases',
      wordId: 'phrase-привет',
      prompt: 'Привет',
      answer: 'hello',
      isCorrect: true
    });
    await ProgressService.recordWordAttempt({
      category: 'phrases',
      wordId: 'phrase-привет',
      prompt: 'Привет',
      answer: 'hello',
      isCorrect: true
    });
    await ProgressService.recordWordAttempt({
      category: 'phrases',
      wordId: 'phrase-привет',
      prompt: 'Привет',
      answer: 'hello',
      isCorrect: true
    });
    await ProgressService.recordWordAttempt({
      category: 'phrases',
      wordId: 'phrase-привет',
      prompt: 'Привет',
      answer: 'hello',
      isCorrect: true
    });

    // One struggling word
    await ProgressService.recordWordAttempt({
      category: 'phrases',
      wordId: 'phrase-до-свидания',
      prompt: 'До свидания',
      answer: 'goodbye',
      isCorrect: false
    });

    const stats = await ProgressService.getUserStats();

    expect(stats.totalQuizzesTaken).toBe(2);
    expect(stats.averageScore).toBe(80); // (100% + 60%) / 2 = 80%
    expect(stats.wordsMasteredCount).toBe(1);
    expect(stats.wordsToReview.length).toBe(1);
    expect(stats.wordsToReview[0].wordId).toBe('phrase-до-свидания');

    const masteredIds = await ProgressService.getMasteredWordIds();
    expect(masteredIds.has('phrase-привет')).toBe(true);
    expect(masteredIds.has('phrase-до-свидания')).toBe(false);

    // 1st correct answer brings mastery to 1 -> still in review list
    await ProgressService.recordWordAttempt({
      category: 'phrases',
      wordId: 'phrase-до-свидания',
      prompt: 'До свидания',
      answer: 'goodbye',
      isCorrect: true
    });
    const statsAfter1stKnown = await ProgressService.getUserStats();
    expect(statsAfter1stKnown.wordsToReview.length).toBe(1);

    // 2nd correct answer brings mastery to 2 -> clears from words to review
    await ProgressService.recordWordAttempt({
      category: 'phrases',
      wordId: 'phrase-до-свидания',
      prompt: 'До свидания',
      answer: 'goodbye',
      isCorrect: true
    });
    const statsAfter2ndKnown = await ProgressService.getUserStats();
    expect(statsAfter2ndKnown.wordsToReview.length).toBe(0);
  });

  it('safely handles malformed JSON and ignores prototype-polluting keys in localStorage', async () => {
    localStorage.setItem('russian_quiz_sessions', '"not-an-array"');
    localStorage.setItem(
      'russian_word_progress',
      '{"__proto__":{"polluted":true},"constructor":{"polluted":true},"valid-id":{"userId":"guest_user","category":"words","wordId":"valid-id","prompt":"Привет","answer":"hello","timesCorrect":1,"timesIncorrect":0,"lastTestedAt":"2026-01-01T00:00:00Z","masteryLevel":1}}'
    );

    const stats = await ProgressService.getUserStats();
    expect(stats.totalQuizzesTaken).toBe(0);
    expect(stats.wordsLearningCount).toBe(1);
    expect(({} as any).polluted).toBeUndefined();
  });

  it('clamps mastery at 3 (MASTERY_THRESHOLD) and supports overrideWordAttempt', async () => {
    const wordId = 'basicPhrases-Привет';
    for (let i = 1; i <= 4; i++) {
      const res = await ProgressService.recordWordAttempt({
        category: 'basicPhrases',
        wordId,
        prompt: 'Привет',
        answer: 'hello',
        isCorrect: true,
      });
      expect(res.masteryLevel).toBe(Math.min(3, i));
    }
    const masteredIds = await ProgressService.getMasteredWordIds();
    expect(masteredIds.has(wordId)).toBe(true);

    const reviewId = 'basicPhrases-Спасибо';
    const missed = await ProgressService.recordWordAttempt({
      category: 'basicPhrases',
      wordId: reviewId,
      prompt: 'Спасибо',
      answer: 'thank you',
      isCorrect: false,
    });
    expect(missed.timesIncorrect).toBe(1);
    expect(missed.masteryLevel).toBe(0);

    const overridden = await ProgressService.overrideWordAttempt({
      category: 'basicPhrases',
      wordId: reviewId,
      prompt: 'Спасибо',
      answer: 'thank you',
    });
    expect(overridden.timesCorrect).toBe(1);
    expect(overridden.timesIncorrect).toBe(0);
    expect(overridden.masteryLevel).toBe(1);
  });
});
