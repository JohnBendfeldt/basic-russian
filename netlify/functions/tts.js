// Netlify function for Google Cloud Text-to-Speech API
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
    
    console.log(`TTS request received for: "${text}"`);
    
    // Initialize the client
    const client = new TextToSpeechClient();
    
    // Prepare the request
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
    
    if (!response.audioContent) {
      throw new Error('No audio content returned from Google TTS API');
    }
    
    // Convert audio content to base64
    const audioContent = Buffer.from(response.audioContent).toString('base64');
    
    // Return the audio content
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        audioContent,
        text
      })
    };
  } catch (error) {
    console.error('Error in TTS function:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to generate speech',
        message: error.message
      })
    };
  }
};
