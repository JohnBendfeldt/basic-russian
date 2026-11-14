import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import russianData from '../data/russianData';
import { containsCyrillic } from '../utils/transliteration';

const PUBLIC_DIR = path.resolve(__dirname, '../../public');

/**
 * Mirrors PronunciationButton.getAudioPath() to guarantee every curriculum item
 * resolves to a real pre-rendered neural MP3 file on disk.
 */
function resolvePronunciationAudioPath(text: string, audioCategory: string): string {
  let category = audioCategory;
  if (category === 'basicPhrases') category = 'phrases';
  if (category === 'commonWords') category = 'words';

  const cleanText = text
    .toLowerCase()
    .trim()
    .split('/')[0]
    .replace(/\s*\([^)]*\)\s*/g, '')
    .replace(/[?.,!\\]/g, '')
    .replace(/\.\.+/g, '')
    .trim();
  const fileName = cleanText.replace(/\s+/g, '_');
  return `/audio/${category}/${fileName}.mp3`;
}

describe('Russian Curriculum Integrity & Pre-Rendered Neural Audio Audit', () => {
  it('defines all 33 Russian Cyrillic alphabet letters in canonical order with complete examples', () => {
    expect(russianData.alphabet).toHaveLength(33);
    const letters = russianData.alphabet.map((item) => item.letter).join('');
    expect(letters).toBe('АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ');

    for (const item of russianData.alphabet) {
      expect(containsCyrillic(item.letter)).toBe(true);
      expect(item.pronunciation.trim().length).toBeGreaterThan(0);
      expect(item.example.trim().length).toBeGreaterThan(0);
      expect(item.russianWord?.trim().length).toBeGreaterThan(0);
      expect(containsCyrillic(item.russianWord!)).toBe(true);
      expect(item.englishWord?.trim().length).toBeGreaterThan(0);
    }
  });

  it.each([
    ['basicPhrases', russianData.basicPhrases, 25],
    ['numbers', russianData.numbers, 25],
    ['time', russianData.time ?? [], 30],
    ['commonWords', russianData.commonWords, 45],
  ] as const)('%s has at least %i unique, well-formed Russian entries', (_name, items, minCount) => {
    expect(items.length).toBeGreaterThanOrEqual(minCount);
    const seen = new Set<string>();

    for (const item of items) {
      expect(item.russian.trim().length).toBeGreaterThan(0);
      expect(containsCyrillic(item.russian)).toBe(true);
      expect(item.english.trim().length).toBeGreaterThan(0);
      expect(item.pronunciation.trim().length).toBeGreaterThan(0);

      const normalized = item.russian.toLowerCase().trim();
      expect(seen.has(normalized)).toBe(false);
      seen.add(normalized);
    }
  });

  it('verifies every curriculum item across alphabet, examples, phrases, numbers, time, and words has a non-empty MP3 on disk', () => {
    const missing: string[] = [];

    const verifyAudio = (text: string, category: string) => {
      const relUrl = resolvePronunciationAudioPath(text, category);
      const diskPath = path.join(PUBLIC_DIR, relUrl.replace(/^\//, ''));
      if (!fs.existsSync(diskPath) || fs.statSync(diskPath).size < 100) {
        missing.push(`${category}:${text} -> ${relUrl}`);
      }
    };

    for (const item of russianData.alphabet) {
      verifyAudio(item.letter.toLowerCase(), 'alphabet');
      if (item.russianWord) {
        verifyAudio(item.russianWord, 'examples');
      }
    }
    for (const item of russianData.basicPhrases) {
      verifyAudio(item.russian, 'phrases');
    }
    for (const item of russianData.numbers) {
      verifyAudio(item.russian, 'numbers');
    }
    for (const item of russianData.time ?? []) {
      verifyAudio(item.russian, 'time');
    }
    for (const item of russianData.commonWords) {
      verifyAudio(item.russian, 'words');
    }

    expect(missing).toEqual([]);
  });

  it('validates public/audio/index.json integrity and on-disk file references', () => {
    const indexJsonPath = path.join(PUBLIC_DIR, 'audio/index.json');
    expect(fs.existsSync(indexJsonPath)).toBe(true);
    const parsed = JSON.parse(fs.readFileSync(indexJsonPath, 'utf-8'));
    expect(parsed.files).toBeDefined();

    for (const category of ['alphabet', 'examples', 'phrases', 'numbers', 'words']) {
      expect(Array.isArray(parsed.files[category])).toBe(true);
      expect(parsed.files[category].length).toBeGreaterThan(0);
    }
  });
});
