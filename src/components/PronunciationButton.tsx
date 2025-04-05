import React, { useState, useEffect } from 'react';
import { FaVolumeUp } from 'react-icons/fa';

interface PronunciationButtonProps {
  text: string;
  lang?: string;
  label?: string; // Add optional label prop
  className?: string; // Add optional className prop
}

const PronunciationButton: React.FC<PronunciationButtonProps> = ({ 
  text, 
  lang = 'ru-RU',
  label,
  className
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [_isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check if speech synthesis is supported
    if (!window.speechSynthesis) {
      setIsSupported(false);
    }
  }, []);

  const speak = () => {
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported');
      setIsSupported(false);
      return;
    }

    if (isPlaying) return;

    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    
    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      console.error('Speech synthesis error');
      setIsPlaying(false);
      setIsSupported(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Don't render if speech synthesis is not supported
  if (!_isSupported) {
    return null;
  }

  return (
    <button
      className={`pronunciation-button ${isPlaying ? 'playing' : ''} ${className || ''}`}
      onClick={speak}
      disabled={isPlaying}
      title={label || "Pronounce"}
      aria-label={label || "Pronounce"}
    >
      <FaVolumeUp aria-hidden="true" />
    </button>
  );
};

export default PronunciationButton;