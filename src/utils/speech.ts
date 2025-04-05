/**
 * Utility functions for text-to-speech using ResponsiveVoice with fallbacks
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

// Voices to try in order of preference if Russian Female isn't available
const FALLBACK_VOICES = [
  'Russian Female',
  'Russian Male',
  'UK English Female', // For transliteration fallback
  'US English Female'
];

// Check if ResponsiveVoice is supported (initialized or available)
export const isSpeechSupported = (): boolean => {
  return isInitialized || isResponsiveVoiceAvailable();
};

// Initialize ResponsiveVoice with improved error handling
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
    
    // Always consider the app functional even if voice loading fails
    return Promise.resolve();
  } catch (error) {
    console.warn('Failed to load ResponsiveVoice:', error);
    
    // Don't fail the app - just mark as initialized so buttons still appear
    isInitialized = true;
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
    
    // Try each voice in succession if needed
    let success = false;
    let lastError: unknown = null;
    
    // Create a function to try each voice in sequence
    const tryVoiceWithFallback = async (voiceIndex: number): Promise<void> => {
      if (voiceIndex >= FALLBACK_VOICES.length) {
        throw lastError || new Error('All voices failed');
      }
      
      const voiceName = FALLBACK_VOICES[voiceIndex];
      const isTransliterationVoice = voiceIndex > 1; // English voices
      
      try {
        // For English fallback voices, change the text to include transliteration hints
        const speechText = isTransliterationVoice 
          ? `${text}. (Russian pronunciation: ${createPhoneticText(text)})`
          : text;
        
        await speakWithResponsiveVoice(speechText, voiceName, {
          onend: () => {
            speakingButtons.set(buttonId, false);
            if (onEnd) onEnd();
            // Process next item in this button's queue
            processSpeechQueue(buttonId);
          },
          onerror: (error: unknown) => {
            // Save the error but don't report it yet - try next voice
            lastError = error;
            // Try the next voice in the list
            tryVoiceWithFallback(voiceIndex + 1);
          }
        });
        
        // If we get here, the voice worked
        success = true;
      } catch (error) {
        // Save the error but don't report it yet - try next voice
        lastError = error;
        await tryVoiceWithFallback(voiceIndex + 1);
      }
    };
    
    // Start with the first voice
    await tryVoiceWithFallback(0);
    
    // This will only execute if one of the voices succeeds
    if (!success) {
      throw lastError || new Error('Failed to speak with any voice');
    }
  } catch (error) {
    console.error('Error during speech:', error);
    speakingButtons.set(buttonId, false);
    if (onError) onError(error);
    // Process next item in this button's queue
    processSpeechQueue(buttonId);
  }
};

// Helper to create an English-readable phonetic approximation of Russian text
function createPhoneticText(text: string): string {
  // Simple map of Russian characters to their approximate English phonetic equivalents
  const phonetics: Record<string, string> = {
    'а': 'ah', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'ye', 
    'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'ee', 'й': 'y', 'к': 'k',
    'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
    'с': 's', 'т': 't', 'у': 'oo', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'ih', 'ь': '',
    'э': 'eh', 'ю': 'yu', 'я': 'ya',
    'А': 'ah', 'Б': 'b', 'В': 'v', 'Г': 'g', 'Д': 'd', 'Е': 'ye', 
    'Ё': 'yo', 'Ж': 'zh', 'З': 'z', 'И': 'ee', 'Й': 'y', 'К': 'k',
    'Л': 'l', 'М': 'm', 'Н': 'n', 'О': 'o', 'П': 'p', 'Р': 'r',
    'С': 's', 'Т': 't', 'У': 'oo', 'Ф': 'f', 'Х': 'kh', 'Ц': 'ts',
    'Ч': 'ch', 'Ш': 'sh', 'Щ': 'shch', 'Ъ': '', 'Ы': 'ih', 'Ь': '',
    'Э': 'eh', 'Ю': 'yu', 'Я': 'ya'
  };
  
  let phonetic = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    phonetic += phonetics[char] || char;
    if (phonetics[char] && i < text.length - 1) {
      phonetic += ' ';
    }
  }
  
  return phonetic;
}

// Speak text using ResponsiveVoice with fallbacks
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