import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaCheck, FaTimes, FaKeyboard } from 'react-icons/fa';
import RussianKeyboard from './RussianKeyboard';
import PronunciationButton from './PronunciationButton';
import { transliterate, containsCyrillic } from '../utils/transliteration';

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

// Update the existing interface to include data structure
interface QuizProps {
  data: {
    alphabet?: AlphabetItem[];
    basicPhrases?: PhraseItem[];
    numbers?: PhraseItem[];
    commonWords?: PhraseItem[];
    [key: string]: any;
  };
}

// Constants for special characters
const SOFT_SIGN_CHARS = ['Ь', 'ь'];
const HARD_SIGN_CHARS = ['Ъ', 'ъ'];

// Helper functions for soft and hard signs
const isSoftSign = (char: string): boolean => SOFT_SIGN_CHARS.includes(char);
const isHardSign = (char: string): boolean => HARD_SIGN_CHARS.includes(char);
const isSoftSignAnswer = (answer: string): boolean => 
  ['soft sign', 'soft'].includes(answer.toLowerCase().trim());
const isHardSignAnswer = (answer: string): boolean => 
  ['hard sign', 'hard'].includes(answer.toLowerCase().trim());

// Helper function to determine the audio category based on question type
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
      // Fall back to the question type, which might be "alphabet", "numbers", etc.
      return questionType as any;
  }
};

