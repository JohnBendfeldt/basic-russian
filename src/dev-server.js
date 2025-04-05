// Local mock server for development testing
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = 9000;

app.use(cors());
app.use(bodyParser.json());

// Mock TTS endpoint for local development
app.post('/.netlify/functions/tts', (req, res) => {
  const { text, voice } = req.body;
  
  console.log(`[DEV SERVER] TTS request for: "${text}" using voice: ${voice?.name || 'default'}`);
  
  // Debug output showing full request
  console.log('Received request payload:', JSON.stringify(req.body, null, 2));
  
  // Return a 404 error to show what's happening in the real environment
  res.status(404).json({
    error: "Simulating the 404 error you're seeing in production",
    message: "This is the same error you would see in production. Check your Netlify Function deployment."
  });
});

// Information endpoint
app.get('/', (req, res) => {
  res.send(`
    <h1>Russian Learning App Dev Server</h1>
    <p>This mock server simulates the same 404 error that occurs in production to help with debugging.</p>
    <pre>
    Available endpoint: POST /.netlify/functions/tts
    
    Example request body:
    {
      "text": "привет",
      "voice": {
        "languageCode": "ru-RU",
        "name": "ru-RU-Standard-A",
        "ssmlGender": "FEMALE"
      }
    }
    </pre>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │   Debug Mock Server running on port ${PORT}         │
  │   TTS endpoint: http://localhost:${PORT}/.netlify/functions/tts │
  │                                                  │
  │   This server simulates the 404 errors to help   │
  │   with debugging the real API issues.            │
  │                                                  │
  └──────────────────────────────────────────────────┘
  `);
});
