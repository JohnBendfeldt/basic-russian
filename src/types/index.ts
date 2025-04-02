// Define data structure types for the application
export interface AlphabetItem {
  letter: string;
  pronunciation: string;
  example: string;
}

export interface PhraseItem {
  russian: string;
  english: string;
  pronunciation: string;
}

export interface RussianData {
  alphabet: AlphabetItem[];
  basicPhrases: PhraseItem[];
  numbers: PhraseItem[];
  commonWords: PhraseItem[];
}

export interface QuizQuestion extends PhraseItem {
  type: 'phrase' | 'number' | 'word';
  isEnglishToRussian: boolean;
  prompt: string;
  answer: string;
}