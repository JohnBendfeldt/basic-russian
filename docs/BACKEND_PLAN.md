# Full-Stack & Security Architecture: Supabase PostgreSQL, OAuth 2.0 (Google, Entra ID, GitHub) & React 19 PWA

## 1. Executive Summary
**Basic Russian** (`basicrussian.org`) is architected as a privacy-first, guest-ready React 19 Progressive Web App (PWA) backed by **Supabase Auth** and **Supabase PostgreSQL** with strict **Row Level Security (RLS)**.

Learners can use every feature immediately without an account (Guest Mode via `localStorage`), or optionally sign in with **Google**, **Microsoft Entra ID (Azure)**, or **GitHub** to migrate their local study history and synchronize quiz sessions, accuracy metrics, and spaced-repetition mastery across devices.

---

## 2. Guiding Principles
1. **Guest-First, Zero Friction**: 100% of lessons and quizzes work offline and unauthenticated. Guest progress is stored locally in `localStorage` and automatically uploaded and cleared once a user signs in.
2. **Defense-in-Depth Security**:
   - Passwordless OAuth 2.0 / OpenID Connect (OIDC) authentication via Supabase Auth.
   - Database-enforced Row Level Security (`auth.uid() = user_id`), `anon` role privilege revocation, and SQL `CHECK` constraints (`docs/schema.sql`).
   - Strict HTTP security headers in `netlify.toml`, including a Content Security Policy (CSP) without `'unsafe-inline'` scripts, HSTS preload, `X-Frame-Options: DENY`, and `Cross-Origin-Opener-Policy: same-origin-allow-popups`.
   - Client-side validation of Supabase HTTPS endpoints, OAuth avatar URLs (`referrerPolicy="no-referrer"`), Cyrillic audio guards, and prototype-pollution-safe `localStorage` parsing.
3. **Serverless & Zero-Maintenance Operations**: Static CDN delivery via Netlify paired directly with Supabase's managed Auth and PostgREST layer—eliminating custom middleware servers while enforcing authorization at the database row level.

---

## 3. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["React 19 + Vite 6 PWA (Netlify CDN)"]
        UI["Alphabet / Phrases / Numbers & Time / Quiz"]
        UserMenu["UserMenu & AuthModal"]
        ProgressModal["ProgressModal (My Stats & Review)"]
        ProgressService["ProgressService (Cloud + Guest Fallback)"]
        LocalStore[("Browser localStorage")]
    end

    subgraph IdP["OAuth 2.0 / OIDC Identity Providers"]
        Google["Google Identity"]
        Entra["Microsoft Entra ID"]
        GitHub["GitHub OAuth"]
    end

    subgraph Supabase["Supabase Cloud"]
        GoTrue["Supabase Auth (JWT Session)"]
        PostgREST["PostgREST + RLS Engine"]
        AuthUsers[("auth.users")]
        QuizSessions[("public.quiz_sessions")]
        WordProgress[("public.word_progress")]
    end

    UserMenu -->|OAuth Redirect| GoTrue
    GoTrue <-->|OIDC / OAuth 2.0| Google
    GoTrue <-->|OIDC / OAuth 2.0| Entra
    GoTrue <-->|OAuth 2.0| GitHub
    GoTrue --> AuthUsers
    GoTrue -->|Signed JWT| ProgressService

    UI --> ProgressService
    ProgressModal --> ProgressService
    ProgressService -->|Unauthenticated Fallback| LocalStore
    ProgressService -->|HTTPS + Bearer JWT| PostgREST
    PostgREST -->|auth.uid() = user_id| QuizSessions
    PostgREST -->|auth.uid() = user_id| WordProgress
```

---

## 4. Database Schema & Row Level Security

The canonical schema lives in [`docs/schema.sql`](schema.sql) and links directly to Supabase's managed `auth.users` table with `ON DELETE CASCADE`:

* **`public.quiz_sessions`**:
  - Tracks completed quiz category, `score`, `total_questions`, generated `percentage`, and `completed_at` timestamp.
  - Enforces `CHECK (score >= 0 AND score <= total_questions)` and `CHECK (total_questions > 0 AND total_questions <= 500)`.
* **`public.word_progress`**:
  - Tracks per-item spaced-repetition performance (`word_id`, `category`, `prompt`, `answer`, `times_correct`, `times_incorrect`, `last_tested_at`, `mastery_level`).
  - Enforces `UNIQUE (user_id, word_id)` and `CHECK (mastery_level BETWEEN 0 AND 5)`.
  - Mastery increases by `+1` per correct attempt and decreases by `-1` per miss (clamped `0`–`5`). Missed words remain in **Words to Review** until reaching `mastery_level >= 2`, and items reaching `mastery_level >= 5` are marked mastered.
* **Privilege & RLS Isolation**:
  - `REVOKE ALL` from `anon`; `GRANT` least-privilege operations exclusively to `authenticated`.
  - Explicit `SELECT`, `INSERT`, `UPDATE`, and `DELETE` RLS policies restrict every query and mutation to `auth.uid() = user_id`.

---

## 5. Environment & Identity Configuration

1. Copy `.env.example` to `.env.local` for local cloud-sync testing (or leave unconfigured to run in Guest Mode):
   ```bash
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<supabase-anon-public-key>
   ```
   *(Note: `VITE_SUPABASE_ANON_KEY` is a publishable client key designed to be paired with PostgreSQL RLS; never expose a `service_role` secret in client environment variables.)*
2. Run [`docs/schema.sql`](schema.sql) in the Supabase SQL Editor.
3. Enable **Google**, **Azure (Microsoft Entra ID)**, and **GitHub** providers under **Supabase Dashboard → Authentication → Providers**, and add `https://basicrussian.org` (plus `http://localhost:5173` for local dev) to **Redirect URLs**.
4. Microsoft Entra publisher domain verification is served from `/well-known/microsoft-identity-association.json` and routed via `/.well-known/*` rules in [`netlify.toml`](../netlify.toml).

---

## 6. Implementation Status

- [x] **Client Data & Spaced-Repetition Layer**: Implemented `src/types/progress.ts` and `src/services/progressService.ts` with prototype-safe `localStorage` persistence and mastery calculation.
- [x] **Supabase Auth & OAuth Providers**: Implemented `src/services/supabaseClient.ts`, `AuthModal.tsx`, and `UserMenu.tsx` supporting Google, Microsoft Entra ID, and GitHub sign-in.
- [x] **PostgreSQL Schema & RLS Hardening**: Shipped `docs/schema.sql` with `auth.users` foreign keys, `CHECK` constraints, `anon` privilege revocation, and strict `auth.uid() = user_id` policies.
- [x] **Progress Dashboard & One-Time Guest Sync**: Implemented `ProgressModal.tsx` ("My Stats" & Cyrillic-aware "Words to Review") and deduplicated guest-to-cloud migration on sign-in.
- [x] **React 19 & OWASP Security Hardening**: Upgraded to React 19 + TypeScript 5.9 and hardened CSP (`script-src 'self'`), HSTS, COOP, and OAuth avatar handling.
