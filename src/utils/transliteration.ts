/**
 * Russian transliteration utility that properly handles letter combinations
 */

// Combinations that need special handling (from longest to shortest)
const combinations = [
  // 4-letter combinations
  { from: 'shch', to: 'щ' },
  { from: 'Shch', to: 'Щ' },
  { from: 'SHCH', to: 'Щ' },
  
  // 2-letter combinations
  { from: 'ya', to: 'я' },
  { from: 'Ya', to: 'Я' },
  { from: 'YA', to: 'Я' },
  { from: 'yu', to: 'ю' },
  { from: 'Yu', to: 'Ю' },
  { from: 'YU', to: 'Ю' },
  { from: 'yo', to: 'ё' },
  { from: 'Yo', to: 'Ё' },
  { from: 'YO', to: 'Ё' },
  { from: 'ye', to: 'е' },
  { from: 'Ye', to: 'Е' },
  { from: 'YE', to: 'Е' },
  { from: 'zh', to: 'ж' },
  { from: 'Zh', to: 'Ж' },
  { from: 'ZH', to: 'Ж' },
  { from: 'sh', to: 'ш' },
  { from: 'Sh', to: 'Ш' },
  { from: 'SH', to: 'Ш' },
  { from: 'ch', to: 'ч' },
  { from: 'Ch', to: 'Ч' },
  { from: 'CH', to: 'Ч' },
  { from: 'ts', to: 'ц' },
  { from: 'Ts', to: 'Ц' },
  { from: 'TS', to: 'Ц' },
  { from: 'kh', to: 'х' },
  { from: 'Kh', to: 'Х' },
  { from: 'KH', to: 'Х' },
];

// Single character mappings
const singleChars: Record<string, string> = {
  'a': 'а', 'A': 'А',
  'b': 'б', 'B': 'Б',
  'v': 'в', 'V': 'В',
  'g': 'г', 'G': 'Г',
  'd': 'д', 'D': 'Д',
  'e': 'е', 'E': 'Е',
  'z': 'з', 'Z': 'З',
  'i': 'и', 'I': 'И',
  'j': 'й', 'J': 'Й',
  'k': 'к', 'K': 'К',
  'l': 'л', 'L': 'Л',
  'm': 'м', 'M': 'М',
  'n': 'н', 'N': 'Н',
  'o': 'о', 'O': 'О',
  'p': 'п', 'P': 'П',
  'r': 'р', 'R': 'Р',
  's': 'с', 'S': 'С',
  't': 'т', 'T': 'Т',
  'u': 'у', 'U': 'У',
  'f': 'ф', 'F': 'Ф',
  'h': 'х', 'H': 'Х',
  'c': 'ц', 'C': 'Ц',
  'y': 'ы', 'Y': 'Ы',
  "'": 'ь',
  "`": 'ь',
  '"': 'ъ',
};

/**
 * Transliterates Latin text to Cyrillic
 */
export const transliterate = (input: string): string => {
  if (!input) return input;
  
  // Start with the input
  let result = input;
  
  // Step 1: Process all combinations first
  for (const combo of combinations) {
    // Use a regex with word boundaries to avoid partial matches
    const pattern = new RegExp(combo.from, 'g');
    result = result.replace(pattern, combo.to);
  }
  
  // Step 2: Process individual characters, but be careful about which ones
  // Process character by character so we can examine the context
  let processed = '';
  for (let i = 0; i < result.length; i++) {
    const char = result[i];
    
    // Skip characters that are already Cyrillic
    if (isCyrillic(char)) {
      processed += char;
      continue;
    }
    
    // Look up the character in our single character map
    const cyrillicChar = singleChars[char];
    if (cyrillicChar) {
      processed += cyrillicChar;
    } else {
      // Keep characters we don't have mappings for
      processed += char;
    }
  }
  
  return processed;
};

/**
 * Checks if a given character is a Russian Cyrillic character
 */
export const isCyrillic = (char: string): boolean => {
  return /[\u0400-\u04FF]/.test(char);
};

/**
 * Checks if a string contains any Cyrillic characters
 */
export const containsCyrillic = (text: string): boolean => {
  return Array.from(text).some(char => isCyrillic(char));
};

export default {
  transliterate,
  isCyrillic,
  containsCyrillic
};
