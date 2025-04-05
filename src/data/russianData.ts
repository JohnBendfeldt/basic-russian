/**
 * Russian language data file
 * Contains all content for the Russian Learning App
 */
import { AlphabetItem, PhraseItem } from '../types/index';

// Russian alphabet with pronunciation guides and examples
const alphabet: AlphabetItem[] = [
  {
    letter: 'А',
    pronunciation: 'a',
    example: 'as in father',
    russianWord: 'автобус',
    englishWord: 'bus'
  },
  {
    letter: 'Б',
    pronunciation: 'b',
    example: 'as in boy',
    russianWord: 'брат',
    englishWord: 'brother'
  },
  {
    letter: 'В',
    pronunciation: 'v',
    example: 'as in very',
    russianWord: 'вода',
    englishWord: 'water'
  },
  {
    letter: 'Г',
    pronunciation: 'g',
    example: 'as in go',
    russianWord: 'город',
    englishWord: 'city'
  },
  {
    letter: 'Д',
    pronunciation: 'd',
    example: 'as in dog',
    russianWord: 'дом',
    englishWord: 'house'
  },
  {
    letter: 'Е',
    pronunciation: 'ye',
    example: 'as in yes',
    russianWord: 'ем',
    englishWord: 'I eat'
  },
  {
    letter: 'Ё',
    pronunciation: 'yo',
    example: 'as in yogurt',
    russianWord: 'ёлка',
    englishWord: 'Christmas tree'
  },
  {
    letter: 'Ж',
    pronunciation: 'zh',
    example: 'as in measure',
    russianWord: 'журнал',
    englishWord: 'magazine'
  },
  {
    letter: 'З',
    pronunciation: 'z',
    example: 'as in zoo',
    russianWord: 'завод',
    englishWord: 'factory'
  },
  {
    letter: 'И',
    pronunciation: 'ee',
    example: 'as in meet',
    russianWord: 'имя',
    englishWord: 'name'
  },
  {
    letter: 'Й',
    pronunciation: 'y',
    example: 'as in boy',
    russianWord: 'йогурт',
    englishWord: 'yogurt'
  },
  {
    letter: 'К',
    pronunciation: 'k',
    example: 'as in kite',
    russianWord: 'кошка',
    englishWord: 'cat'
  },
  {
    letter: 'Л',
    pronunciation: 'l',
    example: 'as in lamp',
    russianWord: 'любовь',
    englishWord: 'love'
  },
  {
    letter: 'М',
    pronunciation: 'm',
    example: 'as in man',
    russianWord: 'мама',
    englishWord: 'mom'
  },
  {
    letter: 'Н',
    pronunciation: 'n',
    example: 'as in not',
    russianWord: 'нос',
    englishWord: 'nose'
  },
  {
    letter: 'О',
    pronunciation: 'o',
    example: 'as in more',
    russianWord: 'окно',
    englishWord: 'window'
  },
  {
    letter: 'П',
    pronunciation: 'p',
    example: 'as in pet',
    russianWord: 'папа',
    englishWord: 'dad'
  },
  {
    letter: 'Р',
    pronunciation: 'r',
    example: 'rolled r',
    russianWord: 'рыба',
    englishWord: 'fish'
  },
  {
    letter: 'С',
    pronunciation: 's',
    example: 'as in sun',
    russianWord: 'собака',
    englishWord: 'dog'
  },
  {
    letter: 'Т',
    pronunciation: 't',
    example: 'as in top',
    russianWord: 'телефон',
    englishWord: 'telephone'
  },
  {
    letter: 'У',
    pronunciation: 'oo',
    example: 'as in moon',
    russianWord: 'утро',
    englishWord: 'morning'
  },
  {
    letter: 'Ф',
    pronunciation: 'f',
    example: 'as in fun',
    russianWord: 'фото',
    englishWord: 'photo'
  },
  {
    letter: 'Х',
    pronunciation: 'kh',
    example: 'as in Bach',
    russianWord: 'хлеб',
    englishWord: 'bread'
  },
  {
    letter: 'Ц',
    pronunciation: 'ts',
    example: 'as in bits',
    russianWord: 'центр',
    englishWord: 'center'
  },
  {
    letter: 'Ч',
    pronunciation: 'ch',
    example: 'as in check',
    russianWord: 'чай',
    englishWord: 'tea'
  },
  {
    letter: 'Ш',
    pronunciation: 'sh',
    example: 'as in shine',
    russianWord: 'школа',
    englishWord: 'school'
  },
  {
    letter: 'Щ',
    pronunciation: 'shch',
    example: 'as in fresh cheese',
    russianWord: 'щека',
    englishWord: 'cheek'
  },
  {
    letter: 'Ъ',
    pronunciation: 'hard sign',
    example: 'separates consonant and vowel',
    russianWord: 'объект',
    englishWord: 'object'
  },
  {
    letter: 'Ы',
    pronunciation: 'i',
    example: 'no English equivalent',
    russianWord: 'мы',
    englishWord: 'we'
  },
  {
    letter: 'Ь',
    pronunciation: 'soft sign',
    example: 'softens preceding consonant',
    russianWord: 'мать',
    englishWord: 'mother'
  },
  {
    letter: 'Э',
    pronunciation: 'e',
    example: 'as in bet',
    russianWord: 'это',
    englishWord: 'this'
  },
  {
    letter: 'Ю',
    pronunciation: 'yu',
    example: 'as in you',
    russianWord: 'юг',
    englishWord: 'south'
  },
  {
    letter: 'Я',
    pronunciation: 'ya',
    example: 'as in yard',
    russianWord: 'яблоко',
    englishWord: 'apple'
  }
];

