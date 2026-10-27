import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Quiz from '../components/Quiz';
import { ProgressService } from '../services/progressService';

// Mock Audio
window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve());
window.HTMLMediaElement.prototype.pause = vi.fn();

const sampleData = {
  alphabet: [
    { character: 'А', pronunciation: 'ah', example: 'автобус' },
    { character: 'Б', pronunciation: 'beh', example: 'билет' },
    { character: 'В', pronunciation: 'veh', example: 'вода' },
  ],
  basicPhrases: [
    { english: 'Hello', russian: 'Привет', pronunciation: 'pree-vyet' },
    { english: 'Thank you', russian: 'Спасибо', pronunciation: 'spuh-see-buh' },
  ],
  numbers: [
    { english: 'One', russian: 'Один', pronunciation: 'ah-deen' },
  ],
  commonWords: [
    { english: 'Cat', russian: 'Кот', pronunciation: 'kot' },
  ],
};

describe('Quiz Component - Session Goals & Mastery Filtering', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders default session goal of 10 questions and pool indicator', async () => {
    render(<Quiz data={sampleData} />);

    // Session goal pills
    expect(screen.getByRole('button', { name: '10 Qs' })).toHaveClass('active');
    expect(screen.getByText('Question')).toBeInTheDocument();
    expect(screen.getByText('of 10')).toBeInTheDocument();

    // Mastery pool badge
    expect(screen.getByText(/Mastered:/i)).toBeInTheDocument();
  });

  it('allows user to change the session goal to 5 or 20 questions', async () => {
    render(<Quiz data={sampleData} />);

    const fivePill = screen.getByRole('button', { name: '5 Qs' });
    fireEvent.click(fivePill);

    expect(fivePill).toHaveClass('active');
    expect(screen.getByText('of 5')).toBeInTheDocument();
    expect(localStorage.getItem('russian_quiz_goal')).toBe('5');

    const twentyPill = screen.getByRole('button', { name: '20 Qs' });
    fireEvent.click(twentyPill);

    expect(twentyPill).toHaveClass('active');
    expect(screen.getByText('of 20')).toBeInTheDocument();
    expect(localStorage.getItem('russian_quiz_goal')).toBe('20');
  });

  it('excludes mastered words (masteryLevel >= 5) from active questions', async () => {
    // Mock getMasteredWordIds to return 'alphabet-А' as already mastered
    vi.spyOn(ProgressService, 'getMasteredWordIds').mockResolvedValue(new Set(['alphabet-А']));

    render(<Quiz data={{
      alphabet: [
        { character: 'А', pronunciation: 'ah' },
        { character: 'Б', pronunciation: 'beh' }
      ]
    }} />);

    // Wait for mastered words to load
    await waitFor(() => {
      expect(screen.getByText(/Mastered:/i)).toBeInTheDocument();
    });

    // The prompt should be Б, NOT the mastered А
    const prompt = document.querySelector('.quiz-prompt');
    expect(prompt?.textContent).toContain('Б');
    expect(prompt?.textContent).not.toContain('А');
  });

  it('finishes session and shows Done recap card when goal questions answered', async () => {
    const recordQuizSpy = vi.spyOn(ProgressService, 'recordQuizSession').mockResolvedValue({
      id: 'session_1',
      userId: 'guest',
      category: 'mixed',
      score: 1,
      totalQuestions: 1,
      percentage: 100,
      completedAt: new Date().toISOString()
    });

    render(<Quiz data={{
      alphabet: [{ character: 'А', pronunciation: 'ah' }]
    }} />);

    // Switch goal to 5
    const fivePill = screen.getByRole('button', { name: '5 Qs' });
    fireEvent.click(fivePill);

    // Answer questions 1 through 5
    for (let i = 1; i <= 5; i++) {
      const input = screen.getByPlaceholderText(/Your answer here/i);
      fireEvent.change(input, { target: { value: 'ah' } });
      fireEvent.click(screen.getByRole('button', { name: 'Check Answer' }));

      if (i < 5) {
        const nextBtn = screen.getByRole('button', { name: new RegExp(`Next Question \\(${i + 1}/5\\)`, 'i') });
        fireEvent.click(nextBtn);
      } else {
        const finishBtn = screen.getByRole('button', { name: /Complete Quiz & View Results/i });
        fireEvent.click(finishBtn);
      }
    }

    // Now Done screen should be rendered!
    await waitFor(() => {
      expect(screen.getByText('Quiz Session Complete!')).toBeInTheDocument();
      expect(screen.getByText(/Отлично!/i)).toBeInTheDocument();
      expect(screen.getByText(/100%/i)).toBeInTheDocument();
      expect(screen.getByText(/5 \/ 5 correct/i)).toBeInTheDocument();
      expect(screen.getByText(/Logged as 1 completed quiz in your learning progress/i)).toBeInTheDocument();
    });

    expect(recordQuizSpy).toHaveBeenCalledWith({
      category: 'mixed',
      score: 5,
      totalQuestions: 5
    });

    // Test restarting with button
    const restartBtn = screen.getByRole('button', { name: /Start Next Quiz/i });
    fireEvent.click(restartBtn);

    // Active quiz returns!
    expect(screen.getByText('Test Your Knowledge')).toBeInTheDocument();
    expect(screen.getByText('of 5')).toBeInTheDocument();
  });

  it('accepts conversational synonyms and contractions for English phrases (e.g., wheres the restroom for where is the bathroom)', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2); // Selects 'What does this mean in English?'
    render(<Quiz data={{
      basicPhrases: [
        { english: 'Where is the bathroom', russian: 'Где туалет', pronunciation: 'gdye too-ah-lyet' }
      ]
    }} />);

    // Wait for question to render
    const input = await screen.findByRole('textbox');
    // User types contraction + synonym "wheres the restroom"
    fireEvent.change(input, { target: { value: 'wheres the restroom' } });
    fireEvent.click(screen.getByRole('button', { name: /Check Answer/i }));

    expect(screen.getByText(/Correct!/i)).toBeInTheDocument();
  });

  it('renders the fluid bottom feedback drawer on answer check', async () => {
    render(<Quiz data={{
      alphabet: [{ character: 'А', pronunciation: 'ah' }]
    }} />);

    const input = await screen.findByPlaceholderText(/Your answer here/i);
    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check Answer' }));

    // Bottom feedback sheet should be present with Not quite
    const drawer = document.querySelector('.quiz-feedback-drawer');
    expect(drawer).toBeInTheDocument();
    expect(drawer).toHaveClass('feedback-incorrect');
    expect(screen.getByText('Not quite')).toBeInTheDocument();
    expect(screen.getByText(/The correct answer is:/i)).toBeInTheDocument();
  });

  it('accepts numeric equivalents including formatted digits like 1,000 for one thousand (тысяча)', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.2); // Selects 'What does this mean in English?'
    render(<Quiz data={{
      numbers: [
        { english: 'One thousand', russian: 'тысяча', pronunciation: 'tih-see-cha' }
      ]
    }} />);

    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: '1,000' } });
    fireEvent.click(screen.getByRole('button', { name: /Check Answer/i }));

    expect(screen.getByText(/Correct!/i)).toBeInTheDocument();
  });

  it('does NOT accept digits like 1 for alphabet pronunciation questions like M', async () => {
    render(<Quiz data={{
      alphabet: [
        { character: 'М', pronunciation: 'm', example: 'as in man' }
      ]
    }} />);

    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /Check Answer/i }));

    expect(screen.getByText('Not quite')).toBeInTheDocument();
    expect(screen.queryByText(/Correct!/i)).not.toBeInTheDocument();
  });

  it('accepts common 1-letter typos on short words like чаи for чай (tea) with spelling guidance', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // Selects index 1: English-to-Russian ("HOW DO YOU SAY THIS IN RUSSIAN? tea")
    render(<Quiz data={{
      commonWords: [
        { english: 'tea', russian: 'чай', pronunciation: 'chay' }
      ]
    }} />);

    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: 'чаи' } });
    fireEvent.click(screen.getByRole('button', { name: /Check Answer/i }));

    expect(screen.getByText(/Correct!/i)).toBeInTheDocument();
    expect(screen.getByText(/Correct spelling:/i)).toBeInTheDocument();
  });

  it('accepts interchangeable Russian letters ё and е without penalty', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    render(<Quiz data={{
      commonWords: [
        { english: 'hedgehog', russian: 'ёж', pronunciation: 'yozh' }
      ]
    }} />);

    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: 'еж' } });
    fireEvent.click(screen.getByRole('button', { name: /Check Answer/i }));

    expect(screen.getByText(/Correct!/i)).toBeInTheDocument();
  });

  it('renders category filter pills for all topics and switches active category', async () => {
    render(<Quiz data={{
      ...sampleData,
      time: [
        { english: 'Monday', russian: 'Понедельник', pronunciation: 'pah-nee-dyel-neek' }
      ]
    }} />);

    // Check that all category filter tabs are rendered
    expect(screen.getByRole('tab', { name: /All Topics/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Alphabet/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Phrases & Greetings/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Common Words/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Numbers/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Time & Days/i })).toBeInTheDocument();

    // Default active is All Topics
    expect(screen.getByRole('tab', { name: /All Topics/i })).toHaveClass('active');

    // Click Time & Days category
    const timeTab = screen.getByRole('tab', { name: /Time & Days/i });
    fireEvent.click(timeTab);

    expect(timeTab).toHaveClass('active');
    expect(localStorage.getItem('russian_quiz_category')).toBe('time');

    // Prompt should strictly come from the time dataset
    const prompt = document.querySelector('.quiz-prompt');
    const isMondayRu = prompt?.textContent?.includes('Понедельник');
    const isMondayEn = prompt?.textContent?.includes('Monday');
    expect(isMondayRu || isMondayEn).toBe(true);
  });

  it('records quiz session with the selected category when completed', async () => {
    const recordQuizSpy = vi.spyOn(ProgressService, 'recordQuizSession').mockResolvedValue({
      id: 'session_time_1',
      userId: 'guest',
      category: 'time',
      score: 5,
      totalQuestions: 5,
      percentage: 100,
      completedAt: new Date().toISOString()
    });

    render(<Quiz data={{
      time: [
        { english: 'Today', russian: 'Сегодня', pronunciation: 'see-voh-dnya' }
      ]
    }} />);

    // Switch to Time & Days
    const timeTab = screen.getByRole('tab', { name: /Time & Days/i });
    fireEvent.click(timeTab);

    // Set goal to 5
    const fivePill = screen.getByRole('button', { name: '5 Qs' });
    fireEvent.click(fivePill);

    // Answer 5 questions
    for (let i = 1; i <= 5; i++) {
      const input = screen.getByRole('textbox');
      // Prompt will be either Russian or English; both are accepted if we provide the right counterpart
      const promptText = document.querySelector('.quiz-prompt-text')?.textContent || '';
      const ans = promptText.includes('Сегодня') ? 'today' : 'сегодня';
      fireEvent.change(input, { target: { value: ans } });
      fireEvent.click(screen.getByRole('button', { name: 'Check Answer' }));

      if (i < 5) {
        const nextBtn = screen.getByRole('button', { name: new RegExp(`Next Question \\(${i + 1}/5\\)`, 'i') });
        fireEvent.click(nextBtn);
      } else {
        const finishBtn = screen.getByRole('button', { name: /Complete Quiz & View Results/i });
        fireEvent.click(finishBtn);
      }
    }

    await waitFor(() => {
      expect(screen.getByText('Quiz Session Complete!')).toBeInTheDocument();
    });

    expect(recordQuizSpy).toHaveBeenCalledWith({
      category: 'time',
      score: 5,
      totalQuestions: 5
    });
  });
});


