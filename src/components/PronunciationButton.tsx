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
  useLocalAudio?: boolean;
  isAlphabet?: boolean;
  audioCategory?: 'alphabet' | 'words' | 'phrases' | 'numbers' | 'examples' | 'basicPhrases' | 'commonWords';
}

const PronunciationButton: React.FC<PronunciationButtonProps> = ({ 
  text, 
  lang = 'ru-RU',
  label,
  className,
  style,
  useLocalAudio = true, 
  audioCategory
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVoicePrompt, setShowVoicePrompt] = useState(false);
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
        await initVoices();
        
        // If not mounted anymore, abort
        if (!isMounted.current) return;
        
        // Check if a Russian voice is available
        if (!isRussianVoiceAvailable() && !useLocalAudio) {
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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [useLocalAudio]);

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
    
    // Try to play local audio first when useLocalAudio is true
    if (useLocalAudio && text) {
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
          console.log(`Audio file not found: ${audioPath}, falling back to speech synthesis`);
          
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
    
    // Show installation instructions if no Russian voice is available
    if (showVoicePrompt) {
      const instructions = getRussianVoiceInstallInstructions();
      alert(`No Russian voice found. ${instructions}`);
      return;
    }
    
    // If not using local audio or no text provided, use speech synthesis directly
    setIsPlaying(true);
    playSpeechSynthesis();
  };
  
  // Separate function to use speech synthesis (to avoid duplication)
  // Renamed from "useSpeechSynthesis" to "playSpeechSynthesis" to avoid React hooks linting error
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