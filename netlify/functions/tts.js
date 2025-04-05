// Serverless function for Google Cloud Text-to-Speech API
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const { text, voice, audioConfig } = body;
    
    if (!text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Text is required' })
      };
    }
    
    // Log detailed information for debugging
    console.log('TTS Request received:', { text, voiceName: voice?.name });
    console.log('Environment vars check:', { 
      hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      credLength: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 
        process.env.GOOGLE_APPLICATION_CREDENTIALS.length : 0
    });
    
    // For local development testing, always return a beep sound
    // This ensures we have functional audio while we debug the API
    if (process.env.NODE_ENV === 'development' || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('Using fallback audio (development mode or missing credentials)');
      return fallbackResponse(text);
    }
    
    try {
      // Parse credentials with better error handling
      let credentials;
      try {
        credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      } catch (parseError) {
        console.error('Failed to parse credentials JSON:', parseError);
        // The credentials might be a file path - try to use it directly
        credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      }
      
      // Create the TTS client - handle both JSON object and file path cases
      let client;
      if (typeof credentials === 'string') {
        console.log('Using credentials as file path');
        client = new TextToSpeechClient();
      } else if (credentials && credentials.private_key) {
        console.log('Using inline credentials JSON object');
        client = new TextToSpeechClient({ credentials });
      } else {
        throw new Error('Invalid credentials format');
      }
      
      // Prepare request for TTS API
      const request = {
        input: { text },
        voice: voice || {
          languageCode: 'ru-RU',
          name: 'ru-RU-Standard-A',
          ssmlGender: 'FEMALE'
        },
        audioConfig: audioConfig || {
          audioEncoding: 'MP3'
        }
      };
      
      // Call Google Cloud TTS API
      const [response] = await client.synthesizeSpeech(request);
      
      // Convert audio content to base64
      const audioContent = Buffer.from(response.audioContent).toString('base64');
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          audioContent: audioContent,
          text: text
        })
      };
    } catch (credError) {
      console.error('Error with Google Cloud credentials or API call:', credError);
      return fallbackResponse(text);
    }
  } catch (error) {
    console.error('Error processing TTS request:', error);
    return fallbackResponse(text);
  }
};

// Fallback response function that generates a simple beep sound when Google TTS fails
function fallbackResponse(text) {
  console.log('Using fallback TTS response for:', text);
  
  // Simple base64 encoded beep sound (very short MP3)
  const fallbackAudioBase64 = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADSADh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYVAAAAAAAAA0io6zCuAAAAAAAAAAAAAAAAAAAAAP/7UMQAAAf4XkAUAAABF4DJVBAAACiImUo7TYd9J1gOPtJ0Ti/qQXG/qATNiIeT4nvMN+y3NRUTx90PkPYLvLEXUw0AyP0eW7uofR+Ilyjdx6m///pJ0YA/Fw8f0RAG4EF2cAIAgIALe2/8EBYf8P////CAoJh3//+EPCT/18CAoBwgAZIOUEf////////CEXKKioqK4XCxMQEBAQEwuJ//////ggLC4qlP//////gQEBIQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==';
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      audioContent: fallbackAudioBase64,
      text: text,
      source: 'fallback'
    })
  };
}
