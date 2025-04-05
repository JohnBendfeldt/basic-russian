/**
 * Browser Speech Synthesis for Russian language
 */

// Cache for successful voice lookups
const voiceCache: {
  russian?: SpeechSynthesisVoice | null;
  lastCheck: number;
} = {
  lastCheck: 0
};

/**
 * Get available Russian voices from the browser
 */
export const getRussianVoices = (): SpeechSynthesisVoice[] => {
  if (!window.speechSynthesis) return [];
  
  const allVoices = window.speechSynthesis.getVoices();
  return allVoices.filter(voice => 
    voice.lang.toLowerCase().includes('ru') || 
    voice.name.toLowerCase().includes('russian')
  );
};

/**
 * Get the best Russian voice available
 */
export const getBestRussianVoice = (): SpeechSynthesisVoice | null => {
  // Use cached voice if available and less than 10 minutes old
  const now = Date.now();
  if (voiceCache.russian !== undefined && now - voiceCache.lastCheck < 600000) {
    return voiceCache.russian;
  }
  
  // Get all Russian voices
  const russianVoices = getRussianVoices();
  
  if (russianVoices.length === 0) {
    voiceCache.russian = null;
    voiceCache.lastCheck = now;
    return null;
  }
  
  // Prefer female voices for Russian (typically clearer)
  const femaleVoice = russianVoices.find(voice => 
    voice.name.includes('Female') || 
    voice.name.includes('Tatyana') || 
    voice.name.includes('Milena') ||
    voice.name.includes('Yelena')
  );
  
  if (femaleVoice) {
    voiceCache.russian = femaleVoice;
    voiceCache.lastCheck = now;
    return femaleVoice;
  }
  
  // Fall back to any Russian voice
  voiceCache.russian = russianVoices[0];
  voiceCache.lastCheck = now;
  return russianVoices[0];
};

/**
 * Check if at least one Russian voice is available
 */
export const isRussianVoiceAvailable = (): boolean => {
  return getBestRussianVoice() !== null;
};

/**
 * Speaks the text using browser speech synthesis
 */
export const speakText = (
  text: string, 
  lang = 'ru-RU',
  onEnd?: () => void,
  onError?: (error: Error) => void
): void => {
  if (!window.speechSynthesis) {
    if (onError) onError(new Error('Speech synthesis not supported in this browser'));
    return;
  }
  
  // Create a new utterance
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set language
  utterance.lang = lang;
  
  // Find best voice
  const voice = getBestRussianVoice();
  if (voice) {
    utterance.voice = voice;
  }
  
  // Set event handlers
  utterance.onend = () => {
    if (onEnd) onEnd();
  };
  
  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event);
    if (onError) onError(new Error(`Speech synthesis error: ${event.error}`));
  };
  
  // Speak the text
  window.speechSynthesis.speak(utterance);
};

/**
 * Checks if speech synthesis is supported in this browser
 */
export const isSpeechSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

/**
 * Wait for voices to be loaded (workaround for Chrome)
 */
export const initVoices = (): Promise<void> => {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      resolve();
      return;
    }
    
    // If voices are already loaded
    if (synth.getVoices().length > 0) {
      resolve();
      return;
    }
    
    // Wait for voices to be loaded
    const onVoicesChanged = () => {
      synth.removeEventListener('voiceschanged', onVoicesChanged);
      resolve();
    };
    
    synth.addEventListener('voiceschanged', onVoicesChanged);
    
    // Fallback timeout in case the event doesn't fire
    setTimeout(resolve, 1000);
  });
};

/**
 * Get installation instructions for Russian voices
 */
export const getRussianVoiceInstallInstructions = (): string => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('windows')) {
    return 'To add Russian voices in Windows, go to Settings → Time & Language → Language & Region → Add a language → Russian → Install the language pack.';
  }
  
  if (userAgent.includes('mac os') || userAgent.includes('macintosh')) {
    return 'To add Russian voices on macOS, go to System Preferences → Accessibility → Spoken Content → System Voice → Customize → Russian → Download the voice.';
  }
  
  if (userAgent.includes('android')) {
    return 'For Android, go to Settings → Language & Input → Text-to-speech output → Preferred engine settings → Install voice data → Russian.';
  }
  
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return 'For iOS, go to Settings → Accessibility → Spoken Content → Voices → Russian → Download the voice.';
  }
  
  return 'To add Russian voices, check your device settings for language and speech options, then download a Russian voice pack.';
};

// Default export
const browserSpeech = {
  getRussianVoices,
  getBestRussianVoice,
  isRussianVoiceAvailable,
  speakText,
  isSpeechSupported,
  initVoices,
  getRussianVoiceInstallInstructions
};

export default browserSpeech;
