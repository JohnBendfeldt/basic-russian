/**
 * Russian transliteration utility
 */

// Use the approach that was working before - simple and reliable
export const transliterate = (input: string): string => {
  if (!input) return input;
  
  // First replace quotes and apostrophes
  let result = input
    .replace(/'/g, 'ь')
    .replace(/`/g, 'ь')
    .replace(/"/g, 'ъ');
  
  // Process combinations first (to avoid issues with individual letters)
  result = result
    // 4-letter combinations (including live-typed sh -> ш followed by ch)
    .replace(/shch/g, 'щ')
    .replace(/Shch/g, 'Щ')
    .replace(/SHCH/g, 'Щ')
    .replace(/SHch/g, 'Щ')
    .replace(/ш[cC][hH]/g, 'щ')
    .replace(/Ш[cC][hH]/g, 'Щ')
    
    // 2-letter combinations
    .replace(/zh/g, 'ж')
    .replace(/Zh/g, 'Ж')
    .replace(/ZH/g, 'Ж')
    .replace(/ya/g, 'я')
    .replace(/Ya/g, 'Я')
    .replace(/YA/g, 'Я')
    .replace(/yu/g, 'ю')
    .replace(/Yu/g, 'Ю')
    .replace(/YU/g, 'Ю')
    .replace(/yo/g, 'ё')
    .replace(/Yo/g, 'Ё')
    .replace(/YO/g, 'Ё')
    .replace(/ye/g, 'е')
    .replace(/Ye/g, 'Е')
    .replace(/YE/g, 'Е')
    .replace(/ih/g, 'ы')
    .replace(/Ih/g, 'Ы')
    .replace(/IH/g, 'Ы')
    .replace(/eh/g, 'э')
    .replace(/Eh/g, 'Э')
    .replace(/EH/g, 'Э')
    .replace(/sh/g, 'ш')
    .replace(/Sh/g, 'Ш')
    .replace(/SH/g, 'Ш')
    .replace(/ch/g, 'ч')
    .replace(/Ch/g, 'Ч')
    .replace(/CH/g, 'Ч')
    .replace(/ts/g, 'ц')
    .replace(/Ts/g, 'Ц')
    .replace(/TS/g, 'Ц')
    .replace(/kh/g, 'х')
    .replace(/Kh/g, 'Х')
    .replace(/KH/g, 'Х')
    
    // Individual characters (after combinations to avoid conflicts)
    .replace(/a/g, 'а')
    .replace(/b/g, 'б')
    .replace(/v/g, 'в')
    .replace(/w/g, 'в')
    .replace(/g/g, 'г')
    .replace(/d/g, 'д')
    .replace(/e/g, 'е')
    .replace(/z/g, 'з')
    .replace(/i/g, 'и')
    .replace(/j/g, 'й')
    .replace(/k/g, 'к')
    .replace(/l/g, 'л')
    .replace(/m/g, 'м')
    .replace(/n/g, 'н')
    .replace(/o/g, 'о')
    .replace(/p/g, 'п')
    .replace(/q/g, 'щ')
    .replace(/r/g, 'р')
    .replace(/s/g, 'с')
    .replace(/t/g, 'т')
    .replace(/u/g, 'у')
    .replace(/f/g, 'ф')
    .replace(/h/g, 'х')
    .replace(/c/g, 'ц')
    .replace(/x/g, 'кс')
    
    .replace(/A/g, 'А')
    .replace(/B/g, 'Б')
    .replace(/V/g, 'В')
    .replace(/W/g, 'В')
    .replace(/G/g, 'Г')
    .replace(/D/g, 'Д')
    .replace(/E/g, 'Е')
    .replace(/Z/g, 'З')
    .replace(/I/g, 'И')
    .replace(/J/g, 'Й')
    .replace(/K/g, 'К')
    .replace(/L/g, 'Л')
    .replace(/M/g, 'М')
    .replace(/N/g, 'Н')
    .replace(/O/g, 'О')
    .replace(/P/g, 'П')
    .replace(/Q/g, 'Щ')
    .replace(/R/g, 'Р')
    .replace(/S/g, 'С')
    .replace(/T/g, 'Т')
    .replace(/U/g, 'У')
    .replace(/F/g, 'Ф')
    .replace(/H/g, 'Х')
    .replace(/C/g, 'Ц')
    .replace(/X/g, 'Кс')

    // Context-aware 'y': after vowels -> 'й' (e.g. moy -> мой, muzey -> музей),
    // after consonants -> 'ы' (e.g. vy -> вы, ryba -> рыба), with yy -> ый (dobryy -> добрый)
    .replace(/([аеёиоуыэюяАЕЁИОУЫЭЮЯ])y/g, '$1й')
    .replace(/([аеёиоуыэюяАЕЁИОУЫЭЮЯ])Y/g, '$1Й')
    .replace(/y/g, 'ы')
    .replace(/Y/g, 'Ы')
    .replace(/([ыЫ])ы/g, '$1й')
    .replace(/([ыЫ])Ы/g, '$1Й');
  
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

// Create a named export object to avoid ESLint warning
const transliterationUtils = {
  transliterate,
  isCyrillic,
  containsCyrillic
};

export default transliterationUtils;
