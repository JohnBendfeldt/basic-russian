/**
 * Simple and robust Russian transliteration utility
 */

// Define all mappings with explicit ordering
const transliterationRules = [
  // Special characters (handled first)
  { from: "'", to: 'ь' },  // soft sign
  { from: "`", to: 'ь' },  // alternative soft sign
  { from: '"', to: 'ъ' },  // hard sign
  
  // Four-letter combinations
  { from: 'shch', to: 'щ' },
  { from: 'Shch', to: 'Щ' },
  { from: 'SHCH', to: 'Щ' },
  
  // Two-letter combinations - critical ones first
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
  
  // Single characters - lowercase
  { from: 'a', to: 'а' },
  { from: 'b', to: 'б' },
  { from: 'v', to: 'в' },
  { from: 'g', to: 'г' },
  { from: 'd', to: 'д' },
  { from: 'e', to: 'е' },
  { from: 'z', to: 'з' },
  { from: 'i', to: 'и' },
  { from: 'j', to: 'й' },
  { from: 'k', to: 'к' },
  { from: 'l', to: 'л' },
  { from: 'm', to: 'м' },
  { from: 'n', to: 'н' },
  { from: 'o', to: 'о' },
  { from: 'p', to: 'п' },
  { from: 'r', to: 'р' },
  { from: 's', to: 'с' },
  { from: 't', to: 'т' },
  { from: 'u', to: 'у' },
  { from: 'f', to: 'ф' },
  { from: 'h', to: 'х' },
  { from: 'c', to: 'ц' },
  { from: 'y', to: 'ы' },  // Processed after 'ya', 'yu', etc.
  
  // Single characters - uppercase
  { from: 'A', to: 'А' },
  { from: 'B', to: 'Б' },
  { from: 'V', to: 'В' },
  { from: 'G', to: 'Г' },
  { from: 'D', to: 'Д' },
  { from: 'E', to: 'Е' },
  { from: 'Z', to: 'З' },
  { from: 'I', to: 'И' },
  { from: 'J', to: 'Й' },
  { from: 'K', to: 'К' },
  { from: 'L', to: 'Л' },
  { from: 'M', to: 'М' },
  { from: 'N', to: 'Н' },
  { from: 'O', to: 'О' },
  { from: 'P', to: 'П' },
  { from: 'R', to: 'Р' },
  { from: 'S', to: 'С' },
  { from: 'T', to: 'Т' },
  { from: 'U', to: 'У' },
  { from: 'F', to: 'Ф' },
  { from: 'H', to: 'Х' },
  { from: 'C', to: 'Ц' },
  { from: 'Y', to: 'Ы' }   // Processed after 'YA', 'YU', etc.
];

/**
 * Transliterates Latin text to Cyrillic using explicit mapping
 */
export const transliterate = (input: string): string => {
  if (!input) return input;
  
  let result = input;
  
  // Apply each rule in the order specified
  for (const rule of transliterationRules) {
    // Escape special regex characters in the 'from' string
    const escapedFrom = rule.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escapedFrom, 'g');
    result = result.replace(pattern, rule.to);
  }
  
  return result;
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
