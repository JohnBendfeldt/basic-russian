// Local development server for testing the app without the Netlify function
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = 9000;

app.use(cors());
app.use(bodyParser.json());

// Mock TTS endpoint
app.post('/.netlify/functions/tts', (req, res) => {
  const { text } = req.body;
  console.log(`[DEV SERVER] TTS request for: "${text}"`);
  
  // Always return a valid base64 audio response (beep sound)
  setTimeout(() => {
    res.json({
      audioContent: 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADSADh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAYVAAAAAAAAA0io6zCuAAAAAAAAAAAAAAAAAAAAAP/7UMQAAAf4XkAUAAABF4DJVBAAACiImUo7TYd9J1gOPtJ0Ti/qQXG/qATNiIeT4nvMN+y3NRUTx90PkPYLvLEXUw0AyP0eW7uofR+Ilyjdx6m///pJ0YA/Fw8f0RAG4EF2cAIAgIALe2/8EBYf8P////CAoJh3//+EPCT/18CAoBwgAZIOUEf////////CEXKKioqK4XCxMQEBAQEwuJ//////ggLC4qlP//////gQEBIQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==',
      text: text,
      source: 'dev-server'
    });
  }, 300); // Simulate a short delay
});

app.listen(PORT, () => {
  console.log(`
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │   Local development server running on port ${PORT}   │
  │   TTS endpoint: http://localhost:${PORT}/.netlify/functions/tts │
  │                                                  │
  └──────────────────────────────────────────────────┘
  `);
});
