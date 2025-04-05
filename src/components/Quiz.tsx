import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaVolumeUp, FaCheck, FaTimes, FaKeyboard } from 'react-icons/fa';
import RussianKeyboard from './RussianKeyboard';
import { transliterate, containsCyrillic } from '../utils/transliteration';

interface QuizProps {
  data: any;
}

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

  const getRandomQuestion = useCallback(() => {
    setUserAnswer('');
    setIsCorrect(null);
    setShowNext(false);

    try {
      const categories = ['alphabet', 'basicPhrases', 'numbers', 'commonWords'];
      let randomCategory = categories[Math.floor(Math.random() * categories.length)];
      let itemsList = data[randomCategory];

      if (!itemsList || !Array.isArray(itemsList) || itemsList.length === 0) {
        const availableCategories = categories.filter(cat => 
          data[cat] && Array.isArray(data[cat]) && data[cat].length > 0
        );
        if (availableCategories.length === 0) {
          console.error("No quiz data available");
          setCurrentQuestion({
            type: 'dummy',
            prompt: 'Loading...',
            answer: '',
            hint: 'Please wait while we load questions',
            russian: ''
          });
          return;
        }
        randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        itemsList = data[randomCategory];
      }

      if (!itemsList || itemsList.length === 0) {
        throw new Error("No items in the selected category");
      }

      const randomIndex = Math.floor(Math.random() * itemsList.length);
      const randomItem = itemsList[randomIndex];

      if (!randomItem) {
        throw new Error("Failed to get random item");
      }

      if (randomCategory === 'alphabet') {
        if (typeof randomItem !== 'object' || randomItem === null) {
          throw new Error("Invalid alphabet item structure");
        }
        const character = randomItem.character?.toString() || '';
        const pronunciation = randomItem.pronunciation?.toString() || '';
        if (!character || !pronunciation) {
          throw new Error("Missing required alphabet properties");
        }
        setCurrentQuestion({
          type: 'alphabet',
          prompt: character,
          answer: pronunciation.toLowerCase(),
          hint: `How is the letter "${character}" pronounced in Russian?`,
          russian: character
        });
      } else {
        const russian = randomItem.russian?.toString() || '';
        const english = randomItem.english?.toString() || '';
        if (!russian || !english) {
          throw new Error(`Invalid ${randomCategory} item: missing russian or english`);
        }
        const isRussianToEnglish = Math.random() > 0.5;
        if (isRussianToEnglish) {
          setCurrentQuestion({
            type: randomCategory,
            prompt: russian,
            answer: english.toLowerCase(),
            hint: 'What does this mean in English?',
            russian: russian
          });
        } else {
          setCurrentQuestion({
            type: randomCategory,
            prompt: english,
            answer: russian.toLowerCase(),
            hint: 'How do you say this in Russian?',
            russian: russian
          });
        }
      }
    } catch (error) {
      console.error("Error generating question:", error);
      try {
        if (data.basicPhrases && Array.isArray(data.basicPhrases) && data.basicPhrases.length > 0) {
          const fallbackItem = data.basicPhrases[0];
          setCurrentQuestion({
            type: 'fallback',
            prompt: fallbackItem.english,
            answer: fallbackItem.russian.toLowerCase(),
            hint: 'How do you say this in Russian?',
            russian: fallbackItem.russian
          });
          return;
        }
        setCurrentQuestion({
          type: 'hardcoded',
          prompt: 'Hello',
          answer: 'привет',
          hint: 'How do you say this in Russian?',
          russian: 'Привет'
        });
      } catch (fallbackError) {
        console.error("Error creating fallback question:", fallbackError);
        setCurrentQuestion({
          type: 'emergency',
          prompt: 'Hello',
          answer: 'привет',
          hint: 'How do you say this in Russian?',
          russian: 'Привет'
        });
      }
    }
  }, [data]);

  useEffect(() => {
    getRandomQuestion();
    correctSoundRef.current = new Audio('/sounds/correct.mp3');
    incorrectSoundRef.current = new Audio('/sounds/incorrect.mp3');
    return () => {
      if (correctSoundRef.current) {
        correctSoundRef.current.pause();
      }
      if (incorrectSoundRef.current) {
        incorrectSoundRef.current.pause();
      }
    };
  }, [getRandomQuestion]);

  const checkAnswer = () => {
    if (!userAnswer.trim()) return;
    const userAnswerNormalized = normalizeText(userAnswer);
    let isAnswerCorrect = false;
    if (currentQuestion.answer.includes('/')) {
      const possibleAnswers = currentQuestion.answer
        .split('/')
        .map((ans: string) => normalizeText(ans));
      isAnswerCorrect = possibleAnswers.includes(userAnswerNormalized);
      if (!isAnswerCorrect) {
        isAnswerCorrect = possibleAnswers.some((possibleAnswer: string) => 
          checkNumberEquivalence(userAnswerNormalized, possibleAnswer)
        );
      }
    } else {
      const correctAnswerNormalized = normalizeText(currentQuestion.answer);
      if (userAnswerNormalized === correctAnswerNormalized) {
        isAnswerCorrect = true;
      } else if (checkNumberEquivalence(userAnswerNormalized, correctAnswerNormalized)) {
        isAnswerCorrect = true;
      } else if (containsCyrillic(userAnswerNormalized) || containsCyrillic(correctAnswerNormalized)) {
        const maxErrors = Math.floor(correctAnswerNormalized.length / 5) + 1;
        const distance = levenshteinDistance(userAnswerNormalized, correctAnswerNormalized);
        isAnswerCorrect = distance <= maxErrors;
      }
      if (!isAnswerCorrect) {
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
      if (correctSoundRef.current) {
        correctSoundRef.current.currentTime = 0;
        correctSoundRef.current.play().catch(e => console.error("Error playing sound:", e));
      }
    } else {
      if (incorrectSoundRef.current) {
        incorrectSoundRef.current.currentTime = 0;
        incorrectSoundRef.current.play().catch(e => console.error("Error playing sound:", e));
      }
    }
  };

  const nextQuestion = () => {
    getRandomQuestion();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!showNext) {
        checkAnswer();
      } else {
        nextQuestion();
      }
    }
  };

  const speakRussian = () => {
    if (!currentQuestion) return;
    const utterance = new SpeechSynthesisUtterance(currentQuestion.russian);
    utterance.lang = 'ru-RU';
    window.speechSynthesis.speak(utterance);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const selectionStart = e.target.selectionStart || 0;
    
    // Skip transliteration for English answers
    if (!needsRussianKeyboard) {
      setUserAnswer(newValue);
      setLastInput(newValue);
      return;
    }
    
    // Check if we are dealing with quotes or apostrophes (handle immediately)
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
    
    // Store raw input for comparison
    setUserAnswer(newValue);
    
    // Check if we just completed a combination (like "ya", "zh", etc.)
    const lastCharIndex = selectionStart - 1;
    if (lastCharIndex >= 1 && lastCharIndex < newValue.length) {
      const prevChar = newValue.charAt(lastCharIndex - 1);
      const currChar = newValue.charAt(lastCharIndex);
      
      if (combinationStarters.includes(prevChar) && 
          combinationFollowers[prevChar as keyof typeof combinationFollowers]?.includes(currChar)) {
        // We just typed a valid combination - transliterate immediately
        console.log(`Found combination: ${prevChar}${currChar}`);
        const transliteratedValue = transliterate(newValue);
        setUserAnswer(transliteratedValue);
        setCursorPosition(selectionStart);
        setLastInput(newValue);
        return;
      }
    }
    
    // Also transliterate at specific triggers
    // Fix the TypeScript error by properly typing nativeEvent
    const hasInputType = 'inputType' in e.nativeEvent;
    const inputType = hasInputType ? (e.nativeEvent as any).inputType : undefined;
    
    if (newValue.endsWith(' ') || 
        /[.,!?;:]/.test(newValue.charAt(selectionStart - 1)) ||
        inputType === 'insertLineBreak' ||
        newValue.includes('\n')) {
      console.log('Transliterating at trigger point');
      const transliteratedValue = transliterate(newValue);
      setUserAnswer(transliteratedValue);
      setCursorPosition(selectionStart);
    } else {
      setCursorPosition(selectionStart);
    }
    
    setLastInput(newValue);
  };

  const handleCheckAnswer = () => {
    // Always transliterate before checking
    if (needsRussianKeyboard && userAnswer) {
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
      // When using the virtual keyboard, we should transliterate immediately
      const newInput = userAnswer + letter;
      // If it's a space, we should transliterate the whole input
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

  // Define the combination starters and followers
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
        Score: {score} / {questionsAnswered}
      </div>
      <div className="quiz-card">
        <h3>{currentQuestion.hint}</h3>
        <div className="quiz-prompt">
          {currentQuestion.prompt}
          {currentQuestion.type !== 'alphabet' && (
            <button 
              className="pronunciation-button" 
              onClick={speakRussian}
              style={{ marginLeft: '12px' }}
            >
              <FaVolumeUp aria-hidden="true" />
              <span className="visually-hidden">Pronounce</span>
            </button>
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
            autoFocus
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
        
        {/* Enhanced instructions for transliteration */}
        {needsRussianKeyboard && (
          <div className="transliteration-instructions">
            <div className="answer-tips">
              <strong>Typing in Russian:</strong> Type in English letters and press <span className="instruction-highlight">SPACE</span> or <span className="instruction-highlight">punctuation</span> to convert to Russian.
            </div>
            <div className="answer-tips examples">
              Type <span className="example-text">ya</span> + <span className="key-badge">space</span> → <span className="example-result">я</span>
              <span className="example-divider">|</span>
              Type <span className="example-text">zh</span> + <span className="key-badge">space</span> → <span className="example-result">ж</span>
            </div>
          </div>
        )}
        
        {!needsRussianKeyboard && (
          <div className="answer-tips">
            <small>Tip: Punctuation is ignored when checking answers.</small>
          </div>
        )}
        
        {/* Visual flash notification when transliteration happens */}
        {needsRussianKeyboard && (
          <div id="transliteration-notification" className={userAnswer.length > 0 ? "has-content" : ""}>
            Press SPACE to convert to Russian letters
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
                <span>Correct!</span>
              </div>
            ) : (
              <div className="incorrect-answer-container">
                <FaTimes className="result-icon incorrect-icon" />
                <span>
                  Not quite. The correct answer is: {" "}
                  {currentQuestion.answer.includes('/') 
                    ? currentQuestion.answer.split('/').join(' or ') 
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
            <button className="next-button" onClick={nextQuestion}>
              Next Question
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;