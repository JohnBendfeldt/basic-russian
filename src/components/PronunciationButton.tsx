import React, { useState, useEffect, useRef } from 'react';
import { FaVolumeUp } from 'react-icons/fa';
import { speak, initVoices } from '../utils/speech';

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
  const [_isSupported, setIsSupported] = useState(false); // Prefix with underscore to indicate it's unused
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
        // Assume support is available on all devices - we'll handle fallbacks
        // and show a more user-friendly error if needed
        setIsSupported(true);
        
        // Ensure voices are initialized
        await initVoices();
        
        // If not mounted anymore, abort
        if (!isMounted.current) return;
        
        setInitialized(true);
      } catch (err) {
        console.error('Error initializing speech in button:', err);
        // Still allow the button to be shown, it will handle errors on click
        if (isMounted.current) {
          setInitialized(true);
        }
      }
    };
    
    // Execute initialization
    init();
    
    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSpeak = () => {
    if (isPlaying) return;

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
          
          // Show a user-friendly message for voice errors
          if (error instanceof Error) {
            // Check if we're on a mobile device
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isMobile) {
              alert('Voice error: Using English pronunciation as a fallback. For better Russian pronunciation, please use a desktop browser.');
            } else {
              alert(`Voice error: ${error.message}`);
            }
          }
        }
      }
    );
  };

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