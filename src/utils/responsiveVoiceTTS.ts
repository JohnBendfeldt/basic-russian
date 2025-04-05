/**
 * ResponsiveVoice Text-to-Speech API integration
 * This is a simpler alternative to the Google TTS API that works directly in the browser
 */

// The API key should be obtained from responsivevoice.org
const RV_API_KEY = process.env.REACT_APP_RESPONSIVE_VOICE_KEY || ''; 
const SCRIPT_SRC = `https://code.responsivevoice.org/responsivevoice.js?key=${RV_API_KEY}`;

// Track if the script is loaded
let scriptLoaded = false;
let scriptLoading = false;
let onReadyCallbacks: (() => void)[] = [];

/**
 * Load the ResponsiveVoice script
 */
export const loadResponsiveVoiceScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (scriptLoaded && window.responsiveVoice) {
      resolve();
      return;
    }

    // If currently loading, add to callbacks
    if (scriptLoading) {
      onReadyCallbacks.push(() => resolve());
      return;
    }

    // Start loading
    scriptLoading = true;

    // Create script element
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      console.log('ResponsiveVoice loaded successfully');
      scriptLoaded = true;
      scriptLoading = false;
      // Call all callbacks
      onReadyCallbacks.forEach(callback => callback());
      onReadyCallbacks = [];
      resolve();
    };
    script.onerror = (error) => {
      console.error('Failed to load ResponsiveVoice:', error);
      scriptLoading = false;
      reject(error);
    };

    document.body.appendChild(script);
  });
};

/**
 * Check if ResponsiveVoice is available
 */
export const isResponsiveVoiceAvailable = (): boolean => {
  return scriptLoaded && !!window.responsiveVoice;
};

/**
 * Speak text using ResponsiveVoice
 */
export const speakWithResponsiveVoice = async (
  text: string,
  voiceName = 'Russian Female', // Removed type annotation that was inferrable
  options: any = {}
): Promise<void> => {
  try {
    await loadResponsiveVoiceScript();
    
    if (!window.responsiveVoice) {
      throw new Error('ResponsiveVoice not available');
    }

    return new Promise((resolve, reject) => {
      // Default options
      const defaultOptions = {
        pitch: 1,
        rate: 0.9,
        volume: 1,
        onend: resolve,
        onerror: reject
      };

      // Merge with custom options
      const speechOptions = { ...defaultOptions, ...options };
      
      // Speak the text
      window.responsiveVoice.speak(text, voiceName, speechOptions);
    });
  } catch (error) {
    console.error('Error speaking with ResponsiveVoice:', error);
    throw error;
  }
};

/**
 * Cancel any ongoing speech
 */
export const cancelSpeech = (): void => {
  if (window.responsiveVoice) {
    window.responsiveVoice.cancel();
  }
};

/**
 * Get available Russian voices
 */
export const getRussianVoices = (): string[] => {
  if (!window.responsiveVoice) {
    return [];
  }

  return ['Russian Female', 'Russian Male'];
};

// Create a named constant for the export to fix the "no-anonymous-default-export" warning
const responsiveVoiceUtils = {
  loadResponsiveVoiceScript,
  isResponsiveVoiceAvailable,
  speakWithResponsiveVoice,
  cancelSpeech,
  getRussianVoices
};

export default responsiveVoiceUtils;
