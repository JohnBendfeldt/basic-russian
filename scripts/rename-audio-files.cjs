/**
 * Script to rename audio files from speech_[numbers] to corresponding Russian numbers
 * in the order they appear in the UI
 */
const fs = require('fs');
const path = require('path');

// Path to source directory with downloaded Amazon audio files
const SOURCE_DIR = path.join(__dirname, '../public/audio/duplicates_backup');
// Path to destination directory to save renamed files
const DEST_DIR = path.join(__dirname, '../public/audio/numbers'); // Changed to numbers directory

// Ensure destination directory exists
if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

// Extract Russian numbers from russianData.ts
function extractNumbers() {
  const dataFilePath = path.join(__dirname, '../src/data/russianData.ts');
  const content = fs.readFileSync(dataFilePath, 'utf8');
  
  // Find the numbers section
  const numbersSectionMatch = content.match(/const numbers: PhraseItem\[\] = \[[\s\S]*?\];/);
  if (!numbersSectionMatch) {
    throw new Error('Could not find numbers section in russianData.ts');
  }
  
  const numbersSection = numbersSectionMatch[0];
  
  // Extract all numbers using regex
  const numberMatches = numbersSection.matchAll(/russian: ['"]([^'"]+)['"]/g);
  const numbers = [];
  
  for (const match of numberMatches) {
    numbers.push(match[1]);
  }
  
  return numbers;
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

// Rename files according to numbers
function renameFiles() {
  try {
    const numbers = extractNumbers();
    console.log(`Found ${numbers.length} numbers in russianData.ts`);
    
    const audioFiles = getAudioFiles();
    console.log(`Found ${audioFiles.length} audio files in source directory`);
    
    if (audioFiles.length === 0) {
      console.log('No audio files found to rename.');
      return;
    }
    
    // Check if we have enough numbers for all audio files
    if (audioFiles.length > numbers.length) {
      console.warn(`Warning: More audio files (${audioFiles.length}) than numbers (${numbers.length})`);
    }
    
    // Process each audio file
    const mappings = [];
    
    for (let i = 0; i < audioFiles.length; i++) {
      if (i >= numbers.length) {
        console.warn(`No number available for file ${audioFiles[i]}, skipping`);
        continue;
      }
      
      const oldPath = path.join(SOURCE_DIR, audioFiles[i]);
      
      // Format the new filename: lowercase and replace spaces with underscores
      const number = numbers[i];
      const newFilename = number.toLowerCase().replace(/\s+/g, '_') + '.mp3';
      const newPath = path.join(DEST_DIR, newFilename);
      
      // Copy file to new location with new name
      fs.copyFileSync(oldPath, newPath);
      
      mappings.push({
        originalFile: audioFiles[i],
        number: number,
        newFile: newFilename
      });
      
      console.log(`Renamed '${audioFiles[i]}' to '${newFilename}'`);
    }
    
    // Generate a report
    const reportPath = path.join(__dirname, 'audio-rename-numbers-report.json'); // Changed report name
    fs.writeFileSync(reportPath, JSON.stringify(mappings, null, 2));
    console.log(`\nRenamed ${mappings.length} files`);
    console.log(`Report saved to ${reportPath}`);
    
  } catch (error) {
    console.error('Error renaming files:', error);
  }
}

// Run the rename function
renameFiles();
