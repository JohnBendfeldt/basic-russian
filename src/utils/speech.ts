/**
 * Utility functions for text-to-speech
 */

// Check if speech synthesis is supported
export const isSpeechSupported = (): boolean => {
  return 'speechSynthesis' in window;
};

// Speak text using the browser's speech synthesis API
export const speak = (
  text: string, 
  lang = 'ru-RU', // Remove type annotation for inferrable types
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
  
  // Stop any current speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  
  if (onEnd) {
    utterance.onend = onEnd;
  }
  
  if (onError) {
    utterance.onerror = onError;
  }
  
  window.speechSynthesis.speak(utterance);
};

// Get available voices that support Russian
export const getRussianVoices = (): SpeechSynthesisVoice[] => {
  if (!isSpeechSupported()) return [];
  
  const voices = window.speechSynthesis.getVoices();
  // Filter for voices that support Russian
  return voices.filter(voice => 
    voice.lang.startsWith('ru') || 
    voice.lang === 'ru-RU' ||
    voice.lang === 'ru'
  );
};

// Create a named export object to avoid ESLint warning
const speechUtils = {
  isSpeechSupported,
  speak,
  getRussianVoices
};

export default speechUtils;