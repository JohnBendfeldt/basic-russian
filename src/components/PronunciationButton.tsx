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
  const [isSupported, setIsSupported] = useState(false); // Default to false until confirmed
  const [initialized, setInitialized] = useState(false);
  
  // Create a unique ID for each button instance
  const buttonId = useRef(`btn-${Math.random().toString(36).substring(2, 9)}`);
  
  // Track mounting state to avoid state updates after unmount
  const isMounted = useRef(true);

  // Initialize speech synthesis on component mount
  useEffect(() => {
    // Reset mount status on component mount
    isMounted.current = true;
    
    const init = async () => {
      try {
        // Check if ResponsiveVoice is supported
        const supported = isSpeechSupported();
        
        // If not mounted anymore, abort
        if (!isMounted.current) return;
        
        setIsSupported(supported);
        
        if (supported) {
          // Ensure voices are initialized
          await initVoices();
          
          // If not mounted anymore, abort
          if (!isMounted.current) return;
          
          setInitialized(true);
        }
      } catch (err) {
        console.error('Error initializing speech in button:', err);
      }
    };
    
    // Execute initialization
    init();
    
    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Update speech supported status whenever component is shown
  useEffect(() => {
    setIsSupported(isSpeechSupported());
  }, []);

  const handleSpeak = () => {
    if (!isSpeechSupported() || isPlaying) return;

    setIsPlaying(true);
    
    speak(
      text, 
      lang,
      buttonId.current,
      // onEnd callback
      () => {
        if (isMounted.current) {
          setIsPlaying(false);
        }
      },
      // onError callback
      (error: unknown) => {
        console.error(`Pronunciation error for ${buttonId.current}:`, error);
        if (isMounted.current) {
          setIsPlaying(false);
        }
        
        if (error instanceof Error) {
          alert(`Voice error: ${error.message}`);
        }
      }
    );
  };

  // Don't render if ResponsiveVoice is not supported
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