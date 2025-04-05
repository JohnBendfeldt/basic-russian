// English to Russian transliteration map
const transliterationMap: { [key: string]: string } = {
  // Single letter mappings
  'a': 'а',
  'b': 'б',
  'v': 'в',
  'g': 'г',
  'd': 'д',
  'e': 'е',
  'z': 'з',
  'i': 'и',
  'j': 'й',
  'k': 'к',
  'l': 'л',
  'm': 'м',
  'n': 'н',
  'o': 'о',
  'p': 'п',
  'r': 'р',
  's': 'с',
  't': 'т',
  'u': 'у',
  'f': 'ф',
  'h': 'х',
  "'": 'ь', // Soft sign
  "`": 'ь', // Alternative for soft sign
  '"': 'ъ', // Hard sign
  'y': 'ы',
  
  // Special combinations (these must be checked first)
  'shch': 'щ',
  'sh': 'ш',
  'ch': 'ч',
  'ts': 'ц',
  'ya': 'я',
  'yu': 'ю',
  'yo': 'ё',
  'zh': 'ж',
  'ye': 'е',
  'kh': 'х',
  
  // Uppercase variants
  'A': 'А',
  'B': 'Б',
  'V': 'В',
  'G': 'Г',
  'D': 'Д',
  'E': 'Е',
  'Z': 'З',
  'I': 'И',
  'J': 'Й',
  'K': 'К',
  'L': 'Л',
  'M': 'М',
  'N': 'Н',
  'O': 'О',
  'P': 'П',
  'R': 'Р',
  'S': 'С',
  'T': 'Т',
  'U': 'У',
  'F': 'Ф',
  'H': 'Х',
  'Y': 'Ы',
  
  // Uppercase combinations
  'SHCH': 'Щ',
  'SHch': 'Щ',
  'Shch': 'Щ',
  'SH': 'Ш',
  'Sh': 'Ш',
  'CH': 'Ч',
  'Ch': 'Ч',
  'TS': 'Ц',
  'Ts': 'Ц',
  'YA': 'Я',
  'Ya': 'Я',
  'YU': 'Ю',
  'Yu': 'Ю',
  'YO': 'Ё',
  'Yo': 'Ё',
  'ZH': 'Ж',
  'Zh': 'Ж',
  'YE': 'Е',
  'Ye': 'Е',
  'KH': 'Х',
  'Kh': 'Х',
};

// Define all possible letter combinations for transliteration
const combinations = [
  { latin: 'shch', cyrillic: 'щ' },
  { latin: 'sh', cyrillic: 'ш' },
  { latin: 'ch', cyrillic: 'ч' },
  { latin: 'ts', cyrillic: 'ц' },
  { latin: 'ya', cyrillic: 'я' },
  { latin: 'yu', cyrillic: 'ю' },
  { latin: 'yo', cyrillic: 'ё' },
  { latin: 'zh', cyrillic: 'ж' },
  { latin: 'ye', cyrillic: 'е' },
  { latin: 'kh', cyrillic: 'х' },
  // Add uppercase versions
  { latin: 'Shch', cyrillic: 'Щ' },
  { latin: 'SHCH', cyrillic: 'Щ' },
  { latin: 'SHch', cyrillic: 'Щ' },
  { latin: 'Sh', cyrillic: 'Ш' },
  { latin: 'SH', cyrillic: 'Ш' },
  { latin: 'Ch', cyrillic: 'Ч' },
  { latin: 'CH', cyrillic: 'Ч' },
  { latin: 'Ts', cyrillic: 'Ц' },
  { latin: 'TS', cyrillic: 'Ц' },
  { latin: 'Ya', cyrillic: 'Я' },
  { latin: 'YA', cyrillic: 'Я' },
  { latin: 'Yu', cyrillic: 'Ю' },
  { latin: 'YU', cyrillic: 'Ю' },
  { latin: 'Yo', cyrillic: 'Ё' },
  { latin: 'YO', cyrillic: 'Ё' },
  { latin: 'Zh', cyrillic: 'Ж' },
  { latin: 'ZH', cyrillic: 'Ж' },
  { latin: 'Ye', cyrillic: 'Е' },
  { latin: 'YE', cyrillic: 'Е' },
  { latin: 'Kh', cyrillic: 'Х' },
  { latin: 'KH', cyrillic: 'Х' },
];

