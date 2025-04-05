/**
 * Utility functions for text-to-speech with enhanced mobile support
 */
import { speakWithResponsiveVoice, isResponsiveVoiceAvailable, loadResponsiveVoiceScript } from './responsiveVoiceTTS';

// Available voice preferences in order of preference
const VOICE_PREFERENCES = ['ru-RU', 'ru', 'en-US'];

// Cache for available voices
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

// Track currently speaking items - use a Map to track button ID to speaking state
// This allows multiple buttons to be speaking at the same time
const speakingButtons = new Map<string, boolean>();

// Speech queue for each button
const speechQueues = new Map<string, Array<{
  text: string;
  lang: string;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}>>();

// Check if speech synthesis is supported (browser or ResponsiveVoice)
export const isSpeechSupported = (): boolean => {
  return (typeof window !== 'undefined' && 'speechSynthesis' in window) || isResponsiveVoiceAvailable();
};

// Get the best available Russian voice
export const getBestRussianVoice = (): SpeechSynthesisVoice | null => {
  if (!isSpeechSupported()) return null;
  
  // If voices cache is empty, try to load them
  if (!voicesLoaded) {
    cachedVoices = window.speechSynthesis.getVoices();
    voicesLoaded = true;
  }
  
  // First try to find a Russian voice
  for (const langCode of VOICE_PREFERENCES) {
    const matchingVoice = cachedVoices.find(voice => 
      voice.lang.includes(langCode) && !voice.localService
    );
    if (matchingVoice) return matchingVoice;
  }
  
  // Fall back to any Russian voice
  for (const langCode of VOICE_PREFERENCES) {
    const matchingVoice = cachedVoices.find(voice => 
      voice.lang.includes(langCode)
    );
    if (matchingVoice) return matchingVoice;
  }
  
  // Last resort - use default voice
  return null;
};

// Initialize voice list and ResponsiveVoice
export const initVoices = async (): Promise<void> => {
  // Try to load ResponsiveVoice first
  try {
    await loadResponsiveVoiceScript();
  } catch (error) {
    console.warn('Failed to load ResponsiveVoice:', error);
  }

  // If browser TTS is supported, also initialize that
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return new Promise((resolve) => {
      // Check if voices are already available
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        cachedVoices = voices;
        voicesLoaded = true;
        resolve();
        return;
      }
      
      // Wait for voices to be loaded (needed for Chrome)
      const voicesChangedHandler = () => {
        cachedVoices = window.speechSynthesis.getVoices();
        voicesLoaded = true;
        resolve();
        window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
      };
      
      window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler);
      
      // Fallback - if voices don't load in 2 seconds, resolve anyway
      setTimeout(() => {
        if (!voicesLoaded) {
          cachedVoices = window.speechSynthesis.getVoices() || [];
          voicesLoaded = true;
          resolve();
        }
      }, 2000);
    });
  }

  return Promise.resolve();
};

// Process the queue for a specific button
const processSpeechQueue = async (buttonId: string): Promise<void> => {
  // If this button is already speaking or has no queued items, do nothing
  if (speakingButtons.get(buttonId) || !speechQueues.has(buttonId) || speechQueues.get(buttonId)?.length === 0) {
    return;
  }
  
  // Mark this button as speaking
  speakingButtons.set(buttonId, true);
  
  // Get the queue for this button
  const buttonQueue = speechQueues.get(buttonId) || [];
  const queueItem = buttonQueue.shift();
  
  // Update the queue
  speechQueues.set(buttonId, buttonQueue);
  
  if (!queueItem) {
    speakingButtons.set(buttonId, false);
    return;
  }
  
  const { text, lang, onEnd, onError } = queueItem;
  
  try {
    // Try ResponsiveVoice first if available
    if (isResponsiveVoiceAvailable()) {
      const voice = lang.includes('ru') ? 'Russian Female' : 'UK English Female';
      await speakWithResponsiveVoice(text, voice, {
        onend: () => {
          speakingButtons.set(buttonId, false);
          if (onEnd) onEnd();
          // Process next item in this button's queue
          processSpeechQueue(buttonId);
        },
        onerror: (error: unknown) => {
          speakingButtons.set(buttonId, false);
          if (onError) onError(error);
          // Process next item in this button's queue
          processSpeechQueue(buttonId);
        }
      });
      return;
    }

    // Fall back to browser TTS
    if (!window.speechSynthesis) {
      throw new Error('Speech synthesis not supported');
    }
    
    // Mobile Safari has issues with long text, so split it up if needed
    const textChunks = text.length > 100 ? splitTextIntoChunks(text) : [text];
    
    // Use our best available voice
    const bestVoice = getBestRussianVoice();
    
    // Speaking complete callback
    const handleSpeakingComplete = () => {
      speakingButtons.set(buttonId, false);
      if (onEnd) onEnd();
      // Process next item in this button's queue
      processSpeechQueue(buttonId);
    };
    
    // Speaking error callback
    const handleSpeakingError = (err: unknown) => {
      speakingButtons.set(buttonId, false);
      if (onError) onError(err);
      // Process next item in this button's queue
      processSpeechQueue(buttonId);
    };
    
    // Speak each chunk in sequence
    await speakTextChunksPromise(textChunks, lang, bestVoice, handleSpeakingComplete, handleSpeakingError);
  } catch (error) {
    console.error('Error during speech:', error);
    speakingButtons.set(buttonId, false);
    if (onError) onError(error);
    // Process next item in this button's queue
    processSpeechQueue(buttonId);
  }
};

