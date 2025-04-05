import React, { useState, useEffect, useRef } from 'react';
import { FaVolumeUp } from 'react-icons/fa';
import { speak, isSpeechSupported, initVoices } from '../utils/speech';

interface PronunciationButtonProps {
  text: string;
  lang?: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

const PronunciationButton: React.FC<PronunciationButtonProps> = ({ 
  text, 
  lang = 'ru-RU',
  label,
  className,
  style
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  // Create a unique ID for each button instance
  const buttonId = useRef(`btn-${Math.random().toString(36).substring(2, 9)}`);

  // Initialize speech synthesis on component mount
  useEffect(() => {
    const init = async () => {
      setIsSupported(isSpeechSupported());
      if (isSpeechSupported()) {
        await initVoices();
        setInitialized(true);
      }
    };
    
    init();
  }, []);

  const handleSpeak = () => {
    if (!isSpeechSupported() || isPlaying) return;

    setIsPlaying(true);
    
    speak(
      text, 
      lang,
      // Pass the buttonId to the speak function so it knows which button to enable
      buttonId.current,
      // onEnd callback
      () => {
        setIsPlaying(false);
      },
      // onError callback
      (error: unknown) => {
        console.error(`Pronunciation error for ${buttonId.current}:`, error);
        setIsPlaying(false);
        
        // Properly check error.message by first ensuring it's an Error object
        if (
          error instanceof Error && 
          error.message === 'Speech synthesis not supported'
        ) {
          alert('Voice not available. Try installing Russian in your device language settings.');
        }
      }
    );
  };

  // Don't render if speech synthesis is not supported
  if (!isSupported) {
    return null;
  }

  return (
    <button
      className={`pronunciation-button ${isPlaying ? 'playing' : ''} ${className || ''}`}
      onClick={handleSpeak}
      disabled={isPlaying || !initialized}
      title={isPlaying ? "Speaking..." : (label || "Pronounce")}
      aria-label={isPlaying ? "Speaking..." : (label || "Pronounce")}
      style={style}
      data-button-id={buttonId.current}
    >
      {isPlaying ? (
        <FaVolumeUp className="pulse-animation" aria-hidden="true" />
      ) : (
        <FaVolumeUp aria-hidden="true" />
      )}
    </button>
  );
};

export default PronunciationButton;