// Define characters that could be at the start of a combination
// We need to delay processing these until we know they're not part of a combination
const comboStarterChars = ['y', 'Y', 's', 'S', 'c', 'C', 'z', 'Z', 't', 'T', 'k', 'K'];

/**
 * Transliterates English input to Russian Cyrillic characters
 * @param input Text input in English
 * @returns Transliterated text in Russian
 */
export const transliterate = (input: string): string => {
  if (!input) return input;

  // Replace special characters immediately
  let processedInput = input
    .replace(/'/g, 'ь')
    .replace(/`/g, 'ь')
    .replace(/"/g, 'ъ');
  
  // Build result
  let result = '';
  let i = 0;
  
  while (i < processedInput.length) {
    // Skip existing Cyrillic characters and spaces
    if (isCyrillic(processedInput[i]) || processedInput[i] === ' ') {
      result += processedInput[i];
      i++;
      continue;
    }
    
    let foundCombination = false;
    
    // Look for combinations at current position
    for (const combo of combinations) {
      const comboLength = combo.latin.length;
      
      // Check if we have enough characters left and they match the combo
      if (i + comboLength <= processedInput.length) {
        const potentialCombo = processedInput.substring(i, i + comboLength);
        
        if (potentialCombo === combo.latin) {
          // Found a combination, add its Cyrillic equivalent
          result += combo.cyrillic;
          i += comboLength;
          foundCombination = true;
          break;
        }
      }
    }
    
    // If no combination was found
    if (!foundCombination) {
      // Check if current character might be start of a combination
      const currentChar = processedInput[i].toLowerCase();
      
      if (comboStarterChars.includes(processedInput[i]) && i + 1 < processedInput.length) {
        // This could be the start of a combination, look ahead
        let shouldDelay = false;
        
        // Look for specific combinations based on the current character
        if (currentChar === 'y') {
          // Check if 'y' is followed by 'a', 'u', 'o', 'e'
          const nextChar = processedInput[i + 1].toLowerCase();
          shouldDelay = ['a', 'u', 'o', 'e'].includes(nextChar);
        } else if (currentChar === 's') {
          // Check if 's' is followed by 'h'
          shouldDelay = processedInput[i + 1].toLowerCase() === 'h';
        } else if (currentChar === 'z') {
          // Check if 'z' is followed by 'h'
          shouldDelay = processedInput[i + 1].toLowerCase() === 'h';
        } else if (currentChar === 'c') {
          // Check if 'c' is followed by 'h'
          shouldDelay = processedInput[i + 1].toLowerCase() === 'h';
        } else if (currentChar === 't') {
          // Check if 't' is followed by 's'
          shouldDelay = processedInput[i + 1].toLowerCase() === 's';
        } else if (currentChar === 'k') {
          // Check if 'k' is followed by 'h'
          shouldDelay = processedInput[i + 1].toLowerCase() === 'h';
        }
        
        if (shouldDelay) {
          // It's part of a valid combination but we didn't match a full one
          // This means we're likely missing the complete combo due to in-progress typing
          // Just output the original Latin character for now
          result += processedInput[i];
          i++;
          continue;
        }
      }
      
      // It's a single character, not part of a combination
      const char = processedInput[i];
      // Use transliteration map if available, otherwise keep original
      result += transliterationMap[char] || char;
      i++;
    }
  }
  
  return result;
};

/**
 * Checks if a given character is a Russian Cyrillic character
 * @param char Character to check
 * @returns True if the character is Cyrillic
 */
export const isCyrillic = (char: string): boolean => {
  return /[\u0400-\u04FF]/.test(char);
};

/**
 * Checks if a string contains any Cyrillic characters
 * @param text String to check
 * @returns True if the string contains any Cyrillic characters
 */
export const containsCyrillic = (text: string): boolean => {
  return Array.from(text).some(char => isCyrillic(char));
};

export default {
  transliterate,
  isCyrillic,
  containsCyrillic
};
