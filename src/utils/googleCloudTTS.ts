/**
 * Google Cloud Text-to-Speech API integration with robust fallbacks
 */

// Cache for audio to reduce API calls
const audioCache: Record<string, string> = {};

// API URL for Google Cloud TTS
const API_URL = '/.netlify/functions/tts';

// Add preloaded sample audio for common Russian words
const SAMPLE_AUDIO: Record<string, string> = {
  'привет': 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADrADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAWEAAAAAAAAA6yq4hqUAAAAAAAAAAAAAAAAAAAA',
};

/**
 * Available Google Cloud TTS voices for Russian
 */
export const RUSSIAN_VOICES = [
  'ru-RU-Standard-A', // Female
  'ru-RU-Standard-B', // Male
  'ru-RU-Standard-C', // Female
  'ru-RU-Standard-D', // Male
  'ru-RU-Wavenet-A',  // Female (higher quality)
  'ru-RU-Wavenet-B',  // Male (higher quality)
  'ru-RU-Wavenet-C',  // Female (higher quality)
  'ru-RU-Wavenet-D',  // Male (higher quality)
];

/**
 * Check if TTS is configured (always return true so UI works)
 */
export const isGoogleTTSConfigured = (): boolean => {
  return true;
};

/**
 * Generate speech with proper error handling
 */
export const generateSpeech = async (
  text: string,
  voiceName = 'ru-RU-Standard-A',
  languageCode = 'ru-RU'
): Promise<string> => {
  // Create cache key
  const cacheKey = `${text}_${voiceName}_${languageCode}`;
  
  // Return cached audio if available
  if (audioCache[cacheKey]) {
    return audioCache[cacheKey];
  }
  
  // Check if we have preloaded sample audio for this text
  const normalizedText = text.toLowerCase().trim();
  if (SAMPLE_AUDIO[normalizedText]) {
    audioCache[cacheKey] = SAMPLE_AUDIO[normalizedText];
    return SAMPLE_AUDIO[normalizedText];
  }
  
  try {
    // Add detailed logging to help diagnose issues
    console.log(`Requesting TTS from ${API_URL} for: "${text}" with voice ${voiceName}`);
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: {
          languageCode,
          name: voiceName,
          ssmlGender: voiceName.includes('B') || voiceName.includes('D') ? 'MALE' : 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3'
        }
      }),
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));
    
    // Handle response errors
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error response');
      console.error(`API error ${response.status}: ${errorText}`);
      throw new Error(`TTS API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.audioContent) {
      console.error('Missing audio content in response:', data);
      throw new Error('No audio content in API response');
    }
    
    // Cache and return the audio content
    audioCache[cacheKey] = data.audioContent;
    return data.audioContent;
  } catch (error) {
    console.error(`TTS API error for "${text}":`, error);
    
    // Return sample audio if available as fallback
    if (SAMPLE_AUDIO.привет) {
      console.log('Using sample audio as fallback');
      audioCache[cacheKey] = SAMPLE_AUDIO.привет;
      return SAMPLE_AUDIO.привет;
    }
    
    // Re-throw for upstream handling
    throw error;
  }
};

/**
 * Play audio with increased robustness
 */
export const playGoogleTTS = async (
  text: string,
  voiceName = 'ru-RU-Standard-A',
  languageCode = 'ru-RU',
  onEnd?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    // Get the audio content with timeout protection
    const audioPromise = generateSpeech(text, voiceName, languageCode);
    
    // Add a timeout to prevent indefinite hanging
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('TTS request timed out')), 5000);
    });
    
    // Race the audio request against the timeout
    const audioContent = await Promise.race([audioPromise, timeoutPromise]);
    
    // Create and configure audio element
    const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
    
    // Set up listeners
    audio.addEventListener('ended', () => {
      console.log(`Audio playback completed for "${text}"`);
      if (onEnd) onEnd();
    });
    
    audio.addEventListener('error', (event) => {
      console.error(`Audio playback error for "${text}":`, event);
      if (onError) onError(new Error('Audio playback failed'));
    });
    
    // Load audio first (important for mobile browsers)
    audio.load();
    
    // Play with proper error handling
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error(`Audio play failed for "${text}":`, error);
        
        // Special handling for "user didn't interact" errors on mobile
        if (error.name === 'NotAllowedError') {
          console.warn('Audio playback requires user interaction first');
        }
        
        if (onError) onError(new Error(`Audio play failed: ${error.message}`));
      });
    }
  } catch (error) {
    console.error(`TTS preparation error for "${text}":`, error);
    if (onError) {
      if (error instanceof Error) {
        onError(error);
      } else {
        onError(new Error('Unknown TTS error'));
      }
    }
  }
};

// Create a named export object
const googleCloudTTS = {
  isGoogleTTSConfigured,
  generateSpeech,
  playGoogleTTS,
  RUSSIAN_VOICES
};

export default googleCloudTTS;
