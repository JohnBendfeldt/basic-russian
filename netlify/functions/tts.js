// Serverless function for Google Cloud Text-to-Speech API - Debug version
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
    console.log('TTS Request:', { 
      text, 
      voice: voice ? JSON.stringify(voice) : 'default', 
      env: process.env.NODE_ENV
    });
    
    console.log('Environment check:', {
      hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      credLength: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 
        process.env.GOOGLE_APPLICATION_CREDENTIALS.length : 0,
      nodeEnv: process.env.NODE_ENV,
      netlifyDev: process.env.NETLIFY_DEV
    });
    
    // For detailed inspection of credentials string (sanitized)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const credStr = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      console.log('Credentials check:', {
        isJSON: credStr.startsWith('{') && credStr.endsWith('}'),
        length: credStr.length,
        firstChars: credStr.substring(0, 20) + '...',
        hasProjectId: credStr.includes('project_id'),
        hasPrivateKey: credStr.includes('private_key'),
        hasClientEmail: credStr.includes('client_email')
      });
    }
    
    // Initialize with credentials
    let client;
    
    // Check if we have proper credentials and connect to Google
    try {
      // Parse credentials from environment variable
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}');
      
      // Log key parts of credentials for debugging (without exposing private data)
      console.log('Credential keys available:', Object.keys(credentials).join(', '));
      
      if (!credentials.private_key || !credentials.client_email) {
        throw new Error('Missing required credential fields');
      }
      
      client = new TextToSpeechClient({ credentials });
      console.log('TextToSpeechClient initialized successfully');
    } catch (credError) {
      console.error('Credentials error:', credError.message);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to initialize Google TTS client',
          message: credError.message,
          documentation: 'Make sure GOOGLE_APPLICATION_CREDENTIALS is set correctly'
        })
      };
    }
    
    // Prepare the request for Google TTS API
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
    
    console.log('Sending API request to Google TTS...');
    
    // Call Google TTS API
    const [response] = await client.synthesizeSpeech(request);
    console.log('Got response from Google TTS API');
    
    // Check if we have audio content in the response
    if (!response.audioContent || response.audioContent.length === 0) {
      console.error('No audio content in Google TTS response');
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'No audio content returned from Google TTS'
        })
      };
    }
    
    // Convert the audio content to base64
    const audioContent = Buffer.from(response.audioContent).toString('base64');
    
    console.log(`Successfully synthesized speech for: "${text}" (${audioContent.length} bytes)`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        audioContent,
        text,
        status: 'success'
      })
    };
  } catch (error) {
    console.error('Error in TTS function:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to synthesize speech',
        message: error.message,
        stack: error.stack
      })
    };
  }
};
