import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaVolumeUp, FaCheck, FaTimes, FaKeyboard } from 'react-icons/fa';
import RussianKeyboard from './RussianKeyboard';
import { transliterate } from '../utils/transliteration';

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
  const [lastInput, setLastInput] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  // Helper function to normalize text for comparison
  const normalizeText = (text: string): string => {
    // Remove content in parentheses first
    const textWithoutParentheses = text.replace(/\([^)]*\)/g, "");
    
    // Remove punctuation and extra spaces, convert to lowercase
    // eslint-disable-next-line no-useless-escape
    return textWithoutParentheses.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Use useCallback to memoize the getRandomQuestion function
  const getRandomQuestion = useCallback(() => {
    // Reset state for new question
    setUserAnswer('');
    setIsCorrect(null);
    setShowNext(false);

    // Choose a random category
    const categories = ['alphabet', 'basicPhrases', 'numbers', 'commonWords'];
    let randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    let itemsList = data[randomCategory];
    
    // Safety check: if the category or items aren't loaded yet, try another one or show loading
    if (!itemsList || itemsList.length === 0) {
      // Try to find a category that has data
      const availableCategories = categories.filter(cat => data[cat] && data[cat].length > 0);
      
      if (availableCategories.length === 0) {
        console.error("No quiz data available");
        return; // Keep current question or let the component show loading
      }
      
      // Select from available categories
      randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
      itemsList = data[randomCategory];
    }
    
    // For alphabet, we'll quiz on letter sounds
    if (randomCategory === 'alphabet') {
      const randomLetter = itemsList[Math.floor(Math.random() * itemsList.length)];
      
      // Safety check for a valid letter object
      if (!randomLetter || !randomLetter.character) {
        console.error("Invalid letter data:", randomLetter);
        getRandomQuestion(); // Try again with another question
        return;
      }
      
      setCurrentQuestion({
        type: 'alphabet',
        prompt: randomLetter.character,
        answer: randomLetter.pronunciation.toLowerCase(),
        hint: `How is the letter "${randomLetter.character}" pronounced in Russian?`,
        russian: randomLetter.character
      });
    } else {
      // For other categories, we'll quiz on Russian phrases/words
      const randomItem = itemsList[Math.floor(Math.random() * itemsList.length)];
      
      // Safety check for a valid phrase/word object
      if (!randomItem || !randomItem.russian || !randomItem.english) {
        console.error("Invalid item data:", randomItem);
        getRandomQuestion(); // Try again with another question
        return;
      }
      
      const isRussianToEnglish = Math.random() > 0.5;
      
      if (isRussianToEnglish) {
        setCurrentQuestion({
          type: randomCategory,
          prompt: randomItem.russian,
          answer: randomItem.english.toLowerCase(),
          hint: 'What does this mean in English?',
          russian: randomItem.russian
        });
      } else {
        setCurrentQuestion({
          type: randomCategory,
          prompt: randomItem.english,
          answer: randomItem.russian.toLowerCase(),
          hint: 'How do you say this in Russian?',
          russian: randomItem.russian
        });
      }
    }
  }, [data]); // Include data as a dependency

  // Initialize or get a new question
  useEffect(() => {
    getRandomQuestion();
    
    // Create audio elements for sounds
    correctSoundRef.current = new Audio('/sounds/correct.mp3');
    incorrectSoundRef.current = new Audio('/sounds/incorrect.mp3');
    
    // Cleanup function
    return () => {
      if (correctSoundRef.current) {
        correctSoundRef.current.pause();
      }
      if (incorrectSoundRef.current) {
        incorrectSoundRef.current.pause();
      }
    };
  }, [getRandomQuestion]); // Add getRandomQuestion as a dependency

  const checkAnswer = () => {
    if (!userAnswer.trim()) return;
    
    // Normalize user answer to ignore parentheses, punctuation and case
    const userAnswerNormalized = normalizeText(userAnswer);
    let isAnswerCorrect = false;
    
    // Handle multiple correct answers (e.g., "please/thank you")
    if (currentQuestion.answer.includes('/')) {
      // Split the answer by "/" and check if any of them match
      const possibleAnswers = currentQuestion.answer
        .split('/')
        .map((ans: string) => normalizeText(ans));
      
      isAnswerCorrect = possibleAnswers.includes(userAnswerNormalized);
    } else {
      // Single answer check with normalization
      isAnswerCorrect = userAnswerNormalized === normalizeText(currentQuestion.answer);
    }
    
    setIsCorrect(isAnswerCorrect);
    setShowNext(true);
    setQuestionsAnswered(prev => prev + 1);
    
    if (isAnswerCorrect) {
      setScore(prev => prev + 1);
      // Play correct sound
      if (correctSoundRef.current) {
        correctSoundRef.current.currentTime = 0;
        correctSoundRef.current.play().catch(e => console.error("Error playing sound:", e));
      }
    } else {
      // Play incorrect sound
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

  const handleKeyboardLetterClick = (letter: string) => {
    if (showNext) return;
    
    if (letter === 'backspace') {
      setUserAnswer(prev => prev.slice(0, -1));
    } else if (letter === 'clear') {
      setUserAnswer('');
    } else {
      setUserAnswer(prev => prev + letter);
    }
    
    // Focus back on the input after clicking a key
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const toggleKeyboard = () => {
    setShowKeyboard(prev => !prev);
  };

  // Determine if the current question requires a Russian answer
  const needsRussianKeyboard = currentQuestion && 
    !currentQuestion.type.includes('alphabet') && 
    currentQuestion.hint.includes('How do you say this in Russian');

  // Handle input change with automatic transliteration
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Store cursor position
    const selectionStart = e.target.selectionStart || 0;
    
    // Skip transliteration completely for English answers
    if (!needsRussianKeyboard) {
      // For English answers, just update the state without any transliteration
      setUserAnswer(newValue);
      setLastInput(newValue);
      return;
    }
    
    // Only apply transliteration for Russian answers from here on
    
    // Determine what changed by comparing with the last input
    const isAddition = newValue.length > lastInput.length;
    
    if (isAddition) {
      // For additions, only transliterate the newly added text
      // First, find what was added and where
      const addedLength = newValue.length - lastInput.length;
      const additionStartIndex = selectionStart - addedLength;
      
      // Get the added text
      const addedText = newValue.substring(additionStartIndex, selectionStart);
      
      // Only transliterate if Latin characters were added
      if (/[a-zA-Z]/.test(addedText)) {
        // Prepare context for transliteration (a few characters before the addition)
        const contextStartIndex = Math.max(0, additionStartIndex - 3);
        const context = newValue.substring(contextStartIndex, selectionStart);
        
        // Transliterate the context
        const transliteratedContext = transliterate(context);
        
        // Calculate length difference caused by transliteration
        const lenDiff = transliteratedContext.length - context.length;
        
        // Construct the new value by combining parts
        const resultValue = 
          newValue.substring(0, contextStartIndex) +
          transliteratedContext +
          newValue.substring(selectionStart);
        
        // Calculate new cursor position - adjust for the transliteration changes
        const newCursorPosition = selectionStart + lenDiff;
        
        // Update state
        setUserAnswer(resultValue);
        setLastInput(resultValue);
        setCursorPosition(newCursorPosition);
        return;
      }
    }
    
    // For deletions or non-Latin additions, just update normally
    setUserAnswer(newValue);
    setLastInput(newValue);
    setCursorPosition(selectionStart);
  };

  // Set cursor position after update - with improved reliability
  useEffect(() => {
    // Only attempt to adjust cursor for Russian inputs
    // This prevents cursor jumping in English answers
    if (inputRef.current && needsRussianKeyboard) {
      // Use requestAnimationFrame to ensure the DOM has updated
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      });
    }
  }, [cursorPosition, userAnswer, needsRussianKeyboard]);

  // Add a check to ensure data is ready before rendering
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
            onChange={handleInputChange} // Use our new handler
            onKeyDown={handleKeyDown}
            placeholder={needsRussianKeyboard ? "Type in English, get Russian letters" : "Your answer here..."}
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
        
        {/* Add a hint about punctuation */}
        <div className="answer-tips">
          <small>Tip: Punctuation is ignored when checking answers.</small>
        </div>
        
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
            <button className="check-button" onClick={checkAnswer}>
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