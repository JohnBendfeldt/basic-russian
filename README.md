# 🇷🇺 Basic Russian

An interactive, responsive Russian language learning application featuring Microsoft Neural TTS pronunciation audio, an integrated Cyrillic keyboard with live phonetic transliteration, adaptive quizzes, cloud progress sync, and Progressive Web App (PWA) support.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-basicrussian.org-22c55e?style=for-the-badge&logo=google-chrome&logoColor=white)](https://basicrussian.org)
[![React](https://img.shields.io/badge/React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript%205-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22%20LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite%206-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-98_Passing-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20RLS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=black)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-f59e0b?style=for-the-badge&logo=pwa&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Netlify](https://img.shields.io/badge/Hosted%20on-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://basicrussian.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 🌟 Overview

**Basic Russian** ([basicrussian.org](https://basicrussian.org)) is built for English speakers to rapidly learn the Cyrillic alphabet, numbers, telling time, high-frequency Russian vocabulary, and survival phrases.

Designed with modern web performance and security in mind, it provides instant neural audio feedback, live Latin-to-Cyrillic phonetic typing, an adaptive quiz engine with spaced-repetition mastery, optional OAuth cloud sync, and offline PWA learning capabilities.

* 🚀 **Live Application**: [https://basicrussian.org](https://basicrussian.org)
* 🌐 **Multi-Language Hub**: Part of [Basic Language School](https://basiclanguage.school) (15+ world languages across 210 bidirectional pairs).

---

## 🚀 Key Features

* **🔊 Microsoft Neural TTS Pronunciation**: Crystal-clear audio playback (`ru-RU-SvetlanaNeural`) across all 33 Cyrillic letters, pronunciation examples, numbers, time expressions, common words, and survival phrases—with automatic browser Web Speech API fallback.
* **📚 Structured Beginner Curriculum**:
  * **Cyrillic Alphabet (`/alphabet`)**: All 33 Russian letters with pronunciation guides, transliteration, and audio examples.
  * **Basic Phrases (`/phrases`)**: Essential greetings, etiquette, travel expressions, and conversational survival phrases.
  * **Numbers & Telling Time (`/numbers` & `/time`)**: Interactive Russian numbers (0–1000+) and practical clock/time expressions.
  * **Common Words (`/words`)**: Expanded everyday vocabulary covering family, days of the week, question words, food, and daily life with flashcard reveal modes.
* **⌨️ Integrated Cyrillic Keyboard & Live Transliteration**: Type Russian directly without a physical Russian keyboard using either the on-screen Cyrillic keyboard or live phonetic Latin-to-Cyrillic transliteration.
* **🎯 Adaptive Quiz Engine (`/quiz`)**:
  * Topic category filtering, Russian-to-English and English-to-Russian modes, and Levenshtein-distance fuzzy matching to forgive minor typos and soft/hard sign nuances.
  * Spaced-repetition mastery tracking (levels `0`–`3`), audio reinforcement, and end-of-session score recaps.
* **☁️ Guest-First Progress & OAuth Cloud Sync**:
  * **100% Playable Without Login**: Guest quiz history and weak words are saved locally in `localStorage` and viewable in the **My Stats** modal.
  * **1-Click Single Sign-On**: Optional login via **Google**, **Microsoft Entra ID**, or **GitHub** (powered by Supabase Auth OAuth 2.0 / OIDC) seamlessly migrates guest progress to PostgreSQL and syncs across devices.
* **📱 Progressive Web App (PWA)**: Installable on iOS, Android, and Desktop via `vite-plugin-pwa` + Workbox (`NetworkFirst` HTML navigation + `StaleWhileRevalidate` audio caching) with automatic iOS WebKit update checks.

---

## 🔒 Security Architecture

* **Strict Content Security Policy (CSP)**: Enforces `script-src 'self'` (no `'unsafe-inline'` or `'unsafe-eval'`), `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `worker-src 'self'`, and `upgrade-insecure-requests`.
* **OWASP HTTP Headers**: Configured in [`netlify.toml`](netlify.toml) with HSTS (`max-age=31536000; includeSubDomains; preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Cross-Origin-Opener-Policy: same-origin-allow-popups`, `Referrer-Policy: strict-origin-when-cross-origin`, and restrictive `Permissions-Policy`.
* **Database Row Level Security (RLS) & Constraints**: PostgreSQL tables (`public.quiz_sessions`, `public.word_progress`) revoke `anon` access, enforce `auth.uid() = user_id` RLS policies across all `SELECT`/`INSERT`/`UPDATE`/`DELETE` operations, and validate score/mastery bounds via SQL `CHECK` constraints (see [`docs/schema.sql`](docs/schema.sql)).
* **Zero Password Handling & Safe Client Storage**: Passwordless federated OAuth 2.0 / OIDC sign-in, strict `https:` validation on Supabase endpoints and OAuth avatar URLs (`referrerPolicy="no-referrer"`), Cyrillic-only audio safety guards, and prototype-pollution-safe `localStorage` parsing.

*Detailed system architecture and database design are documented in [`docs/BACKEND_PLAN.md`](docs/BACKEND_PLAN.md).*

---

## 🤖 Built with Google Antigravity & Gemini

This project is actively developed and architected using **Google Antigravity** paired with **Google Gemini / Advanced Agentic AI**.

* **Agentic Pair Programming**: Used Antigravity's autonomous multi-step workflows to modernize the app to React 19 & Vite 6, harden security headers and RLS schemas, configure Vitest suites, and manage continuous deployment.
* **Modern Developer Velocity**: Demonstrates AI-accelerated full-stack engineering while maintaining strict TypeScript type safety, test coverage, and security standards.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript 5.9, Modern CSS (CSS Variables, Flexbox, CSS Grid)
* **Build Tool & PWA**: Vite 6, `@vitejs/plugin-react`, `vite-plugin-pwa` v2 (Workbox)
* **Auth & Cloud Database**: Supabase Auth (Google, Microsoft Entra ID, GitHub OAuth) + Supabase PostgreSQL with Row Level Security
* **Testing**: Vitest 5, React Testing Library 16, JSDOM
* **Audio & Assets**: Pre-rendered Microsoft Neural TTS (`ru-RU-SvetlanaNeural`) MP3s + Native Web Speech API fallback
* **Deployment & Hosting**: Netlify (Automated CI/CD from `master`, OWASP security headers, SSL, service worker anti-stale caching rules)

---

## 💻 Local Development

### Prerequisites
* **Node.js**: `v22.x` LTS or later
* **npm**: `v10.x` or later

### Setup & Running
```bash
# 1. Clone the repository
git clone https://github.com/JohnBendfeldt/basic-russian.git
cd basic-russian

# 2. Install dependencies
npm install

# 3. (Optional) Configure Supabase for OAuth & Cloud Sync
# Without .env.local, the app runs seamlessly in offline Guest Mode.
cp .env.example .env.local

# 4. Start development server (runs on http://localhost:5173 with Vite HMR)
npm run dev   # or: npm start

# 5. Run automated test suite
npm test

# 6. Production typecheck, build & preview
npm run build
npm run preview
```

### Regenerating Curriculum Audio (Optional)
```bash
# Requires Python 3 and edge-tts
npm run generate-audio         # Generate missing audio files
npm run generate-audio:force   # Force-regenerate all curriculum audio
npm run generate-audio:time    # Regenerate telling-time audio only
```

---

## 🌐 Deployment Configuration

The application is configured for deployment on **Netlify** via [`netlify.toml`](netlify.toml):

* **Build command**: `npm run build` (`tsc && vite build`)
* **Publish directory**: `dist`
* **Environment variables** (for cloud sync): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
* **Primary Custom Domain**: `basicrussian.org`

---

## 🤝 Contributing & Security

* **Contributing**: Native-speaker Russian translation fixes, Cyrillic keyboard/transliteration improvements, accessibility fixes, and bug fixes with tests are welcome — please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.
* **Security**: Please report suspected vulnerabilities privately rather than opening a public issue; see [`SECURITY.md`](SECURITY.md) for disclosure instructions.

---

## 👤 Author

**John Bendfeldt**  
* GitHub: [@JohnBendfeldt](https://github.com/JohnBendfeldt)  
* Live App: [basicrussian.org](https://basicrussian.org)  
* Contact: [dev@basiclanguage.school](mailto:dev@basiclanguage.school)

---

## 📄 License
This project's source code is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

> **Branding Note**: While the source code is open source under MIT, the **Basic Russian** / **Basic Language School** names, domain branding (`basicrussian.org`), and custom academic emblems are reserved for the official platform.