// Promise-based version of speakTextChunks
const speakTextChunksPromise = (
  chunks: string[], 
  lang: string, 
  voice: SpeechSynthesisVoice | null,
  onComplete?: () => void,
  onError?: (err: unknown) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    speakTextChunks(
      chunks, 
      0, 
      lang, 
      voice, 
      () => {
        if (onComplete) onComplete();
        resolve();
      }, 
      (err) => {
        if (onError) onError(err);
        reject(err);
      }
    );
  });
};

// Speak text using the best available method
export const speak = (
  text: string, 
  lang = 'ru-RU',
  buttonId: string,
  onEnd?: () => void,
  onError?: (err: unknown) => void
): void => {
  // Initialize the queue for this button if it doesn't exist
  if (!speechQueues.has(buttonId)) {
    speechQueues.set(buttonId, []);
  }
  
  // Add the speech request to this button's queue
  const buttonQueue = speechQueues.get(buttonId) || [];
  buttonQueue.push({ text, lang, onEnd, onError });
  speechQueues.set(buttonId, buttonQueue);
  
  // Process this button's queue
  processSpeechQueue(buttonId);
};

// Helper to split text into manageable chunks for mobile devices
function splitTextIntoChunks(text: string): string[] {
  // Split by sentence boundaries or commas
  const chunks = text.match(/[^.!?,:;]+[.!?,:;]+|\s+/g) || [];
  
  // Combine very short chunks
  const result: string[] = [];
  let currentChunk = '';
  
  chunks.forEach(chunk => {
    if ((currentChunk + chunk).length < 100) {
      currentChunk += chunk;
    } else {
      if (currentChunk) result.push(currentChunk);
      currentChunk = chunk;
    }
  });
  
  if (currentChunk) result.push(currentChunk);
  return result.length > 0 ? result : [text];
}

// Recursively speak chunks of text
function speakTextChunks(
  chunks: string[], 
  index: number, 
  lang: string, 
  voice: SpeechSynthesisVoice | null,
  onEnd?: () => void,
  onError?: (err: SpeechSynthesisErrorEvent) => void
): void {
  if (index >= chunks.length) {
    if (onEnd) onEnd();
    return;
  }
  
  const utterance = new SpeechSynthesisUtterance(chunks[index]);
  utterance.lang = lang;
  
  if (voice) {
    utterance.voice = voice;
  }
  
  // On mobile, use higher pitch and slower rate for better quality
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    utterance.rate = 0.9;  // Slightly slower
    utterance.pitch = 1.1; // Slightly higher pitch
    utterance.volume = 1.0; // Full volume
  }
  
  utterance.onend = () => {
    // Speak the next chunk
    speakTextChunks(chunks, index + 1, lang, voice, onEnd, onError);
  };
  
  utterance.onerror = (err) => {
    console.error('Speech synthesis error:', err);
    if (onError) onError(err);
    
    // Try to continue with the next chunk
    speakTextChunks(chunks, index + 1, lang, voice, onEnd, onError);
  };
  
  window.speechSynthesis.speak(utterance);
}

// Get available voices that support Russian
export const getRussianVoices = (): SpeechSynthesisVoice[] => {
  if (!isSpeechSupported()) return [];
  
  if (!voicesLoaded) {
    cachedVoices = window.speechSynthesis.getVoices();
    voicesLoaded = true;
  }
  
  // Filter for voices that support Russian
  return cachedVoices.filter(voice => 
    voice.lang.startsWith('ru') || 
    voice.lang === 'ru-RU' ||
    voice.lang === 'ru'
  );
};

// Create a named export object to avoid ESLint warning
const speechUtils = {
  isSpeechSupported,
  speak,
  getRussianVoices,
  initVoices,
  getBestRussianVoice
};

export default speechUtils;