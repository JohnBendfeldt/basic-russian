/**
 * Google Cloud Text-to-Speech API integration - debugging version
 */

// Cache for audio to reduce API calls
const audioCache: Record<string, string> = {};

// API URL for Google Cloud TTS - Netlify serverless function
const API_URL = '/.netlify/functions/tts';

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
 * Generate speech using Google Cloud TTS API with improved debugging
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
  
  // Prepare request payload for debugging
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
  
  console.log('API request payload:', JSON.stringify(requestPayload, null, 2));
  
  // Make the API call with explicit error detection
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload)
    });
    
    // Log detailed information about the response
    console.log(`API Response status: ${response.status} ${response.statusText}`);
    console.log('Response headers:', 
      Array.from(response.headers.entries())
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    );
    
    if (!response.ok) {
      // Try to read and log the error response body
      const errorBody = await response.text();
      console.error('API error response body:', errorBody);
      throw new Error(`Google TTS API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response to get the audio data
    const data = await response.json();
    console.log('API response structure:', Object.keys(data).join(', '));
    
    if (!data.audioContent) {
      console.error('Missing audioContent in response:', data);
      throw new Error('No audio content in API response');
    }
    
    // Cache and return the audio data
    console.log('Successfully received audio data');
    audioCache[cacheKey] = data.audioContent;
    return data.audioContent;
  } catch (error) {
    // Log detailed error information
    console.error('Google TTS API error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      text,
      voiceName,
      languageCode,
      apiUrl: API_URL
    });
    
    // Rethrow the error to be handled by the caller
    throw error;
  }
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
    // Get the audio content
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
      if (onError) onError(new Error(`Audio playback failed: ${event}`));
    };
    
    // Play the audio with error handling
    try {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Audio play failed:', error);
          if (onError) onError(new Error(`Audio play failed: ${error.message}`));
        });
      }
    } catch (playError) {
      console.error('Error during audio.play():', playError);
      if (onError) onError(new Error(`Error playing audio: ${playError}`));
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
