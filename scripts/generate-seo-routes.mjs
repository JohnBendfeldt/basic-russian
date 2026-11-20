import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const BASE_URL = 'https://basicrussian.org';

const ROUTES = [
  {
    path: '/alphabet',
    title: 'Russian Alphabet (Cyrillic) | Basic Russian',
    description:
      'Learn the 33 letters of the Russian alphabet (Cyrillic) with pronunciation guides, audio examples, and transliteration. Free interactive Russian alphabet chart for beginners.',
    heading: 'Russian Alphabet (Cyrillic)',
    summary:
      'Learn all 33 letters of the Russian Cyrillic alphabet with studio neural audio pronunciation, example words, and Latin transliteration.',
  },
  {
    path: '/phrases',
    title: 'Basic Russian Phrases | Basic Russian',
    description:
      'Learn essential Russian phrases for beginners with audio pronunciation. Greetings, introductions, common expressions, and everyday Russian phrases with English translations.',
    heading: 'Basic Russian Phrases for Beginners',
    summary:
      'Practice essential Russian greetings, introductions, polite expressions, and everyday travel phrases with native audio pronunciation.',
  },
  {
    path: '/numbers',
    title: 'Russian Numbers & Time | Basic Russian',
    description:
      'Learn Russian numbers and telling time with authentic native audio. Count in Russian from 1 to 1000 and tell time accurately.',
    heading: 'Russian Numbers (0–1,000)',
    summary:
      'Learn how to count in Russian from 0 to 1,000 with studio neural audio pronunciation and transliteration guides.',
  },
  {
    path: '/time',
    title: 'Russian Time & Telling Time | Basic Russian',
    description:
      'Learn how to tell time in Russian with authentic native audio pronunciation. Hours, minutes, and practical time expressions for beginners.',
    heading: 'Telling Time in Russian',
    summary:
      'Learn how to ask and tell time in Russian with grammar rules for hours, minutes, and authentic native audio pronunciation.',
  },
  {
    path: '/words',
    title: 'Common Russian Words | Basic Russian',
    description:
      'Learn the most common Russian words with audio pronunciation and English translations. Build your Russian vocabulary with essential everyday words for beginners.',
    heading: 'Common Russian Words & Vocabulary',
    summary:
      'Build your core Russian vocabulary with high-frequency everyday words, transliteration guides, and native audio pronunciation.',
  },
  {
    path: '/quiz',
    title: 'Russian Quiz | Basic Russian',
    description:
      'Test your Russian knowledge with interactive quizzes covering the alphabet, phrases, numbers, and vocabulary. Free Russian language practice for beginners.',
    heading: 'Interactive Russian Practice Quiz',
    summary:
      'Test your Russian Cyrillic alphabet, phrases, numbers, time, and vocabulary with adaptive quizzes and an on-screen Cyrillic keyboard.',
  },
];

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const indexPath = path.join(DIST_DIR, 'index.html');
if (!fs.existsSync(indexPath)) {
  throw new Error(`Missing built index.html at ${indexPath}`);
}

const template = fs.readFileSync(indexPath, 'utf-8');

for (const route of ROUTES) {
  const canonicalUrl = `${BASE_URL}${route.path}`;
  const escapedTitle = escapeHtml(route.title);
  const escapedDesc = escapeHtml(route.description);

  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escapedTitle}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      () => `<meta name="description" content="${escapedDesc}" />`
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      () => `<link rel="canonical" href="${canonicalUrl}" />`
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
      () => `<meta property="og:url" content="${canonicalUrl}" />`
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      () => `<meta property="og:title" content="${escapedTitle}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      () => `<meta property="og:description" content="${escapedDesc}" />`
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
      () => `<meta name="twitter:title" content="${escapedTitle}" />`
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
      () => `<meta name="twitter:description" content="${escapedDesc}" />`
    )
    .replace(
      /<noscript>[\s\S]*?<\/noscript>/i,
      () => `<noscript>
      <h1>${escapeHtml(route.heading)}</h1>
      <p>${escapeHtml(route.summary)} Please enable JavaScript to use the full interactive app.</p>
      <nav aria-label="Lessons and resources">
        <ul>
          <li><a href="/">Basic Russian Home</a></li>
          <li><a href="/alphabet">Russian Alphabet (Cyrillic)</a></li>
          <li><a href="/phrases">Basic Russian Phrases</a></li>
          <li><a href="/numbers">Russian Numbers</a></li>
          <li><a href="/time">Telling Time in Russian</a></li>
          <li><a href="/words">Common Russian Words</a></li>
          <li><a href="/quiz">Russian Quiz</a></li>
          <li><a href="/privacy">Privacy Policy</a></li>
          <li><a href="/terms">Terms of Service</a></li>
        </ul>
      </nav>
    </noscript>`
    );

  const outFile = path.join(DIST_DIR, `${route.path.replace(/^\/+/, '')}.html`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html, 'utf-8');
}

console.log(`Generated ${ROUTES.length} static SEO route HTML files in dist/`);
