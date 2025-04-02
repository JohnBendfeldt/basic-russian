import React, { useState, useEffect, useCallback } from 'react';
import { RussianData, QuizQuestion, PhraseItem } from '../types';
import PronunciationButton from './PronunciationButton';

interface QuizProps {
  data: RussianData;
}

interface NumberMappings {
  [key: string]: string;
}

interface WordAlternatives {
  [key: string]: string[];
}

const Quiz: React.FC<QuizProps> = ({ data }) => {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [questionsAsked, setQuestionsAsked] = useState<number>(0);
  
  // Number mappings for accepting spelled out versions
  const numberMappings: NumberMappings = {
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'six',
    '7': 'seven',
    '8': 'eight',
    '9': 'nine',
    '10': 'ten'
  };

  // Word alternatives for accepting multiple correct answers
  const wordAlternatives: WordAlternatives = {
    'bad': ['badly'],
    'badly': ['bad'],
    'good': ['well'],
    'well': ['good']
  };

  // Use useCallback to memoize the generateQuestion function
  // Move allData inside useCallback to avoid recreating it on every render
  const generateQuestion = useCallback((): void => {
    // Combine all data types for quiz questions inside the callback
    const allData: (PhraseItem & { type: string })[] = [
      ...data.basicPhrases.map(item => ({...item, type: 'phrase'})),
      ...data.numbers.map(item => ({...item, type: 'number'})),
      ...data.commonWords.map(item => ({...item, type: 'word'}))
    ];
    
    const randomIndex = Math.floor(Math.random() * allData.length);
    const question = allData[randomIndex];
    // 50% chance to ask for English->Russian translation or Russian->English
    const isEnglishToRussian = Math.random() > 0.5;
    
    setCurrentQuestion({
      ...question,
      isEnglishToRussian,
      prompt: isEnglishToRussian ? question.english : question.russian,
      answer: isEnglishToRussian ? question.russian : question.english,
      type: question.type as "number" | "phrase" | "word"
    });
    setUserAnswer('');
    setResult('');
  }, [data]); // Only depend on data, which won't change between renders

  const checkAnswer = (): void => {
    if (!currentQuestion) return;

    // Normalize answers by removing punctuation, making lowercase, and trimming whitespace
    const normalizeText = (text: string): string => {
      return text.toLowerCase()
                .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") // Remove basic punctuation
                .replace(/\.{3,}/g, "") // Remove ellipsis (...)
                .replace(/\s+/g, " ") // Normalize spaces
                .trim();
    };
    
    // Special processing for answer text to remove parenthetical explanations
    const processAnswer = (text: string): string => {
      // Remove text in parentheses like "You (formal)" or "You (formal/plural)" -> "You"
      return text.replace(/\s*\([^)]*\)/g, "").trim();
    };
    
    const normalizedUserAnswer = normalizeText(userAnswer);
    let correctAnswer = currentQuestion.answer;
    let isCorrect = false;
    
    // For non-Russian answers (English answers), be more lenient
    if (!currentQuestion.isEnglishToRussian) {
      let possibleAnswers: string[] = [];
      
      // Add the base processed answer (removing parentheses)
      const baseProcessedAnswer = processAnswer(correctAnswer);
      possibleAnswers.push(normalizeText(baseProcessedAnswer));
      
      // If there are slashes, create additional possible answers
      if (correctAnswer.includes('/')) {
        // Split by slash and normalize each option
        correctAnswer.split('/').forEach(option => {
          possibleAnswers.push(normalizeText(processAnswer(option)));
        });
      }
      
      // Check if user's answer matches any of the possible answers
      isCorrect = possibleAnswers.includes(normalizedUserAnswer);
      
      // Additional checks for number questions and word alternatives
      if (!isCorrect && currentQuestion.type === 'number') {
        // For number questions, check both numeric and spelled out versions
        for (const possibleAnswer of possibleAnswers) {
          // Check number mappings (e.g., "1" ↔ "one")
          if ((numberMappings[possibleAnswer] && normalizedUserAnswer === numberMappings[possibleAnswer]) ||
              (Object.keys(numberMappings).find(key => 
                numberMappings[key] === possibleAnswer && key === normalizedUserAnswer))) {
            isCorrect = true;
            break;
          }
        }
      }
      
      // Check word alternatives (like bad/badly)
      if (!isCorrect) {
        for (const possibleAnswer of possibleAnswers) {
          if (wordAlternatives[possibleAnswer] && 
              wordAlternatives[possibleAnswer].includes(normalizedUserAnswer)) {
            isCorrect = true;
            break;
          }
        }
        
        if (!isCorrect && wordAlternatives[normalizedUserAnswer]) {
          for (const possibleAnswer of possibleAnswers) {
            if (wordAlternatives[normalizedUserAnswer].includes(possibleAnswer)) {
              isCorrect = true;
              break;
            }
          }
        }
      }
    } else {
      // For Russian answers, be more strict but still handle slashes
      if (correctAnswer.includes('/')) {
        // Split by slash and check if user answer matches any option
        const options = correctAnswer.split('/').map(option => normalizeText(option));
        isCorrect = options.includes(normalizedUserAnswer);
      } else {
        // Simple direct comparison for Russian answers
        isCorrect = normalizedUserAnswer === normalizeText(correctAnswer);
      }
    }
    
    setResult(isCorrect ? 'Correct!' : `Incorrect. The answer is: ${currentQuestion.answer}`);
    if (isCorrect) {
      setScore(score + 1);
    }
    setQuestionsAsked(questionsAsked + 1);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  };

  useEffect(() => {
    generateQuestion();
  }, [generateQuestion]); // Now including the memoized function as a dependency

  return (
    <div className="section quiz-section">
      <h2>Test Your Knowledge</h2>
      <div className="quiz-stats">
        <p>Score: {score}/{questionsAsked}</p>
      </div>
      
      {currentQuestion && (
        <div className="quiz-card">
          <h3>
            {currentQuestion.isEnglishToRussian 
              ? 'Translate to Russian:' 
              : 'Translate to English:'}
          </h3>
          <div className="quiz-prompt-container">
            <p className="quiz-prompt">{currentQuestion.prompt}</p>
            {!currentQuestion.isEnglishToRussian && (
              <PronunciationButton text={currentQuestion.prompt} />
            )}
          </div>
          
          <input 
            type="text" 
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type your answer"
            className="quiz-input"
            onKeyPress={handleKeyPress}
          />
          
          <div className="quiz-buttons">
            <button onClick={checkAnswer} className="check-button">
              Check Answer
            </button>
            <button onClick={generateQuestion} className="next-button">
              Next Question
            </button>
          </div>
          
          {result && (
            <div className="quiz-result">
              <p>{result}</p>
              {result.startsWith('Incorrect') && currentQuestion.isEnglishToRussian && (
                <div className="correct-answer-container">
                  <span className="correct-answer">{currentQuestion.answer}</span>
                  <PronunciationButton text={currentQuestion.answer} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Quiz;