// Basic phrases for everyday communication
const basicPhrases: PhraseItem[] = [
  {
    russian: 'Привет',
    english: 'Hello (informal)',
    pronunciation: 'pree-vyet'
  },
  {
    russian: 'Здравствуйте',
    english: 'Hello (formal)',
    pronunciation: 'zdrah-stvooy-tye'
  },
  {
    russian: 'До свидания',
    english: 'Goodbye',
    pronunciation: 'dah svee-dah-nee-ye'
  },
  {
    russian: 'Спасибо',
    english: 'Thank you',
    pronunciation: 'spah-see-bah'
  },
  {
    russian: 'Пожалуйста',
    english: 'Please / You\'re welcome',
    pronunciation: 'pah-zhal-stah'
  },
  {
    russian: 'Да',
    english: 'Yes',
    pronunciation: 'dah'
  },
  {
    russian: 'Нет',
    english: 'No',
    pronunciation: 'nyet'
  },
  {
    russian: 'Извините',
    english: 'Excuse me / Sorry',
    pronunciation: 'eez-vee-nee-tye'
  },
  {
    russian: 'Как дела',
    english: 'How are you',
    pronunciation: 'kahk dee-lah'
  },
  {
    russian: 'Хорошо',
    english: 'Good / Well',
    pronunciation: 'khah-rah-shoh'
  },
  {
    russian: 'Плохо',
    english: 'Bad / Poorly',
    pronunciation: 'ploh-khah'
  },
  {
    russian: 'Я не понимаю',
    english: 'I don\'t understand',
    pronunciation: 'ya nee pah-nee-mah-yu'
  },
  {
    russian: 'Говорите медленнее',
    english: 'Speak more slowly',
    pronunciation: 'gah-vah-ree-tye myed-lyen-nye-ye'
  },
  {
    russian: 'Повторите пожалуйста',
    english: 'Please repeat',
    pronunciation: 'pahf-tah-ree-tye pah-zhal-stah'
  },
  {
    russian: 'Меня зовут',
    english: 'My name is',
    pronunciation: 'mee-nya zah-voot'
  },
  {
    russian: 'Сколько стоит',
    english: 'How much does it cost',
    pronunciation: 'skohl-kah stoh-eet'
  },
  {
    russian: 'Где туалет',
    english: 'Where is the bathroom',
    pronunciation: 'gdye too-ah-lyet'
  },
  {
    russian: 'Помогите',
    english: 'Help me',
    pronunciation: 'pah-mah-gee-tye'
  },
  {
    russian: 'Я хочу есть',
    english: 'I want to eat',
    pronunciation: 'ya khah-choo yest'
  },
  {
    russian: 'Я хочу пить',
    english: 'I want to drink',
    pronunciation: 'ya khah-choo peet'
  }
];

