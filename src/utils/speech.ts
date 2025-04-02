import { useState, useCallback } from 'react';

// Interface for the Text-to-Speech service
interface TTSOptions {
  text: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

/**
 * A set of Russian phrases that we'll use with their IPA pronunciation
 * for better speech synthesis
 */
const PRONUNCIATION_MAP: { [key: string]: string } = {
  'привет': 'privet',
  'спасибо': 'spasiba',
  'пожалуйста': 'pazhalsta',
  'да': 'da',
  'нет': 'nyet',
  'здравствуйте': 'zdrastvuyte',
  'до свидания': 'do svidaniya',
  // Add more common Russian words/phrases as needed
};

/**
 * Hook for text-to-speech functionality
 */
export const useSpeech = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(
    typeof window !== 'undefined' && 'speechSynthesis' in window
  );

  // Speak the provided text using browser's speech synthesis
  const speak = useCallback((options: TTSOptions) => {
    if (!isSupported) {
      console.error('Speech synthesis is not supported in this browser');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const { text, lang = 'ru-RU', rate = 0.9, pitch = 1, volume = 1 } = options;
    
    // For better pronunciation, check if we have a mapped version
    const textToSpeak = PRONUNCIATION_MAP[text.toLowerCase()] || text;
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Event handlers
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
    };

    // Speak
    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  // Get available voices
  const getVoices = useCallback(() => {
    if (!isSupported) return [];
    return window.speechSynthesis.getVoices();
  }, [isSupported]);

  return {
    speak,
    isPlaying,
    isSupported,
    getVoices
  };
};

/**
 * Fallback audio function using a free Text-to-Speech API
 * This is used when browser speech synthesis isn't available or for better quality
 */
export const getExternalTTSUrl = (text: string, lang: string = 'ru'): string => {
  // Using VoiceRSS as an example - in production you would need an API key
  // For demo purposes, this won't actually work without your API key
  const apiKey = 'YOUR_API_KEY'; // Replace with your actual API key
  
  // For a free alternative without API key (with limitations):
  // return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(text)}&tl=${lang}`;
  
  return `https://api.voicerss.org/?key=${apiKey}&hl=${lang}&src=${encodeURIComponent(text)}`;
};

/**
 * Component props for our reusable pronunciation button
 */
export interface PronunciationButtonProps {
  text: string;
  lang?: string;
  className?: string;
}

// Speech synthesis utility for Russian language pronunciation

// Type definition for speech options
interface SpeechOptions {
  text: string;
  lang?: string; // BCP 47 language tag
  rate?: number; // 0.1 to 10
  pitch?: number; // 0 to 2
  volume?: number; // 0 to 1
}

// Check if the browser supports speech synthesis
const isSpeechSynthesisSupported = (): boolean => {
  return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
};

// Check if Russian voices are available
const hasRussianVoice = (): boolean => {
  if (!isSpeechSynthesisSupported()) return false;
  
  const voices = window.speechSynthesis.getVoices();
  return voices.some(voice => 
    voice.lang.includes('ru') || 
    voice.name.toLowerCase().includes('russian')
  );
};

// Speak the provided text
const speak = ({
  text,
  lang = 'ru-RU',
  rate = 0.9,
  pitch = 1,
  volume = 1
}: SpeechOptions): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!isSpeechSynthesisSupported()) {
      console.warn('Speech synthesis is not supported in this browser');
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Get available voices
    let voices = window.speechSynthesis.getVoices();
    
    // If voices array is empty, wait for them to load (Firefox requires this)
    if (voices.length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        voices = window.speechSynthesis.getVoices();
        setVoice();
      }, { once: true });
    } else {
      setVoice();
    }

    function setVoice() {
      // Try to find a Russian voice
      const russianVoice = voices.find(voice => 
        voice.lang.includes('ru') || 
        voice.name.toLowerCase().includes('russian')
      );
      
      if (russianVoice) {
        utterance.voice = russianVoice;
      } else {
        console.warn('No Russian voice found, using default voice');
      }
    }

    utterance.onend = () => {
      resolve();
    };

    utterance.onerror = (event) => {
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    window.speechSynthesis.speak(utterance);
  });
};

// Pause ongoing speech
const pause = (): void => {
  if (isSpeechSynthesisSupported() && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }
};

// Resume paused speech
const resume = (): void => {
  if (isSpeechSynthesisSupported() && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
};

// Cancel ongoing speech
const cancel = (): void => {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
};

export default {
  speak,
  pause,
  resume,
  cancel,
  isSpeechSynthesisSupported,
  hasRussianVoice
};