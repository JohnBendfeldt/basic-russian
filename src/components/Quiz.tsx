import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FaCheck, FaTimes, FaKeyboard, FaTrophy, FaRedo, FaCheckCircle, FaTimesCircle, FaStar, FaGraduationCap } from 'react-icons/fa';
import RussianKeyboard from './RussianKeyboard';
import PronunciationButton from './PronunciationButton';
import { transliterate, containsCyrillic } from '../utils/transliteration';
import { ProgressService } from '../services/progressService';
import { MASTERY_THRESHOLD } from '../types/progress';

// Define interfaces for the data structure
interface AlphabetItem {
  character: string;
  pronunciation: string;
  example?: string;
  russianWord?: string;
}

interface PhraseItem {
  english: string;
  russian: string;
  pronunciation?: string;
}

export type QuizCategoryFilter = 'all' | 'alphabet' | 'basicPhrases' | 'commonWords' | 'numbers' | 'time';

export interface QuizCategoryInfo {
  id: QuizCategoryFilter;
  label: string;
  icon: string;
  description: string;
}

export const QUIZ_CATEGORIES: QuizCategoryInfo[] = [
  { id: 'all', label: 'All Topics', icon: '🎯', description: 'Curated mix of the entire Russian curriculum' },
  { id: 'alphabet', label: 'Alphabet', icon: '🔤', description: '33 Cyrillic letters and pronunciations' },
  { id: 'basicPhrases', label: 'Phrases & Greetings', icon: '💬', description: 'Greetings, politeness, and essential dialogue' },
  { id: 'commonWords', label: 'Common Words', icon: '📖', description: 'Question words, family, transit, and essentials' },
  { id: 'numbers', label: 'Numbers', icon: '🔢', description: 'Counting 0 through 1,000' },
  { id: 'time', label: 'Time & Days', icon: '⏰', description: 'Days of the week, relative days, and clock phrases' },
];

interface QuizProps {
  data: {
    alphabet?: AlphabetItem[];
    basicPhrases?: PhraseItem[];
    numbers?: PhraseItem[];
    commonWords?: PhraseItem[];
    time?: PhraseItem[];
    [key: string]: any;
  };
}

interface QuestionDef {
  item: AlphabetItem | PhraseItem;
  isRussianToEnglish: boolean;
  id: string;
  wordId: string;
  category: string;
}

const isQuestionMastered = (
  q: { id?: string; wordId?: string },
  masteredSet: Set<string>
): boolean => Boolean((q.wordId && masteredSet.has(q.wordId)) || (q.id && masteredSet.has(q.id)));

interface MissedWord {
  prompt: string;
  answer: string;
  userAnswer: string;
  category: string;
  russian?: string;
}

// Constants for special characters
const SOFT_SIGN_CHARS = ['Ь', 'ь'];
const HARD_SIGN_CHARS = ['Ъ', 'ъ'];

const isSoftSign = (char: string): boolean => SOFT_SIGN_CHARS.includes(char);
const isHardSign = (char: string): boolean => HARD_SIGN_CHARS.includes(char);
const isSoftSignAnswer = (answer: string): boolean => 
  ['soft sign', 'soft'].includes(answer.toLowerCase().trim());
const isHardSignAnswer = (answer: string): boolean => 
  ['hard sign', 'hard'].includes(answer.toLowerCase().trim());

const CYRILLIC_QUICK_CHARS = ['я', 'ю', 'ё', 'ж', 'ш', 'щ', 'ч', 'ь', 'ъ', 'ы', 'э'];

const getAudioCategory = (questionType: string): 'alphabet' | 'phrases' | 'numbers' | 'words' | 'time' | 'examples' => {
  switch (questionType) {
    case 'alphabet':
      return 'alphabet';
    case 'basicPhrases':
      return 'phrases';
    case 'numbers':
      return 'numbers';
    case 'commonWords':
      return 'words';
    case 'time':
      return 'time';
    default:
      return questionType as any;
  }
};

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const scrollToTop = (): void => {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
};

