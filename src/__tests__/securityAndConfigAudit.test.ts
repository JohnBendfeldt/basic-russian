import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '../..');

describe('Security Headers, CSP, HTML Script-Injection & PostgreSQL RLS Regression Audit', () => {
  const netlifyToml = fs.readFileSync(path.join(ROOT_DIR, 'netlify.toml'), 'utf-8');
  const schemaSql = fs.readFileSync(path.join(ROOT_DIR, 'docs/schema.sql'), 'utf-8');
  const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));

  it('enforces pre-deploy test gating, OWASP security headers, and strict script-src CSP in netlify.toml', () => {
    expect(netlifyToml).toContain('command = "npm test && npm run build"');
    expect(netlifyToml).toContain('X-Frame-Options = "DENY"');
    expect(netlifyToml).toContain('X-Content-Type-Options = "nosniff"');
    expect(netlifyToml).toContain('Cross-Origin-Opener-Policy = "same-origin-allow-popups"');
    expect(netlifyToml).toContain('Referrer-Policy = "strict-origin-when-cross-origin"');
    expect(netlifyToml).toContain('Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"');

    const cspMatch = netlifyToml.match(/Content-Security-Policy\s*=\s*"([^"]+)"/);
    expect(cspMatch).not.toBeNull();
    const csp = cspMatch![1];

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("worker-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain('upgrade-insecure-requests');

    const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src')) || '';
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it('ensures no HTML entry points contain executable inline <script> blocks that would violate strict CSP', () => {
    const htmlFiles = ['index.html', 'public/privacy/index.html', 'public/terms/index.html'];
    for (const relPath of htmlFiles) {
      const fullPath = path.join(ROOT_DIR, relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const html = fs.readFileSync(fullPath, 'utf-8');

      const scriptTags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
      for (const [, attrs, body] of scriptTags) {
        const isJsonLd = /type=["']application\/ld\+json["']/i.test(attrs);
        const hasExternalSrc = /\bsrc=["'][^"']+["']/i.test(attrs);
        if (!isJsonLd) {
          expect(hasExternalSrc).toBe(true);
          expect(body.trim()).toBe('');
        }
      }
    }
  });

  it('enforces Row Level Security, anon privilege revocation, and CHECK constraints in docs/schema.sql', () => {
    for (const table of ['quiz_sessions', 'word_progress']) {
      expect(schemaSql).toContain(`REVOKE ALL ON public.${table} FROM anon;`);
      expect(schemaSql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }
    expect(schemaSql).toContain('TO authenticated');
    expect(schemaSql).toContain('USING (auth.uid() = user_id)');
    expect(schemaSql).toContain('WITH CHECK (auth.uid() = user_id)');
    expect(schemaSql).toContain('CHECK (score >= 0 AND score <= total_questions)');
    expect(schemaSql).toContain('CHECK (mastery_level BETWEEN 0 AND 5)');
  });

  it('stays pinned to React 19.3+ and TypeScript 5.9+ with valid PWA manifest', () => {
    expect(pkgJson.dependencies.react).toMatch(/^\^?19\./);
    expect(pkgJson.dependencies['react-dom']).toMatch(/^\^?19\./);
    expect(pkgJson.devDependencies.typescript).toMatch(/^\^?5\.9\./);

    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'public/manifest.json'), 'utf-8'));
    expect(manifest.name).toBeTruthy();
    expect(['.', '/']).toContain(manifest.start_url);
  });
});
