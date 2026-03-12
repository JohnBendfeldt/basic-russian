import React, { useState, useEffect } from 'react';
import { PhraseItem } from '../types/index';
import PronunciationButton from './PronunciationButton';

interface PhraseCardProps {
  russian: string;
  english: string;
  pronunciation: string;
  isRevealed: boolean;
  onToggleReveal: () => void;
  animationKey: number; // Add a key to trigger animation only on the changed card
  contentType?: 'phrases' | 'words' | 'numbers'; // Add content type prop
}

const PhraseCard: React.FC<PhraseCardProps> = ({ 
  russian, 
  english, 
  pronunciation, 
  isRevealed, 
  onToggleReveal,
  animationKey,
  contentType = 'phrases' // Default to phrases
}) => {
  return (
    <div className={`phrase-card ${isRevealed ? 'phrase-revealed' : 'phrase-hidden'}`} 
         key={`card-${animationKey}`}>
      <div className="phrase-header">
        <h3 className="russian">{russian}</h3>
        <PronunciationButton 
          text={russian} 
          label={`Pronounce ${contentType === 'words' ? 'word' : contentType === 'numbers' ? 'number' : 'phrase'} ${russian}`}
          className="phrase-pronunciation"
          audioCategory={contentType} // Use explicit content type for audio category
          useLocalAudio={true}
        />
      </div>
      <div className="phrase-content" onClick={onToggleReveal}>
        {isRevealed ? (
          <>
            <p className="english">{english}</p>
            <p className="pronunciation">Pronunciation: {pronunciation}</p>
          </>
        ) : (
          <p className="hint">Click to reveal translation</p>
        )}
      </div>
    </div>
  );
};

interface PhrasesProps {
  data: PhraseItem[];
  title: string;
  contentType?: 'phrases' | 'words' | 'numbers'; // Add content type prop
}

const Phrases: React.FC<PhrasesProps> = ({ 
  data, 
  title,
  contentType = 'phrases' // Default to phrases
}) => {
  // State to track which cards are revealed, using an array of booleans
  const [revealedCards, setRevealedCards] = useState<boolean[]>(
    new Array(data.length).fill(false)
  );
  
  // Add state to track which card was last toggled (for animation purposes)
  const [lastToggledCard, setLastToggledCard] = useState<number | null>(null);

  // Reset revealed cards state when data or title changes
  useEffect(() => {
    setRevealedCards(new Array(data.length).fill(false));
    setLastToggledCard(null);
  }, [data, title]);

  // Function to toggle the revealed state of a specific card
  const toggleReveal = (index: number) => {
    const newRevealedCards = [...revealedCards];
    newRevealedCards[index] = !newRevealedCards[index];
    setRevealedCards(newRevealedCards);
    setLastToggledCard(index); // Update the last toggled card
  };

  return (
    <div className="section">
      <h2>{title}</h2>
      <div className="phrases-container">
        {data.map((item, index) => (
          <PhraseCard 
            key={index}
            russian={item.russian}
            english={item.english}
            pronunciation={item.pronunciation}
            isRevealed={revealedCards[index]}
            onToggleReveal={() => toggleReveal(index)}
            animationKey={lastToggledCard === index ? Date.now() : index}
            contentType={contentType} // Pass content type down to card
          />
        ))}
      </div>
    </div>
  );
};

export default Phrases;