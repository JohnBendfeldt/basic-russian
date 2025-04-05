import React, { useState, useEffect, useRef } from 'react';
import { FaVolumeUp, FaDownload } from 'react-icons/fa';
import { speak, initVoices, isRussianVoiceAvailable } from '../utils/speech';
import { getRussianVoiceInstallInstructions } from '../utils/browserSpeech';

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
  const [showVoicePrompt, setShowVoicePrompt] = useState(false);
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
        await initVoices();
        
        // If not mounted anymore, abort
        if (!isMounted.current) return;
        
        // Check if a Russian voice is available
        if (!isRussianVoiceAvailable()) {
          setShowVoicePrompt(true);
        }
        
        setInitialized(true);
      } catch (err) {
        console.error('Error initializing speech in button:', err);
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
    
    // Show installation instructions if no Russian voice is available
    if (showVoicePrompt) {
      const instructions = getRussianVoiceInstallInstructions();
      alert(`No Russian voice found. ${instructions}`);
      return;
    }

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
            alert(`Voice error: ${error.message}`);
          }
        }
      }
    );
  };

  return (
    <button
      className={`pronunciation-button ${isPlaying ? 'playing' : ''} ${showVoicePrompt ? 'needs-voice' : ''} ${className || ''}`}
      onClick={handleSpeak}
      disabled={isPlaying || !initialized}
      title={showVoicePrompt ? "Russian voice required" : (isPlaying ? "Speaking..." : (label || "Pronounce"))}
      aria-label={showVoicePrompt ? "Install Russian voice" : (isPlaying ? "Speaking..." : (label || "Pronounce"))}
      style={style}
      data-button-id={buttonId.current}
    >
      {showVoicePrompt ? (
        <FaDownload aria-hidden="true" />
      ) : isPlaying ? (
        <FaVolumeUp className="pulse-animation" aria-hidden="true" />
      ) : (
        <FaVolumeUp aria-hidden="true" />
      )}
    </button>
  );
};

export default PronunciationButton;