// Numbers in Russian
const numbers: PhraseItem[] = [
  {
    russian: 'ноль',
    english: 'Zero',
    pronunciation: 'nohl'
  },
  {
    russian: 'один',
    english: 'One',
    pronunciation: 'ah-deen'
  },
  {
    russian: 'два',
    english: 'Two',
    pronunciation: 'dvah'
  },
  {
    russian: 'три',
    english: 'Three',
    pronunciation: 'tree'
  },
  {
    russian: 'четыре',
    english: 'Four',
    pronunciation: 'chee-tih-rye'
  },
  {
    russian: 'пять',
    english: 'Five',
    pronunciation: 'pyat'
  },
  {
    russian: 'шесть',
    english: 'Six',
    pronunciation: 'shest'
  },
  {
    russian: 'семь',
    english: 'Seven',
    pronunciation: 'syem'
  },
  {
    russian: 'восемь',
    english: 'Eight',
    pronunciation: 'voh-seem'
  },
  {
    russian: 'девять',
    english: 'Nine',
    pronunciation: 'dyeh-vyet'
  },
  {
    russian: 'десять',
    english: 'Ten',
    pronunciation: 'dyeh-syet'
  },
  {
    russian: 'одиннадцать',
    english: 'Eleven',
    pronunciation: 'ah-deen-nad-tsat'
  },
  {
    russian: 'двенадцать',
    english: 'Twelve',
    pronunciation: 'dvye-nad-tsat'
  },
  {
    russian: 'тринадцать',
    english: 'Thirteen',
    pronunciation: 'tree-nad-tsat'
  },
  {
    russian: 'четырнадцать',
    english: 'Fourteen',
    pronunciation: 'chee-tir-nad-tsat'
  },
  {
    russian: 'пятнадцать',
    english: 'Fifteen',
    pronunciation: 'peet-nad-tsat'
  },
  {
    russian: 'шестнадцать',
    english: 'Sixteen',
    pronunciation: 'shest-nad-tsat'
  },
  {
    russian: 'семнадцать',
    english: 'Seventeen',
    pronunciation: 'seem-nad-tsat'
  },
  {
    russian: 'восемнадцать',
    english: 'Eighteen',
    pronunciation: 'vah-seem-nad-tsat'
  },
  {
    russian: 'девятнадцать',
    english: 'Nineteen',
    pronunciation: 'dee-veet-nad-tsat'
  },
  {
    russian: 'двадцать',
    english: 'Twenty',
    pronunciation: 'dvad-tsat'
  },
  {
    russian: 'тридцать',
    english: 'Thirty',
    pronunciation: 'treed-tsat'
  },
  {
    russian: 'сорок',
    english: 'Forty',
    pronunciation: 'soh-rak'
  },
  {
    russian: 'пятьдесят',
    english: 'Fifty',
    pronunciation: 'pee-dee-seat'
  },
  {
    russian: 'шестьдесят',
    english: 'Sixty',
    pronunciation: 'shest-dee-seat'
  },
  {
    russian: 'семьдесят',
    english: 'Seventy',
    pronunciation: 'sem-dee-seat'
  },
  {
    russian: 'восемьдесят',
    english: 'Eighty',
    pronunciation: 'voh-seem-dee-seat'
  },
  {
    russian: 'девяносто',
    english: 'Ninety',
    pronunciation: 'dev-ya-noh-stah'
  },
  {
    russian: 'сто',
    english: 'One hundred',
    pronunciation: 'stoh'
  },
  {
    russian: 'тысяча',
    english: 'One thousand',
    pronunciation: 'tih-see-cha'
  }
];

