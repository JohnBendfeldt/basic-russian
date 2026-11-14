# Contributing to Basic Russian

Thank you for helping improve **Basic Russian** (`basicrussian.org`)! Contributions from Russian native speakers, teachers, and frontend/accessibility engineers are warmly welcomed.

To keep pull requests focused and safe for learners, please review these guidelines before opening an issue or PR.

---

## What We Welcome

- **Curriculum, Translation & Stress/Phonetic Fixes**
  - Improving natural Russian/English translations, Cyrillic examples, pronunciation cues, numbers, and time-telling expressions in `src/data/russianData.ts`.
- **Cyrillic Keyboard & Transliteration Improvements**
  - Improving live Latin-to-Cyrillic transliteration (`src/utils/transliteration.ts`), on-screen keyboard ergonomics (`src/components/RussianKeyboard.tsx`), or quiz grading tolerance (`src/components/Quiz.tsx`), accompanied by unit tests.
- **Accessibility & Mobile UX Fixes**
  - Improving keyboard navigation, ARIA semantics, audio controls, or mobile layout ergonomics.
- **Bug Fixes with Regression Tests**
  - Resolving reproducible bugs along with focused Vitest unit/integration tests in `src/__tests__/`.

---

## What Requires Maintainer Discussion First (or Is Out of Scope)

Please open an issue and discuss with the maintainer **before** submitting large changes in these areas:

- **Visual Redesigns & Major UI Overhauls**: Unsolicited redesigns or header/navigation restructuring will usually be declined unless coordinated first.
- **Bulk Binary Audio Regeneration**: Do **not** regenerate or commit bulk `.mp3` files under `public/audio/` in PRs. Edit the curriculum TypeScript text or open a **Translation or Audio Correction** issue so the maintainer can synthesize consistent studio neural audio (`ru-RU-SvetlanaNeural`) and update `src/data/audioManifest.ts`.
- **Database Schema & Authentication Changes**: Do not modify `docs/schema.sql`, Netlify security headers (`netlify.toml`), or OAuth providers without prior approval.
- **Third-Party Tracking, Ads, or Analytics**: Basic Russian is strictly privacy-first and ad-free; tracking SDKs will not be accepted.
- **Unrelated Formatting Churn**: Keep diffs tight and focused on the lines you actually changed.

---

## Local Development Setup

1. Fork the repository and create a branch from `master`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the app in Guest Mode (no `.env.local` or Supabase credentials are required):
   ```bash
   npm run dev
   ```
4. The repository includes `.editorconfig`, `.gitattributes`, and `.vscode/settings.json` to keep line endings (`LF`) and formatting consistent. Do **not** reformat unrelated files or introduce `CRLF` line endings.

---

## Pull Request Checklist

Before opening a pull request against `master`, please verify locally:

1. **Automated Tests Pass**:
   ```bash
   npm test
   ```
2. **Production Typecheck & Build Pass** (checks TypeScript compilation, Vite bundle, and PWA service worker build):
   ```bash
   npm run build
   ```
3. **No Sensitive Data or Local Machine Paths**:
   - Never commit `.env*` files, API keys, tokens, or local absolute paths (such as `/Users/...` or `C:\...`).
   - Do not modify `docs/schema.sql` unless explicitly requested for an approved schema migration.
4. **Focused Diff**: Ensure `git diff` contains only your intentional changes and passes CI (`.github/workflows/ci.yml`).
