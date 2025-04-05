/**
 * Utility functions for text-to-speech with enhanced mobile support
 */

// Available voice preferences in order of preference
const VOICE_PREFERENCES = ['ru-RU', 'ru', 'en-US'];

// Cache for available voices
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

// Check if speech synthesis is supported
export const isSpeechSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
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

// Initialize voice list
export const initVoices = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!isSpeechSupported()) {
      resolve();
      return;
    }
    
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
};

// Speak text using the browser's speech synthesis API with mobile optimizations
export const speak = (
  text: string, 
  lang = 'ru-RU',
  onEnd?: () => void,
  onError?: (err: SpeechSynthesisErrorEvent) => void
): void => {
  if (!isSpeechSupported()) {
    console.error('Speech synthesis not supported in this browser');
    if (onError) {
      // Create a custom error event
      const errorEvent = new ErrorEvent('error', {
        message: 'Speech synthesis not supported',
        error: new Error('Speech synthesis not supported')
      });
      // Call the error handler with the error cast to the expected type
      onError(errorEvent as unknown as SpeechSynthesisErrorEvent);
    }
    return;
  }
  
  // Mobile Safari has issues with long text, so split it up if needed
  const textChunks = text.length > 100 ? splitTextIntoChunks(text) : [text];
  
  // Stop any current speech
  window.speechSynthesis.cancel();
  
  // Use our best available voice
  const bestVoice = getBestRussianVoice();
  
  // Speak each chunk in sequence
  speakTextChunks(textChunks, 0, lang, bestVoice, onEnd, onError);
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