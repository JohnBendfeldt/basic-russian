/**
 * Utility functions for text-to-speech using browser speech synthesis
 */
import { 
  speakText, 
  isSpeechSupported as isBrowserSpeechSupported,
  initVoices as initBrowserVoices
} from './browserSpeech';

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

// Check if speech is supported
export const isSpeechSupported = (): boolean => {
  return isInitialized || isBrowserSpeechSupported();
};

// Initialize speech system
export const initVoices = async (): Promise<void> => {
  if (isInitialized) {
    return Promise.resolve();
  }
  
  await initBrowserVoices();
  isInitialized = true;
  
  return Promise.resolve();
};

// Process the queue for a specific button
const processSpeechQueue = async (buttonId: string): Promise<void> => {
  // If already speaking or no items in queue, do nothing
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
    // Use browser speech synthesis to play audio
    speakText(
      text,
      lang,
      () => {
        speakingButtons.set(buttonId, false);
        if (onEnd) onEnd();
        // Process next item in queue
        processSpeechQueue(buttonId);
      },
      (error: Error) => {
        console.error('Speech synthesis error:', error);
        speakingButtons.set(buttonId, false);
        if (onError) onError(error);
        // Process next item in queue
        processSpeechQueue(buttonId);
      }
    );
  } catch (error) {
    console.error('Error during speech:', error);
    speakingButtons.set(buttonId, false);
    if (onError) onError(error);
    // Process next item in queue
    processSpeechQueue(buttonId);
  }
};

// Speak text using browser speech synthesis
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

// Add a function to cancel all speaking for cleanup purposes
export const cancelAllSpeech = (): void => {
  // Clear all speech queues
  speechQueues.clear();
  
  // Reset all speaking states
  speakingButtons.clear();
  
  // Cancel any ongoing speech synthesis
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

// Create a named export object to avoid ESLint warning
const speechUtils = {
  isSpeechSupported,
  speak,
  initVoices,
  cancelAllSpeech
};

export default speechUtils;