import React, { useState } from 'react';
import speechService from '../utils/speech';

interface PronunciationButtonProps {
  text: string;
  lang?: string;
  className?: string;
  label?: string;
}

const PronunciationButton: React.FC<PronunciationButtonProps> = ({ 
  text, 
  lang = 'ru-RU', 
  className = '', 
  label = 'Pronounce'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(speechService.isSpeechSynthesisSupported());

  const handleSpeak = async () => {
    if (isPlaying || !isSupported) return;
    
    setIsPlaying(true);
    try {
      await speechService.speak({ text, lang });
    } catch (error) {
      console.error('Error speaking text:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  if (!isSupported) {
    return null; // Don't render the button if speech synthesis is not supported
  }

  return (
    <button 
      onClick={handleSpeak}
      disabled={isPlaying}
      className={`pronunciation-button ${isPlaying ? 'playing' : ''} ${className}`}
      aria-label={label}
      title={label}
    >
      <span className="visually-hidden">{label}</span>
      {/* Sound icon - Playing state */}
      {isPlaying ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
          <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89l.706.706z"/>
          <path d="M8.707 11.182A4.5 4.5 0 0 0 10.025 8a4.5 4.5 0 0 0-1.318-3.182L8 5.525A3.5 3.5 0 0 1 9.025 8 3.5 3.5 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
        </svg>
      ) : (
        /* Sound icon - Normal state */
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
          <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89l.706.706z"/>
          <path d="M8.707 11.182A4.5 4.5 0 0 0 10.025 8a4.5 4.5 0 0 0-1.318-3.182L8 5.525A3.5 3.5 0 0 1 9.025 8 3.5 3.5 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
        </svg>
      )}
    </button>
  );
};

export default PronunciationButton;