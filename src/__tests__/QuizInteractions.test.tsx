import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Quiz from '../components/Quiz';
import { ProgressService } from '../services/progressService';
import * as speechMod from '../utils/speech';

describe('Quiz Deep Interactions - Category Filters, Soft/Hard Signs, Cyrillic Helpers, Mastery & Missed Recap', () => {
  beforeEach(() => {
    localStorage.clear();
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
    vi.spyOn(speechMod, 'initVoices').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('grades Russian soft sign (Ь) and celebrates Word Mastered (3/3)', async () => {
    vi.spyOn(ProgressService, 'recordWordAttempt').mockResolvedValue({
      userId: 'guest_user',
      category: 'alphabet',
      wordId: 'alphabet-Ь',
      prompt: 'Ь',
      answer: 'soft sign',
      timesCorrect: 3,
      timesIncorrect: 0,
      lastTestedAt: new Date().toISOString(),
      masteryLevel: 3,
    });

    render(
      <Quiz
        data={{
          alphabet: [{ character: 'Ь', pronunciation: 'soft sign', example: 'мать' }],
        }}
      />
    );

    // Filter by Alphabet pill once initial async question load settles
    const alphabetTab = await screen.findByRole('tab', { name: /Alphabet/i });
    fireEvent.click(alphabetTab);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'soft sign' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(await screen.findByText('Correct!')).toBeInTheDocument();
    expect(await screen.findByText(/Word Mastered \(3\/3\)!/i)).toBeInTheDocument();
  });

  it('allows overriding an incorrect answer via "I was right" and persists credit', async () => {
    render(
      <Quiz
        data={{
          alphabet: [{ character: 'А', pronunciation: 'ah', example: 'арбуз' }],
        }}
      />
    );

    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: 'totally wrong' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(await screen.findByText('Not quite')).toBeInTheDocument();
    const overrideBtn = screen.getByRole('button', { name: /I was right/i });
    fireEvent.click(overrideBtn);

    expect(await screen.findByText(/Correct! \(Overridden\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Answer accepted as correct/i)).toBeInTheDocument();
    expect(document.querySelector('.session-score-badge')?.textContent).toContain('1 / 1');
  });

  it('toggles Phonetic Typing Cheatsheet, full Russian Keyboard, quick Cyrillic helper keys, and completes missed-word recap', async () => {
    localStorage.setItem('russian_quiz_goal', '5');
    // Force English -> Russian direction by mocking Math.random
    vi.spyOn(Math, 'random').mockReturnValue(0.9);

    render(
      <Quiz
        data={{
          commonWords: [{ english: 'Apple', russian: 'яблоко', pronunciation: 'yabloko' }],
        }}
      />
    );

    // Quick-char helper bar & phonetic guide popover
    const guideBtn = await screen.findByRole('button', { name: 'Phonetic typing guide' });
    fireEvent.click(guideBtn);
    expect(screen.getByText(/Phonetic Typing Cheatsheet/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close guide' }));
    expect(screen.queryByText(/Phonetic Typing Cheatsheet/i)).not.toBeInTheDocument();

    // Open and close full Russian keyboard
    const kbToggle = screen.getByTitle('Toggle Russian Keyboard');
    fireEvent.click(kbToggle);
    expect(screen.getByText('Full Russian Keyboard')).toBeInTheDocument();

    // Insert quick char 'я'
    fireEvent.click(screen.getByRole('button', { name: 'Insert я' }));
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('я');

    fireEvent.click(screen.getByRole('button', { name: 'Close keyboard' }));
    expect(screen.queryByText('Full Russian Keyboard')).not.toBeInTheDocument();

    // Complete 5 missed questions and inspect recap
    for (let i = 0; i < 5; i++) {
      const box = screen.getByRole('textbox');
      fireEvent.change(box, { target: { value: 'неверно' } });
      fireEvent.keyDown(box, { key: 'Enter', code: 'Enter' });
      expect(await screen.findByText('Not quite')).toBeInTheDocument();

      if (i < 4) {
        fireEvent.click(screen.getByRole('button', { name: /Next Question/i }));
      } else {
        fireEvent.click(screen.getByRole('button', { name: /Complete Quiz & View Results/i }));
      }
    }

    expect(await screen.findByText(/Words to Review/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Start Next Quiz/i }));
    await waitFor(() => expect(screen.getByText('of 5')).toBeInTheDocument());
  });
});
