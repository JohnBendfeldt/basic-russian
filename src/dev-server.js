// Local development server using real Google Cloud TTS API
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const app = express();
const PORT = 9000;

app.use(cors());
app.use(bodyParser.json());

// TTS API endpoint
app.post('/.netlify/functions/tts', async (req, res) => {
  const { text, voice, audioConfig } = req.body;
  
  console.log(`[DEV SERVER] TTS request for: "${text}" using voice:`, voice?.name || 'default');
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  
  try {
    // Initialize the Google Cloud TTS client
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
    
    console.log(`[DEV SERVER] Calling Google TTS API with request:`, {
      input: request.input,
      voice: request.voice
    });
    
    // Call Google Cloud TTS API
    const [response] = await client.synthesizeSpeech(request);
    
    if (!response.audioContent) {
      throw new Error('No audio content returned from Google TTS API');
    }
    
    console.log(`[DEV SERVER] Successfully received ${response.audioContent.length} bytes of audio from Google TTS API`);
    
    // Convert audio content to base64
    const audioContent = Buffer.from(response.audioContent).toString('base64');
    
    // Return the audio content
    return res.json({
      audioContent,
      text
    });
  } catch (error) {
    console.error('[DEV SERVER] Google TTS API error:', error);
    
    return res.status(500).json({
      error: 'Failed to generate speech',
      message: error.message
    });
  }
});

// API status endpoint
app.get('/', (req, res) => {
  res.send(`
    <h1>Russian Learning App - Google TTS Development Server</h1>
    <p>This server is configured to use the real Google Cloud TTS API.</p>
    <p>Make sure you have the GOOGLE_APPLICATION_CREDENTIALS environment variable set.</p>
    <p>API endpoint: <code>POST http://localhost:${PORT}/.netlify/functions/tts</code></p>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`
  ┌──────────────────────────────────────────────────────┐
  │                                                      │
  │   Google TTS Development Server running on port ${PORT}  │
  │   API endpoint: http://localhost:${PORT}/.netlify/functions/tts  │
  │                                                      │
  │   Using REAL Google Cloud TTS API                    │
  │   (ensure GOOGLE_APPLICATION_CREDENTIALS is set)     │
  │                                                      │
  └──────────────────────────────────────────────────────┘
  `);
});
