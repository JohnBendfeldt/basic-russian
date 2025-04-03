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
  "'": 'ь',
  "`": 'ь', // Add backtick as alternative
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

// Order combinations from longest to shortest to prevent partial matches
const orderedCombinations = Object.keys(transliterationMap).sort((a, b) => b.length - a.length);

/**
 * Transliterates English input to Russian Cyrillic characters
 * @param input Text input in English
 * @returns Transliterated text in Russian
 */
export const transliterate = (input: string): string => {
  // Don't attempt to transliterate if input is empty
  if (!input) return input;
  
  let result = input;
  let i = 0;
  
  while (i < result.length) {
    // Skip existing Cyrillic characters and spaces
    if (isCyrillic(result[i]) || result[i] === ' ') {
      i++;
      continue;
    }
    
    let replaced = false;
    
    // Special handling for apostrophes to ensure they become soft signs
    if (result[i] === "'" || result[i] === "`") {
      result = result.substring(0, i) + 'ь' + result.substring(i + 1);
      i += 1;
      replaced = true;
    } else {
      // Try to match longer combinations first to prevent partial matches
      for (const combo of orderedCombinations) {
        // Only check if we have enough characters left
        if (i + combo.length <= result.length) {
          const substr = result.substring(i, i + combo.length);
          
          // Case insensitive match
          if (substr.toLowerCase() === combo.toLowerCase()) {
            // Determine appropriate case for replacement
            let replacement = transliterationMap[combo];
            
            // Apply casing based on the original text
            if (substr[0] === substr[0].toUpperCase()) {
              // First letter is uppercase
              replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
            }
            
            // Replace the text
            result = result.substring(0, i) + replacement + result.substring(i + combo.length);
            
            // Move index past the replacement
            i += replacement.length;
            replaced = true;
            break;
          }
        }
      }
    }
    
    // If no replacement was made, move to the next character
    if (!replaced) {
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
