import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaCheck, FaTimes, FaKeyboard, FaTrophy, FaRedo, FaCheckCircle, FaTimesCircle, FaStar, FaGraduationCap } from 'react-icons/fa';
import RussianKeyboard from './RussianKeyboard';
import PronunciationButton from './PronunciationButton';
import { transliterate, containsCyrillic } from '../utils/transliteration';
import { ProgressService } from '../services/progressService';

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

interface QuizProps {
  data: {
    alphabet?: AlphabetItem[];
    basicPhrases?: PhraseItem[];
    numbers?: PhraseItem[];
    commonWords?: PhraseItem[];
    [key: string]: any;
  };
}

interface QuestionDef {
  item: AlphabetItem | PhraseItem;
  isRussianToEnglish: boolean;
  id: string;
  category: string;
}

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

const getAudioCategory = (questionType: string): 'alphabet' | 'phrases' | 'numbers' | 'words' | 'examples' => {
  switch (questionType) {
    case 'alphabet':
      return 'alphabet';
    case 'basicPhrases':
      return 'phrases';
    case 'numbers':
      return 'numbers';
    case 'commonWords':
      return 'words';
    default:
      return questionType as any;
  }
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

  // Mastered words tracking (masteryLevel >= 5)
  const [masteredWordIds, setMasteredWordIds] = useState<Set<string>>(new Set());
  const masteredWordIdsRef = useRef<Set<string>>(new Set());
  const [isWordJustMastered, setIsWordJustMastered] = useState(false);

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
          if (prev && ids.has(prev.id) && sessionAnswered === 0) {
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isSessionComplete]);

  const normalizeText = (text: string): string => {
    let mainText = text;
    const outsideParentheses = text.replace(/\s*\([^)]*\)\s*/g, "");
    if (outsideParentheses.trim()) {
      mainText = outsideParentheses;
    }
    let normalized = mainText.toLowerCase()
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
    let s = text.toLowerCase().trim();

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
      [/\b(bye|bye bye|see you|farewell)\b/gi, 'goodbye'],
      [/\b(thanks|thank u|many thanks)\b/gi, 'thank you'],
      [/\b(welcome|no problem|not at all|my pleasure|dont mention it)\b/gi, 'you are welcome'],
      [/\b(sorry|pardon|pardon me|forgive me)\b/gi, 'excuse me'],
      [/\b(speak slower|talk slower|speak slowly|talk more slowly)\b/gi, 'speak more slowly'],
      [/\b(repeat please|say it again|say that again|can you repeat)\b/gi, 'please repeat'],
      [/\b(how are you doing|how are things|how is it going)\b/gi, 'how are you'],
      [/\b(how much is it|how much is this|whats the price|what is the price)\b/gi, 'how much does it cost'],
      [/\b(im hungry|i am hungry|i want food|i would like to eat)\b/gi, 'i want to eat'],
      [/\b(im thirsty|i am thirsty|i want water|i would like to drink)\b/gi, 'i want to drink'],
      [/\b(i do not understand|i do not get it|i dont get it)\b/gi, 'i dont understand'],
      [/\b(i am called|they call me)\b/gi, 'my name is'],
      [/\b(yeah|yep|yup)\b/gi, 'yes'],
      [/\b(nope|nah)\b/gi, 'no']
    ];

    synonymMap.forEach(([pattern, replacement]) => {
      s = s.replace(pattern, replacement);
    });

    return s.replace(/\s+/g, ' ').trim();
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
    "18": ["eighteen", "восемьнадцать"],
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
      const possibleWordForms = numberEquivalents[userDigits] || [];
      return possibleWordForms.some(wordForm => 
        cleanTarget === wordForm || cleanTarget.includes(wordForm)
      );
    } 

    // Check if target is digits
    const targetDigits = cleanTarget.replace(/\s+/g, '');
    if (/^\d+$/.test(targetDigits)) {
      const possibleWordForms = numberEquivalents[targetDigits] || [];
      return possibleWordForms.some(wordForm =>
        cleanUser === wordForm || cleanUser.includes(wordForm)
      );
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

  const levenshteinDistance = (a: string, b: string): number => {
    const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[a.length][b.length];
  };

  const getSpellingDifferences = (userInput: string, correctAnswer: string): Array<{ char: string; isDiff: boolean }> => {
    if (!containsCyrillic(correctAnswer)) return [];
    return correctAnswer.split('').map((char, i) => ({
      char,
      isDiff: i >= userInput.length || userInput[i] !== char
    }));
  };

  // Build the complete list of all 209 curriculum questions
  const getAllQuestions = useCallback((): QuestionDef[] => {
    if (!data) return [];
    const questions: QuestionDef[] = [];

    if (data.alphabet && Array.isArray(data.alphabet)) {
      data.alphabet.forEach(item => {
        questions.push({
          item,
          isRussianToEnglish: true,
          id: `alphabet-${item.character}`,
          category: 'alphabet'
        });
      });
    }

    const categories = ['basicPhrases', 'numbers', 'commonWords'];
    categories.forEach(cat => {
      if (data[cat] && Array.isArray(data[cat])) {
        data[cat].forEach((item: PhraseItem) => {
          questions.push({
            item,
            isRussianToEnglish: true,
            id: `${cat}-${item.russian}-to-en`,
            category: cat
          });
          questions.push({
            item,
            isRussianToEnglish: false,
            id: `${cat}-${item.english}-to-ru`,
            category: cat
          });
        });
      }
    });

    return questions;
  }, [data]);

  const totalCurriculumQuestions = (data?.alphabet?.length || 0) +
    ((data?.basicPhrases?.length || 0) * 2) +
    ((data?.numbers?.length || 0) * 2) +
    ((data?.commonWords?.length || 0) * 2);

  const getRandomQuestion = useCallback((overrideMastered?: Set<string>) => {
    setUserAnswer('');
    setIsCorrect(null);
    setShowNext(false);
    setSpellingDiff(null);
    setIsWordJustMastered(false);

    if (!data) return;

    try {
      const allQuestions = getAllQuestions();
      if (allQuestions.length === 0) {
        setCurrentQuestion({
          type: 'dummy',
          prompt: 'No questions available',
          answer: '',
          hint: 'Please load some content first',
          russian: ''
        });
        return;
      }

      const activeMastered = overrideMastered || masteredWordIdsRef.current || masteredWordIds;

      // Priority 1: Unmastered (masteryLevel < 5) AND not yet asked in current rotation
      let candidatePool = allQuestions.filter(q => 
        !activeMastered.has(q.id) && !askedQuestionsRef.current.has(q.id)
      );

      // Priority 2: If all unmastered were asked in this rotation, reset rotation and pick from unmastered
      if (candidatePool.length === 0) {
        askedQuestionsRef.current.clear();
        candidatePool = allQuestions.filter(q => !activeMastered.has(q.id));
      }

      // Priority 3: If ALL 209 questions are mastered, allow practicing mastered questions
      if (candidatePool.length === 0) {
        candidatePool = allQuestions.filter(q => !askedQuestionsRef.current.has(q.id));
        if (candidatePool.length === 0) {
          askedQuestionsRef.current.clear();
          candidatePool = allQuestions;
        }
      }

      const selected = candidatePool[Math.floor(Math.random() * candidatePool.length)];
      askedQuestionsRef.current.add(selected.id);

      if (selected.category === 'alphabet') {
        const item = selected.item as AlphabetItem;
        const character = item.character?.toString() || '';
        const pronunciation = item.pronunciation?.toString() || '';

        if (isSoftSign(character)) {
          setCurrentQuestion({
            type: 'alphabet',
            prompt: character,
            answer: 'soft sign/soft',
            hint: `What type of sign is "${character}"?`,
            russian: character,
            id: selected.id
          });
        } else if (isHardSign(character)) {
          setCurrentQuestion({
            type: 'alphabet',
            prompt: character,
            answer: 'hard sign/hard',
            hint: `What type of sign is "${character}"?`,
            russian: character,
            id: selected.id
          });
        } else {
          setCurrentQuestion({
            type: 'alphabet',
            prompt: character,
            answer: pronunciation.toLowerCase(),
            hint: `How is the letter "${character}" pronounced in Russian?`,
            russian: character,
            id: selected.id
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
            id: selected.id
          });
        } else {
          setCurrentQuestion({
            type: selected.category,
            prompt: english,
            answer: russian.toLowerCase(),
            hint: 'How do you say this in Russian?',
            russian: russian,
            id: selected.id
          });
        }
      }

      setTimeout(() => {
        if (inputRef.current) {
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
        id: 'emergency-hello'
      });
    }
  }, [data, getAllQuestions, masteredWordIds]);

  const handleNextQuestion = useCallback(() => {
    setSessionIndex(prev => prev + 1);
    getRandomQuestion();
  }, [getRandomQuestion]);

  const handleCompleteSession = useCallback(async () => {
    setIsSessionComplete(true);
    sessionStatsRef.current.isSaved = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      await ProgressService.recordQuizSession({
        category: 'mixed',
        score: sessionScore,
        totalQuestions: sessionGoal,
      });
    } catch (err) {
      console.warn('Could not record completed quiz session:', err);
    }
  }, [sessionScore, sessionGoal]);

  const startNewQuizSession = useCallback((newGoal?: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const goal = newGoal !== undefined ? newGoal : sessionGoal;
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
    setIsCorrect(null);
    setSpellingDiff(null);
    setIsWordJustMastered(false);
    sessionStatsRef.current = {
      score: 0,
      total: 0,
      category: 'mixed',
      isSaved: false
    };
    getRandomQuestion();
  }, [sessionGoal, getRandomQuestion]);

  const handleGoalChange = (newGoal: number) => {
    if (newGoal === sessionGoal) return;
    localStorage.setItem('russian_quiz_goal', newGoal.toString());
    setSessionGoal(newGoal);

    // If user already reached or exceeded the new goal, finish session right away
    if (sessionAnswered >= newGoal) {
      setIsSessionComplete(true);
      sessionStatsRef.current.isSaved = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      ProgressService.recordQuizSession({
        category: 'mixed',
        score: sessionScore,
        totalQuestions: sessionAnswered,
      }).catch(err => console.warn('Could not save quiz session on goal adjustment:', err));
    }
  };

  // Global event listener for Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (isSessionComplete) {
          e.preventDefault();
          startNewQuizSession();
        } else if (showNext && !(e.target instanceof HTMLInputElement)) {
          e.preventDefault();
          if (sessionAnswered >= sessionGoal) {
            handleCompleteSession();
          } else {
            handleNextQuestion();
          }
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
    if (currentQuestion && !showNext && !isSessionComplete && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [currentQuestion, showNext, isSessionComplete]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      getRandomQuestion();

      correctSoundRef.current = new Audio('/audio/sounds/correct.mp3');
      incorrectSoundRef.current = new Audio('/audio/sounds/incorrect.mp3');
    }
  }, [getRandomQuestion]);

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
    if (needsRussianKeyboard && !containsCyrillic(processedAnswer)) {
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
          if (stripArticles(userEnglishNorm) === stripArticles(targetEnglishNorm)) {
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
      category: currentQuestion?.type || 'mixed',
      isSaved: false
    };

    // Record word attempt in background and check if it reached mastery (level 5)
    if (currentQuestion) {
      ProgressService.recordWordAttempt({
        category: currentQuestion.type || 'alphabet',
        wordId: currentQuestion.id || `${currentQuestion.type}-${currentQuestion.prompt}`,
        prompt: currentQuestion.prompt || '',
        answer: currentQuestion.answer || '',
        isCorrect: isAnswerCorrect,
      }).then(updatedWord => {
        if (updatedWord && updatedWord.masteryLevel >= 5) {
          setIsWordJustMastered(true);
          masteredWordIdsRef.current.add(updatedWord.wordId);
          setMasteredWordIds(prev => {
            const next = new Set(prev);
            next.add(updatedWord.wordId);
            return next;
          });
        }
      }).catch(err => console.warn('Could not record word attempt:', err));
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
    const newValue = e.target.value;
    const selectionStart = e.target.selectionStart || 0;

    if (!needsRussianKeyboard) {
      setUserAnswer(newValue);
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

    setUserAnswer(newValue);

    const lastCharIndex = selectionStart - 1;
    if (lastCharIndex >= 1 && lastCharIndex < newValue.length) {
      const prevChar = newValue.charAt(lastCharIndex - 1);
      const currChar = newValue.charAt(lastCharIndex);

      if (combinationStarters.includes(prevChar) && 
          combinationFollowers[prevChar as keyof typeof combinationFollowers]?.includes(currChar)) {
        const transliteratedValue = transliterate(newValue);
        setUserAnswer(transliteratedValue);
        setCursorPosition(selectionStart);
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
      setUserAnswer(transliteratedValue);
      setCursorPosition(selectionStart);
    } else {
      setCursorPosition(selectionStart);
    }

    setLastInput(newValue);
  };

  const handleCheckAnswer = () => {
    if (needsRussianKeyboard && userAnswer && !containsCyrillic(userAnswer)) {
      const transliteratedValue = transliterate(userAnswer);
      setUserAnswer(transliteratedValue);
    }
    checkAnswer();
  };

  const handleKeyboardLetterClick = (letter: string, e?: React.MouseEvent) => {
    if (showNext) return;
    if (e) {
      e.preventDefault();
    }

    const input = inputRef.current;
    const start = input && typeof input.selectionStart === 'number' 
      ? input.selectionStart 
      : userAnswer.length;
    const end = input && typeof input.selectionEnd === 'number' 
      ? input.selectionEnd 
      : userAnswer.length;

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
      }
    }

    setUserAnswer(newValue);

    // Keep cursor right after inserted character, preventing jumping to start
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
        try {
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        } catch {
          // ignore in environments without selection range
        }
      }
    }, 0);
  };

  const toggleKeyboard = () => {
    setShowKeyboard(prev => !prev);
  };

  const needsRussianKeyboard = currentQuestion && 
    !currentQuestion.type.includes('alphabet') && 
    currentQuestion.hint.includes('How do you say this in Russian');

  const combinationStarters = ['y', 'Y', 'z', 'Z', 's', 'S', 'c', 'C', 't', 'T', 'k', 'K'];
  const combinationFollowers = {
    'y': ['a', 'A', 'u', 'U', 'o', 'O', 'e', 'E'],
    'Y': ['a', 'A', 'u', 'U', 'o', 'O', 'e', 'E'],
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
    if (inputRef.current && needsRussianKeyboard) {
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      });
    }
  }, [cursorPosition, userAnswer, needsRussianKeyboard]);

  // --- RENDER RECAP SCREEN WHEN SESSION IS COMPLETE ---
  if (isSessionComplete) {
    const percentage = sessionGoal > 0 ? Math.round((sessionScore / sessionGoal) * 100) : 0;
    const masteredCount = masteredWordIds.size;
    const remainingToMaster = Math.max(0, totalCurriculumQuestions - masteredCount);

    let headlineRussian = '';
    let headlinePronunciation = '';
    let headlineEnglish = '';
    let recapIcon = null;

    if (percentage === 100) {
      headlineRussian = 'Отлично!';
      headlinePronunciation = 'Otlichno!';
      headlineEnglish = 'Perfect score! You mastered every question in this session.';
      recapIcon = <FaTrophy className="recap-icon gold" />;
    } else if (percentage >= 80) {
      headlineRussian = 'Молодец!';
      headlinePronunciation = 'Molodets!';
      headlineEnglish = 'Outstanding job! Your Russian skills are getting stronger.';
      recapIcon = <FaTrophy className="recap-icon silver" />;
    } else if (percentage >= 60) {
      headlineRussian = 'Хорошо!';
      headlinePronunciation = 'Khorosho!';
      headlineEnglish = 'Solid progress! A little more practice and you will ace it.';
      recapIcon = <FaStar className="recap-icon bronze" />;
    } else {
      headlineRussian = 'Повторение — мать учения';
      headlinePronunciation = 'Povtorenie — mat ucheniya';
      headlineEnglish = 'Repetition is the mother of learning. Practice makes perfect!';
      recapIcon = <FaGraduationCap className="recap-icon practice" />;
    }

    return (
      <div className="section quiz-section quiz-recap-section">
        <h2 className="quiz-recap-title">Quiz Session Complete!</h2>

        <div className="quiz-card quiz-recap-card">
          <div className="recap-praise-hero">
            <div className="recap-badge-icon-wrap">
              {recapIcon}
            </div>
            <h3 className="recap-russian-title">{headlineRussian}</h3>
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
              <svg className="recap-progress-ring" width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
                <defs>
                  <linearGradient id="scoreRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={percentage === 100 ? '#f59e0b' : percentage >= 80 ? '#3b82f6' : '#4A5AF4'} />
                    <stop offset="100%" stopColor={percentage === 100 ? '#fbbf24' : percentage >= 80 ? '#6366f1' : '#0039A6'} />
                  </linearGradient>
                </defs>
                <circle
                  className="recap-ring-track"
                  cx="60"
                  cy="60"
                  r={48}
                  strokeWidth="8"
                />
                <circle
                  className="recap-ring-bar"
                  cx="60"
                  cy="60"
                  r={48}
                  strokeWidth="8"
                  strokeDasharray={301.59}
                  strokeDashoffset={301.59 - (percentage / 100) * 301.59}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="recap-ring-label">
                <span className="recap-score-percent">{percentage}%</span>
                <span className="recap-score-ratio">{sessionScore} / {sessionGoal} correct</span>
              </div>
            </div>

            <div className="recap-stats-grid" role="group" aria-label="Session summary stats">
              <div className="recap-stat-card">
                <span className="stat-label">🎯 Goal</span>
                <span className="stat-value">{sessionGoal} Qs</span>
              </div>
              <div className="recap-stat-card correct">
                <span className="stat-label">✅ Correct</span>
                <span className="stat-value">{sessionScore}</span>
              </div>
              <div className="recap-stat-card highlight">
                <span className="stat-label">🏆 Mastered</span>
                <span className="stat-value">{masteredCount} / {totalCurriculumQuestions}</span>
              </div>
              <div className="recap-stat-card pool-left">
                <span className="stat-label">📚 Remaining</span>
                <span className="stat-value">{remainingToMaster}</span>
              </div>
            </div>

            <p className="recap-save-notice">
              <FaCheckCircle className="notice-icon" /> Logged as 1 completed quiz in your learning progress
            </p>
          </div>

          <div className="recap-next-session">
            <div className="recap-goal-picker">
              <span className="goal-picker-label">Choose next quiz length:</span>
              <div className="goal-picker-buttons" role="group" aria-label="Next quiz length">
                {[5, 10, 20].map(count => (
                  <button
                    key={count}
                    type="button"
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
                className="next-button start-new-quiz-button" 
                onClick={() => startNewQuizSession(sessionGoal)}
                autoFocus
                title="Start next quiz session"
                aria-label={`Start Next Quiz (${sessionGoal} Qs)`}
              >
                <span className="btn-main-label">
                  <FaRedo className="btn-icon" /> Start Next Quiz ({sessionGoal} Qs)
                </span>
                <span className="btn-hint-badge">
                  press <span className="btn-kbd">↵ Enter</span>
                </span>
              </button>
            </div>
          </div>

          {missedInSession.length > 0 && (
            <div className="recap-missed-section">
              <div className="missed-header-row">
                <h4>Words to Review from This Session ({missedInSession.length})</h4>
              </div>
              <p className="missed-hint">Listen to the correct pronunciation to reinforce your memory:</p>
              <div className="missed-words-list">
                {missedInSession.map((item, idx) => (
                  <div key={idx} className="missed-word-item">
                    <div className="missed-word-details">
                      <div className="missed-word-prompt">{item.prompt}</div>
                      <div className="missed-word-answers">
                        <span className="correct-answer-text">Answer: <strong>{item.answer.split('/')[0]}</strong></span>
                        {item.userAnswer && (
                          <span className="user-answer-text">You typed: <span className="strikethrough">{item.userAnswer}</span></span>
                        )}
                      </div>
                    </div>
                    <PronunciationButton
                      text={item.russian || item.prompt}
                      audioCategory={getAudioCategory(item.category)}
                    />
                  </div>
                ))}
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
        <div className="quiz-card">
          <h3>Loading quiz questions...</h3>
          <p>Please wait while we prepare your questions.</p>
        </div>
      </div>
    );
  }

  // --- RENDER ACTIVE QUIZ SESSION ---
  const masteredCount = masteredWordIds.size;
  const remainingToMaster = Math.max(0, totalCurriculumQuestions - masteredCount);
  const progressPercent = sessionGoal > 0 ? Math.min(100, Math.round((sessionAnswered / sessionGoal) * 100)) : 0;
  const questionsLeft = Math.max(0, sessionGoal - sessionAnswered);

  return (
    <div className="section quiz-section">
      <h2 className="quiz-page-title">Test Your Knowledge</h2>

      {/* Modern Compact Quiz Header Panel / Game HUD */}
      <div className="quiz-header-panel">
        <div className="quiz-progress-bar-container" aria-label="Session progress bar">
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
          <span className="pool-icon">🏆</span>
          <span>Mastered: <strong>{masteredCount}</strong> / {totalCurriculumQuestions}</span>
          <span className="pool-remaining-tag">({remainingToMaster} remaining)</span>
        </div>
      </div>

      <div className="quiz-card">
        <h3 className="quiz-question-hint">{currentQuestion.hint}</h3>
        <div className="quiz-prompt">
          <span className="quiz-prompt-text">{currentQuestion.prompt}</span>
          {currentQuestion.type !== 'alphabet' && (
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
            type="text"
            className="quiz-input"
            value={userAnswer}
            onChange={handleInputChange} 
            onKeyDown={handleKeyDown}
            placeholder={needsRussianKeyboard ? "Type in English (press SPACE)..." : "Your answer here..."}
            disabled={showNext}
          />
          {needsRussianKeyboard && !showNext && (
            <button 
              className={`keyboard-toggle-button ${showKeyboard ? 'active' : ''}`}
              onClick={toggleKeyboard}
              title="Toggle Russian Keyboard"
            >
              <FaKeyboard />
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
                    onClick={() => handleKeyboardLetterClick(char)}
                    aria-label={`Insert ${char}`}
                  >
                    {char}
                  </button>
                ))}
                <button
                  type="button"
                  className={`quick-char-btn hint-toggle-btn ${showPhoneticGuide ? 'active' : ''}`}
                  onClick={() => setShowPhoneticGuide(prev => !prev)}
                  title="Phonetic typing guide"
                  aria-expanded={showPhoneticGuide}
                  aria-label="Phonetic typing guide"
                >
                  💡
                </button>
              </div>
            </div>

            {showPhoneticGuide && (
              <div className="phonetic-guide-popover" role="region" aria-label="Phonetic typing guide">
                <div className="popover-header">
                  <span className="popover-title">💡 Phonetic Typing Cheatsheet</span>
                  <button 
                    type="button" 
                    className="close-popover-btn" 
                    onClick={() => setShowPhoneticGuide(false)}
                    aria-label="Close guide"
                  >
                    ✕
                  </button>
                </div>
                <div className="phonetic-rules-grid">
                  <div><code>ya</code> → <strong>я</strong></div>
                  <div><code>yu</code> → <strong>ю</strong></div>
                  <div><code>yo</code> → <strong>ё</strong></div>
                  <div><code>zh</code> → <strong>ж</strong></div>
                  <div><code>sh</code> → <strong>ш</strong></div>
                  <div><code>ch</code> → <strong>ч</strong></div>
                  <div><code>'</code> → <strong>ь</strong></div>
                  <div><code>"</code> → <strong>ъ</strong></div>
                </div>
                <small className="phonetic-note">Type phonetically in English, then press SPACE to auto-convert!</small>
              </div>
            )}
          </div>
        )}

        {!needsRussianKeyboard && (
          <div className="answer-tips">
            <small>Tip: Punctuation is ignored when checking answers.</small>
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
                ✕ Close
              </button>
            </div>
            <RussianKeyboard onLetterClick={handleKeyboardLetterClick} />
          </div>
        )}

        <div className="quiz-buttons">
          {!showNext && (
            <button className="check-button" onClick={handleCheckAnswer} aria-label="Check Answer">
              <span className="btn-main-label">Check Answer</span>
              <span className="btn-hint-badge">
                press <span className="btn-kbd">↵ Enter</span>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Fluid Duolingo-style Bottom Feedback Sheet */}
      {showNext && isCorrect !== null && (
        <div 
          className={`quiz-feedback-drawer ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`}
          role="region"
          aria-live="polite"
        >
          <div className="feedback-drawer-inner">
            <div className="feedback-info-area">
              <div className="feedback-header-row">
                {isCorrect ? (
                  <FaCheckCircle className="feedback-icon correct-icon" />
                ) : (
                  <FaTimesCircle className="feedback-icon incorrect-icon" />
                )}
                <div className="feedback-text-content">
                  <span className="feedback-title">
                    {isCorrect ? 'Correct!' : 'Not quite'}
                  </span>
                  {!isCorrect && (
                    <div className="feedback-answer-line">
                      <span>The correct answer is: </span>
                      <strong className="feedback-correct-word">
                        {currentQuestion.answer.includes('/') 
                          ? currentQuestion.answer.split('/')[0]
                          : currentQuestion.answer}
                      </strong>
                    </div>
                  )}
                  {isCorrect && spellingDiff && spellingDiff.length > 0 && (
                    <div className="spelling-note">
                      Correct spelling:{' '}
                      <span>
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
                      🏆 <strong>Word Mastered (5/5)!</strong> Removed from upcoming questions.
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
              {sessionAnswered < sessionGoal ? (
                <button 
                  className={`feedback-continue-button ${isCorrect ? 'btn-next-correct' : 'btn-next-incorrect'}`} 
                  onClick={handleNextQuestion} 
                  autoFocus
                  aria-label={`Next Question (${sessionIndex + 1}/${sessionGoal})`}
                >
                  <span className="btn-main-label">Next Question ({sessionIndex + 1}/{sessionGoal})</span>
                  <span className="btn-hint-badge">
                    press <span className="btn-kbd">↵ Enter</span>
                  </span>
                </button>
              ) : (
                <button 
                  className="feedback-continue-button finish-quiz-button" 
                  onClick={handleCompleteSession} 
                  autoFocus
                  aria-label="Complete Quiz & View Results"
                >
                  <span className="btn-main-label">
                    <FaCheckCircle className="btn-icon" /> Complete Quiz & View Results 🎉
                  </span>
                  <span className="btn-hint-badge">
                    press <span className="btn-kbd">↵ Enter</span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;