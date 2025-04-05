/**
 * Script to generate placeholder audio files for Russian language content
 * 
 * This script creates placeholder MP3 files for:
 * - Russian alphabet letters
 * - Example words
 * - Common phrases
 * - Numbers
 * 
 * Usage: node scripts/generate-audio-placeholders.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Try to load actual content from russianData.json
let russianDataContent = {};
try {
  const dataPath = path.join(__dirname, '../src/data/russianData.json');
  if (fs.existsSync(dataPath)) {
    russianDataContent = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log('Successfully loaded russianData.json');
  }
} catch (error) {
  console.log('Could not load russianData.json, using hardcoded data:', error.message);
}

// Comprehensive Russian content that needs audio files
// Combines hardcoded content with data from russianData.json when available
const RUSSIAN_CONTENT = {
  // Russian alphabet letters
  alphabet: russianDataContent.alphabet 
    ? russianDataContent.alphabet.map(item => item.letter)
    : [
        'а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 
        'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 
        'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я'
      ],
  
  // Examples for each letter
  examples: russianDataContent.alphabet 
    ? russianDataContent.alphabet
        .filter(item => item.russianWord)
        .map(item => item.russianWord)
    : [
        'автобус', 'брат', 'вода', 'город', 'дом', 'ем', 'ёлка', 'журнал', 
        'завод', 'имя', 'йогурт', 'кошка', 'любовь', 'мама', 'нос', 'окно', 
        'папа', 'рыба', 'собака', 'телефон', 'утро', 'фото', 'хлеб', 'центр', 
        'чай', 'школа', 'щека', 'объект', 'мы', 'мать', 'это', 'юг', 'яблоко'
      ],
  
  // Common phrases
  phrases: russianDataContent.basicPhrases
    ? russianDataContent.basicPhrases.map(item => item.russian)
    : [
        'привет', 'здравствуйте', 'до свидания', 'спасибо', 'пожалуйста', 
        'извините', 'да', 'нет', 'как дела', 'меня зовут', 'я не понимаю', 
        'говорите медленнее', 'повторите пожалуйста', 'хорошо', 'плохо', 
        'где туалет', 'сколько стоит', 'помогите', 'я хочу есть', 'я хочу пить'
      ],
  
  // Numbers
  numbers: russianDataContent.numbers
    ? russianDataContent.numbers.map(item => item.russian)
    : [
        'ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 
        'девять', 'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 
        'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать', 
        'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 
        'восемьдесят', 'девяносто', 'сто', 'тысяча'
      ],
  
  // Common words
  words: russianDataContent.commonWords
    ? russianDataContent.commonWords.map(item => item.russian)
    : [
        'мужчина', 'женщина', 'ребенок', 'мальчик', 'девочка', 'друг', 'еда', 'вода', 
        'хлеб', 'молоко', 'мясо', 'рыба', 'овощи', 'фрукты', 'кофе', 'чай', 'пиво', 
        'вино', 'магазин', 'ресторан', 'гостиница', 'станция', 'аэропорт', 'улица', 
        'площадь', 'парк', 'больница', 'аптека', 'банк', 'почта', 'полиция', 
        'музей', 'театр', 'кино', 'билет', 'деньги', 'паспорт', 'виза'
      ]
};

// Also include all the quiz words and phrases
const quizContent = [
  // Quiz examples from the code
  'привет', 'hello', 'formal', 'informal'
];

// Add quiz content to appropriate categories
quizContent.forEach(word => {
  // Only add if it's Russian (contains Cyrillic characters)
  if (/[\u0400-\u04FF]/.test(word)) {
    // Add to the appropriate category or to phrases as fallback
    let added = false;
    
    // Check if it's a single letter (alphabet)
    if (word.length === 1 && RUSSIAN_CONTENT.alphabet.indexOf(word) === -1) {
      RUSSIAN_CONTENT.alphabet.push(word);
      added = true;
    }
    
    // Check if it's a number word
    const numberWords = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 
      'девять', 'десять', 'одиннадцать', 'двенадцать', 'тысяча'];
    
    if (numberWords.includes(word) && RUSSIAN_CONTENT.numbers.indexOf(word) === -1) {
      RUSSIAN_CONTENT.numbers.push(word);
      added = true;
    }
    
    // Add to common words if it's a single word and not already added
    if (!added && word.indexOf(' ') === -1 && RUSSIAN_CONTENT.words.indexOf(word) === -1) {
      RUSSIAN_CONTENT.words.push(word);
      added = true;
    }
    
    // Add to phrases if it contains spaces and not already added
    if (!added && word.indexOf(' ') !== -1 && RUSSIAN_CONTENT.phrases.indexOf(word) === -1) {
      RUSSIAN_CONTENT.phrases.push(word);
    }
  }
});

// Configuration
const AUDIO_BASE_DIR = path.join(__dirname, '../public/audio');
const AUDIO_DIRS = {
  alphabet: path.join(AUDIO_BASE_DIR, 'alphabet'),
  examples: path.join(AUDIO_BASE_DIR, 'examples'),
  phrases: path.join(AUDIO_BASE_DIR, 'phrases'),
  numbers: path.join(AUDIO_BASE_DIR, 'numbers'),
  words: path.join(AUDIO_BASE_DIR, 'words')
};

// Create directories if they don't exist
const createDirectories = () => {
  if (!fs.existsSync(AUDIO_BASE_DIR)) {
    fs.mkdirSync(AUDIO_BASE_DIR, { recursive: true });
    console.log(`Created directory: ${AUDIO_BASE_DIR}`);
  }

  Object.values(AUDIO_DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

// Sanitize filename to ensure it's valid
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[<>:"/\\|?*\s]/g, '_') // Replace invalid characters with underscore
    .toLowerCase()
    .trim();
};

// Generate a simple beep MP3 file or use a fallback if ffmpeg is not available
const generateAudioFile = async (outputPath, frequency = 440, duration = 500) => {
  try {
    // Try to use ffmpeg if available
    await execPromise('ffmpeg -version');
    const command = `ffmpeg -f lavfi -i "sine=frequency=${frequency}:duration=${duration/1000}:sample_rate=44100" -c:a libmp3lame -q:a 2 "${outputPath}" -y`;
    await execPromise(command);
    console.log(`Generated audio: ${outputPath}`);
  } catch (error) {
    console.log(`Could not use ffmpeg (${error.message}), using fallback method`);
    
    // Fallback: Create a minimal valid MP3 file
    // This is a very basic MP3 header that produces a short silent file
    const emptyMp3Buffer = Buffer.from(
      'ID3\x03\x00\x00\x00\x00\x00\x00' + 
      '\xFF\xFB\x90\x44\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00',
      'binary'
    );
    fs.writeFileSync(outputPath, emptyMp3Buffer);
    console.log(`Created fallback MP3 file: ${outputPath}`);
  }
};

// Generate audio for a category
const generateCategoryAudio = async (category, items, options = {}) => {
  console.log(`\nGenerating ${category} audio files...`);
  
  const categoryDir = AUDIO_DIRS[category];
  let count = 0;
  
  for (const item of items) {
    if (!item) continue; // Skip empty items
    
    const filename = `${sanitizeFilename(item)}.mp3`;
    const filePath = path.join(categoryDir, filename);
    
    if (!fs.existsSync(filePath)) {
      // Generate unique audio characteristics based on the category and item
      const itemLength = item.length || 1;
      const frequency = 440 + (options.frequency || 0) + (itemLength * 5);
      const duration = (options.duration || 500) + (itemLength * 20);
      
      await generateAudioFile(filePath, frequency, duration);
      count++;
    }
  }
  
  console.log(`Generated ${count} new audio files for ${category} (${items.length} total)`);
};

// Generate default audio file
const generateDefaultAudio = async () => {
  console.log('Generating default audio file...');
  
  const defaultPath = path.join(AUDIO_BASE_DIR, 'default.mp3');
  
  if (!fs.existsSync(defaultPath)) {
    await generateAudioFile(defaultPath, 440, 300);
  }
};

// Create an index file of all generated audio
const createAudioIndex = () => {
  console.log('Creating audio index file...');
  
  const audioFiles = {};
  
  // Collect all audio files by category
  Object.entries(AUDIO_DIRS).forEach(([category, dirPath]) => {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath)
        .filter(file => file.endsWith('.mp3'))
        .map(file => ({
          filename: file,
          path: `/audio/${category}/${file}`,
          size: fs.statSync(path.join(dirPath, file)).size
        }));
      
      audioFiles[category] = files;
    }
  });
  
  // Add default audio
  const defaultPath = path.join(AUDIO_BASE_DIR, 'default.mp3');
  if (fs.existsSync(defaultPath)) {
    audioFiles.default = {
      filename: 'default.mp3',
      path: '/audio/default.mp3',
      size: fs.statSync(defaultPath).size
    };
  }
  
  // Count total files
  const totalFiles = Object.values(audioFiles)
    .reduce((sum, files) => sum + (Array.isArray(files) ? files.length : 1), 0);
  
  // Write index file
  const indexPath = path.join(AUDIO_BASE_DIR, 'index.json');
  fs.writeFileSync(
    indexPath, 
    JSON.stringify({
      generated: new Date().toISOString(),
      count: totalFiles,
      files: audioFiles
    }, null, 2)
  );
  
  console.log(`Audio index created at ${indexPath} (${totalFiles} files indexed)`);
};

// Print summary of what we'll generate
console.log('\nContent to generate audio for:');
Object.entries(RUSSIAN_CONTENT).forEach(([category, items]) => {
  console.log(`- ${category}: ${items.length} items`);
});

// Main function
const main = async () => {
  try {
    console.log('\n=== Russian Audio Placeholder Generator ===\n');
    
    // Create necessary directories
    createDirectories();
    
    // Generate default audio
    await generateDefaultAudio();
    
    // Generate audio for each category with custom options
    await generateCategoryAudio('alphabet', RUSSIAN_CONTENT.alphabet, { duration: 300 });
    await generateCategoryAudio('examples', RUSSIAN_CONTENT.examples, { duration: 800 });
    await generateCategoryAudio('phrases', RUSSIAN_CONTENT.phrases, { duration: 1000 });
    await generateCategoryAudio('numbers', RUSSIAN_CONTENT.numbers, { duration: 700 });
    await generateCategoryAudio('words', RUSSIAN_CONTENT.words, { duration: 800 });
    
    // Create index of all audio files
    createAudioIndex();
    
    console.log('\n=== Audio placeholder generation complete! ===');
    console.log('\nNext steps:');
    console.log('1. Replace these placeholder files with real recordings');
    console.log('2. Keep the same filenames to maintain compatibility');
    console.log('3. The audio files will be used automatically by the app\n');
  } catch (error) {
    console.error('\nError generating audio placeholders:', error);
    process.exit(1);
  }
};

// Run the script
main();
