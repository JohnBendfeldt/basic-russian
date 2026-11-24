import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '../..');
const BASE_URL = 'https://basicrussian.org';

describe('SEO, Structured Data, Sitemap & Asset Integrity Audit', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');
  const robotsTxt = fs.readFileSync(path.join(ROOT_DIR, 'public/robots.txt'), 'utf-8');
  const sitemapXml = fs.readFileSync(path.join(ROOT_DIR, 'public/sitemap.xml'), 'utf-8');
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'public/manifest.json'), 'utf-8'));

  it('includes complete primary SEO, robots, Open Graph, and Twitter Card meta tags in index.html', () => {
    const titleMatch = indexHtml.match(/<title>([^<]+)<\/title>/i);
    expect(titleMatch).not.toBeNull();
    expect(titleMatch![1].length).toBeGreaterThanOrEqual(20);
    expect(titleMatch![1].length).toBeLessThanOrEqual(70);

    const descMatch = indexHtml.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    expect(descMatch).not.toBeNull();
    expect(descMatch![1].length).toBeGreaterThanOrEqual(100);
    expect(descMatch![1].length).toBeLessThanOrEqual(200);

    expect(indexHtml).toMatch(/<meta\s+name="robots"\s+content="[^"]*index,\s*follow[^"]*"/i);
    expect(indexHtml).toContain('<meta name="author" content="John Bendfeldt" />');
    expect(indexHtml).toContain('<link rel="author" href="https://johnbendfeldt.com/" />');
    expect(indexHtml).toContain(`<link rel="canonical" href="${BASE_URL}/" />`);

    for (const prop of [
      'og:type',
      'og:url',
      'og:site_name',
      'og:locale',
      'og:title',
      'og:description',
      'og:image',
      'og:image:width',
      'og:image:height',
      'og:image:alt',
    ]) {
      expect(indexHtml).toContain(`property="${prop}"`);
    }

    for (const name of [
      'twitter:card',
      'twitter:title',
      'twitter:description',
      'twitter:image',
      'twitter:image:alt',
    ]) {
      expect(indexHtml).toContain(`name="${name}"`);
    }
  });

  it('embeds valid JSON-LD structured data with Person, EducationalOrganization, WebSite, WebApplication, and Course', () => {
    const ldMatch = indexHtml.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    expect(ldMatch).not.toBeNull();

    const jsonLd = JSON.parse(ldMatch![1]);
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(Array.isArray(jsonLd['@graph'])).toBe(true);

    const types = jsonLd['@graph'].map((node: { '@type': string }) => node['@type']);
    expect(types).toContain('Person');
    expect(types).toContain('EducationalOrganization');
    expect(types).toContain('WebSite');
    expect(types).toContain('WebApplication');
    expect(types).toContain('Course');

    const person = jsonLd['@graph'].find((node: { '@type': string }) => node['@type'] === 'Person');
    expect(person['@id']).toBe('https://johnbendfeldt.com/#person');
    expect(person.name).toBe('John Bendfeldt');
    expect(person.url).toBe('https://johnbendfeldt.com/');

    const org = jsonLd['@graph'].find((node: { '@type': string }) => node['@type'] === 'EducationalOrganization');
    expect(org.founder).toEqual({ '@id': 'https://johnbendfeldt.com/#person' });

    const webApp = jsonLd['@graph'].find((node: { '@type': string }) => node['@type'] === 'WebApplication');
    expect(webApp.author).toEqual({ '@id': 'https://johnbendfeldt.com/#person' });
    expect(webApp.creator).toEqual({ '@id': 'https://johnbendfeldt.com/#person' });
  });

  it('never references non-existent public assets in index.html or manifest.json', () => {
    expect(indexHtml).not.toContain('/splash-screen.png');

    for (const icon of manifest.icons || []) {
      const assetPath = path.join(ROOT_DIR, 'public', icon.src.replace(/^\//, ''));
      expect(fs.existsSync(assetPath), `Missing manifest icon: ${icon.src}`).toBe(true);
    }

    for (const shot of manifest.screenshots || []) {
      const assetPath = path.join(ROOT_DIR, 'public', shot.src.replace(/^\//, ''));
      expect(fs.existsSync(assetPath), `Missing manifest screenshot: ${shot.src}`).toBe(true);
    }

    expect(fs.existsSync(path.join(ROOT_DIR, 'public/og-image.png'))).toBe(true);
  });

  it('configures robots.txt and sitemap.xml consistently with canonical URLs and lastmod dates', () => {
    expect(robotsTxt).toContain('User-agent: *');
    expect(robotsTxt).toContain('Allow: /');
    expect(robotsTxt).toContain(`Sitemap: ${BASE_URL}/sitemap.xml`);

    const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const lastmods = [...sitemapXml.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)];
    expect(locs.length).toBeGreaterThanOrEqual(9);
    expect(new Set(locs).size).toBe(locs.length);
    expect(lastmods.length).toBe(locs.length);

    expect(locs).toContain(`${BASE_URL}/`);
    for (const loc of locs) {
      expect(loc.startsWith(BASE_URL)).toBe(true);
    }
  });

  it('includes canonical, author, and Open Graph tags on standalone legal pages', () => {
    for (const page of ['privacy', 'terms']) {
      const html = fs.readFileSync(path.join(ROOT_DIR, `public/${page}/index.html`), 'utf-8');
      expect(html).toContain(`<link rel="canonical" href="${BASE_URL}/${page}">`);
      expect(html).toContain('<meta name="author" content="John Bendfeldt">');
      expect(html).toContain('<link rel="author" href="https://johnbendfeldt.com/">');
      expect(html).toContain('<meta name="robots" content="index, follow">');
      expect(html).toContain(`property="og:url" content="${BASE_URL}/${page}"`);
    }
  });
});