// Use a ref to track askedQuestions to prevent re-renders
const Quiz: React.FC<QuizProps> = ({ data }) => {
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [showNext, setShowNext] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const incorrectSoundRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [_lastInput, setLastInput] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [correctFormatted, setCorrectFormatted] = useState('');
  
  // Instead of using state for askedQuestions, use a ref to prevent re-renders
  const askedQuestionsRef = useRef<Set<string>>(new Set());
  // Only use this state for UI updates, not for logic that would trigger re-renders
  const [askedQuestionsCount, setAskedQuestionsCount] = useState(0);
  
  // Ref to always access the latest nextQuestion function inside event listeners
  const nextQuestionRef = useRef<() => void>(() => {});

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
    "100": ["hundred", "сто"]
  };

  const checkNumberEquivalence = (userAnswer: string, correctAnswer: string): boolean => {
    if (userAnswer === correctAnswer) return true;
    if (/^\d+$/.test(userAnswer)) {
      const possibleWordForms = numberEquivalents[userAnswer] || [];
      return possibleWordForms.some(wordForm => 
        correctAnswer === wordForm || correctAnswer.includes(wordForm)
      );
    } else {
      for (const [digit, wordForms] of Object.entries(numberEquivalents)) {
        if (wordForms.includes(userAnswer) && (correctAnswer === digit || correctAnswer.includes(digit))) {
          return true;
        }
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

  const highlightDifferences = (userInput: string, correctAnswer: string): string => {
    if (!containsCyrillic(correctAnswer)) return correctAnswer;
    
    let result = '';
    for (let i = 0; i < correctAnswer.length; i++) {
      if (i >= userInput.length || userInput[i] !== correctAnswer[i]) {
        result += `<span class="diff-char">${correctAnswer[i]}</span>`;
      } else {
        result += correctAnswer[i];
      }
    }
    
    return result;
  };

  const getRandomQuestion = useCallback(() => {
    
    setUserAnswer('');
    setIsCorrect(null);
    setShowNext(false);
    setCorrectFormatted('');

    // Don't continue if data isn't loaded yet
    if (!data) {
      return;
    }

    try {
      const categories = ['alphabet', 'basicPhrases', 'numbers', 'commonWords'];
      const availableCategories = categories.filter(cat => 
        data[cat] && Array.isArray(data[cat]) && data[cat].length > 0
      );
      
      if (availableCategories.length === 0) {
        console.error("No data available in any category");
        setCurrentQuestion({
          type: 'dummy',
          prompt: 'No questions available',
          answer: '',
          hint: 'Please load some content first',
          russian: ''
        });
        return;
      }
      
      const randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
      const itemsList = data[randomCategory];

      const questionPool: Array<{item: AlphabetItem | PhraseItem, isRussianToEnglish: boolean}> = [];
      
      if (randomCategory === 'alphabet') {
        (itemsList as AlphabetItem[]).forEach((item: AlphabetItem) => {
          const id = `alphabet-${item.character}`;
          if (!askedQuestionsRef.current.has(id)) {
            questionPool.push({ item, isRussianToEnglish: true });
          }
        });
      } else {
        (itemsList as PhraseItem[]).forEach((item: PhraseItem) => {
          const russianToEnglishId = `${randomCategory}-${item.russian}-to-en`;
          const englishToRussianId = `${randomCategory}-${item.english}-to-ru`;
          
          if (!askedQuestionsRef.current.has(russianToEnglishId)) {
            questionPool.push({ item, isRussianToEnglish: true });
          }
          
          if (!askedQuestionsRef.current.has(englishToRussianId)) {
            questionPool.push({ item, isRussianToEnglish: false });
          }
        });
      }
      
      if (questionPool.length === 0) {

        askedQuestionsRef.current = new Set();
        setAskedQuestionsCount(0);
        
        if (randomCategory === 'alphabet' && itemsList.length > 0) {
          const randomIndex = Math.floor(Math.random() * itemsList.length);
          const item = (itemsList as AlphabetItem[])[randomIndex];
          const questionId = `alphabet-${item.character}`;
          
          askedQuestionsRef.current.add(questionId);
          setAskedQuestionsCount(1);
          
          if (isSoftSign(item.character)) {
            setCurrentQuestion({
              type: 'alphabet',
              prompt: item.character,
              answer: 'soft sign/soft',
              hint: `What type of sign is "${item.character}"?`,
              russian: item.character,
              id: questionId
            });
          } else if (isHardSign(item.character)) {
            setCurrentQuestion({
              type: 'alphabet',
              prompt: item.character,
              answer: 'hard sign/hard',
              hint: `What type of sign is "${item.character}"?`,
              russian: item.character,
              id: questionId
            });
          } else {
            setCurrentQuestion({
              type: 'alphabet',
              prompt: item.character,
              answer: item.pronunciation.toLowerCase(),
              hint: `How is the letter "${item.character}" pronounced in Russian?`,
              russian: item.character,
              id: questionId
            });
          }
          return;
        } else if (itemsList.length > 0) {
          const randomIndex = Math.floor(Math.random() * itemsList.length);
          const item = (itemsList as PhraseItem[])[randomIndex];
          const isRussianToEnglish = Math.random() > 0.5;
          
          let questionId: string;
          if (isRussianToEnglish) {
            questionId = `${randomCategory}-${item.russian}-to-en`;
            setCurrentQuestion({
              type: randomCategory,
              prompt: item.russian,
              answer: item.english.toLowerCase(),
              hint: 'What does this mean in English?',
              russian: item.russian,
              id: questionId
            });
          } else {
            questionId = `${randomCategory}-${item.english}-to-ru`;
            setCurrentQuestion({
              type: randomCategory,
              prompt: item.english,
              answer: item.russian.toLowerCase(),
              hint: 'How do you say this in Russian?',
              russian: item.russian,
              id: questionId
            });
          }
          
          askedQuestionsRef.current.add(questionId);
          setAskedQuestionsCount(1);
          return;
        }
      }
      
      const randomIndex = Math.floor(Math.random() * questionPool.length);
      const { item: randomItem, isRussianToEnglish } = questionPool[randomIndex];

      if (randomCategory === 'alphabet') {
        const alphabetItem = randomItem as AlphabetItem;
        const character = alphabetItem.character?.toString() || '';
        const pronunciation = alphabetItem.pronunciation?.toString() || '';
        
        if (!character || !pronunciation) {
          throw new Error("Missing required alphabet properties");
        }
        
        const questionId = `alphabet-${character}`;
        
        askedQuestionsRef.current.add(questionId);
        setAskedQuestionsCount(askedQuestionsRef.current.size);
        
        if (isSoftSign(character)) {
          setCurrentQuestion({
            type: 'alphabet',
            prompt: character,
            answer: 'soft sign/soft',
            hint: `What type of sign is "${character}"?`,
            russian: character,
            id: questionId
          });
        } else if (isHardSign(character)) {
          setCurrentQuestion({
            type: 'alphabet',
            prompt: character,
            answer: 'hard sign/hard',
            hint: `What type of sign is "${character}"?`,
            russian: character,
            id: questionId
          });
        } else {
          setCurrentQuestion({
            type: 'alphabet',
            prompt: character,
            answer: pronunciation.toLowerCase(),
            hint: `How is the letter "${character}" pronounced in Russian?`,
            russian: character,
            id: questionId
          });
        }
      } else {
        const phraseItem = randomItem as PhraseItem;
        const russian = phraseItem.russian?.toString() || '';
        const english = phraseItem.english?.toString() || '';
        
        if (!russian || !english) {
          throw new Error(`Invalid ${randomCategory} item: missing russian or english`);
        }
        
        let questionId: string;
        
        if (isRussianToEnglish) {
          questionId = `${randomCategory}-${russian}-to-en`;
          setCurrentQuestion({
            type: randomCategory,
            prompt: russian,
            answer: english.toLowerCase(),
            hint: 'What does this mean in English?',
            russian: russian,
            id: questionId
          });
        } else {
          questionId = `${randomCategory}-${english}-to-ru`;
          setCurrentQuestion({
            type: randomCategory,
            prompt: english,
            answer: russian.toLowerCase(),
            hint: 'How do you say this in Russian?',
            russian: russian,
            id: questionId
          });
        }
        
        askedQuestionsRef.current.add(questionId);
        setAskedQuestionsCount(askedQuestionsRef.current.size);
      }

      // Focus the input field after a short delay to ensure the DOM has updated
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error("Error generating question:", error);
      setCurrentQuestion({
        type: 'emergency',
        prompt: 'Hello',
        answer: 'привет',
        hint: 'How do you say this in Russian?',
        russian: 'Привет'
      });
    }
  }, [data]);

  // Store the nextQuestion function in a ref to access it in event listeners
  const nextQuestion = useCallback(() => {
    getRandomQuestion();
  }, [getRandomQuestion]);
  
  // Update the ref whenever the function changes
  useEffect(() => {
    nextQuestionRef.current = nextQuestion;
  }, [nextQuestion]);
  
  // Global event listener for Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only allow the Enter key to move to next question when we're showing the next button
      // and the key event didn't originate from within an input field
      if (e.key === 'Enter' && showNext && !(e.target instanceof HTMLInputElement)) {
        nextQuestionRef.current();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNext]);

  // Also add useEffect to focus the input when a new question is shown
  useEffect(() => {
    // Focus the input when currentQuestion changes and we're not showing the next button
    if (currentQuestion && !showNext && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentQuestion, showNext]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {

      isInitialMount.current = false;
      getRandomQuestion();
      
      // Initialize sounds during first mount
      correctSoundRef.current = new Audio('audio/sounds/correct.mp3');
      incorrectSoundRef.current = new Audio('audio/sounds/incorrect.mp3');
    }
  }, [getRandomQuestion]);

  // Add a cleanup effect for audio when unmounting
  useEffect(() => {
    return () => {
      // This effect will run when the component unmounts
      if (correctSoundRef.current) {
        correctSoundRef.current.pause();
      }
      if (incorrectSoundRef.current) {
        incorrectSoundRef.current.pause();
      }
    };
  }, []);

  const checkAnswer = () => {
    if (!userAnswer.trim()) return;
    
    // Automatically transliterate if needed for Russian answers
    let processedAnswer = userAnswer;
    if (needsRussianKeyboard && !containsCyrillic(processedAnswer)) {
      processedAnswer = transliterate(processedAnswer);
      setUserAnswer(processedAnswer); // Update the input field to show the transliterated text
    }
    
    const userAnswerNormalized = normalizeText(processedAnswer);
    let isAnswerCorrect = false;
    
    // Check for special signs first
    if (isSoftSign(currentQuestion.prompt) && isSoftSignAnswer(userAnswerNormalized)) {
      isAnswerCorrect = true;
    } else if (isHardSign(currentQuestion.prompt) && isHardSignAnswer(userAnswerNormalized)) {
      isAnswerCorrect = true;
    } else if (currentQuestion.answer.includes('/')) {
      // Handle multiple possible answers (like soft sign/soft)
      const possibleAnswers = currentQuestion.answer
        .split('/')
        .map((ans: string) => normalizeText(ans));
      
      isAnswerCorrect = possibleAnswers.some((possibleAnswer: string) => 
        userAnswerNormalized === possibleAnswer || 
        checkNumberEquivalence(userAnswerNormalized, possibleAnswer)
      );
    } else {
      const correctAnswerNormalized = normalizeText(currentQuestion.answer);
      
      if (userAnswerNormalized === correctAnswerNormalized) {
        isAnswerCorrect = true;
      } else if (checkNumberEquivalence(userAnswerNormalized, correctAnswerNormalized)) {
        isAnswerCorrect = true;
      } else if (containsCyrillic(userAnswerNormalized) || containsCyrillic(correctAnswerNormalized)) {
        // Flexible checking for Cyrillic answers
        const maxErrors = Math.floor(correctAnswerNormalized.length / 5) + 1;
        const distance = levenshteinDistance(userAnswerNormalized, correctAnswerNormalized);
        isAnswerCorrect = distance <= maxErrors;
        
        // Show correct spelling if it's Cyrillic and generally correct
        if (containsCyrillic(correctAnswerNormalized) && distance <= maxErrors) {
          setCorrectFormatted(highlightDifferences(userAnswerNormalized, correctAnswerNormalized));
        } else {
          setCorrectFormatted('');
        }
      } else {
        // Check for informal/formal variations
        const answerWithFormal = `${correctAnswerNormalized} formal`;
        const answerWithInformal = `${correctAnswerNormalized} informal`;
        isAnswerCorrect = 
          userAnswerNormalized.includes(correctAnswerNormalized) || 
          normalizeText(answerWithFormal).includes(userAnswerNormalized) || 
          normalizeText(answerWithInformal).includes(userAnswerNormalized);
      }
    }
    
    setIsCorrect(isAnswerCorrect);
    setShowNext(true);
    setQuestionsAnswered(prev => prev + 1);
    
    if (isAnswerCorrect) {
      setScore(prev => prev + 1);
      // Play correct sound with improved error handling
      playSound(correctSoundRef.current, "correct");
    } else {
      // Play incorrect sound with improved error handling
      playSound(incorrectSoundRef.current, "incorrect");
    }
  };

  // Simplified sound playing function to be more reliable
  const playSound = (audio: HTMLAudioElement | null, type: string) => {
    if (!audio) return;
    
    try {
      // Ensure the audio is reset
      audio.pause();
      audio.currentTime = 0;
      
      // Play the sound
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
      if (!showNext) {
        // Prevent form submission
        e.preventDefault();
        // Check the answer
        checkAnswer();
      } else {
        // If we're already showing the next button, pressing Enter within the input
        // should also advance to the next question
        nextQuestion();
        e.preventDefault();
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
    // Automatically transliterate if this is a Russian question and the input contains Latin characters
    if (needsRussianKeyboard && userAnswer && !containsCyrillic(userAnswer)) {
      const transliteratedValue = transliterate(userAnswer);
      setUserAnswer(transliteratedValue);
    }
    
    checkAnswer();
  };

  const handleKeyboardLetterClick = (letter: string) => {
    if (showNext) return;
    
    if (letter === 'backspace') {
      setUserAnswer(prev => prev.slice(0, -1));
    } else if (letter === 'clear') {
      setUserAnswer('');
    } else {
      const newInput = userAnswer + letter;
      if (letter === ' ') {
        const transliteratedValue = transliterate(newInput);
        setUserAnswer(transliteratedValue);
      } else {
        setUserAnswer(newInput);
      }
    }
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
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

  const getProgressText = () => {
    const totalQuestions = 
      (data.alphabet?.length || 0) + 
      ((data.basicPhrases?.length || 0) * 2) + 
      ((data.numbers?.length || 0) * 2) + 
      ((data.commonWords?.length || 0) * 2);
    
    return `${askedQuestionsCount}/${totalQuestions} unique questions asked`;
  };

  if (!data || !currentQuestion) {
    return <div className="section quiz-section">
      <h2>Test Your Knowledge</h2>
      <div className="quiz-card">
        <h3>Loading quiz questions...</h3>
        <p>Please wait while we prepare your questions.</p>
      </div>
    </div>;
  }

  return (
    <div className="section quiz-section">
      <h2>Test Your Knowledge</h2>
      <div className="quiz-stats">
        <div>Score: {score} / {questionsAnswered}</div>
        <div className="quiz-progress-text">{getProgressText()}</div>
      </div>
      <div className="quiz-card">
        <h3>{currentQuestion.hint}</h3>
        <div className="quiz-prompt">
          {currentQuestion.prompt}
          {currentQuestion.type !== 'alphabet' && (
            <PronunciationButton 
              text={currentQuestion.russian}
              className="margin-left"
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
            placeholder={needsRussianKeyboard ? "Type in English, press SPACE to convert" : "Your answer here..."}
            disabled={showNext}
            autoFocus // Keep the autoFocus attribute
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
        
        {needsRussianKeyboard && (
          <div className="transliteration-instructions">
            <div className="answer-tips">
              Phonetic mapping: <span className="example-text">ya</span> → <span className="example-result">я</span>, <span className="example-text">zh</span> → <span className="example-result">ж</span>, <span className="example-text">sh</span> → <span className="example-result">ш</span>, <span className="example-text">ch</span> → <span className="example-result">ч</span>
            </div>
          </div>
        )}
        
        {!needsRussianKeyboard && (
          <div className="answer-tips">
            <small>Tip: Punctuation is ignored when checking answers.</small>
          </div>
        )}
        

        
        {needsRussianKeyboard && showKeyboard && !showNext && (
          <div className="virtual-keyboard-container">
            <RussianKeyboard onLetterClick={handleKeyboardLetterClick} />
          </div>
        )}
        
        {isCorrect !== null && (
          <div className={`quiz-result ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? (
              <div className="correct-answer-container">
                <FaCheck className="result-icon correct-icon" />
                <span>
                  Correct!
                  {correctFormatted && (
                    <div className="spelling-note">
                      Correct spelling: <span dangerouslySetInnerHTML={{ __html: correctFormatted }}></span>
                    </div>
                  )}
                </span>
              </div>
            ) : (
              <div className="incorrect-answer-container">
                <FaTimes className="result-icon incorrect-icon" />
                <span>
                  Not quite. The correct answer is: {" "}
                  {currentQuestion.answer.includes('/') 
                    ? currentQuestion.answer.split('/')[0] // Just show the first preferred answer
                    : currentQuestion.answer}
                </span>
              </div>
            )}
          </div>
        )}
        <div className="quiz-buttons">
          {!showNext ? (
            <button className="check-button" onClick={handleCheckAnswer}>
              Check Answer
            </button>
          ) : (
            <button className="next-button" onClick={nextQuestion} autoFocus>
              Next Question 
              <span className="button-hint">(or press Enter)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;