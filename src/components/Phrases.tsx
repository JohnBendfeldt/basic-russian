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
  cardIndex: number;
  isLastToggled: boolean;
  contentType?: 'phrases' | 'words' | 'numbers' | 'time';
}

const PhraseCard: React.FC<PhraseCardProps> = ({ 
  russian, 
  english, 
  pronunciation, 
  isRevealed, 
  onToggleReveal,
  cardIndex,
  isLastToggled,
  contentType = 'phrases'
}) => {
  const detailsId = `phrase-details-${contentType}-${cardIndex}`;

  return (
    <div 
      className={`phrase-card ${isRevealed ? 'phrase-revealed' : 'phrase-hidden'}${isLastToggled ? ' phrase-just-toggled' : ''}`}
    >
      <div className="phrase-header">
        <h3 className="russian" lang="ru">{russian}</h3>
        <PronunciationButton 
          text={russian} 
          label={`Pronounce ${contentType === 'words' ? 'word' : contentType === 'numbers' ? 'number' : contentType === 'time' ? 'time expression' : 'phrase'} ${russian}`}
          className="phrase-pronunciation"
          audioCategory={contentType}
          useLocalAudio={true}
        />
      </div>
      <div className="phrase-content">
        {isRevealed ? (
          <div 
            id={detailsId}
            className="phrase-revealed-wrap"
            onClick={onToggleReveal}
          >
            <div className="phrase-revealed-body">
              <p className="english" lang="en">{english}</p>
              <p className="pronunciation">
                <span className="pronunciation-label">Pronunciation:</span> {pronunciation}
              </p>
            </div>
          </div>
        ) : null}
        <button 
          type="button"
          className={isRevealed ? 'card-hide-cue phrase-toggle-btn' : 'phrase-reveal-btn'}
          aria-expanded={isRevealed}
          aria-controls={isRevealed ? detailsId : undefined}
          aria-label={isRevealed ? `Tap to hide translation for ${russian}` : `Tap to reveal translation for ${russian}`}
          onClick={onToggleReveal}
        >
          <FaSyncAlt className={isRevealed ? 'cue-icon mini' : 'cue-icon'} aria-hidden="true" />
          <span>{isRevealed ? 'Tap to hide' : 'Tap to reveal'}</span>
        </button>
      </div>
    </div>
  );
};

interface PhrasesProps {
  data: PhraseItem[];
  title: string;
  contentType?: 'phrases' | 'words' | 'numbers' | 'time';
}

const Phrases: React.FC<PhrasesProps> = ({ 
  data, 
  title,
  contentType = 'phrases'
}) => {
  const [revealedCards, setRevealedCards] = useState<boolean[]>(
    new Array(data.length).fill(false)
  );
  
  const [lastToggledCard, setLastToggledCard] = useState<number | null>(null);

  useEffect(() => {
    setRevealedCards(new Array(data.length).fill(false));
    setLastToggledCard(null);
  }, [data, title]);

  const toggleReveal = (index: number) => {
    setRevealedCards(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
    setLastToggledCard(index);
  };

  const allRevealed = revealedCards.length > 0 && revealedCards.every(Boolean);

  const toggleAll = () => {
    const nextState = !allRevealed;
    setRevealedCards(new Array(data.length).fill(nextState));
    setLastToggledCard(null);
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
          aria-pressed={allRevealed}
          aria-label={allRevealed ? `Hide all ${title.toLowerCase()}` : `Reveal all ${title.toLowerCase()}`}
        >
          <FaSyncAlt className={`toggle-btn-icon ${allRevealed ? 'rotated' : ''}`} aria-hidden="true" />
          <span>{allRevealed ? 'Hide All' : 'Reveal All'}</span>
        </button>
      </div>

      <div className="phrases-container">
        {data.map((item, index) => (
          <PhraseCard 
            key={`${contentType}-${index}-${item.russian}`}
            cardIndex={index}
            russian={item.russian}
            english={item.english}
            pronunciation={item.pronunciation}
            isRevealed={Boolean(revealedCards[index])}
            isLastToggled={lastToggledCard === index}
            onToggleReveal={() => toggleReveal(index)}
            contentType={contentType}
          />
        ))}
      </div>
    </div>
  );
};

export default Phrases;
