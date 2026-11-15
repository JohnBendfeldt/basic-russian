import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import axe from 'axe-core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import Alphabet from '../components/Alphabet';
import Phrases from '../components/Phrases';
import NumbersAndTime from '../components/NumbersAndTime';
import Quiz from '../components/Quiz';
import RussianKeyboard from '../components/RussianKeyboard';
import { AuthModal } from '../components/AuthModal';
import { ProgressModal } from '../components/ProgressModal';
import { UserMenu } from '../components/UserMenu';
import PrivacyPolicy from '../components/PrivacyPolicy';
import TermsOfService from '../components/TermsOfService';
import { ProgressService } from '../services/progressService';
import * as speechMod from '../utils/speech';
import * as supabaseMod from '../services/supabaseClient';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    runOnly: {
      type: 'tag',
      values: WCAG_TAGS,
    },
  });
  const formatted = results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help} -> ${v.nodes.map((n) => n.html).join(' | ')}`
  );
  expect(formatted).toEqual([]);
}

const sampleAlphabet = [
  { letter: 'А', character: 'А', pronunciation: 'ah', example: 'as in father', russianWord: 'арбуз', englishWord: 'watermelon' },
  { letter: 'Б', character: 'Б', pronunciation: 'beh', example: 'as in book', russianWord: 'билет', englishWord: 'ticket' },
];

const samplePhrases = [
  { russian: 'Привет', english: 'Hello', pronunciation: 'pree-vyet' },
  { russian: 'Спасибо', english: 'Thank you', pronunciation: 'spuh-see-buh' },
];

const sampleNumbers = [
  { russian: 'один', english: '1 (one)', pronunciation: 'ah-deen' },
  { russian: 'два', english: '2 (two)', pronunciation: 'dvah' },
];

const sampleTime = [
  { russian: 'Который час?', english: 'What time is it?', pronunciation: 'kah-toh-ryy chas' },
  { russian: 'Понедельник', english: 'Monday', pronunciation: 'pah-nee-dyel-neek' },
];

const sampleWords = [
  { russian: 'вода', english: 'water', pronunciation: 'vah-dah' },
  { russian: 'книга', english: 'book', pronunciation: 'knee-guh' },
];

const ControlledNumbersAndTime: React.FC<{ initial?: 'numbers' | 'time' }> = ({ initial = 'numbers' }) => {
  const [tab, setTab] = React.useState<'numbers' | 'time'>(initial);
  return (
    <NumbersAndTime
      numbersData={sampleNumbers}
      timeData={sampleTime}
      activeTab={tab}
      onTabChange={setTab}
    />
  );
};

describe('WCAG 2.1 / 2.2 Level AA Accessibility Audit Suite', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    localStorage.clear();
    document.body.style.overflow = '';
    vi.spyOn(speechMod, 'initVoices').mockResolvedValue();
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  afterEach(() => {
    document.body.style.overflow = '';
    vi.restoreAllMocks();
  });

  describe('1. Automated axe-core WCAG 2.1 / 2.2 AA Scans Across All Views & States', () => {
    it('passes axe-core on full App shell (Header, Skip Link, Navigation, Alphabet, BottomNavigation, Footer)', async () => {
      const { container } = render(<App />);
      await screen.findByRole('heading', { name: /Russian Alphabet/i, level: 2 });
      await expectNoAxeViolations(container);
    });

    it('passes axe-core on Phrases in both collapsed and revealed states and Common Words view', async () => {
      const { container, rerender } = render(
        <Phrases data={samplePhrases} title="Basic Phrases" contentType="phrases" />
      );
      await expectNoAxeViolations(container);

      fireEvent.click(screen.getByRole('button', { name: /Reveal All/i }));
      await expectNoAxeViolations(container);

      rerender(<Phrases data={sampleWords} title="Common Words" contentType="words" />);
      await expectNoAxeViolations(container);
    });

    it('passes axe-core on NumbersAndTime across both Numbers and Telling Time tabpanels', async () => {
      const { container } = render(<ControlledNumbersAndTime initial="numbers" />);
      await expectNoAxeViolations(container);

      fireEvent.click(screen.getByRole('tab', { name: /Telling Time/i }));
      expect(screen.getByRole('heading', { name: /Russian Time Grammar Rules/i, level: 3 })).toBeInTheDocument();
      await expectNoAxeViolations(container);
    });

    it('passes axe-core on Quiz across Ru->En, En->Ru + Virtual Keyboard + Cheatsheet, Feedback Drawer, and Missed-Word Recap', async () => {
      localStorage.setItem('russian_quiz_goal', '5');

      // 1. Ru -> En active state
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);
      const { container, unmount } = render(
        <Quiz
          data={{
            alphabet: sampleAlphabet,
            basicPhrases: samplePhrases,
            numbers: sampleNumbers,
            time: sampleTime,
            commonWords: sampleWords,
          }}
        />
      );
      await screen.findByRole('textbox', { name: /Quiz answer input/i });
      await expectNoAxeViolations(container);
      unmount();

      // 2. En -> Ru state with Cyrillic quick bar, Phonetic Cheatsheet popover, and full RussianKeyboard open
      randomSpy.mockReturnValue(0.95);
      const { container: enToRuContainer } = render(
        <Quiz
          data={{
            commonWords: [{ english: 'Apple', russian: 'яблоко', pronunciation: 'yah-bluh-kuh' }],
          }}
        />
      );
      await screen.findByRole('textbox', { name: /Quiz answer input/i });
      fireEvent.click(screen.getByRole('button', { name: 'Phonetic typing guide' }));
      fireEvent.click(screen.getByRole('button', { name: 'Toggle Russian keyboard' }));
      expect(screen.getByRole('group', { name: 'Russian phonetic virtual keyboard' })).toBeInTheDocument();
      await expectNoAxeViolations(enToRuContainer);

      // Close popover and submit wrong answers to inspect Feedback Drawer & Recap Screen
      fireEvent.click(screen.getByRole('button', { name: 'Close guide' }));
      for (let i = 0; i < 5; i++) {
        const input = screen.getByRole('textbox', { name: /Quiz answer input/i });
        fireEvent.change(input, { target: { value: 'неверно' } });
        fireEvent.click(screen.getByRole('button', { name: 'Check Answer' }));
        expect(await screen.findByText('Not quite')).toBeInTheDocument();

        if (i === 0) {
          // Scan incorrect feedback drawer with override button
          await expectNoAxeViolations(enToRuContainer);
        }

        if (i < 4) {
          fireEvent.click(screen.getByRole('button', { name: /Next Question/i }));
        } else {
          fireEvent.click(screen.getByRole('button', { name: /Complete Quiz & View Results/i }));
        }
      }

      expect(await screen.findByRole('heading', { name: /Words to Review/i, level: 3 })).toBeInTheDocument();
      await expectNoAxeViolations(enToRuContainer);
    });

    it('passes axe-core on AuthModal (default & error alert), ProgressModal (empty & populated), UserMenu, and Legal SPA pages', async () => {
      // AuthModal default + error alert
      vi.spyOn(supabaseMod, 'signInWithGoogle').mockResolvedValue({ error: new Error('OAuth blocked') });
      const { container: authContainer, unmount: unmountAuth } = render(
        <AuthModal isOpen={true} onClose={vi.fn()} />
      );
      await expectNoAxeViolations(authContainer);
      fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));
      expect(await screen.findByRole('alert')).toHaveTextContent('OAuth blocked');
      await expectNoAxeViolations(authContainer);
      unmountAuth();

      // ProgressModal empty state
      const { container: emptyProgContainer, unmount: unmountEmptyProg } = render(
        <ProgressModal isOpen={true} onClose={vi.fn()} />
      );
      await screen.findByText('No Quiz History Yet');
      await expectNoAxeViolations(emptyProgContainer);
      unmountEmptyProg();

      // ProgressModal populated state
      await ProgressService.recordQuizSession({ category: 'basicPhrases', score: 8, totalQuestions: 10 });
      await ProgressService.recordWordAttempt({
        category: 'phrases',
        wordId: 'phrase-privet',
        prompt: 'Привет',
        answer: 'Hello',
        isCorrect: false,
      });
      const { container: popProgContainer, unmount: unmountPopProg } = render(
        <ProgressModal isOpen={true} onClose={vi.fn()} userEmail="learner@example.com" />
      );
      await screen.findByText('Words & Phrases to Review');
      await expectNoAxeViolations(popProgContainer);
      unmountPopProg();

      // UserMenu open dropdown
      const { container: menuContainer, unmount: unmountMenu } = render(
        <UserMenu
          initialUser={{
            id: 'u-1',
            email: 'anna@example.com',
            app_metadata: { provider: 'google' },
            user_metadata: { full_name: 'Anna Karenina' },
          }}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /User menu for Anna Karenina/i }));
      expect(screen.getByRole('menu')).toBeInTheDocument();
      await expectNoAxeViolations(menuContainer);
      unmountMenu();

      // PrivacyPolicy & TermsOfService SPA pages
      const { container: privacyContainer, unmount: unmountPrivacy } = render(<PrivacyPolicy onNavigate={vi.fn()} />);
      await expectNoAxeViolations(privacyContainer);
      unmountPrivacy();

      const { container: termsContainer, unmount: unmountTerms } = render(<TermsOfService onNavigate={vi.fn()} />);
      await expectNoAxeViolations(termsContainer);
      unmountTerms();
    });

    it('passes axe-core and structural WCAG checks on static HTML files (index.html, public/privacy, public/terms)', async () => {
      const rootDir = path.resolve(__dirname, '../..');
      const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
      expect(indexHtml).toMatch(/<html[^>]+lang="en"/);

      for (const relPath of ['public/privacy/index.html', 'public/terms/index.html']) {
        const html = fs.readFileSync(path.join(rootDir, relPath), 'utf8');
        expect(html).toMatch(/<html[^>]+lang="en"/);
        expect(html).toContain('class="skip-link"');
        expect(html).toContain('id="main-content"');
        expect(html).toContain(':focus-visible');
        expect(html).toContain('prefers-reduced-motion: reduce');

        const parsed = new DOMParser().parseFromString(html, 'text/html');
        expect(parsed.querySelectorAll('h1')).toHaveLength(1);
        parsed.querySelectorAll('svg').forEach((svg) => {
          expect(svg.getAttribute('aria-hidden')).toBe('true');
        });

        const host = document.createElement('div');
        host.innerHTML = parsed.body.innerHTML;
        document.body.appendChild(host);
        try {
          await expectNoAxeViolations(host);
        } finally {
          document.body.removeChild(host);
        }
      }
    });
  });

  describe('2. WCAG 3.1.2 Language of Parts (lang="ru" / lang="en") Tagging', () => {
    it('tags Cyrillic letters, words, phrases, grammar examples, keyboard keys, quiz prompts/inputs/answers, and review items with lang="ru"', async () => {
      // Alphabet
      const { unmount: u1 } = render(<Alphabet data={sampleAlphabet} />);
      expect(document.querySelector('.letter-uppercase')).toHaveAttribute('lang', 'ru');
      expect(document.querySelector('.letter-lowercase')).toHaveAttribute('lang', 'ru');
      expect(document.querySelector('.example-word')).toHaveAttribute('lang', 'ru');
      expect(document.querySelector('.example-translation')).toHaveAttribute('lang', 'en');
      u1();

      // Phrases
      const { unmount: u2 } = render(<Phrases data={samplePhrases} title="Basic Phrases" contentType="phrases" />);
      expect(document.querySelector('.russian')).toHaveAttribute('lang', 'ru');
      fireEvent.click(screen.getByRole('button', { name: /Reveal All/i }));
      expect(document.querySelector('.english')).toHaveAttribute('lang', 'en');
      u2();

      // NumbersAndTime grammar guide
      const { unmount: u3 } = render(<ControlledNumbersAndTime initial="time" />);
      const ruTimeSpans = document.querySelectorAll('.time-grammar-guide [lang="ru"]');
      expect(ruTimeSpans.length).toBeGreaterThanOrEqual(8);
      u3();

      // RussianKeyboard
      const { unmount: u4 } = render(<RussianKeyboard onLetterClick={vi.fn()} />);
      document.querySelectorAll('.russian-keyboard .key-ru').forEach((el) => {
        expect(el).toHaveAttribute('lang', 'ru');
      });
      document.querySelectorAll('.russian-keyboard .key-en').forEach((el) => {
        expect(el).toHaveAttribute('aria-hidden', 'true');
      });
      u4();

      // Quiz Ru -> En vs En -> Ru
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);
      const { unmount: u5 } = render(<Quiz data={{ commonWords: sampleWords }} />);
      const ruPrompt = await screen.findByText(/вода|книга/i);
      expect(ruPrompt.closest('.quiz-prompt-text')).toHaveAttribute('lang', 'ru');
      expect(screen.getByRole('textbox', { name: /Quiz answer input/i })).toHaveAttribute('lang', 'en');
      u5();

      randomSpy.mockReturnValue(0.95);
      const { unmount: u6 } = render(<Quiz data={{ commonWords: sampleWords }} />);
      const enInput = await screen.findByRole('textbox', { name: /Quiz answer input/i });
      expect(enInput).toHaveAttribute('lang', 'ru');
      expect(document.querySelector('.quiz-prompt-text')).toHaveAttribute('lang', 'en');
      fireEvent.change(enInput, { target: { value: 'неверно' } });
      fireEvent.click(screen.getByRole('button', { name: 'Check Answer' }));
      expect(await screen.findByText('Not quite')).toBeInTheDocument();
      expect(document.querySelector('.feedback-correct-word')).toHaveAttribute('lang', 'ru');
      u6();
    });
  });

  describe('3. Landmarks, Skip Link, Roving Tablist & Phrase Card Focus Stability', () => {
    it('renders functional skip link to #main-content, semantic brand home button, aria-current nav buttons, and roving tablist in NumbersAndTime', async () => {
      render(<App />);
      await screen.findByRole('heading', { name: /Russian Alphabet/i, level: 2 });

      const skipLink = screen.getByRole('link', { name: 'Skip to main content' });
      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(document.getElementById('main-content')).toHaveAttribute('tabindex', '-1');

      const homeBtn = screen.getByRole('button', { name: /Basic Russian/i });
      expect(homeBtn).toHaveClass('brand-home-button');

      const mainNav = screen.getByRole('navigation', { name: 'Main navigation' });
      const activeDesktopBtn = mainNav.querySelector('button[aria-current="page"]');
      expect(activeDesktopBtn).toHaveTextContent('Alphabet');

      const bottomNav = screen.getByRole('navigation', { name: 'Bottom navigation' });
      expect(bottomNav.querySelector('button[aria-current="page"]')).toHaveTextContent('Alphabet');

      // Switch to Numbers & Time and test ArrowRight / ArrowLeft roving tabindex
      fireEvent.click(screen.getByRole('button', { name: 'Numbers & Time' }));
      const numbersTab = await screen.findByRole('tab', { name: /Numbers/i });
      const timeTab = screen.getByRole('tab', { name: /Telling Time/i });
      expect(numbersTab).toHaveAttribute('tabindex', '0');
      expect(timeTab).toHaveAttribute('tabindex', '-1');

      fireEvent.keyDown(numbersTab, { key: 'ArrowRight' });
      expect(timeTab).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(timeTab);
      expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'tab-time');

      fireEvent.keyDown(timeTab, { key: 'ArrowLeft' });
      expect(numbersTab).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(numbersTab);
    });

    it('preserves Phrase card DOM identity, button focus, aria-expanded, aria-pressed, and unmasked translation text', () => {
      render(<Phrases data={samplePhrases} title="Basic Phrases" contentType="phrases" />);

      const cardBefore = document.querySelectorAll('.phrase-card')[0];
      const toggleBtn = screen.getAllByRole('button', { name: /Reveal translation for Привет/i })[0];
      expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

      toggleBtn.focus();
      fireEvent.click(toggleBtn);

      const cardAfter = document.querySelectorAll('.phrase-card')[0];
      // Card MUST NOT remount on toggle
      expect(cardAfter).toBe(cardBefore);
      expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
      expect(document.activeElement).toBe(toggleBtn);

      // Revealed English text must NOT be inside role="button" (which would mask child text from screen readers)
      const englishNode = screen.getByText('Hello');
      expect(englishNode.closest('[role="button"]')).toBeNull();

      const studyToggle = screen.getByRole('button', { name: /Reveal All/i });
      expect(studyToggle).toHaveAttribute('aria-pressed', 'false');
      fireEvent.click(studyToggle);
      expect(studyToggle).toHaveAttribute('aria-pressed', 'true');
    });

    it('ensures zero generic bare "Pronounce" buttons exist anywhere on Alphabet or Phrases views', () => {
      const { unmount } = render(<Alphabet data={sampleAlphabet} />);
      expect(screen.queryAllByRole('button', { name: 'Pronounce' })).toHaveLength(0);
      unmount();

      render(<Phrases data={samplePhrases} title="Basic Phrases" contentType="phrases" />);
      expect(screen.queryAllByRole('button', { name: 'Pronounce' })).toHaveLength(0);
    });
  });

  describe('4. Quiz Keyboard Operability, Virtual Keyboard Focus Retention & Escape Popover', () => {
    it('does NOT hijack Enter when focused on "I was right" or other buttons, while keeping body Enter shortcut working', async () => {
      render(
        <Quiz
          data={{
            alphabet: [{ character: 'А', pronunciation: 'ah', example: 'арбуз' }],
          }}
        />
      );

      const input = await screen.findByRole('textbox', { name: /Quiz answer input/i });
      expect(input).toHaveAttribute('aria-describedby', 'quiz-question-hint quiz-question-prompt');

      fireEvent.change(input, { target: { value: 'wrong' } });
      fireEvent.click(screen.getByRole('button', { name: 'Check Answer' }));

      expect(await screen.findByText('Not quite')).toBeInTheDocument();
      const overrideBtn = screen.getByRole('button', { name: /I was right/i });
      overrideBtn.focus();

      // Dispatching keydown Enter on focused override button MUST NOT call preventDefault or skip to question 2!
      const enterOnButton = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      const notPrevented = overrideBtn.dispatchEvent(enterOnButton);
      expect(notPrevented).toBe(true);
      expect(screen.getByText('Not quite')).toBeInTheDocument();

      // Activating override marks question 1 correct and focuses continue button
      fireEvent.click(overrideBtn);
      expect(await screen.findByText(/Correct! \(Overridden\)/i)).toBeInTheDocument();

      // Pressing Enter on non-interactive body advances to next question
      fireEvent.keyDown(document.body, { key: 'Enter' });
      await waitFor(() => expect(screen.queryByText(/Correct! \(Overridden\)/i)).not.toBeInTheDocument());
    });

    it('keeps focus on virtual keyboard keys & quick Cyrillic buttons during keyboard activation (detail === 0) and focuses input on pointer click (detail > 0)', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.95);
      render(
        <Quiz
          data={{
            commonWords: [{ english: 'Apple', russian: 'яблоко', pronunciation: 'yah-bluh-kuh' }],
          }}
        />
      );

      const input = (await screen.findByRole('textbox', { name: /Quiz answer input/i })) as HTMLInputElement;

      // Open Phonetic Cheatsheet and close with Escape, restoring focus to trigger
      const guideBtn = screen.getByRole('button', { name: 'Phonetic typing guide' });
      fireEvent.click(guideBtn);
      expect(screen.getByRole('region', { name: 'Phonetic typing guide' })).toBeInTheDocument();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('region', { name: 'Phonetic typing guide' })).not.toBeInTheDocument();
      expect(document.activeElement).toBe(guideBtn);

      // Quick Cyrillic button activated via keyboard (detail: 0) retains focus on quick button
      const quickYa = screen.getByRole('button', { name: 'Insert я' });
      quickYa.focus();
      fireEvent.click(quickYa, { detail: 0 });
      expect(input.value).toBe('я');
      expect(document.activeElement).toBe(quickYa);

      // Open full RussianKeyboard
      const kbToggle = screen.getByRole('button', { name: 'Toggle Russian keyboard' });
      expect(kbToggle).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(kbToggle);
      expect(kbToggle).toHaveAttribute('aria-expanded', 'true');

      // Virtual key activated via keyboard (detail: 0) retains focus on the key!
      const bKey = screen.getByRole('button', { name: 'Insert letter б' });
      bKey.focus();
      fireEvent.click(bKey, { detail: 0 });
      expect(input.value).toBe('яб');
      expect(document.activeElement).toBe(bKey);

      // Virtual key clicked with pointer (detail: 1) moves focus to input for seamless typing!
      fireEvent.click(bKey, { detail: 1 });
      expect(input.value).toBe('ябб');
      expect(document.activeElement).toBe(input);
    });
  });

  describe('5. Modal Focus Trap, Escape Dismissal, UserMenu Keyboard Navigation & Reduced Motion', () => {
    it('traps Tab/Shift+Tab focus inside AuthModal & ProgressModal, locks scroll, dismisses on Escape, and restores trigger focus', async () => {
      render(<UserMenu />);

      // 1. AuthModal via Sign In button
      const signInTrigger = screen.getByRole('button', { name: 'Sign in to sync progress' });
      signInTrigger.focus();
      fireEvent.click(signInTrigger);

      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(document.body.style.overflow).toBe('hidden');

      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled])'));
      expect(focusables.length).toBeGreaterThanOrEqual(4);

      // Wrap Tab from last element -> first element
      focusables[focusables.length - 1].focus();
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
      expect(document.activeElement).toBe(focusables[0]);

      // Wrap Shift+Tab from first element -> last element
      focusables[0].focus();
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(focusables[focusables.length - 1]);

      // Escape closes modal, unlocks body scroll, and restores focus to signInTrigger
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(document.body.style.overflow).toBe('');
      expect(document.activeElement).toBe(signInTrigger);

      // 2. ProgressModal via My Stats button (WCAG 2.5.3 Label in Name)
      const statsTrigger = screen.getByRole('button', { name: /My Stats — View learning progress/i });
      statsTrigger.focus();
      fireEvent.click(statsTrigger);
      expect(await screen.findByRole('dialog')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(document.activeElement).toBe(statsTrigger);
    });

    it('supports ArrowDown, ArrowUp, Home, End, and Escape keyboard navigation on authenticated UserMenu', () => {
      render(
        <UserMenu
          onNavigate={vi.fn()}
          initialUser={{
            id: 'u-99',
            email: 'boris@example.com',
            app_metadata: { provider: 'github' },
            user_metadata: { full_name: 'Boris' },
          }}
        />
      );

      const trigger = screen.getByRole('button', { name: 'User menu for Boris' });
      trigger.focus();
      fireEvent.click(trigger);

      const menu = screen.getByRole('menu');
      const items = screen.getAllByRole('menuitem');
      expect(items.length).toBe(5);
      expect(menu.querySelectorAll('[role="separator"]').length).toBe(2);

      items[0].focus();
      fireEvent.keyDown(menu, { key: 'ArrowDown' });
      expect(document.activeElement).toBe(items[1]);

      fireEvent.keyDown(menu, { key: 'End' });
      expect(document.activeElement).toBe(items[items.length - 1]);

      fireEvent.keyDown(menu, { key: 'ArrowDown' });
      expect(document.activeElement).toBe(items[0]);

      fireEvent.keyDown(menu, { key: 'ArrowUp' });
      expect(document.activeElement).toBe(items[items.length - 1]);

      fireEvent.keyDown(menu, { key: 'Home' });
      expect(document.activeElement).toBe(items[0]);

      fireEvent.keyDown(menu, { key: 'Escape' });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);
    });

    it('respects prefers-reduced-motion in JS scrollTo calls and enforces WCAG contrast/focus/reflow rules in App.css', async () => {
      const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <Quiz
          data={{
            alphabet: sampleAlphabet,
            commonWords: sampleWords,
          }}
        />
      );
      await screen.findByRole('textbox', { name: /Quiz answer input/i });

      // Switching category in Quiz calls scrollToTop(), which checks prefers-reduced-motion
      fireEvent.click(screen.getByRole('tab', { name: /Common Words/i }));
      expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });

      // Static audit of App.css for key WCAG 2.1 / 2.2 AA rules
      const css = fs.readFileSync(path.resolve(__dirname, '../App.css'), 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
      expect(css).toContain(':focus-visible');
      expect(css).toContain('overflow-x: clip');
      expect(css).toContain('minmax(min(100%, 300px), 1fr)');
      expect(css).not.toMatch(/#ff526c/i);
    });
  });
});