// Common words for everyday use
const commonWords: PhraseItem[] = [
  {
    russian: 'мужчина',
    english: 'man',
    pronunciation: 'moosh-chee-na'
  },
  {
    russian: 'женщина',
    english: 'woman',
    pronunciation: 'zhen-shee-na'
  },
  {
    russian: 'ребенок',
    english: 'child',
    pronunciation: 'ree-byo-nok'
  },
  {
    russian: 'мальчик',
    english: 'boy',
    pronunciation: 'mahl-cheek'
  },
  {
    russian: 'девочка',
    english: 'girl',
    pronunciation: 'dyeh-vach-ka'
  },
  {
    russian: 'друг',
    english: 'friend',
    pronunciation: 'drook'
  },
  {
    russian: 'еда',
    english: 'food',
    pronunciation: 'ye-da'
  },
  {
    russian: 'вода',
    english: 'water',
    pronunciation: 'va-da'
  },
  {
    russian: 'хлеб',
    english: 'bread',
    pronunciation: 'khlyep'
  },
  {
    russian: 'молоко',
    english: 'milk',
    pronunciation: 'ma-la-ko'
  },
  {
    russian: 'мясо',
    english: 'meat',
    pronunciation: 'mya-sa'
  },
  {
    russian: 'рыба',
    english: 'fish',
    pronunciation: 'rih-ba'
  },
  {
    russian: 'овощи',
    english: 'vegetables',
    pronunciation: 'o-va-shi'
  },
  {
    russian: 'фрукты',
    english: 'fruits',
    pronunciation: 'frook-ti'
  },
  {
    russian: 'кофе',
    english: 'coffee',
    pronunciation: 'ko-fe'
  },
  {
    russian: 'чай',
    english: 'tea',
    pronunciation: 'chai'
  },
  {
    russian: 'пиво',
    english: 'beer',
    pronunciation: 'pee-va'
  },
  {
    russian: 'вино',
    english: 'wine',
    pronunciation: 'vee-no'
  },
  {
    russian: 'магазин',
    english: 'store',
    pronunciation: 'ma-ga-zeen'
  },
  {
    russian: 'ресторан',
    english: 'restaurant',
    pronunciation: 're-sta-ran'
  },
  {
    russian: 'гостиница',
    english: 'hotel',
    pronunciation: 'ga-stee-nee-tsa'
  },
  {
    russian: 'станция',
    english: 'station',
    pronunciation: 'stan-tsee-ya'
  },
  {
    russian: 'аэропорт',
    english: 'airport',
    pronunciation: 'a-eh-ra-port'
  },
  {
    russian: 'улица',
    english: 'street',
    pronunciation: 'oo-lee-tsa'
  },
  {
    russian: 'площадь',
    english: 'square',
    pronunciation: 'ploh-shad'
  },
  {
    russian: 'парк',
    english: 'park',
    pronunciation: 'park'
  },
  {
    russian: 'больница',
    english: 'hospital',
    pronunciation: 'bal-nee-tsa'
  },
  {
    russian: 'аптека',
    english: 'pharmacy',
    pronunciation: 'ap-tye-ka'
  },
  {
    russian: 'банк',
    english: 'bank',
    pronunciation: 'bank'
  },
  {
    russian: 'почта',
    english: 'post office',
    pronunciation: 'poch-ta'
  },
  {
    russian: 'полиция',
    english: 'police',
    pronunciation: 'pa-lee-tsee-ya'
  },
  {
    russian: 'музей',
    english: 'museum',
    pronunciation: 'moo-zyey'
  },
  {
    russian: 'театр',
    english: 'theater',
    pronunciation: 'tee-atr'
  },
  {
    russian: 'кино',
    english: 'cinema',
    pronunciation: 'kee-no'
  },
  {
    russian: 'билет',
    english: 'ticket',
    pronunciation: 'bee-lyet'
  },
  {
    russian: 'деньги',
    english: 'money',
    pronunciation: 'dyen-gee'
  },
  {
    russian: 'паспорт',
    english: 'passport',
    pronunciation: 'pass-port'
  },
  {
    russian: 'виза',
    english: 'visa',
    pronunciation: 'vee-za'
  }
];

// Export all data
const russianData = {
  alphabet,
  basicPhrases,
  numbers,
  commonWords
};

export default russianData;