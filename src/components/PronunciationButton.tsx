import React, { useState, useEffect, useRef } from 'react';
import { FaVolumeUp } from 'react-icons/fa';
import { speak, initVoices } from '../utils/speech';

interface PronunciationButtonProps {
  text: string;
  lang?: string;
  label?: string;
  className?: string;
  useLocalAudio?: boolean;
  isAlphabet?: boolean;
  audioCategory?: 'alphabet' | 'words' | 'phrases' | 'numbers' | 'examples' | 'basicPhrases' | 'commonWords';
}

const PronunciationButton: React.FC<PronunciationButtonProps> = ({ 
  text, 
  lang = 'ru-RU',
  label,
  className,
  audioCategory
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioPathRef = useRef<string>('');
  const fallbackAttemptedRef = useRef<boolean>(false);
  
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
        // Initialize voices but don't worry about Russian voice availability
        await initVoices();
        
        // If not mounted anymore, abort
        if (!isMounted.current) return;
        
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
    
    // Enhanced cleanup function
    return () => {
      isMounted.current = false;
      
      // Properly cleanup audio resources
      if (audioRef.current) {
        try {
          // Remove all event listeners
          audioRef.current.onended = null;
          audioRef.current.onerror = null;
          audioRef.current.oncanplay = null;
          audioRef.current.onloadedmetadata = null;
          
          // Pause and reset the audio
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          
          // Clear the source
          audioRef.current.src = '';
          
          // Force the browser to release resources
          audioRef.current.load();
          audioRef.current = null;
        } catch (error) {
          console.warn('Error during audio cleanup:', error);
        }
      }
      
      // Clear audio path reference
      audioPathRef.current = '';
    };
  }, []);

  // Also cleanup audio when text or category changes (happens when React reuses
  // the same component instance across tabs)
  useEffect(() => {
    // Reset playing state immediately when text/category changes so the button
    // doesn't stay stuck in the "playing" / disabled state on the new page
    setIsPlaying(false);
    fallbackAttemptedRef.current = false;

    return () => {
      if (audioRef.current && audioRef.current.src) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch (error) {
          console.warn('Error pausing audio on text/category change:', error);
        }
      }
    };
  }, [text, audioCategory]);

  const getAudioPath = (): string => {
    if (!text) return '';
    
    const normalizedText = text.toLowerCase().trim();
    
    // Use provided audioCategory if available
    let category = audioCategory;
    if (!category) {
      // Simple heuristic to determine category
      if (normalizedText.length === 1) {
        category = 'alphabet';
      } else if (/\s/.test(normalizedText)) {
        category = 'phrases';
      } else if (/^\d+$/.test(normalizedText) || ['один', 'два', 'три'].includes(normalizedText)) {
        category = 'numbers';
      } else {
        category = 'words';
      }
    }
    
    // Convert any non-standard category names to our standard folders
    if (category === 'basicPhrases') category = 'phrases';
    if (category === 'commonWords') category = 'words';
    
    // Format filename - replace spaces with underscores
    const fileName = normalizedText.replace(/\s+/g, '_');
    
    return `/audio/${category}/${fileName}.mp3`;
  };

  const handleSpeak = () => {
    if (isPlaying) return;
    
    // Reset fallback attempt tracker for new playback
    fallbackAttemptedRef.current = false;
    
    // Always try to play local audio first (since we have files for everything now)
    if (text) {
      setIsPlaying(true);
      
      const audioPath = getAudioPath();
      
      // Create a new audio instance if we need one or if the path changed
      if (!audioRef.current || audioPathRef.current !== audioPath) {
        // Clean up previous audio if it exists
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
          audioRef.current.onended = null;
          audioRef.current.onerror = null;
        }
        
        audioRef.current = new Audio(audioPath);
        audioPathRef.current = audioPath;
        
        audioRef.current.onended = () => {
          if (isMounted.current) {
            setIsPlaying(false);
          }
        };
        
        audioRef.current.onerror = () => {
          // fall back to speech synthesis
          
          if (isMounted.current && !fallbackAttemptedRef.current) {
            fallbackAttemptedRef.current = true;
            // Fall back to speech synthesis
            playSpeechSynthesis();
          }
        };
      } else {
        // Reset audio position to the beginning if reusing
        audioRef.current.currentTime = 0;
      }
      
      // Play the audio
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        
        if (isMounted.current && !fallbackAttemptedRef.current) {
          fallbackAttemptedRef.current = true;
          // Fall back to speech synthesis
          playSpeechSynthesis();
        }
      });
      
      return;
    }
    
    // If no text provided, use speech synthesis directly
    setIsPlaying(true);
    playSpeechSynthesis();
  };
  
  // Speech synthesis fallback
  const playSpeechSynthesis = () => {
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
          if (error instanceof Error && !fallbackAttemptedRef.current) {
            console.warn(`Speech synthesis error: ${error.message}`);
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