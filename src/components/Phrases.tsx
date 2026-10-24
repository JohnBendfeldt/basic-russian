import React, { useState, useEffect } from 'react';
import { PhraseItem } from '../types/index';
import PronunciationButton from './PronunciationButton';
import { FaSyncAlt } from 'react-icons/fa';

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
    <div 
      className={`phrase-card ${isRevealed ? 'phrase-revealed' : 'phrase-hidden'}`} 
      key={`card-${animationKey}`}
    >
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
      <div className="phrase-content">
        {isRevealed ? (
          <div 
            className="phrase-revealed-wrap"
            role="button"
            tabIndex={0}
            aria-expanded={true}
            aria-label={`Hide translation for ${russian}`}
            onClick={onToggleReveal}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleReveal();
              }
            }}
          >
            <div className="phrase-revealed-body">
              <p className="english">{english}</p>
              <p className="pronunciation">
                <span className="pronunciation-label">Pronunciation:</span> {pronunciation}
              </p>
            </div>
            <div className="card-hide-cue">
              <FaSyncAlt className="cue-icon mini" aria-hidden="true" />
              <span>Tap to hide</span>
            </div>
          </div>
        ) : (
          <button 
            type="button"
            className="phrase-reveal-btn" 
            aria-expanded={false}
            aria-label={`Reveal translation for ${russian}`}
            onClick={onToggleReveal}
          >
            <FaSyncAlt className="cue-icon" aria-hidden="true" />
            <span>Tap to reveal</span>
          </button>
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

  const allRevealed = revealedCards.length > 0 && revealedCards.every(Boolean);

  const toggleAll = () => {
    const nextState = !allRevealed;
    setRevealedCards(new Array(data.length).fill(nextState));
  };

  return (
    <div className="section">
      <div className="phrases-header-section">
        <div className="phrases-header-text">
          <h2>{title}</h2>
          <p className="phrases-subtitle">
            Tap any card to reveal its translation and pronunciation
          </p>
        </div>
        <button
          type="button"
          className="study-toggle-btn"
          onClick={toggleAll}
          aria-label={allRevealed ? `Hide all ${title.toLowerCase()}` : `Reveal all ${title.toLowerCase()}`}
        >
          <FaSyncAlt className={`toggle-btn-icon ${allRevealed ? 'rotated' : ''}`} aria-hidden="true" />
          <span>{allRevealed ? 'Hide All' : 'Reveal All'}</span>
        </button>
      </div>

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