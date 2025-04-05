/**
 * Direct Google Cloud Text-to-Speech API integration
 */

// Cache for audio to reduce API calls
const audioCache: Record<string, string> = {};

// API URL for Google Cloud TTS - same for both dev and production 
const API_URL = '/.netlify/functions/tts';

// Log which endpoint we're using
console.log(`Using Google Cloud TTS API via: ${API_URL}`);

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
 * Check if TTS is configured (always return true for UI functionality)
 */
export const isGoogleTTSConfigured = (): boolean => {
  return true;
};

/**
 * Generate speech using Google Cloud TTS API directly
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
    console.log(`Using cached audio for "${text}"`);
    return audioCache[cacheKey];
  }
  
  console.log(`Requesting TTS for: "${text}" using voice: ${voiceName} via ${API_URL}`);
  
  // Prepare request payload for Google TTS API
  const requestPayload = {
    text,
    voice: {
      languageCode,
      name: voiceName,
      ssmlGender: voiceName.includes('B') || voiceName.includes('D') ? 'MALE' : 'FEMALE'
    },
    audioConfig: {
      audioEncoding: 'MP3'
    }
  };
  
  // Make the API call
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload)
  });
  
  // Log information about the response
  console.log(`API Response status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    // Handle API errors
    const errorBody = await response.text();
    console.error('API error response body:', errorBody);
    throw new Error(`Google TTS API error: ${response.status} ${response.statusText}`);
  }
  
  // Parse the response to get the audio data
  const data = await response.json();
  
  if (!data.audioContent) {
    console.error('Missing audioContent in response:', data);
    throw new Error('No audio content in API response');
  }
  
  // Cache and return the audio data
  console.log('Successfully received audio data');
  audioCache[cacheKey] = data.audioContent;
  return data.audioContent;
};

/**
 * Play audio from Google Cloud TTS API
 */
export const playGoogleTTS = async (
  text: string,
  voiceName = 'ru-RU-Standard-A',
  languageCode = 'ru-RU',
  onEnd?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    // Get the audio content from Google TTS API
    const audioContent = await generateSpeech(text, voiceName, languageCode);
    
    // Create an audio element and set its source to the audio data
    const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
    
    // Set up event handlers
    audio.onended = () => {
      console.log(`Audio playback completed for "${text}"`);
      if (onEnd) onEnd();
    };
    
    audio.onerror = (event) => {
      console.error('Audio playback error:', event);
      if (onError) onError(new Error('Audio playback failed'));
    };
    
    // Play the audio with error handling
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('Audio play failed:', error);
        if (onError) onError(new Error(`Audio play failed: ${error.message}`));
      });
    }
  } catch (error) {
    console.error('Error in TTS process:', error);
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
