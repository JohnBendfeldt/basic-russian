/**
 * Shared TypeScript interfaces for the Russian Learning App
 */

// Alphabet item structure
export interface AlphabetItem {
  letter: string;
  pronunciation: string;
  example: string;
  russianWord?: string;
  englishWord?: string;
}

// Phrase item structure - ensure pronunciation is required
export interface PhraseItem {
  russian: string;
  english: string;
  pronunciation: string; // Not optional to match the expected type in Phrases component
}

// Quiz-related interfaces
export interface QuizItem {
  prompt: string;
  answer: string;
  hint?: string;
  russian?: string;
  id?: string;
  type?: string;
}

// App data structure
export interface AppData {
  alphabet: AlphabetItem[];
  basicPhrases: PhraseItem[];
  numbers: PhraseItem[];
  commonWords: PhraseItem[];
}