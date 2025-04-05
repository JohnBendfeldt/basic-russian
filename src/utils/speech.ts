/**
 * Utility functions for text-to-speech using exclusively ResponsiveVoice
 */
import { speakWithResponsiveVoice, isResponsiveVoiceAvailable, loadResponsiveVoiceScript } from './responsiveVoiceTTS';

// Unused variables are prefixed with underscore to satisfy ESLint
const _VOICE_PREFERENCES = ['ru-RU', 'ru', 'en-US'];
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

// Check if ResponsiveVoice is supported - ONLY check ResponsiveVoice
export const isSpeechSupported = (): boolean => {
  return isInitialized || isResponsiveVoiceAvailable();
};

// Initialize ResponsiveVoice ONLY
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
    // Check if ResponsiveVoice is available
    if (!isResponsiveVoiceAvailable()) {
      throw new Error('ResponsiveVoice not available');
    }
    
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
        console.warn('ResponsiveVoice error:', error);
        speakingButtons.set(buttonId, false);
        if (onError) onError(error);
        processSpeechQueue(buttonId);
      }
    });
  } catch (error) {
    console.error('Error during speech:', error);
    speakingButtons.set(buttonId, false);
    if (onError) onError(error);
    // Process next item in this button's queue
    processSpeechQueue(buttonId);
  }
};

// Speak text using ResponsiveVoice exclusively
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

// Compatibility stubs
export const getRussianVoices = (): SpeechSynthesisVoice[] => [];
export const getBestRussianVoice = (): SpeechSynthesisVoice | null => null;

// Create a named export object to avoid ESLint warning
const speechUtils = {
  isSpeechSupported,
  speak,
  getRussianVoices,
  initVoices,
  getBestRussianVoice
};

export default speechUtils;