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
  },
  {
    russian: 'Доброе утро',
    english: 'Good morning',
    pronunciation: 'doh-bra-ye oo-tra'
  },
  {
    russian: 'Добрый день',
    english: 'Good afternoon',
    pronunciation: 'doh-briy dyen\''
  },
  {
    russian: 'Добрый вечер',
    english: 'Good evening',
    pronunciation: 'doh-briy vye-cheer'
  },
  {
    russian: 'Спокойной ночи',
    english: 'Good night',
    pronunciation: 'spah-koy-nay noh-chee'
  },
  {
    russian: 'Пока',
    english: 'Bye (informal)',
    pronunciation: 'pah-kah'
  },
  {
    russian: 'Очень приятно',
    english: 'Nice to meet you',
    pronunciation: 'oh-cheen\' pree-yat-na'
  },
  {
    russian: 'Не за что',
    english: 'You\'re welcome / Not at all',
    pronunciation: 'nye za shta'
  },
  {
    russian: 'Вы говорите по-английски?',
    english: 'Do you speak English?',
    pronunciation: 'vy gah-vah-ree-tye pah ahn-gleey-skee'
  },
  {
    russian: 'Я немного говорю по-русски',
    english: 'I speak a little Russian',
    pronunciation: 'ya nye-mnoh-gah gah-vah-ryoo pah roos-kee'
  },
  {
    russian: 'Как это по-русски?',
    english: 'How do you say this in Russian?',
    pronunciation: 'kak eh-ta pah roos-kee'
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
  },
  // Question Words
  {
    russian: 'кто',
    english: 'who',
    pronunciation: 'ktoh'
  },
  {
    russian: 'что',
    english: 'what',
    pronunciation: 'shtoh'
  },
  {
    russian: 'где',
    english: 'where',
    pronunciation: 'gdye'
  },
  {
    russian: 'когда',
    english: 'when',
    pronunciation: 'kahg-dah'
  },
  {
    russian: 'почему',
    english: 'why',
    pronunciation: 'pah-chee-moo'
  },
  {
    russian: 'как',
    english: 'how',
    pronunciation: 'kahk'
  },
  {
    russian: 'сколько',
    english: 'how much / how many',
    pronunciation: 'skol\'-kah'
  },
  // Family
  {
    russian: 'семья',
    english: 'family',
    pronunciation: 'seem-ya'
  },
  {
    russian: 'мама',
    english: 'mother / mom',
    pronunciation: 'mah-ma'
  },
  {
    russian: 'папа',
    english: 'father / dad',
    pronunciation: 'pah-pa'
  },
  {
    russian: 'сестра',
    english: 'sister',
    pronunciation: 'see-strah'
  },
  {
    russian: 'брат',
    english: 'brother',
    pronunciation: 'braht'
  },
  {
    russian: 'муж',
    english: 'husband',
    pronunciation: 'moozh'
  },
  {
    russian: 'жена',
    english: 'wife',
    pronunciation: 'zhe-nah'
  },
  // Transportation
  {
    russian: 'метро',
    english: 'subway / metro',
    pronunciation: 'mee-troh'
  },
  {
    russian: 'поезд',
    english: 'train',
    pronunciation: 'poh-yezd'
  },
  {
    russian: 'такси',
    english: 'taxi',
    pronunciation: 'tahk-see'
  },
  {
    russian: 'автобус',
    english: 'bus',
    pronunciation: 'ahf-toh-boos'
  },
  {
    russian: 'машина',
    english: 'car',
    pronunciation: 'mah-shee-na'
  },
  {
    russian: 'самолёт',
    english: 'airplane',
    pronunciation: 'sah-mah-lyot'
  }
];

