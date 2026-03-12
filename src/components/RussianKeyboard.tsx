import React from 'react';

interface RussianKeyboardProps {
  onLetterClick: (letter: string) => void;
}

const RussianKeyboard: React.FC<RussianKeyboardProps> = ({ onLetterClick }) => {
  // Phonetic mapping where keys produce Russian letters that sound like the English key
  // For example: pressing 'a' gives 'а', pressing 'd' gives 'д'
  const keyboardRows = [
    // Top row (QWERTY) - mapped to phonetic Russian equivalents
    ['щ', 'в', 'е', 'р', 'т', 'й', 'у', 'и', 'о', 'п'],
    // Middle row (ASDF) - mapped to phonetic Russian equivalents
    ['а', 'с', 'д', 'ф', 'г', 'х', 'й', 'к', 'л'],
    // Bottom row (ZXCV) - mapped to phonetic Russian equivalents
    ['з', 'кс', 'ц', 'в', 'б', 'н', 'м']
  ];

  // English key labels to show under each Russian letter
  const phoneticGuide = [
    // Maps English keys to Russian letters by sound
    [
      { en: 'Q', ru: 'щ' }, // q -> щ (shch)
      { en: 'W', ru: 'в' }, // w -> в (v)
      { en: 'E', ru: 'е' }, // e -> е (ye)
      { en: 'R', ru: 'р' }, // r -> р (r)
      { en: 'T', ru: 'т' }, // t -> т (t)
      { en: 'Y', ru: 'й' }, // y -> й (y)
      { en: 'U', ru: 'у' }, // u -> у (u)
      { en: 'I', ru: 'и' }, // i -> и (i)
      { en: 'O', ru: 'о' }, // o -> о (o)
      { en: 'P', ru: 'п' }, // p -> п (p)
    ],
    [
      { en: 'A', ru: 'а' }, // a -> а (a)
      { en: 'S', ru: 'с' }, // s -> с (s)
      { en: 'D', ru: 'д' }, // d -> д (d)
      { en: 'F', ru: 'ф' }, // f -> ф (f)
      { en: 'G', ru: 'г' }, // g -> г (g)
      { en: 'H', ru: 'х' }, // h -> х (kh)
      { en: 'J', ru: 'й' }, // j -> й (y)
      { en: 'K', ru: 'к' }, // k -> к (k)
      { en: 'L', ru: 'л' }, // l -> л (l)
    ],
    [
      { en: 'Z', ru: 'з' }, // z -> з (z)
      { en: 'X', ru: 'кс' }, // x -> кс (ks)
      { en: 'C', ru: 'ц' }, // c -> ц (ts)
      { en: 'V', ru: 'в' }, // v -> в (v)
      { en: 'B', ru: 'б' }, // b -> б (b)
      { en: 'N', ru: 'н' }, // n -> н (n)
      { en: 'M', ru: 'м' }, // m -> м (m)
    ]
  ];

  // Special characters that are combinations or unique to Russian
  const specialChars = [
    { label: 'Я', value: 'я', en: 'YA' },  // ya
    { label: 'Ю', value: 'ю', en: 'YU' },  // yu
    { label: 'Ё', value: 'ё', en: 'YO' },  // yo
    { label: 'Ж', value: 'ж', en: 'ZH' },  // zh
    { label: 'Ш', value: 'ш', en: 'SH' },  // sh
    { label: 'Ч', value: 'ч', en: 'CH' },  // ch
    { label: 'Ы', value: 'ы', en: 'Y' },   // hard i
    { label: 'Э', value: 'э', en: 'E' },   // hard e
    { label: 'Ь', value: 'ь', en: "'" },   // soft sign - make this more prominent
    { label: 'Ъ', value: 'ъ', en: '"' }    // hard sign
  ];

  // Common vowels that need uppercase versions
  const vowels = ['а', 'е', 'и', 'о', 'у', 'я', 'ю', 'ё', 'э'];

  return (
    <div className="russian-keyboard">
      
      {keyboardRows.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.map((letter, i) => (
            <button
              key={`${rowIndex}-${i}`}
              className="keyboard-key"
              onClick={() => onLetterClick(letter)}
              type="button"
              aria-label={`Insert letter ${letter}`}
            >
              <span className="key-ru">{letter}</span>
              <span className="key-en">{phoneticGuide[rowIndex][i]?.en || ''}</span>
            </button>
          ))}
          {rowIndex === 2 && (
            <button
              className="keyboard-key space-key"
              onClick={() => onLetterClick(' ')}
              type="button"
              aria-label="Space"
            >
              Пробел
            </button>
          )}
        </div>
      ))}
      
      <div className="keyboard-row special-chars-row">
        {/* Soft sign first for emphasis */}
        <button
          className="keyboard-key special-key soft-sign-key"
          onClick={() => onLetterClick('ь')}
          type="button"
          aria-label="Insert soft sign (ь)"
        >
          <span className="key-ru">Ь</span>
          <span className="key-en">'</span>
        </button>
        
        {/* Special Russian characters that don't map directly */}
        {specialChars.filter(char => char.value !== 'ь').map((char) => (
          <button
            key={char.value}
            className="keyboard-key special-key"
            onClick={() => onLetterClick(char.value)}
            type="button"
            aria-label={`Insert letter ${char.label}`}
          >
            <span className="key-ru">{char.label}</span>
            <span className="key-en">{char.en}</span>
          </button>
        ))}
      </div>
      
      <div className="keyboard-row">
        {/* Common uppercase vowels */}
        {vowels.map((letter) => (
          <button
            key={`upper-${letter}`}
            className="keyboard-key vowel-key"
            onClick={() => onLetterClick(letter.toUpperCase())}
            type="button"
            aria-label={`Insert uppercase letter ${letter.toUpperCase()}`}
          >
            {letter.toUpperCase()}
          </button>
        ))}
        
        <button
          className="keyboard-key backspace-key"
          onClick={() => onLetterClick('backspace')}
          type="button"
          aria-label="Backspace"
        >
          ←
        </button>
        
        <button
          className="keyboard-key clear-key"
          onClick={() => onLetterClick('clear')}
          type="button"
          aria-label="Clear"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default RussianKeyboard;
