import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import russianData from '../data/russianData';
import { AUDIO_VOICE, getLocalAudioUrl } from '../data/audioManifest';

const PUBLIC_DIR = path.resolve(__dirname, '../../public');

describe('Basic Russian Studio Audio Completeness & Lookup Normalization', () => {
  it('uses ru-RU-SvetlanaNeural matching basic-language-school', () => {
    expect(AUDIO_VOICE).toBe('ru-RU-SvetlanaNeural');
  });

  it('resolves every single curriculum item in russianData to an existing >1000-byte MP3 on disk', () => {
    const unresolved: string[] = [];

    const verify = (text: string, category?: string) => {
      const url = getLocalAudioUrl(text, category);
      if (!url) {
        unresolved.push(`${category || 'auto'}:${text} -> null`);
        return;
      }
      const diskPath = path.join(PUBLIC_DIR, url.replace(/^\//, '').normalize('NFC'));
      const altDiskPath = path.join(PUBLIC_DIR, url.replace(/^\//, '').normalize('NFD'));
      const found = fs.existsSync(diskPath) ? diskPath : fs.existsSync(altDiskPath) ? altDiskPath : null;
      if (!found || fs.statSync(found).size <= 1000) {
        unresolved.push(`${category || 'auto'}:${text} -> missing or small (${url})`);
      }
    };

    for (const item of russianData.alphabet) {
      verify(item.letter.toLowerCase(), 'alphabet');
      if (item.russianWord) {
        verify(item.russianWord, 'examples');
      }
    }

    for (const item of russianData.basicPhrases) {
      verify(item.russian, 'basicPhrases');
    }
    for (const item of russianData.numbers) {
      verify(item.russian, 'numbers');
    }
    for (const item of russianData.time ?? []) {
      verify(item.russian, 'time');
    }
    for (const item of russianData.commonWords) {
      verify(item.russian, 'commonWords');
    }

    expect(unresolved).toEqual([]);
  });

  it('normalizes NFD strings, punctuation, parenthetical notes, category aliases, and slash variants', () => {
    const nfdYo = 'е\u0308лка';
    expect(getLocalAudioUrl(nfdYo, 'examples')).toBe('/audio/examples/ёлка.mp3');
    expect(getLocalAudioUrl('Как дела? (informal)', 'basicPhrases')).toBe('/audio/phrases/как_дела.mp3');
    expect(getLocalAudioUrl('Вода / H2O', 'commonWords')).toBe('/audio/words/вода.mp3');
  });
});
