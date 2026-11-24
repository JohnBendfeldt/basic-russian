import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const BASE_URL = 'https://basicrussian.org';
const SITE_NAME = 'Basic Russian';
const PERSON_ID = 'https://johnbendfeldt.com/#person';

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
      'Learn Russian numbers and telling time with authentic native audio. Count in Russian from 0 to 1,000 and tell time accurately.',
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

export function buildRouteJsonLd(baseJsonLd, route) {
  const canonicalUrl = `${BASE_URL}${route.path}`;
  const breadcrumbId = `${canonicalUrl}#breadcrumb`;
  const graph = Array.isArray(baseJsonLd['@graph']) ? [...baseJsonLd['@graph']] : [];

  graph.push(
    {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: route.title,
      description: route.description,
      inLanguage: ['en', 'ru'],
      isPartOf: { '@id': `${BASE_URL}/#website` },
      about: { '@id': `${BASE_URL}/#course` },
      author: { '@id': PERSON_ID },
      breadcrumb: { '@id': breadcrumbId },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': breadcrumbId,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: SITE_NAME,
          item: `${BASE_URL}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: route.heading,
          item: canonicalUrl,
        },
      ],
    }
  );

  return {
    ...baseJsonLd,
    '@graph': graph,
  };
}

export function generateSeoRoutes() {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Missing built index.html at ${indexPath}`);
  }

  const template = fs.readFileSync(indexPath, 'utf-8');
  const ldMatch = template.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  const baseJsonLd = ldMatch ? JSON.parse(ldMatch[1]) : null;

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
      <p>${escapeHtml(route.summary)} Created by <a href="https://johnbendfeldt.com/" rel="author">John Bendfeldt</a>. Please enable JavaScript to use the full interactive app.</p>
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

    if (baseJsonLd) {
      const routeJsonLd = buildRouteJsonLd(baseJsonLd, route);
      const serializedLd = JSON.stringify(routeJsonLd, null, 2).replace(/</g, '\\u003c');
      html = html.replace(
        /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,
        () => `<script type="application/ld+json">\n${serializedLd}\n    </script>`
      );
    }

    const outFile = path.join(DIST_DIR, `${route.path.replace(/^\/+/, '')}.html`);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, html, 'utf-8');
  }

  // Stamp dist/sitemap.xml <lastmod> with the build date so deploys stay fresh
  const distSitemapPath = path.join(DIST_DIR, 'sitemap.xml');
  if (fs.existsSync(distSitemapPath)) {
    const today = new Date().toISOString().slice(0, 10);
    const sitemapXml = fs
      .readFileSync(distSitemapPath, 'utf-8')
      .replace(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g, `<lastmod>${today}</lastmod>`);
    fs.writeFileSync(distSitemapPath, sitemapXml, 'utf-8');
  }

  console.log(`Generated ${ROUTES.length} static SEO route HTML files in dist/`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateSeoRoutes();
}

