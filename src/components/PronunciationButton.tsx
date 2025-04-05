import React, { useState, useEffect } from 'react';
import { FaVolumeUp } from 'react-icons/fa';
import { speak, isSpeechSupported, initVoices } from '../utils/speech';

interface PronunciationButtonProps {
  text: string;
  lang?: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties; // Add the style prop to the interface
}

const PronunciationButton: React.FC<PronunciationButtonProps> = ({ 
  text, 
  lang = 'ru-RU',
  label,
  className,
  style // Add style to the parameter destructuring
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [initialized, setInitialized] = useState(false);

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
      // onEnd callback
      () => {
        setIsPlaying(false);
      },
      // onError callback
      (error) => {
        console.error('Pronunciation error:', error);
        setIsPlaying(false);
        
        // Show a notification to the user - could be improved with a toast
        alert('Voice not available. Try installing Russian in your device language settings.');
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
      style={style} // Pass the style to the button
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