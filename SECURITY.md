# Security Policy

## Supported Versions

Security fixes are applied to the latest production deployment on the `master` branch at [https://basicrussian.org](https://basicrussian.org).

| Version / Branch | Supported |
| :--- | :--- |
| `master` (latest release) | Supported |
| Older commits / forks | Not supported |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues, pull requests, or discussions.**

To report a suspected vulnerability privately:

1. Use **GitHub Private Vulnerability Reporting** via the **Security** tab -> **Advisories** -> **Report a vulnerability** on this repository, **or**
2. Email [dev@basicrussian.org](mailto:dev@basicrussian.org) with:
   - A clear description of the issue and affected component or URL.
   - Step-by-step reproduction instructions or a minimal proof of concept.
   - Potential impact assessment.

You can expect an acknowledgment within a few days and coordinated disclosure once a fix is verified and deployed.

---

## Architecture & Scope Context

Before submitting a report, please note how client configuration and backend isolation work in this application:

- **Expected Public Client Variables**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are intentionally public client-side identifiers used by Supabase Auth and PostgREST in the browser. They are **not** private secrets.
- **Database Isolation**: All user data in PostgreSQL is protected by Row Level Security (`auth.uid() = user_id` on `public.quiz_sessions` and `public.word_progress`), explicit `REVOKE ALL ... FROM anon`, and strict `CHECK` constraints defined in [`docs/schema.sql`](docs/schema.sql).
- **In-Scope Security Concerns**:
  - Cross-Site Scripting (XSS) or Content Security Policy (CSP) bypasses
  - OAuth redirect / open-redirect manipulation or token leakage
  - PostgreSQL Row Level Security (RLS) bypasses or privilege escalation
  - Prototype pollution or unsafe JSON deserialization in `localStorage` persistence
  - Sensitive credential or secret exposure
