import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { transliterate, isCyrillic, containsCyrillic } from '../utils/transliteration';
import * as browserSpeech from '../utils/browserSpeech';
import * as speechMod from '../utils/speech';
import PronunciationButton from '../components/PronunciationButton';

class FakeAudio {
  static instances: FakeAudio[] = [];
  src: string;
  currentTime = 0;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  oncanplay: (() => void) | null = null;
  onloadedmetadata: (() => void) | null = null;
  pause = vi.fn();
  load = vi.fn();
  playImpl: () => Promise<void> = () => Promise.resolve();

  constructor(src = '') {
    this.src = src;
    FakeAudio.instances.push(this);
  }

  play() {
    return this.playImpl();
  }
}

describe('Russian Transliteration, Browser Speech, Speech Queue & PronunciationButton', () => {
  const OriginalAudio = globalThis.Audio;
  const OriginalUtterance = (globalThis as any).SpeechSynthesisUtterance;
  const originalSynth = window.speechSynthesis;

  beforeEach(() => {
    FakeAudio.instances = [];
    (globalThis as any).Audio = FakeAudio;
    (globalThis as any).SpeechSynthesisUtterance = class {
      text: string;
      lang = '';
      voice: any = null;
      onend: (() => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    };
  });

  afterEach(() => {
    speechMod.cancelAllSpeech();
    globalThis.Audio = OriginalAudio;
    (globalThis as any).SpeechSynthesisUtterance = OriginalUtterance;
    Object.defineProperty(window, 'speechSynthesis', { value: originalSynth, configurable: true, writable: true });
    vi.restoreAllMocks();
  });

  describe('transliteration.ts', () => {
    it('handles empty input, multi-char combinations, soft/hard signs, and context-aware y rules', () => {
      expect(transliterate('')).toBe('');
      expect(transliterate('privet')).toBe('привет');
      expect(transliterate('borshch')).toBe('борщ');
      expect(transliterate('Shchuka')).toBe('Щука');
      expect(transliterate('шch')).toBe('щ');
      expect(transliterate('zhurnal')).toBe('журнал');
      expect(transliterate('yabloko')).toBe('яблоко');
      expect(transliterate('yug')).toBe('юг');
      expect(transliterate('yolka')).toBe('ёлка');
      expect(transliterate('chai')).toBe('чаи');
      expect(transliterate('tsena')).toBe('цена');
      expect(transliterate('khorosho')).toBe('хорошо');
      expect(transliterate("mat'")).toBe('мать');
      expect(transliterate('ob"yekt')).toBe('объект');
      // Context-aware y: after vowel -> й, after consonant -> ы, double yy -> ый
      expect(transliterate('moy')).toBe('мой');
      expect(transliterate('ryba')).toBe('рыба');
      expect(transliterate('dobryy')).toBe('добрый');

      expect(isCyrillic('Я')).toBe(true);
      expect(isCyrillic('Z')).toBe(false);
      expect(containsCyrillic('Hello мир')).toBe(true);
      expect(containsCyrillic('Hello world')).toBe(false);
    });
  });

  describe('browserSpeech.ts & speech.ts', () => {
    it('discovers Russian female voices, speaks via browser TTS, and cancels cleanly', async () => {
      const utterances: any[] = [];
      const mockSynth = {
        getVoices: vi.fn(() => [
          { name: 'Google US English', lang: 'en-US' },
          { name: 'Milena Russian', lang: 'ru-RU' },
        ]),
        speak: vi.fn((u: any) => utterances.push(u)),
        cancel: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      Object.defineProperty(window, 'speechSynthesis', { value: mockSynth, configurable: true, writable: true });

      await speechMod.initVoices();
      expect(speechMod.isSpeechSupported()).toBe(true);
      expect(browserSpeech.getRussianVoices()).toHaveLength(1);
      expect(browserSpeech.getBestRussianVoice()?.name).toBe('Milena Russian');
      expect(browserSpeech.isRussianVoiceAvailable()).toBe(true);

      const onEnd = vi.fn();
      speechMod.speak('Привет', 'ru-RU', 'btn-ru-1', onEnd);
      await waitFor(() => expect(utterances).toHaveLength(1));
      expect(utterances[0].text).toBe('Привет');
      utterances[0].onend();
      expect(onEnd).toHaveBeenCalledTimes(1);

      speechMod.cancelAllSpeech();
      expect(mockSynth.cancel).toHaveBeenCalled();
    });

    it('returns platform-specific Russian voice installation instructions across OS user agents', () => {
      const origUA = navigator.userAgent;
      const checkUA = (ua: string, expectedSubstring: string) => {
        Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
        expect(browserSpeech.getRussianVoiceInstallInstructions()).toContain(expectedSubstring);
      };

      checkUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Windows');
      checkUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)', 'macOS');
      checkUA('Mozilla/5.0 (Linux; Android 14)', 'Android');
      checkUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'iOS');
      checkUA('Mozilla/5.0 (X11; Linux x86_64)', 'device settings');

      Object.defineProperty(navigator, 'userAgent', { value: origUA, configurable: true });
    });

    it('falls back to /audio/index.json lookup when no browser Russian voice is installed', async () => {
      vi.resetModules();
      const freshBrowserSpeech = await import('../utils/browserSpeech');

      const mockSynth = {
        getVoices: vi.fn(() => []),
        speak: vi.fn(),
        cancel: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      Object.defineProperty(window, 'speechSynthesis', { value: mockSynth, configurable: true, writable: true });

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          files: {
            alphabet: [{ filename: 'а.mp3', path: '/audio/alphabet/а.mp3' }],
            phrases: [{ filename: 'привет.mp3', path: '/audio/phrases/привет.mp3' }],
          },
        }),
      } as any);

      const onEnd = vi.fn();
      await freshBrowserSpeech.speakText('привет', 'ru-RU', onEnd);
      expect(FakeAudio.instances.length).toBeGreaterThanOrEqual(1);
      const played = FakeAudio.instances[FakeAudio.instances.length - 1];
      expect(played.src).toBe('/audio/phrases/привет.mp3');
      played.onended?.();
      expect(onEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('PronunciationButton.tsx', () => {
    it('blocks non-Cyrillic English text, resolves category heuristics, plays MP3, and falls back to TTS on error', async () => {
      vi.spyOn(speechMod, 'initVoices').mockResolvedValue();
      const speakSpy = vi.spyOn(speechMod, 'speak').mockImplementation((_t, _l, _id, onEnd) => {
        if (onEnd) onEnd();
      });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // 1. Non-Cyrillic text is blocked by safety guard
      const { rerender, unmount } = render(<PronunciationButton text="Hello" label="English guard" />);
      const guardBtn = await screen.findByRole('button', { name: 'English guard' });
      await waitFor(() => expect(guardBtn).not.toBeDisabled());
      fireEvent.click(guardBtn);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Skipped playing non-Russian text'), 'Hello');
      expect(FakeAudio.instances).toHaveLength(0);

      // 2. Cyrillic phrase with basicPhrases category maps to /audio/phrases/*.mp3 and strips punctuation
      rerender(<PronunciationButton text="Как дела? (informal)" audioCategory="basicPhrases" label="Play phrase" />);
      const btn = screen.getByRole('button', { name: 'Play phrase' });
      fireEvent.click(btn);
      expect(FakeAudio.instances).toHaveLength(1);
      expect(FakeAudio.instances[0].src).toBe('/audio/phrases/как_дела.mp3');
      expect(btn).toHaveClass('playing');

      act(() => {
        FakeAudio.instances[0].onended?.();
      });
      expect(btn).not.toHaveClass('playing');

      // 3. Re-clicking same text reuses existing Audio element and resets currentTime
      fireEvent.click(btn);
      expect(FakeAudio.instances).toHaveLength(1);
      act(() => {
        FakeAudio.instances[0].onended?.();
      });

      // 4. Audio error falls back to speech.ts speak()
      rerender(<PronunciationButton text="вода" audioCategory="commonWords" label="Play word" />);
      fireEvent.click(screen.getByRole('button', { name: 'Play word' }));
      expect(FakeAudio.instances).toHaveLength(2);
      expect(FakeAudio.instances[1].src).toBe('/audio/words/вода.mp3');
      act(() => {
        FakeAudio.instances[1].onerror?.();
      });
      expect(speakSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: 'Play word' })).not.toHaveClass('playing');

      // 5. Category auto-heuristics when audioCategory is omitted
      rerender(<PronunciationButton text="один" label="Heuristic number" />);
      fireEvent.click(screen.getByRole('button', { name: 'Heuristic number' }));
      expect(FakeAudio.instances[FakeAudio.instances.length - 1].src).toBe('/audio/numbers/один.mp3');

      unmount();
    });
  });
});