// Time expressions and telling time
const time: PhraseItem[] = [
  // Asking the time & basics
  {
    russian: 'Который час?',
    english: 'What time is it?',
    pronunciation: 'kah-toh-riy chas'
  },
  {
    russian: 'Сколько сейчас времени?',
    english: 'What time is it now?',
    pronunciation: 'skohl-kah see-chas vrye-mee-nee'
  },
  {
    russian: 'Во сколько?',
    english: 'At what time?',
    pronunciation: 'vah skohl-kah'
  },
  {
    russian: 'время',
    english: 'time',
    pronunciation: 'vrye-mya'
  },
  {
    russian: 'сейчас',
    english: 'now',
    pronunciation: 'see-chas'
  },
  {
    russian: 'час',
    english: 'hour',
    pronunciation: 'chas'
  },
  {
    russian: 'минута',
    english: 'minute',
    pronunciation: 'mee-noo-ta'
  },
  {
    russian: 'секунда',
    english: 'second',
    pronunciation: 'see-koon-da'
  },

  // Hours (Genitive agreement: час, часа, часов)
  {
    russian: 'Один час',
    english: 'One o\'clock',
    pronunciation: 'ah-deen chas'
  },
  {
    russian: 'Два часа',
    english: 'Two o\'clock',
    pronunciation: 'dva cha-sah'
  },
  {
    russian: 'Три часа',
    english: 'Three o\'clock',
    pronunciation: 'tree cha-sah'
  },
  {
    russian: 'Четыре часа',
    english: 'Four o\'clock',
    pronunciation: 'chee-ty-rye cha-sah'
  },
  {
    russian: 'Пять часов',
    english: 'Five o\'clock',
    pronunciation: 'pyat\' cha-sohf'
  },
  {
    russian: 'Шесть часов',
    english: 'Six o\'clock',
    pronunciation: 'shest\' cha-sohf'
  },
  {
    russian: 'Семь часов',
    english: 'Seven o\'clock',
    pronunciation: 'syem\' cha-sohf'
  },
  {
    russian: 'Восемь часов',
    english: 'Eight o\'clock',
    pronunciation: 'voh-seem\' cha-sohf'
  },
  {
    russian: 'Девять часов',
    english: 'Nine o\'clock',
    pronunciation: 'dyeh-vyat\' cha-sohf'
  },
  {
    russian: 'Десять часов',
    english: 'Ten o\'clock',
    pronunciation: 'dyeh-syat\' cha-sohf'
  },
  {
    russian: 'Одиннадцать часов',
    english: 'Eleven o\'clock',
    pronunciation: 'ah-deen-nad-tsat\' cha-sohf'
  },
  {
    russian: 'Двенадцать часов',
    english: 'Twelve o\'clock',
    pronunciation: 'dvye-nad-tsat\' cha-sohf'
  },

  // Times of Day
  {
    russian: 'утра',
    english: 'in the morning (a.m.)',
    pronunciation: 'oot-rah'
  },
  {
    russian: 'дня',
    english: 'in the afternoon (p.m.)',
    pronunciation: 'dnya'
  },
  {
    russian: 'вечера',
    english: 'in the evening (p.m.)',
    pronunciation: 'vye-chee-rah'
  },
  {
    russian: 'ночи',
    english: 'at night',
    pronunciation: 'noh-chee'
  },
  {
    russian: 'полдень',
    english: 'noon / midday',
    pronunciation: 'pohl-dyen\''
  },
  {
    russian: 'полночь',
    english: 'midnight',
    pronunciation: 'pohl-nahch'
  },

  // Practical Expressions
  {
    russian: 'полчаса',
    english: 'half an hour',
    pronunciation: 'pohl-cha-sah'
  },
  {
    russian: 'четверть часа',
    english: 'quarter of an hour',
    pronunciation: 'cheet-vyert\' cha-sah'
  },
  {
    russian: 'Половина первого',
    english: 'Half past twelve (12:30)',
    pronunciation: 'pah-lah-vee-nah pyer-vah-vah'
  },
  {
    russian: 'Без десяти два',
    english: 'Ten to two (1:50)',
    pronunciation: 'byez dye-see-tee dva'
  },
  {
    russian: 'Ровно три часа',
    english: 'Exactly three o\'clock',
    pronunciation: 'rohv-nah tree cha-sah'
  },
  {
    russian: 'вовремя',
    english: 'on time',
    pronunciation: 'voh-vrye-mya'
  },
  {
    russian: 'рано',
    english: 'early',
    pronunciation: 'rah-nah'
  },
  {
    russian: 'поздно',
    english: 'late',
    pronunciation: 'pohz-nah'
  },
  // Days of the Week & Calendar
  {
    russian: 'понедельник',
    english: 'Monday',
    pronunciation: 'pah-nee-dyel\'-neek'
  },
  {
    russian: 'вторник',
    english: 'Tuesday',
    pronunciation: 'ftohr-neek'
  },
  {
    russian: 'среда',
    english: 'Wednesday',
    pronunciation: 'srye-dah'
  },
  {
    russian: 'четверг',
    english: 'Thursday',
    pronunciation: 'cheet-vyerk'
  },
  {
    russian: 'пятница',
    english: 'Friday',
    pronunciation: 'pyat-nee-tsa'
  },
  {
    russian: 'суббота',
    english: 'Saturday',
    pronunciation: 'soo-boh-ta'
  },
  {
    russian: 'воскресенье',
    english: 'Sunday',
    pronunciation: 'vah-skrye-syen\'-ye'
  },
  {
    russian: 'сегодня',
    english: 'today',
    pronunciation: 'see-voh-dnya'
  },
  {
    russian: 'вчера',
    english: 'yesterday',
    pronunciation: 'fchee-rah'
  },
  {
    russian: 'завтра',
    english: 'tomorrow',
    pronunciation: 'zahf-tra'
  },
  {
    russian: 'день',
    english: 'day',
    pronunciation: 'dyen\''
  },
  {
    russian: 'неделя',
    english: 'week',
    pronunciation: 'nee-dye-lya'
  }
];

// Export all data
const russianData = {
  alphabet,
  basicPhrases,
  numbers,
  commonWords,
  time
};

export default russianData;