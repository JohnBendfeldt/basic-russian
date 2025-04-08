/**
 * Script to rename audio files from speech_[numbers] to corresponding Russian phrases/words
 * in the order they appear in the UI
 */
const fs = require('fs');
const path = require('path');

// Path to source directory with downloaded Amazon audio files
const SOURCE_DIR = path.join(__dirname, '../public/audio/duplicates_backup');
// Path to destination directory to save renamed files
const DEST_DIR = path.join(__dirname, '../public/audio/words'); // Changed to words directory

// Ensure destination directory exists
if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

// Extract Russian words from russianData.ts
function extractWords() {
  const dataFilePath = path.join(__dirname, '../src/data/russianData.ts');
  const content = fs.readFileSync(dataFilePath, 'utf8');
  
  // Find the common words section
  const wordsSectionMatch = content.match(/const commonWords: PhraseItem\[\] = \[[\s\S]*?\];/);
  if (!wordsSectionMatch) {
    throw new Error('Could not find commonWords section in russianData.ts');
  }
  
  const wordsSection = wordsSectionMatch[0];
  
  // Extract all words using regex
  const wordMatches = wordsSection.matchAll(/russian: ['"]([^'"]+)['"]/g);
  const words = [];
  
  for (const match of wordMatches) {
    words.push(match[1]);
  }
  
  return words;
}

// Get all audio files from source directory
function getAudioFiles() {
  const files = fs.readdirSync(SOURCE_DIR)
    .filter(file => file.startsWith('speech_') && file.endsWith('.mp3'))
    .sort((a, b) => {
      // Sort by creation time if available, otherwise by filename
      try {
        const aStats = fs.statSync(path.join(SOURCE_DIR, a));
        const bStats = fs.statSync(path.join(SOURCE_DIR, b));
        return aStats.birthtime.getTime() - bStats.birthtime.getTime();
      } catch (e) {
        return a.localeCompare(b);
      }
    });
  return files;
}

// Rename files according to words
function renameFiles() {
  try {
    const words = extractWords();
    console.log(`Found ${words.length} common words in russianData.ts`);
    
    const audioFiles = getAudioFiles();
    console.log(`Found ${audioFiles.length} audio files in source directory`);
    
    if (audioFiles.length === 0) {
      console.log('No audio files found to rename.');
      return;
    }
    
    // Check if we have enough words for all audio files
    if (audioFiles.length > words.length) {
      console.warn(`Warning: More audio files (${audioFiles.length}) than words (${words.length})`);
    }
    
    // Process each audio file
    const mappings = [];
    
    for (let i = 0; i < audioFiles.length; i++) {
      if (i >= words.length) {
        console.warn(`No word available for file ${audioFiles[i]}, skipping`);
        continue;
      }
      
      const oldPath = path.join(SOURCE_DIR, audioFiles[i]);
      
      // Format the new filename: lowercase and replace spaces with underscores
      const word = words[i];
      const newFilename = word.toLowerCase().replace(/\s+/g, '_') + '.mp3';
      const newPath = path.join(DEST_DIR, newFilename);
      
      // Copy file to new location with new name
      fs.copyFileSync(oldPath, newPath);
      
      mappings.push({
        originalFile: audioFiles[i],
        word: word,
        newFile: newFilename
      });
      
      console.log(`Renamed '${audioFiles[i]}' to '${newFilename}'`);
    }
    
    // Generate a report
    const reportPath = path.join(__dirname, 'audio-rename-words-report.json'); // Changed report name
    fs.writeFileSync(reportPath, JSON.stringify(mappings, null, 2));
    console.log(`\nRenamed ${mappings.length} files`);
    console.log(`Report saved to ${reportPath}`);
    
  } catch (error) {
    console.error('Error renaming files:', error);
  }
}

// Run the rename function
renameFiles();
