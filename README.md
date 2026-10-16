# 🇷🇺 Russian Learning App

An interactive, responsive Russian language learning application featuring native audio pronunciation, adaptive quizzes, an on-screen Cyrillic keyboard, and Progressive Web App (PWA) support.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-basicrussian.org-22c55e?style=for-the-badge&logo=google-chrome&logoColor=white)](https://basicrussian.org)
[![React](https://img.shields.io/badge/React%2018-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22%20LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite%206-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Ready-f59e0b?style=for-the-badge&logo=pwa&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Netlify](https://img.shields.io/badge/Hosted%20on-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://basicrussian.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 🌟 Overview

**Russian Learning App** is built for English speakers to rapidly learn Cyrillic and foundational Russian phrases. Designed with modern web performance in mind, it provides instant audio feedback, an adaptive quiz engine, and offline learning capabilities.

🚀 **Live Application**: [https://basicrussian.org](https://basicrussian.org)

---

## 🚀 Key Features

* **🔊 Native Audio Pronunciation**: High-quality audio playback for alphabet letters, pronunciation examples, common vocabulary, and survival phrases.
* **⌨️ Integrated Cyrillic Keyboard & Transliteration**: Allows users without a physical Russian keyboard to type in Russian directly, featuring phonetic auto-transliteration mapping.
* **🎯 Adaptive Quiz Engine with Fuzzy Matching**:
  * Employs Levenshtein-distance string matching to forgive minor typos while learning Cyrillic.
  * Real-time answer validation, phonetic soft/hard sign checks, and dual Russian-to-English / English-to-Russian testing modes.
  * Audio reinforcement on correct and incorrect responses.
* **📱 Progressive Web App (PWA)**: Installable on iOS, Android, and Desktop with offline caching via Workbox and modern Service Workers.
* **🎨 Responsive Design**: Fluid mobile-first interface optimized for touchscreen phones, tablets, and desktop displays.

---

## 🤖 Built with Google Antigravity & Gemini

This project is actively developed and architected using **Google Antigravity** paired with **Google Gemini / Advanced Agentic AI**.

* **Agentic Pair Programming**: Used Antigravity's multi-step autonomous workflows to modernize the build system to Vite 6, configure Vitest testing suites, and manage continuous deployment.
* **Architectural Planning**: Leveraged Gemini for full-stack data modeling, designing normalized PostgreSQL schemas, and planning serverless Netlify Functions with OAuth 2.0 (Google & Microsoft Entra ID).
* **Modern Developer Velocity**: Demonstrates cutting-edge AI-accelerated software engineering practices—accelerating iteration speed while maintaining strict code quality, type safety, and testing standards.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, TypeScript, Modern CSS (CSS Variables, Flexbox, CSS Grid)
* **Build Tool & Bundler**: Vite 6, `@vitejs/plugin-react`, `vite-plugin-pwa`
* **Testing**: Vitest, React Testing Library, JSDOM
* **Deployment & Hosting**: Netlify (Automated CI/CD from `master`, custom security headers, SSL, service worker caching rules)
* **Audio & Assets**: Compressed audio files with custom automated asset generator scripts

---

## 🗺️ Roadmap & In-Progress Architecture

We are currently engineering a serverless backend layer to support user accounts and progress synchronization:
* **Database**: PostgreSQL (Serverless via Supabase/Neon) with Drizzle ORM.
* **Enterprise & Consumer Authentication**: OAuth 2.0 / OIDC sign-in via **Google** and **Microsoft Entra ID (Azure AD)**.
* **Cloud Sync**: Cross-device sync for quiz sessions, accuracy trends, and spaced-repetition mastery tracking per word.

*Detailed design and SQL schemas are documented in [docs/BACKEND_PLAN.md](docs/BACKEND_PLAN.md).*

---

## 💻 Local Development

### Prerequisites
* **Node.js**: `v22.x` (Active LTS) or later
* **npm**: `v10.x` / `v11.x` or later

### Setup & Running
```bash
# 1. Clone the repository
git clone https://github.com/JohnBendfeldt/russian-learning-app.git
cd russian-learning-app

# 2. Install dependencies
npm install

# 3. Start development server (runs with Vite HMR)
npm start

# 4. Run automated test suite
npm test

# 5. Production build & preview
npm run build
npm run preview
```

---

## 👤 Author

**John Bendfeldt**  
* GitHub: [@JohnBendfeldt](https://github.com/JohnBendfeldt)  
* Live App: [basicrussian.org](https://basicrussian.org)  
* Contact: [dev@basicrussian.org](mailto:dev@basicrussian.org)

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
