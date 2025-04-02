import React from 'react';
import { AlphabetItem } from '../types';
import PronunciationButton from './PronunciationButton';

interface AlphabetCardProps {
  letter: string;
  pronunciation: string;
  example: string;
}

const AlphabetCard: React.FC<AlphabetCardProps> = ({ letter, pronunciation, example }) => {
  // Get just the first character of the letter to avoid duplicates
  const singleLetter = letter.charAt(0);
  
  // Extract only the Russian word from the example
  // Assuming the format is "Russian word - English translation" or similar
  const russianWord = example.split(/[-–—(]/)[0].trim();
  
  return (
    <div className="alphabet-card">
      <div className="letter-header">
        <h2 className="letter">{letter}</h2>
        <PronunciationButton 
          text={singleLetter} 
          label={`Pronounce letter ${singleLetter}`}
          className="letter-pronunciation"
        />
      </div>
      <p className="pronunciation">Pronunciation: {pronunciation}</p>
      <p className="example">Example: {example} <PronunciationButton text={russianWord} label={`Pronounce example word ${russianWord}`} className="example-pronunciation" /></p>
    </div>
  );
}

interface AlphabetProps {
  data: AlphabetItem[];
}

const Alphabet: React.FC<AlphabetProps> = ({ data }) => {
  return (
    <div className="section">
      <h2>Russian Alphabet</h2>
      <div className="alphabet-container">
        {data.map((item, index) => (
          <AlphabetCard 
            key={index}
            letter={item.letter}
            pronunciation={item.pronunciation}
            example={item.example}
          />
        ))}
      </div>
    </div>
  );
}

export default Alphabet;