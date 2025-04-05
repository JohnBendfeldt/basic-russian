/**
 * Utility functions for text-to-speech using Google Cloud TTS
 */
import { playGoogleTTS, isGoogleTTSConfigured } from './googleCloudTTS';

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
  return isInitialized || isGoogleTTSConfigured();
};

// Initialize speech system
export const initVoices = async (): Promise<void> => {
  if (isInitialized) {
    return Promise.resolve();
  }
  
  // Simply mark as initialized - Google TTS doesn't need initialization
  isInitialized = true;
  console.log('Speech system initialized with Google TTS');
  
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
    // Use Google TTS to play audio
    await playGoogleTTS(
      text,
      'ru-RU-Standard-A', // Default voice
      lang,
      () => {
        speakingButtons.set(buttonId, false);
        if (onEnd) onEnd();
        // Process next item in queue
        processSpeechQueue(buttonId);
      },
      (error: Error) => {
        console.error('Google TTS error:', error);
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

// Speak text using Google TTS
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