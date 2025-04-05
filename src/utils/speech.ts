/**
 * Utility functions for text-to-speech with enhanced mobile support
 */
import { speakWithResponsiveVoice, isResponsiveVoiceAvailable, loadResponsiveVoiceScript } from './responsiveVoiceTTS';

// Unused variables are prefixed with underscore to satisfy ESLint
const _VOICE_PREFERENCES = ['ru-RU', 'ru', 'en-US'];

// Cache for available voices (kept for backward compatibility)
const _cachedVoices: SpeechSynthesisVoice[] = [];
const _voicesLoaded = false;

// Track currently speaking items by button ID
const speakingButtons = new Map<string, boolean>();

// Speech queue for each button
const speechQueues = new Map<string, Array<{
  text: string;
  lang: string;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}>>();

// Track if initialization has happened
let isInitialized = false;

// Set to true to completely disable browser speech synthesis
const ONLY_USE_RESPONSIVE_VOICE = true;

// Check if speech is supported - prioritize ResponsiveVoice
export const isSpeechSupported = (): boolean => {
  // First check if ResponseVoice is available or initialized
  if (isInitialized || isResponsiveVoiceAvailable()) {
    return true;
  }
  
  // Only fall back to browser TTS if we're allowing it
  if (!ONLY_USE_RESPONSIVE_VOICE) {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }
  
  return false;
};

// Initialize voice list - prioritize ResponsiveVoice
export const initVoices = async (): Promise<void> => {
  try {
    // If already initialized, return immediately
    if (isInitialized) {
      return Promise.resolve();
    }
    
    // Try to load and initialize ResponsiveVoice
    await loadResponsiveVoiceScript();
    isInitialized = true;
    console.log('ResponsiveVoice successfully initialized');
    return Promise.resolve();
  } catch (error) {
    console.warn('Failed to load ResponsiveVoice:', error);
    
    // Only attempt to initialize browser TTS if we're allowing it
    if (!ONLY_USE_RESPONSIVE_VOICE && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return Promise.resolve();
    }
    
    return Promise.resolve();
  }
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
  
  const { text, onEnd, onError } = queueItem;
  
  try {
    // First try ResponsiveVoice
    if (isResponsiveVoiceAvailable()) {
      try {
        // Always use female voice for consistency
        const voice = 'Russian Female';
        await speakWithResponsiveVoice(text, voice, {
          onend: () => {
            speakingButtons.set(buttonId, false);
            if (onEnd) onEnd();
            // Process next item in this button's queue
            processSpeechQueue(buttonId);
          },
          onerror: (error: unknown) => {
            console.warn('ResponsiveVoice error, may try browser TTS:', error);
            
            // If only using ResponsiveVoice, report the error and move on
            if (ONLY_USE_RESPONSIVE_VOICE) {
              speakingButtons.set(buttonId, false);
              if (onError) onError(error);
              processSpeechQueue(buttonId);
              return;
            }
            
            // Otherwise, fall back to browser TTS (continues to the code below)
            throw error;
          }
        });
        
        // If we successfully executed ResponsiveVoice, return early
        return;
      } catch (rvError) {
        // If we're only using ResponsiveVoice, don't try browser TTS
        if (ONLY_USE_RESPONSIVE_VOICE) {
          throw rvError;
        }
        
        console.warn('Falling back to browser TTS due to ResponsiveVoice error');
        // Otherwise fall through to browser TTS
      }
    }

    // Only reach here if ResponsiveVoice failed and we're allowing browser TTS
    if (!ONLY_USE_RESPONSIVE_VOICE && window.speechSynthesis) {
      throw new Error('Text-to-speech not available');
    }
  } catch (error) {
    console.error('Error during speech:', error);
    speakingButtons.set(buttonId, false);
    if (onError) onError(error);
    // Process next item in this button's queue
    processSpeechQueue(buttonId);
  }
};

// Speak text - prioritize ResponsiveVoice
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

// Get available voices that support Russian - kept for compatibility
export const getRussianVoices = (): SpeechSynthesisVoice[] => {
  return [];
};

// Get the best available Russian voice - kept for compatibility
export const getBestRussianVoice = (): SpeechSynthesisVoice | null => {
  return null;
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