const Quiz: React.FC<QuizProps> = ({ data }) => {
  // Session Goal: 5, 10, or 20 questions (persisted across sessions)
  const [sessionGoal, setSessionGoal] = useState<number>(() => {
    const saved = localStorage.getItem('russian_quiz_goal');
    if (saved) {
      const num = parseInt(saved, 10);
      if ([5, 10, 20].includes(num)) return num;
    }
    return 10;
  });

  // Active Category Filter: 'all', 'alphabet', 'basicPhrases', 'commonWords', 'numbers', 'time'
  const [activeCategory, setActiveCategory] = useState<QuizCategoryFilter>(() => {
    const saved = localStorage.getItem('russian_quiz_category');
    if (saved && ['all', 'alphabet', 'basicPhrases', 'commonWords', 'numbers', 'time'].includes(saved)) {
      return saved as QuizCategoryFilter;
    }
    return 'all';
  });

  // Mastered words tracking (masteryLevel >= MASTERY_THRESHOLD)
  const [masteredWordIds, setMasteredWordIds] = useState<Set<string>>(new Set());
  const masteredWordIdsRef = useRef<Set<string>>(new Set());
  const [isWordJustMastered, setIsWordJustMastered] = useState(false);
  const [isOverridden, setIsOverridden] = useState(false);
  const lastWordAttemptPromiseRef = useRef<Promise<any> | null>(null);

  // Current session tracking
  const [sessionIndex, setSessionIndex] = useState(1);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionAnswered, setSessionAnswered] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [missedInSession, setMissedInSession] = useState<MissedWord[]>([]);

  // Current question state
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showNext, setShowNext] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showPhoneticGuide, setShowPhoneticGuide] = useState(false);
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const incorrectSoundRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  const phoneticGuideTriggerRef = useRef<HTMLButtonElement>(null);
  const categoryTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const recapCategoryTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isKeyboardTabNavRef = useRef(false);
  const [_lastInput, setLastInput] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [spellingDiff, setSpellingDiff] = useState<Array<{ char: string; isDiff: boolean }> | null>(null);

  // Ref to track questions asked in current rotation
  const askedQuestionsRef = useRef<Set<string>>(new Set());

  // Ref to track session totals for background persistence
  const sessionStatsRef = useRef<{ score: number; total: number; category: string; isSaved: boolean }>({
    score: 0,
    total: 0,
    category: 'mixed',
    isSaved: false
  });

  // Load mastered words on mount
  useEffect(() => {
    ProgressService.getMasteredWordIds()
      .then(ids => {
        masteredWordIdsRef.current = ids;
        setMasteredWordIds(ids);
        setCurrentQuestion((prev: any) => {
          if (prev && isQuestionMastered(prev, ids) && sessionAnswered === 0) {
            // Re-select an unmastered question immediately
            getRandomQuestion(ids);
          }
          return prev;
        });
      })
      .catch(err => console.warn('Could not load mastered word IDs:', err));
  }, [sessionAnswered]);

  // Ensure view glides to top when quiz completes so user never misses celebration banner
  useEffect(() => {
    if (isSessionComplete) {
      scrollToTop();
    }
  }, [isSessionComplete]);

  const normalizeText = (text: string): string => {
    let mainText = text;
    const outsideParentheses = text.replace(/\s*\([^)]*\)\s*/g, "");
    if (outsideParentheses.trim()) {
      mainText = outsideParentheses;
    }
    let normalized = mainText.toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    normalized = normalized
      .replace(/c(?=[а-яёА-ЯЁ])/g, 'с')
      .replace(/a(?=[а-яёА-ЯЁ])/g, 'а')
      .replace(/e(?=[а-яёА-ЯЁ])/g, 'е')
      .replace(/o(?=[а-яёА-ЯЁ])/g, 'о')
      .replace(/p(?=[а-яёА-ЯЁ])/g, 'р')
      .replace(/x(?=[а-яёА-ЯЁ])/g, 'х')
      .replace(/y(?=[а-яёА-ЯЁ])/g, 'у');
    return normalized;
  };

  const normalizeEnglishPhrase = (text: string): string => {
    let s = text.toLowerCase().replace(/[\u2018\u2019]/g, "'").trim();

    // Remove text inside parentheses first (e.g. 'Hello (formal)' -> 'Hello')
    s = s.replace(/\s*\([^)]*\)\s*/g, ' ');

    // Normalize contractions
    const contractionMap: [RegExp, string][] = [
      [/\b(where's|wheres)\b/gi, 'where is'],
      [/\b(what's|whats)\b/gi, 'what is'],
      [/\b(who's|whos)\b/gi, 'who is'],
      [/\b(how's|hows)\b/gi, 'how is'],
      [/\b(that's|thats)\b/gi, 'that is'],
      [/\b(it's|its)\b/gi, 'it is'],
      [/\b(there's|theres)\b/gi, 'there is'],
      [/\b(here's|heres)\b/gi, 'here is'],
      [/\b(i'm|im)\b/gi, 'i am'],
      [/\b(i'd|id)\b/gi, 'i would'],
      [/\b(you're|youre)\b/gi, 'you are'],
      [/\b(we're|were)\b/gi, 'we are'],
      [/\b(they're|theyre)\b/gi, 'they are'],
      [/\b(don't|dont)\b/gi, 'do not'],
      [/\b(doesn't|doesnt)\b/gi, 'does not'],
      [/\b(didn't|didnt)\b/gi, 'did not'],
      [/\b(can't|cant)\b/gi, 'cannot'],
      [/\b(won't|wont)\b/gi, 'will not'],
      [/\b(i've|ive)\b/gi, 'i have'],
      [/\b(you've|youve)\b/gi, 'you have'],
      [/\b(i'll|ill)\b/gi, 'i will'],
      [/\b(you'll|youll)\b/gi, 'you will'],
      [/\bwanna\b/gi, 'want to'],
      [/\bgonna\b/gi, 'going to']
    ];

    contractionMap.forEach(([pattern, replacement]) => {
      s = s.replace(pattern, replacement);
    });

    // Strip punctuation
    s = s.replace(/[.,/#!$%^&*;:{}=\-_`~()?'"]/g, ' ').replace(/\s+/g, ' ').trim();

    // Normalize common synonyms & alternative phrasing
    const synonymMap: [RegExp, string][] = [
      [/\b(restroom|toilet|washroom|water closet|wc|lavatory)\b/gi, 'bathroom'],
      [/\b(hi|hey|greetings)\b/gi, 'hello'],
      [/\b(bye bye|bye|see you|farewell)\b/gi, 'goodbye'],
      [/\b(thanks|thank u|many thanks)\b/gi, 'thank you'],
      [/\b(you are welcome|welcome|no problem|not at all|my pleasure|do not mention it)\b/gi, 'you are welcome'],
      [/\b(pardon me|pardon|forgive me)\b/gi, 'excuse me'],
      [/\b(speak slower|talk slower|speak slowly|talk more slowly)\b/gi, 'speak more slowly'],
      [/\b(repeat please|say it again|say that again|can you repeat)\b/gi, 'please repeat'],
      [/\b(how are you doing|how are things|how is it going)\b/gi, 'how are you'],
      [/\b(how much is it|how much is this|what is the price)\b/gi, 'how much does it cost'],
      [/\b(i am hungry|i want food|i would like to eat)\b/gi, 'i want to eat'],
      [/\b(i am thirsty|i want water|i would like to drink)\b/gi, 'i want to drink'],
      [/\b(i do not understand|i do not get it)\b/gi, 'i dont understand'],
      [/\b(i am called|they call me)\b/gi, 'my name is'],
      [/\b(yeah|yep|yup)\b/gi, 'yes'],
      [/\b(nope|nah)\b/gi, 'no']
    ];

    synonymMap.forEach(([pattern, replacement]) => {
      s = s.replace(pattern, replacement);
    });

    return s.replace(/\s+/g, ' ').trim();
  };

  const RUSSIAN_LETTER_ANSWERS: Record<string, string[]> = {
    А: ['a', 'ah'],
    Б: ['b', 'be'],
    В: ['v', 've'],
    Г: ['g', 'ge'],
    Д: ['d', 'de'],
    Е: ['ye', 'je', 'e'],
    Ё: ['yo', 'jo', 'e'],
    Ж: ['zh', 'zhe'],
    З: ['z', 'ze'],
    И: ['ee', 'i'],
    Й: ['y', 'j', 'short i', 'iy', 'ee kratkoye'],
    К: ['k', 'ka'],
    Л: ['l', 'el'],
    М: ['m', 'em'],
    Н: ['n', 'en'],
    О: ['o', 'oh'],
    П: ['p', 'pe'],
    Р: ['r', 'er'],
    С: ['s', 'es'],
    Т: ['t', 'te'],
    У: ['oo', 'u'],
    Ф: ['f', 'ef'],
    Х: ['kh', 'h', 'ha', 'kha'],
    Ц: ['ts', 'tse', 'c'],
    Ч: ['ch', 'che'],
    Ш: ['sh', 'sha'],
    Щ: ['shch', 'shcha'],
    Ъ: ['hard sign', 'hard', 'твёрдый знак', 'твердый знак'],
    Ы: ['y', 'ih', 'ui', 'i'],
    Ь: ['soft sign', 'soft', 'мягкий знак'],
    Э: ['e', 'eh'],
    Ю: ['yu', 'ju', 'u'],
    Я: ['ya', 'ja']
  };

  const numberEquivalents: { [key: string]: string[] } = {
    "0": ["zero", "ноль"],
    "1": ["one", "один", "одна", "одно"],
    "2": ["two", "два", "две"],
    "3": ["three", "три"],
    "4": ["four", "четыре"],
    "5": ["five", "пять"],
    "6": ["six", "шесть"],
    "7": ["seven", "семь"],
    "8": ["eight", "восемь"],
    "9": ["nine", "девять"],
    "10": ["ten", "десять"],
    "11": ["eleven", "одиннадцать"],
    "12": ["twelve", "двенадцать"],
    "13": ["thirteen", "тринадцать"],
    "14": ["fourteen", "четырнадцать"],
    "15": ["fifteen", "пятнадцать"],
    "16": ["sixteen", "шестнадцать"],
    "17": ["seventeen", "семнадцать"],
    "18": ["eighteen", "восемнадцать"],
    "19": ["nineteen", "девятнадцать"],
    "20": ["twenty", "двадцать"],
    "30": ["thirty", "тридцать"],
    "40": ["forty", "сорок"],
    "50": ["fifty", "пятьдесят"],
    "60": ["sixty", "шестьдесят"],
    "70": ["seventy", "семьдесят"],
    "80": ["eighty", "восемьдесят"],
    "90": ["ninety", "девяносто"],
    "100": ["hundred", "one hundred", "a hundred", "сто"],
    "1000": ["thousand", "one thousand", "a thousand", "тысяча"]
  };

  const checkNumberEquivalence = (userAnswer: string, correctAnswer: string): boolean => {
    // Strip commas, periods, and extra spaces (e.g. "1,000" or "1.000" -> "1000")
    const cleanUser = userAnswer.replace(/[,.]/g, '').replace(/\s+/g, ' ').trim();
    const cleanTarget = correctAnswer.replace(/[,.]/g, '').replace(/\s+/g, ' ').trim();
    if (cleanUser === cleanTarget) return true;

    // Check if user answer is digits (allowing spaces like "1 000" or raw "1000")
    const userDigits = cleanUser.replace(/\s+/g, '');
    if (/^\d+$/.test(userDigits)) {
      const possibleWordForms = Object.prototype.hasOwnProperty.call(numberEquivalents, userDigits)
        ? numberEquivalents[userDigits]
        : [];
      return possibleWordForms.some(wordForm => cleanTarget === wordForm);
    } 

    // Check if target is digits
    const targetDigits = cleanTarget.replace(/\s+/g, '');
    if (/^\d+$/.test(targetDigits)) {
      const possibleWordForms = Object.prototype.hasOwnProperty.call(numberEquivalents, targetDigits)
        ? numberEquivalents[targetDigits]
        : [];
      return possibleWordForms.some(wordForm => cleanUser === wordForm);
    }

    // Check if both user and target are equivalent representations of the same number
    // (e.g. user typed "thousand" or "a thousand" and target is "one thousand")
    for (const [digit, wordForms] of Object.entries(numberEquivalents)) {
      const userMatches = wordForms.some(w => cleanUser === w || userDigits === digit);
      const targetMatches = wordForms.some(w => cleanTarget === w || targetDigits === digit);
      if (userMatches && targetMatches) {
        return true;
      }
    }

    return false;
  };

  const levenshteinDistance = (rawA: string, rawB: string): number => {
    const MAX_LEN = 250;
    const a = rawA.length > MAX_LEN ? rawA.slice(0, MAX_LEN) : rawA;
    const b = rawB.length > MAX_LEN ? rawB.slice(0, MAX_LEN) : rawB;
    if (a.length < b.length) return levenshteinDistance(b, a);
    if (b.length === 0) return a.length;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const curr = new Array<number>(b.length + 1);
      curr[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      }
      prev = curr;
    }
    return prev[b.length];
  };

  const getSpellingDifferences = (userInput: string, correctAnswer: string): Array<{ char: string; isDiff: boolean }> => {
    if (!containsCyrillic(correctAnswer)) return [];
    return correctAnswer.split('').map((char, i) => ({
      char,
      isDiff: i >= userInput.length || userInput[i] !== char
    }));
  };

  // Build the complete list of all curriculum questions across categories
  const getAllQuestions = useCallback((): QuestionDef[] => {
    if (!data) return [];
    const questions: QuestionDef[] = [];

    if (data.alphabet && Array.isArray(data.alphabet)) {
      data.alphabet.forEach(item => {
        const canonicalWordId = `alphabet-${item.character}`;
        questions.push({
          item,
          isRussianToEnglish: true,
          id: canonicalWordId,
          wordId: canonicalWordId,
          category: 'alphabet'
        });
      });
    }

    const categories = ['basicPhrases', 'numbers', 'commonWords', 'time'];
    categories.forEach(cat => {
      if (data[cat] && Array.isArray(data[cat])) {
        data[cat].forEach((item: PhraseItem) => {
          const canonicalWordId = `${cat}-${item.russian}`;
          questions.push({
            item,
            isRussianToEnglish: true,
            id: `${cat}-${item.russian}-to-en`,
            wordId: canonicalWordId,
            category: cat
          });
          questions.push({
            item,
            isRussianToEnglish: false,
            id: `${cat}-${item.english}-to-ru`,
            wordId: canonicalWordId,
            category: cat
          });
        });
      }
    });

    return questions;
  }, [data]);

  // All curriculum questions & unique word counts
  const allCurriculumQuestions = useMemo(() => getAllQuestions(), [getAllQuestions]);

  const totalCurriculumWords = useMemo(() => {
    const unique = new Set<string>();
    allCurriculumQuestions.forEach(q => unique.add(q.wordId));
    return unique.size;
  }, [allCurriculumQuestions]);

  const totalMasteredWordsCount = useMemo(() => {
    const masteredUnique = new Set<string>();
    allCurriculumQuestions.forEach(q => {
      if (isQuestionMastered(q, masteredWordIds)) {
        masteredUnique.add(q.wordId);
      }
    });
    return masteredUnique.size;
  }, [allCurriculumQuestions, masteredWordIds]);

  // Filter questions for the currently selected category
  const currentCategoryQuestions = useMemo(() => {
    if (activeCategory === 'all') return allCurriculumQuestions;
    return allCurriculumQuestions.filter(q => q.category === activeCategory);
  }, [allCurriculumQuestions, activeCategory]);

  const activeTotalQuestions = useMemo(() => {
    const unique = new Set<string>();
    currentCategoryQuestions.forEach(q => unique.add(q.wordId));
    return unique.size;
  }, [currentCategoryQuestions]);

  // Mastered count specifically within the active filter (unique curriculum words)
  const activeMasteredCount = useMemo(() => {
    const masteredUnique = new Set<string>();
    currentCategoryQuestions.forEach(q => {
      if (isQuestionMastered(q, masteredWordIds)) {
        masteredUnique.add(q.wordId);
      }
    });
    return masteredUnique.size;
  }, [currentCategoryQuestions, masteredWordIds]);

  const activeRemainingToMaster = Math.max(0, activeTotalQuestions - activeMasteredCount);

  // Per-category counts (unique words total and mastered) for category filter badges
  const categoryCounts = useMemo(() => {
    const counts: Record<QuizCategoryFilter, { total: number; mastered: number; wordIds: Set<string> }> = {
      all: { total: totalCurriculumWords, mastered: totalMasteredWordsCount, wordIds: new Set() },
      alphabet: { total: 0, mastered: 0, wordIds: new Set() },
      basicPhrases: { total: 0, mastered: 0, wordIds: new Set() },
      commonWords: { total: 0, mastered: 0, wordIds: new Set() },
      numbers: { total: 0, mastered: 0, wordIds: new Set() },
      time: { total: 0, mastered: 0, wordIds: new Set() }
    };

    allCurriculumQuestions.forEach(q => {
      const cat = q.category as QuizCategoryFilter;
      if (counts[cat] && !counts[cat].wordIds.has(q.wordId)) {
        counts[cat].wordIds.add(q.wordId);
        counts[cat].total += 1;
        if (isQuestionMastered(q, masteredWordIds)) {
          counts[cat].mastered += 1;
        }
      }
    });

    return counts;
  }, [allCurriculumQuestions, masteredWordIds, totalCurriculumWords, totalMasteredWordsCount]);

  const getRandomQuestion = useCallback((overrideMastered?: Set<string>, categoryOverride?: QuizCategoryFilter) => {
    setUserAnswer('');
    setCursorPosition(0);
    setIsCorrect(null);
    setIsOverridden(false);
    setShowNext(false);
    setSpellingDiff(null);
    setIsWordJustMastered(false);

    if (!data) return;

    try {
      const allQuestions = getAllQuestions();
      const targetCat = categoryOverride !== undefined ? categoryOverride : activeCategory;
      const targetPool = targetCat === 'all'
        ? allQuestions
        : allQuestions.filter(q => q.category === targetCat);

      if (targetPool.length === 0) {
        setCurrentQuestion({
          type: 'dummy',
          prompt: 'No questions available in this category',
          answer: '',
          hint: 'Please choose another topic or reload',
          russian: '',
          isRussianToEnglish: false
        });
        return;
      }

      const activeMastered = overrideMastered || masteredWordIdsRef.current || masteredWordIds;

      // Priority 1: Unmastered (masteryLevel < MASTERY_THRESHOLD) AND not yet asked in current rotation
      let candidatePool = targetPool.filter(q => 
        !isQuestionMastered(q, activeMastered) && !askedQuestionsRef.current.has(q.id)
      );

      // Priority 2: If all unmastered were asked in this rotation, reset rotation and pick from unmastered
      if (candidatePool.length === 0) {
        askedQuestionsRef.current.clear();
        candidatePool = targetPool.filter(q => !isQuestionMastered(q, activeMastered));
      }

      // Priority 3: If ALL questions in this category are mastered, allow practicing mastered questions
      if (candidatePool.length === 0) {
        candidatePool = targetPool.filter(q => !askedQuestionsRef.current.has(q.id));
        if (candidatePool.length === 0) {
          askedQuestionsRef.current.clear();
          candidatePool = targetPool;
        }
      }

      const selected = candidatePool[Math.floor(Math.random() * candidatePool.length)];
      askedQuestionsRef.current.add(selected.id);

      if (selected.category === 'alphabet') {
        const item = selected.item as AlphabetItem;
        const character = item.character?.toString() || '';
        const pronunciation = item.pronunciation?.toString() || '';
        const aliases = RUSSIAN_LETTER_ANSWERS[character.toUpperCase()] || [];

        if (isSoftSign(character)) {
          const ansList = Array.from(new Set(['soft sign', 'soft', ...aliases]));
          setCurrentQuestion({
            type: 'alphabet',
            prompt: character,
            answer: ansList.join('/'),
            hint: `What type of sign is "${character}"?`,
            russian: character,
            isRussianToEnglish: true,
            id: selected.id,
            wordId: selected.wordId
          });
        } else if (isHardSign(character)) {
          const ansList = Array.from(new Set(['hard sign', 'hard', ...aliases]));
          setCurrentQuestion({
            type: 'alphabet',
            prompt: character,
            answer: ansList.join('/'),
            hint: `What type of sign is "${character}"?`,
            russian: character,
            isRussianToEnglish: true,
            id: selected.id,
            wordId: selected.wordId
          });
        } else {
          const ansList = Array.from(new Set([pronunciation.toLowerCase(), ...aliases].filter(Boolean)));
          setCurrentQuestion({
            type: 'alphabet',
            prompt: character,
            answer: ansList.join('/'),
            hint: `How is the letter "${character}" pronounced in Russian?`,
            russian: character,
            isRussianToEnglish: true,
            id: selected.id,
            wordId: selected.wordId
          });
        }
      } else {
        const item = selected.item as PhraseItem;
        const russian = item.russian?.toString() || '';
        const english = item.english?.toString() || '';

        if (selected.isRussianToEnglish) {
          setCurrentQuestion({
            type: selected.category,
            prompt: russian,
            answer: english.toLowerCase(),
            hint: 'What does this mean in English?',
            russian: russian,
            isRussianToEnglish: true,
            id: selected.id,
            wordId: selected.wordId
          });
        } else {
          setCurrentQuestion({
            type: selected.category,
            prompt: english,
            answer: russian.toLowerCase(),
            hint: 'How do you say this in Russian?',
            russian: russian,
            isRussianToEnglish: false,
            id: selected.id,
            wordId: selected.wordId
          });
        }
      }

      setTimeout(() => {
        if (inputRef.current && !isKeyboardTabNavRef.current) {
          inputRef.current.focus({ preventScroll: true });
        }
      }, 100);
    } catch (error) {
      console.error("Error generating question:", error);
      setCurrentQuestion({
        type: 'emergency',
        prompt: 'Hello',
        answer: 'привет',
        hint: 'How do you say this in Russian?',
        russian: 'Привет',
        isRussianToEnglish: false,
        id: 'emergency-hello'
      });
    }
  }, [data, getAllQuestions, activeCategory, masteredWordIds]);

  const handleNextQuestion = useCallback(() => {
    setSessionIndex(prev => prev + 1);
    getRandomQuestion(undefined, activeCategory);
  }, [getRandomQuestion, activeCategory]);

  const handleCompleteSession = useCallback(async () => {
    setIsSessionComplete(true);
    sessionStatsRef.current.isSaved = true;
    scrollToTop();
    try {
      await ProgressService.recordQuizSession({
        category: activeCategory === 'all' ? 'mixed' : activeCategory,
        score: sessionScore,
        totalQuestions: sessionGoal,
      });
    } catch (err) {
      console.warn('Could not record completed quiz session:', err);
    }
  }, [sessionScore, sessionGoal, activeCategory]);

  const startNewQuizSession = useCallback((newGoal?: number, newCategory?: QuizCategoryFilter) => {
    scrollToTop();
    const goal = newGoal !== undefined ? newGoal : sessionGoal;
    const cat = newCategory !== undefined ? newCategory : activeCategory;
    if (newGoal !== undefined && newGoal !== sessionGoal) {
      setSessionGoal(goal);
      localStorage.setItem('russian_quiz_goal', goal.toString());
    }
    setSessionIndex(1);
    setSessionScore(0);
    setSessionAnswered(0);
    setMissedInSession([]);
    setIsSessionComplete(false);
    setShowNext(false);
    setUserAnswer('');
    setCursorPosition(0);
    setIsCorrect(null);
    setIsOverridden(false);
    setSpellingDiff(null);
    setIsWordJustMastered(false);
    sessionStatsRef.current = {
      score: 0,
      total: 0,
      category: cat === 'all' ? 'mixed' : cat,
      isSaved: false
    };
    getRandomQuestion(undefined, cat);
  }, [sessionGoal, activeCategory, getRandomQuestion]);

  const handleCategoryChange = (newCategory: QuizCategoryFilter) => {
    if (newCategory === activeCategory) return;
    setActiveCategory(newCategory);
    localStorage.setItem('russian_quiz_category', newCategory);
    askedQuestionsRef.current.clear();
    startNewQuizSession(sessionGoal, newCategory);
  };

  const handleCategoryKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentId: QuizCategoryFilter,
    tabRefsMap: React.MutableRefObject<Record<string, HTMLButtonElement | null>>
  ) => {
    const idx = QUIZ_CATEGORIES.findIndex(c => c.id === currentId);
    if (idx === -1) return;
    let nextIdx = -1;
    if (e.key === 'ArrowRight') {
      nextIdx = (idx + 1) % QUIZ_CATEGORIES.length;
    } else if (e.key === 'ArrowLeft') {
      nextIdx = (idx - 1 + QUIZ_CATEGORIES.length) % QUIZ_CATEGORIES.length;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = QUIZ_CATEGORIES.length - 1;
    }
    if (nextIdx !== -1) {
      e.preventDefault();
      isKeyboardTabNavRef.current = true;
      const nextCat = QUIZ_CATEGORIES[nextIdx].id;
      handleCategoryChange(nextCat);
      requestAnimationFrame(() => {
        tabRefsMap.current[nextCat]?.focus();
        setTimeout(() => {
          isKeyboardTabNavRef.current = false;
        }, 150);
      });
    }
  };

  const handleGoalChange = (newGoal: number) => {
    if (newGoal === sessionGoal) return;
    localStorage.setItem('russian_quiz_goal', newGoal.toString());
    setSessionGoal(newGoal);

    // If user already reached or exceeded the new goal, finish session right away
    if (sessionAnswered >= newGoal) {
      setIsSessionComplete(true);
      sessionStatsRef.current.isSaved = true;
      scrollToTop();
      ProgressService.recordQuizSession({
        category: activeCategory === 'all' ? 'mixed' : activeCategory,
        score: sessionScore,
        totalQuestions: sessionAnswered,
      }).catch(err => console.warn('Could not save quiz session on goal adjustment:', err));
    }
  };

  // Close phonetic typing cheatsheet popover on Escape
  useEffect(() => {
    if (!showPhoneticGuide) return;
    const handlePopoverKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setShowPhoneticGuide(false);
        phoneticGuideTriggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handlePopoverKeyDown);
    return () => document.removeEventListener('keydown', handlePopoverKeyDown);
  }, [showPhoneticGuide]);

  // Global event listener for Enter key shortcut when focus is not on another interactive control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.defaultPrevented) return;
      if (document.querySelector('[role="dialog"], [role="menu"]')) return;

      const target = e.target;
      if (
        target instanceof Element &&
        target.closest('button, a, input, select, textarea, [role="button"], [role="tab"], [role="menuitem"], [contenteditable="true"]')
      ) {
        return;
      }

      if (isSessionComplete) {
        e.preventDefault();
        startNewQuizSession();
      } else if (showNext) {
        e.preventDefault();
        if (sessionAnswered >= sessionGoal) {
          handleCompleteSession();
        } else {
          handleNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSessionComplete, showNext, sessionAnswered, sessionGoal, handleCompleteSession, handleNextQuestion, startNewQuizSession]);

  // Focus input when new question appears without scrolling/jumping
  useEffect(() => {
    if (currentQuestion && !showNext && !isSessionComplete && inputRef.current && !isKeyboardTabNavRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [currentQuestion, showNext, isSessionComplete]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      getRandomQuestion(undefined, activeCategory);

      correctSoundRef.current = new Audio('/audio/sounds/correct.mp3');
      incorrectSoundRef.current = new Audio('/audio/sounds/incorrect.mp3');
    }
  }, [getRandomQuestion, activeCategory]);

  // Cleanup effect: save partial session if unmounting mid-quiz (at least 3 questions answered)
  useEffect(() => {
    return () => {
      const currentStats = sessionStatsRef.current;
      if (currentStats.total >= 3 && !currentStats.isSaved) {
        ProgressService.recordQuizSession({
          category: currentStats.category,
          score: currentStats.score,
          totalQuestions: currentStats.total,
        }).catch(err => console.warn('Could not save unmounted quiz session:', err));
      }

      if (correctSoundRef.current) correctSoundRef.current.pause();
      if (incorrectSoundRef.current) incorrectSoundRef.current.pause();
    };
  }, []);

  const checkAnswer = () => {
    if (!userAnswer.trim()) return;

    let processedAnswer = userAnswer;
    if (needsRussianKeyboard && /[a-zA-Z'`"]/.test(processedAnswer)) {
      processedAnswer = transliterate(processedAnswer);
      setUserAnswer(processedAnswer);
    }

    const userAnswerNormalized = normalizeText(processedAnswer);
    let isAnswerCorrect = false;

    if (isSoftSign(currentQuestion.prompt) && isSoftSignAnswer(userAnswerNormalized)) {
      isAnswerCorrect = true;
    } else if (isHardSign(currentQuestion.prompt) && isHardSignAnswer(userAnswerNormalized)) {
      isAnswerCorrect = true;
    } else {
      // Collect all valid target answers (split by '/' if present)
      const rawTargets = currentQuestion.answer.includes('/')
        ? currentQuestion.answer.split('/')
        : [currentQuestion.answer];

      const expandedTargets: string[] = [];
      rawTargets.forEach((target: string) => {
        expandedTargets.push(target);
        // Also add version without parentheses, e.g. "Hello (formal)" -> "Hello"
        const noParens = target.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
        if (noParens && noParens !== target) {
          expandedTargets.push(noParens);
        }
      });

      for (const target of expandedTargets) {
        if (isAnswerCorrect) break;

        const targetNormalized = normalizeText(target);

        // 1. Exact match after standard normalization
        if (userAnswerNormalized === targetNormalized) {
          isAnswerCorrect = true;
          break;
        }

        // 2. Number equivalence (e.g. '1' <=> 'one' <=> 'один')
        if (checkNumberEquivalence(userAnswerNormalized, targetNormalized)) {
          isAnswerCorrect = true;
          break;
        }

        // 3. Russian / Cyrillic matching with Levenshtein tolerance
        if (containsCyrillic(userAnswerNormalized) || containsCyrillic(targetNormalized)) {
          const userRu = userAnswerNormalized.replace(/ё/g, 'е');
          const targetRu = targetNormalized.replace(/ё/g, 'е');

          // Exact Russian match (treating ё and е as interchangeable)
          if (userRu === targetRu) {
            isAnswerCorrect = true;
            break;
          }

          // Cyrillic typo tolerance (for words of length >= 3, never digits or alphabet flashcards)
          if (
            !/\d/.test(userAnswerNormalized) &&
            !/\d/.test(targetNormalized) &&
            currentQuestion.type !== 'alphabet' &&
            targetNormalized.length >= 3
          ) {
            const maxErrors = targetNormalized.length >= 7 ? 2 : 1;
            const distance = levenshteinDistance(userRu, targetRu);
            if (distance <= maxErrors) {
              isAnswerCorrect = true;
              if (containsCyrillic(targetNormalized)) {
                setSpellingDiff(getSpellingDifferences(userAnswerNormalized, targetNormalized));
              } else {
                setSpellingDiff(null);
              }
              break;
            }
          }
        } else {
          // 4. English phrase matching with contraction expansion, synonyms, and article tolerance
          const userEnglishNorm = normalizeEnglishPhrase(userAnswer);
          const targetEnglishNorm = normalizeEnglishPhrase(target);

          if (userEnglishNorm === targetEnglishNorm) {
            isAnswerCorrect = true;
            break;
          }

          // Article tolerance ("where is restroom" === "where is the bathroom")
          const stripArticles = (s: string) => s.replace(/\b(the|a|an)\b/gi, '').replace(/\s+/g, ' ').trim();
          const strippedUser = stripArticles(userEnglishNorm);
          const strippedTarget = stripArticles(targetEnglishNorm);
          if (currentQuestion.type !== 'alphabet' && strippedUser.length > 0 && strippedTarget.length > 0 && strippedUser === strippedTarget) {
            isAnswerCorrect = true;
            break;
          }

          // Substring inclusion with high length overlap (only for multi-word phrases of length >= 4, never digits or alphabet)
          if (
            !/\d/.test(userEnglishNorm) &&
            !/\d/.test(targetEnglishNorm) &&
            currentQuestion.type !== 'alphabet' &&
            (userEnglishNorm.includes(targetEnglishNorm) || targetEnglishNorm.includes(userEnglishNorm))
          ) {
            const minLen = Math.min(userEnglishNorm.length, targetEnglishNorm.length);
            const maxLen = Math.max(userEnglishNorm.length, targetEnglishNorm.length);
            if (minLen >= 4 && minLen / maxLen >= 0.6) {
              isAnswerCorrect = true;
              break;
            }
          }

          // English Levenshtein typo tolerance (for words/phrases of length >= 3, NEVER for alphabet or digits)
          if (
            !/\d/.test(userEnglishNorm) &&
            !/\d/.test(targetEnglishNorm) &&
            currentQuestion.type !== 'alphabet' &&
            targetEnglishNorm.length >= 3
          ) {
            const engMaxErrors = targetEnglishNorm.length >= 7 ? 2 : 1;
            const engDistance = levenshteinDistance(userEnglishNorm, targetEnglishNorm);
            if (engDistance <= engMaxErrors) {
              isAnswerCorrect = true;
              break;
            }
          }
        }
      }
    }

    setIsCorrect(isAnswerCorrect);
    setShowNext(true);
    const newSessionAnswered = sessionAnswered + 1;
    const newSessionScore = isAnswerCorrect ? sessionScore + 1 : sessionScore;
    setSessionAnswered(newSessionAnswered);

    if (isAnswerCorrect) {
      setSessionScore(newSessionScore);
      playSound(correctSoundRef.current, "correct");
    } else {
      playSound(incorrectSoundRef.current, "incorrect");
      setMissedInSession(prev => [
        ...prev,
        {
          prompt: currentQuestion.prompt,
          answer: currentQuestion.answer,
          userAnswer: processedAnswer,
          category: currentQuestion.type,
          russian: currentQuestion.russian
        }
      ]);
    }

    sessionStatsRef.current = {
      score: newSessionScore,
      total: newSessionAnswered,
      category: activeCategory === 'all' ? 'mixed' : activeCategory,
      isSaved: false
    };

    // Record word attempt in background and check if it reached mastery
    if (currentQuestion) {
      const canonicalId = currentQuestion.wordId || currentQuestion.id || `${currentQuestion.type}-${currentQuestion.prompt}`;
      const attemptPromise = ProgressService.recordWordAttempt({
        category: currentQuestion.type || 'alphabet',
        wordId: canonicalId,
        prompt: currentQuestion.prompt || '',
        answer: currentQuestion.answer || '',
        isCorrect: isAnswerCorrect,
      });
      lastWordAttemptPromiseRef.current = attemptPromise;
      attemptPromise.then(updatedWord => {
        if (updatedWord && updatedWord.masteryLevel >= MASTERY_THRESHOLD) {
          setIsWordJustMastered(true);
          masteredWordIdsRef.current.add(updatedWord.wordId);
          if (currentQuestion.wordId) masteredWordIdsRef.current.add(currentQuestion.wordId);
          if (currentQuestion.id) masteredWordIdsRef.current.add(currentQuestion.id);
          setMasteredWordIds(prev => {
            const next = new Set(prev);
            next.add(updatedWord.wordId);
            if (currentQuestion.wordId) next.add(currentQuestion.wordId);
            if (currentQuestion.id) next.add(currentQuestion.id);
            return next;
          });
        }
      }).catch(err => console.warn('Could not record word attempt:', err));
    }
  };

  const handleOverrideAnswer = async () => {
    if (isCorrect) return;
    setIsCorrect(true);
    setIsOverridden(true);
    const newSessionScore = sessionScore + 1;
    setSessionScore(newSessionScore);
    sessionStatsRef.current.score = newSessionScore;
    setMissedInSession(prev => prev.filter(m => m.prompt !== currentQuestion?.prompt));
    playSound(correctSoundRef.current, 'correct');

    requestAnimationFrame(() => {
      continueButtonRef.current?.focus({ preventScroll: true });
    });

    if (currentQuestion) {
      const questionSnapshot = currentQuestion;
      try {
        if (lastWordAttemptPromiseRef.current) {
          await lastWordAttemptPromiseRef.current;
        }
        const canonicalId = questionSnapshot.wordId || questionSnapshot.id || `${questionSnapshot.type}-${questionSnapshot.prompt}`;
        const updatedWord = await ProgressService.overrideWordAttempt({
          category: questionSnapshot.type || 'alphabet',
          wordId: canonicalId,
          prompt: questionSnapshot.prompt || '',
          answer: questionSnapshot.answer || '',
        });
        if (updatedWord && updatedWord.masteryLevel >= MASTERY_THRESHOLD) {
          masteredWordIdsRef.current.add(updatedWord.wordId);
          if (questionSnapshot.wordId) masteredWordIdsRef.current.add(questionSnapshot.wordId);
          if (questionSnapshot.id) masteredWordIdsRef.current.add(questionSnapshot.id);
          setMasteredWordIds(prev => {
            const next = new Set(prev);
            next.add(updatedWord.wordId);
            if (questionSnapshot.wordId) next.add(questionSnapshot.wordId);
            if (questionSnapshot.id) next.add(questionSnapshot.id);
            return next;
          });
          if (currentQuestion?.id === questionSnapshot.id) {
            setIsWordJustMastered(true);
          }
        }
      } catch (err) {
        console.warn('Error overriding word attempt:', err);
      }
    }
  };

  const playSound = (audio: HTMLAudioElement | null, type: string) => {
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn(`Could not play ${type} sound`, e);
        });
      }
    } catch (e) {
      console.warn(`Error playing ${type} sound`, e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!showNext) {
        checkAnswer();
      } else {
        if (sessionAnswered >= sessionGoal) {
          handleCompleteSession();
        } else {
          handleNextQuestion();
        }
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.slice(0, 250);
    const selectionStart = e.target.selectionStart || 0;

    if (!needsRussianKeyboard) {
      setUserAnswer(newValue.slice(0, 250));
      setCursorPosition(selectionStart);
      setLastInput(newValue);
      return;
    }

    if (["'", "`", '"'].includes(newValue.charAt(selectionStart - 1))) {
      const withSpecials = newValue
        .replace(/'/g, 'ь')
        .replace(/`/g, 'ь')
        .replace(/"/g, 'ъ');
      setUserAnswer(withSpecials);
      setLastInput(withSpecials);
      setCursorPosition(selectionStart);
      return;
    }

    setUserAnswer(newValue.slice(0, 250));

    const lastCharIndex = selectionStart - 1;
    if (lastCharIndex >= 1 && lastCharIndex < newValue.length) {
      const prevChar = newValue.charAt(lastCharIndex - 1);
      const currChar = newValue.charAt(lastCharIndex);

      if (combinationStarters.includes(prevChar) && 
          combinationFollowers[prevChar as keyof typeof combinationFollowers]?.includes(currChar)) {
        const transliteratedValue = transliterate(newValue);
        const newCursorPos = transliterate(newValue.slice(0, selectionStart)).length;
        setUserAnswer(transliteratedValue);
        setCursorPosition(newCursorPos);
        setLastInput(newValue);
        return;
      }
    }

    const hasInputType = 'inputType' in e.nativeEvent;
    const inputType = hasInputType ? (e.nativeEvent as any).inputType : undefined;

    if (newValue.endsWith(' ') || 
        /[.,!?;:]/.test(newValue.charAt(selectionStart - 1)) ||
        inputType === 'insertLineBreak' ||
        newValue.includes('\n')) {
      const transliteratedValue = transliterate(newValue);
      const newCursorPos = transliterate(newValue.slice(0, selectionStart)).length;
      setUserAnswer(transliteratedValue);
      setCursorPosition(newCursorPos);
    } else {
      setCursorPosition(selectionStart);
    }

    setLastInput(newValue);
  };

  const handleCheckAnswer = () => {
    if (needsRussianKeyboard && userAnswer && /[a-zA-Z'`"]/.test(userAnswer)) {
      const transliteratedValue = transliterate(userAnswer);
      setUserAnswer(transliteratedValue);
    }
    checkAnswer();
  };

  const handleKeyboardLetterClick = (letter: string, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (showNext) return;
    const isPointerActivation = Boolean(e && e.detail > 0);
    if (e) {
      e.preventDefault();
    }

    const input = inputRef.current;
    const useInputSelection =
      input &&
      typeof input.selectionStart === 'number' &&
      (document.activeElement === input || isPointerActivation);

    const start = useInputSelection
      ? (input!.selectionStart as number)
      : Math.min(cursorPosition, userAnswer.length);
    const end = useInputSelection && typeof input!.selectionEnd === 'number'
      ? (input!.selectionEnd as number)
      : start;

    let newValue = '';
    let newCursorPos = start;

    if (letter === 'backspace') {
      if (start === end && start > 0) {
        newValue = userAnswer.slice(0, start - 1) + userAnswer.slice(start);
        newCursorPos = start - 1;
      } else {
        newValue = userAnswer.slice(0, start) + userAnswer.slice(end);
        newCursorPos = start;
      }
    } else if (letter === 'clear') {
      newValue = '';
      newCursorPos = 0;
    } else {
      const insertion = letter;
      newValue = userAnswer.slice(0, start) + insertion + userAnswer.slice(end);
      newCursorPos = start + insertion.length;

      if (letter === ' ') {
        newValue = transliterate(newValue);
        newCursorPos = newValue.length;
      }
    }

    const boundedValue = newValue.slice(0, 250);
    const boundedCursor = Math.min(newCursorPos, boundedValue.length);
    setUserAnswer(boundedValue);
    setCursorPosition(boundedCursor);

    // Only move focus to <input> on pointer clicks (e.detail > 0), preserving keyboard focus on virtual keys
    if (isPointerActivation && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
      setTimeout(() => {
        if (inputRef.current) {
          try {
            inputRef.current.setSelectionRange(boundedCursor, boundedCursor);
          } catch {
            // ignore in environments without selection range
          }
        }
      }, 0);
    }
  };

  const toggleKeyboard = () => {
    setShowKeyboard(prev => !prev);
  };

  const needsRussianKeyboard = currentQuestion && 
    !currentQuestion.type.includes('alphabet') && 
    currentQuestion.hint.includes('How do you say this in Russian');

  const combinationStarters = ['y', 'Y', 'i', 'I', 'e', 'E', 'z', 'Z', 's', 'S', 'c', 'C', 't', 'T', 'k', 'K'];
  const combinationFollowers = {
    'y': ['a', 'A', 'u', 'U', 'o', 'O', 'e', 'E'],
    'Y': ['a', 'A', 'u', 'U', 'o', 'O', 'e', 'E'],
    'i': ['h', 'H'],
    'I': ['h', 'H'],
    'e': ['h', 'H'],
    'E': ['h', 'H'],
    'z': ['h', 'H'],
    'Z': ['h', 'H'],
    's': ['h', 'H'],
    'S': ['h', 'H'],
    'c': ['h', 'H'],
    'C': ['h', 'H'],
    't': ['s', 'S'],
    'T': ['s', 'S'],
    'k': ['h', 'H'],
    'K': ['h', 'H']
  };

  useEffect(() => {
    if (inputRef.current && needsRussianKeyboard && document.activeElement === inputRef.current) {
      requestAnimationFrame(() => {
        if (inputRef.current && document.activeElement === inputRef.current) {
          try {
            inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
          } catch {
            // ignore in environments without selection range
          }
        }
      });
    }
  }, [cursorPosition, userAnswer, needsRussianKeyboard]);

  // --- RENDER RECAP SCREEN WHEN SESSION IS COMPLETE ---
  if (isSessionComplete) {
    const completedTotal = sessionAnswered > 0 ? sessionAnswered : sessionGoal;
    const percentage = completedTotal > 0 ? Math.min(100, Math.round((sessionScore / completedTotal) * 100)) : 0;

    let headlineRussian = '';
    let headlinePronunciation = '';
    let headlineEnglish = '';
    let recapIcon = null;

    if (percentage === 100) {
      headlineRussian = 'Отлично!';
      headlinePronunciation = 'Otlichno!';
      headlineEnglish = 'Perfect score! You mastered every question in this session.';
      recapIcon = <FaTrophy className="recap-icon gold" aria-hidden="true" />;
    } else if (percentage >= 80) {
      headlineRussian = 'Молодец!';
      headlinePronunciation = 'Molodets!';
      headlineEnglish = 'Outstanding job! Your Russian skills are getting stronger.';
      recapIcon = <FaTrophy className="recap-icon silver" aria-hidden="true" />;
    } else if (percentage >= 60) {
      headlineRussian = 'Хорошо!';
      headlinePronunciation = 'Khorosho!';
      headlineEnglish = 'Solid progress! A little more practice and you will ace it.';
      recapIcon = <FaStar className="recap-icon bronze" aria-hidden="true" />;
    } else {
      headlineRussian = 'Повторение — мать учения';
      headlinePronunciation = "Povtoreniye — mat' ucheniya";
      headlineEnglish = 'Repetition is the mother of learning. Practice makes perfect!';
      recapIcon = <FaGraduationCap className="recap-icon practice" aria-hidden="true" />;
    }

    return (
      <div className="section quiz-section quiz-recap-section">
        <h2 className="quiz-recap-title">Quiz Session Complete!</h2>

        <div className="quiz-card quiz-recap-card">
          <div className="recap-praise-hero">
            <div className="recap-badge-icon-wrap" aria-hidden="true">
              {recapIcon}
            </div>
            <h3 className="recap-russian-title" lang="ru">{headlineRussian}</h3>
            {headlinePronunciation && (
              <div className="recap-pronunciation-wrap">
                <span className="recap-pronunciation-pill">
                  {headlinePronunciation}
                </span>
              </div>
            )}
            <p className="recap-english-subtitle">{headlineEnglish}</p>
          </div>

          <div className="recap-hero-score">
            <div className="recap-ring-wrap">
              <svg className="recap-progress-ring" width="164" height="164" viewBox="0 0 164 164" aria-hidden="true">
                <defs>
                  <linearGradient id="scoreRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={percentage === 100 ? '#f59e0b' : percentage >= 80 ? '#3b82f6' : '#4A5AF4'} />
                    <stop offset="100%" stopColor={percentage === 100 ? '#fbbf24' : percentage >= 80 ? '#6366f1' : '#0039A6'} />
                  </linearGradient>
                </defs>
                <circle
                  className="recap-ring-track"
                  cx="82"
                  cy="82"
                  r={72}
                  strokeWidth="10"
                />
                <circle
                  className="recap-ring-bar"
                  cx="82"
                  cy="82"
                  r={72}
                  strokeWidth="10"
                  strokeDasharray={452.39}
                  strokeDashoffset={452.39 - (percentage / 100) * 452.39}
                  strokeLinecap="round"
                  transform="rotate(-90 82 82)"
                />
              </svg>
              <div className="recap-ring-label">
                <span className="recap-score-percent">{percentage}%</span>
                <span className="recap-score-ratio">{sessionScore} / {completedTotal} correct</span>
              </div>
            </div>

            <div className="recap-stats-grid" role="group" aria-label="Session summary stats">
              <div className="recap-stat-card">
                <span className="stat-label"><span aria-hidden="true">🎯</span> Goal</span>
                <span className="stat-value">{completedTotal} Qs</span>
              </div>
              <div className="recap-stat-card correct">
                <span className="stat-label"><span aria-hidden="true">✅</span> Correct</span>
                <span className="stat-value">{sessionScore}</span>
              </div>
              <div className="recap-stat-card highlight">
                <span className="stat-label"><span aria-hidden="true">🏆</span> Mastered</span>
                <span className="stat-value">{activeMasteredCount} / {activeTotalQuestions}</span>
              </div>
              <div className="recap-stat-card pool-left">
                <span className="stat-label"><span aria-hidden="true">📚</span> Remaining</span>
                <span className="stat-value">{activeRemainingToMaster}</span>
              </div>
            </div>

            <p className="recap-save-notice">
              <FaCheckCircle className="notice-icon" aria-hidden="true" /> Logged as 1 completed quiz in your learning progress
            </p>
          </div>

          <div className="recap-next-session">
            <div className="recap-topic-selector">
              <span className="goal-picker-label">Choose topic:</span>
              <div className="recap-topic-pills" role="tablist" aria-label="Choose quiz topic">
                {QUIZ_CATEGORIES.map(cat => {
                  const isActive = activeCategory === cat.id;
                  const countInfo = categoryCounts[cat.id];
                  return (
                    <button
                      key={cat.id}
                      ref={(el) => { recapCategoryTabRefs.current[cat.id] = el; }}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      tabIndex={isActive ? 0 : -1}
                      className={`recap-topic-pill ${isActive ? 'active' : ''}`}
                      onClick={() => handleCategoryChange(cat.id)}
                      onKeyDown={(e) => handleCategoryKeyDown(e, cat.id, recapCategoryTabRefs)}
                      title={`Switch to ${cat.label} (${countInfo?.total || 0} questions)`}
                    >
                      <span className="cat-icon" aria-hidden="true">{cat.icon}</span>
                      <span className="cat-label">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="recap-goal-picker">
              <span className="goal-picker-label">Choose next quiz length:</span>
              <div className="goal-picker-buttons" role="group" aria-label="Next quiz length">
                {[5, 10, 20].map(count => (
                  <button
                    key={count}
                    type="button"
                    aria-pressed={sessionGoal === count}
                    className={`recap-goal-btn ${sessionGoal === count ? 'active' : ''}`}
                    onClick={() => {
                      setSessionGoal(count);
                      localStorage.setItem('russian_quiz_goal', count.toString());
                    }}
                    title={`Set next quiz to ${count} questions`}
                  >
                    {count} Qs
                  </button>
                ))}
              </div>
            </div>

            <div className="quiz-buttons recap-quiz-buttons">
              <button
                type="button"
                className="next-button start-new-quiz-button"
                onClick={() => startNewQuizSession(sessionGoal)}
                autoFocus
                title="Start next quiz session"
                aria-label={`Start Next Quiz (${sessionGoal} Qs)`}
              >
                <span className="btn-main-label">
                  <FaRedo className="btn-icon" aria-hidden="true" /> Start Next Quiz ({sessionGoal} Qs)
                </span>
                <span className="btn-hint-badge" aria-hidden="true">
                  press <span className="btn-kbd">↵ Enter</span>
                </span>
              </button>
            </div>
          </div>

          {missedInSession.length > 0 && (
            <div className="recap-missed-section">
              <div className="missed-header-row">
                <h3>Words to Review from This Session ({missedInSession.length})</h3>
              </div>
              <p className="missed-hint">Listen to the correct pronunciation to reinforce your memory:</p>
              <div className="missed-words-list">
                {missedInSession.map((item, idx) => {
                  const displayAnswer = item.answer.split('/')[0];
                  return (
                    <div key={idx} className="missed-word-item">
                      <div className="missed-word-details">
                        <div
                          className="missed-word-prompt"
                          lang={containsCyrillic(item.prompt) ? 'ru' : 'en'}
                        >
                          {item.prompt}
                        </div>
                        <div className="missed-word-answers">
                          <span className="correct-answer-text">
                            Answer:{' '}
                            <strong lang={containsCyrillic(displayAnswer) ? 'ru' : 'en'}>
                              {displayAnswer}
                            </strong>
                          </span>
                          {item.userAnswer && (
                            <span className="user-answer-text">
                              You typed:{' '}
                              <span
                                className="strikethrough"
                                lang={containsCyrillic(item.userAnswer) ? 'ru' : 'en'}
                              >
                                {item.userAnswer}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                      <PronunciationButton
                        text={item.russian || item.prompt}
                        audioCategory={getAudioCategory(item.category)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER LOADING STATE ---
  if (!data || !currentQuestion) {
    return (
      <div className="section quiz-section">
        <h2>Test Your Knowledge</h2>
        <div className="quiz-card" role="status" aria-live="polite">
          <h3>Loading quiz questions...</h3>
          <p>Please wait while we prepare your questions.</p>
        </div>
      </div>
    );
  }

  // --- RENDER ACTIVE QUIZ SESSION ---
  const progressPercent = sessionGoal > 0 ? Math.min(100, Math.round((sessionAnswered / sessionGoal) * 100)) : 0;
  const primaryCorrectAnswer = currentQuestion.answer.includes('/')
    ? currentQuestion.answer.split('/')[0]
    : currentQuestion.answer;

  return (
    <div className="section quiz-section">
      <h2 className="quiz-page-title">Test Your Knowledge</h2>

      {/* Modern Horizontal Category Filter Bar */}
      <div className="quiz-category-filter-bar">
        <div className="category-filter-scroll" role="tablist" aria-label="Filter quiz by category">
          {QUIZ_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            const countInfo = categoryCounts[cat.id];
            const isFullyMastered = countInfo && countInfo.total > 0 && countInfo.mastered >= countInfo.total;
            return (
              <button
                key={cat.id}
                ref={(el) => { categoryTabRefs.current[cat.id] = el; }}
                type="button"
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                className={`category-filter-pill ${isActive ? 'active' : ''} ${isFullyMastered ? 'mastered' : ''}`}
                onClick={() => handleCategoryChange(cat.id)}
                onKeyDown={(e) => handleCategoryKeyDown(e, cat.id, categoryTabRefs)}
                title={`Filter quiz to ${cat.label} (${countInfo?.total || 0} questions)`}
              >
                <span className="cat-icon" aria-hidden="true">{cat.icon}</span>
                <span className="cat-label">{cat.label}</span>
                <span className="cat-count-badge">
                  {countInfo?.mastered ? `${countInfo.mastered}/${countInfo.total}` : (countInfo?.total || 0)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modern Compact Quiz Header Panel / Game HUD */}
      <div className="quiz-header-panel">
        <div
          className="quiz-progress-bar-container"
          role="progressbar"
          aria-label="Session progress"
          aria-valuenow={sessionAnswered}
          aria-valuemin={0}
          aria-valuemax={sessionGoal}
        >
          <div 
            className="quiz-progress-bar-fill" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        <div className="quiz-top-bar">
          <div className="session-progress-counter">
            <span className="counter-label">Question</span>
            <span className="counter-current">{sessionIndex}</span>
            <span className="counter-total">of {sessionGoal}</span>
          </div>

          <div className="session-score-badge">
            <span>Score: <strong>{sessionScore}</strong> / {sessionAnswered}</span>
          </div>

          <div className="quiz-goal-selector" role="group" aria-label="Session question count">
            {[5, 10, 20].map(count => (
              <button
                key={count}
                type="button"
                aria-pressed={sessionGoal === count}
                className={`goal-pill ${sessionGoal === count ? 'active' : ''}`}
                onClick={() => handleGoalChange(count)}
                title={`Set quiz session to ${count} questions`}
              >
                {count} Qs
              </button>
            ))}
          </div>
        </div>

        <div className="curriculum-pool-badge" title="Mastered words are removed from future questions">
          <span className="pool-icon" aria-hidden="true">🏆</span>
          <span>Mastered: <strong>{activeMasteredCount}</strong> / {activeTotalQuestions}</span>
          <span className="pool-remaining-tag">({activeRemainingToMaster} remaining)</span>
        </div>
      </div>

      <div className="quiz-card">
        <h3 id="quiz-question-hint" className="quiz-question-hint">{currentQuestion.hint}</h3>
        <div className="quiz-prompt">
          <span
            id="quiz-question-prompt"
            className="quiz-prompt-text"
            lang={currentQuestion.isRussianToEnglish ? 'ru' : 'en'}
          >
            {currentQuestion.prompt}
          </span>
          {currentQuestion.type !== 'alphabet' && currentQuestion.isRussianToEnglish && (
            <PronunciationButton 
              text={currentQuestion.russian}
              className="quiz-prompt-audio margin-left"
              audioCategory={getAudioCategory(currentQuestion.type)}
            />
          )}
        </div>
        <div className="input-container">
          <input
            ref={inputRef}
            id="quiz-answer-input"
            type="text"
            className="quiz-input"
            aria-label="Quiz answer input"
            aria-describedby="quiz-question-hint quiz-question-prompt"
            lang={needsRussianKeyboard ? 'ru' : 'en'}
            value={userAnswer}
            maxLength={250}
            onChange={handleInputChange} 
            onKeyDown={handleKeyDown}
            onSelect={(e) => setCursorPosition((e.target as HTMLInputElement).selectionStart || 0)}
            placeholder={needsRussianKeyboard ? "Type in English (press SPACE)..." : "Your answer here..."}
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            disabled={showNext}
          />
          {needsRussianKeyboard && !showNext && (
            <button
              type="button"
              className={`keyboard-toggle-button ${showKeyboard ? 'active' : ''}`}
              onClick={toggleKeyboard}
              title="Toggle Russian Keyboard"
              aria-label="Toggle Russian keyboard"
              aria-expanded={showKeyboard}
            >
              <FaKeyboard aria-hidden="true" />
            </button>
          )}
        </div>

        {needsRussianKeyboard && !showNext && (
          <div className="cyrillic-helper-panel">
            {/* Unified quick-tap Russian letters + guide icon toolbar */}
            <div className="cyrillic-quick-bar" role="toolbar" aria-label="Special Russian characters">
              <div className="quick-keys-scroll">
                {CYRILLIC_QUICK_CHARS.map(char => (
                  <button
                    key={char}
                    type="button"
                    className="quick-char-btn"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => handleKeyboardLetterClick(char, e)}
                    aria-label={`Insert ${char}`}
                  >
                    <span lang="ru">{char}</span>
                  </button>
                ))}
                <button
                  ref={phoneticGuideTriggerRef}
                  type="button"
                  className={`quick-char-btn hint-toggle-btn ${showPhoneticGuide ? 'active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPhoneticGuide(prev => !prev)}
                  title="Phonetic typing guide"
                  aria-expanded={showPhoneticGuide}
                  aria-label="Phonetic typing guide"
                >
                  <span aria-hidden="true">💡</span>
                </button>
              </div>
            </div>

            {showPhoneticGuide && (
              <div className="phonetic-guide-popover translit-cheatsheet-popover" role="region" aria-label="Phonetic typing guide">
                <div className="popover-header">
                  <span className="popover-title"><span aria-hidden="true">💡</span> Phonetic Typing Cheatsheet</span>
                  <button 
                    type="button" 
                    className="close-popover-btn" 
                    onClick={() => setShowPhoneticGuide(false)}
                    aria-label="Close guide"
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                </div>
                <div className="phonetic-rules-grid">
                  <div><code>ya</code> → <strong lang="ru">я</strong></div>
                  <div><code>yu</code> → <strong lang="ru">ю</strong></div>
                  <div><code>yo</code> → <strong lang="ru">ё</strong></div>
                  <div><code>ih</code> → <strong lang="ru">ы</strong></div>
                  <div><code>eh</code> → <strong lang="ru">э</strong></div>
                  <div><code>zh</code> → <strong lang="ru">ж</strong></div>
                  <div><code>sh</code> → <strong lang="ru">ш</strong></div>
                  <div><code>ch</code> → <strong lang="ru">ч</strong></div>
                  <div><code>shch</code> → <strong lang="ru">щ</strong></div>
                  <div><code>ts</code> → <strong lang="ru">ц</strong></div>
                  <div><code>'</code> → <strong lang="ru">ь</strong></div>
                  <div><code>"</code> → <strong lang="ru">ъ</strong></div>
                </div>
                <small className="phonetic-note">Type phonetically in English, then press SPACE to auto-convert!</small>
              </div>
            )}
          </div>
        )}


        {needsRussianKeyboard && showKeyboard && !showNext && (
          <div className="virtual-keyboard-container">
            <div className="virtual-keyboard-header">
              <span>Full Russian Keyboard</span>
              <button 
                type="button" 
                className="close-keyboard-btn" 
                onClick={toggleKeyboard}
                aria-label="Close keyboard"
              >
                <span aria-hidden="true">✕</span> Close
              </button>
            </div>
            <RussianKeyboard onLetterClick={handleKeyboardLetterClick} />
          </div>
        )}

        <div className="quiz-buttons">
          {!showNext && (
            <button type="button" className="check-button" onClick={handleCheckAnswer} aria-label="Check Answer">
              <span className="btn-main-label">Check Answer</span>
              <span className="btn-hint-badge" aria-hidden="true">
                press <span className="btn-kbd">↵ Enter</span>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Persistent polite live region wrapping Fluid Duolingo-style Bottom Feedback Sheet */}
      <div className="quiz-feedback-live-region" aria-live="polite">
        {showNext && isCorrect !== null && (
          <div 
            className={`quiz-feedback-drawer ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`}
            role="region"
            aria-label="Answer feedback"
          >
            <div className="feedback-drawer-inner">
              <div className="feedback-info-area">
                <div className="feedback-header-row">
                  {isCorrect ? (
                    <FaCheckCircle className="feedback-icon correct-icon" aria-hidden="true" />
                  ) : (
                    <FaTimesCircle className="feedback-icon incorrect-icon" aria-hidden="true" />
                  )}
                  <div className="feedback-text-content">
                    <span className="feedback-title">
                      {isCorrect ? (isOverridden ? 'Correct! (Overridden)' : 'Correct!') : 'Not quite'}
                    </span>
                    {isCorrect && isOverridden && (
                      <div className="feedback-overridden-note">
                        Answer accepted as correct — score &amp; mastery updated!
                      </div>
                    )}
                    {!isCorrect && (
                      <div className="feedback-answer-line">
                        <span>The correct answer is: </span>
                        <strong
                          className="feedback-correct-word"
                          lang={currentQuestion.isRussianToEnglish ? 'en' : 'ru'}
                        >
                          {primaryCorrectAnswer}
                        </strong>
                      </div>
                    )}
                    {isCorrect && spellingDiff && spellingDiff.length > 0 && (
                      <div className="spelling-note">
                        Correct spelling:{' '}
                        <span lang="ru">
                          {spellingDiff.map((item, idx) => (
                            item.isDiff ? (
                              <span key={idx} className="diff-char">{item.char}</span>
                            ) : (
                              <React.Fragment key={idx}>{item.char}</React.Fragment>
                            )
                          ))}
                        </span>
                      </div>
                    )}
                    {isCorrect && isWordJustMastered && (
                      <div className="word-mastered-note">
                        <span aria-hidden="true">🏆</span> <strong>Word Mastered ({MASTERY_THRESHOLD}/{MASTERY_THRESHOLD})!</strong> Removed from upcoming questions.
                      </div>
                    )}
                  </div>
                </div>

                {/* Audio button in feedback sheet if available */}
                {currentQuestion.russian && (
                  <div className="feedback-audio-action">
                    <PronunciationButton 
                      text={currentQuestion.russian}
                      className="feedback-pronounce-btn"
                      audioCategory={getAudioCategory(currentQuestion.type)}
                    />
                  </div>
                )}
              </div>

              <div className="feedback-action-area">
                {!isCorrect && (
                  <button
                    type="button"
                    className="feedback-override-button"
                    onClick={handleOverrideAnswer}
                    title="Mark my answer as correct (alternative valid translation or phrasing)"
                  >
                    <span aria-hidden="true">💡</span> I was right
                  </button>
                )}
                {sessionAnswered < sessionGoal ? (
                  <button
                    ref={continueButtonRef}
                    type="button"
                    className={`feedback-continue-button ${isCorrect ? 'btn-next-correct' : 'btn-next-incorrect'}`}
                    onClick={handleNextQuestion}
                    autoFocus
                    aria-label={`Next Question (${sessionIndex + 1}/${sessionGoal})`}
                  >
                    <span className="btn-main-label">Next Question ({sessionIndex + 1}/${sessionGoal})</span>
                    <span className="btn-hint-badge" aria-hidden="true">
                      press <span className="btn-kbd">↵ Enter</span>
                    </span>
                  </button>
                ) : (
                  <button
                    ref={continueButtonRef}
                    type="button"
                    className="feedback-continue-button finish-quiz-button"
                    onClick={handleCompleteSession}
                    autoFocus
                    aria-label="Complete Quiz & View Results"
                  >
                    <span className="btn-main-label">
                      <FaCheckCircle className="btn-icon" aria-hidden="true" /> Complete Quiz & View Results <span aria-hidden="true">🎉</span>
                    </span>
                    <span className="btn-hint-badge" aria-hidden="true">
                      press <span className="btn-kbd">↵ Enter</span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;