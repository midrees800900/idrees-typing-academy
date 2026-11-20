# Idrees Typing Academy — Cloudflare backend setup

The backend code is in `functions/` and uses Cloudflare Pages Functions + D1. Google sign-in is handled by Firebase Authentication so the free `pages.dev` hostname can be used.

## 1. Create the database

1. Cloudflare Dashboard → **Workers & Pages → D1 SQL Database → Create database**.
2. Name it `idrees-typing-db`.
3. Open its **Console** and run the complete SQL from `migrations/0001_schema.sql`.

## 2. Bind D1 to Pages

1. Cloudflare Dashboard → **Workers & Pages → Pages → idrees-typing-academy → Settings → Functions**.
2. Under **D1 database bindings**, add:
   - Variable name: `DB`
   - D1 database: `idrees-typing-db`
3. Save, then redeploy the latest Pages deployment.

## 3. Set up Google sign-in with Firebase (free tier)

1. Open the Firebase Console and create a project named **Idrees Typing Academy**.
2. In **Authentication → Sign-in method**, enable **Google** and select a support email.
3. In **Authentication → Settings → Authorized domains**, add:
   `idrees-typing-academy.pages.dev`
4. In **Project settings → General**, register a Web app and copy its config values.
5. Cloudflare Pages → **Settings → Variables and Secrets**. Add these values for Production (and Preview if desired):
   - `FIREBASE_API_KEY` = Firebase web app `apiKey`
   - `FIREBASE_AUTH_DOMAIN` = Firebase web app `authDomain`
   - `FIREBASE_PROJECT_ID` = Firebase project `projectId`
   - `FIREBASE_APP_ID` = Firebase web app `appId`
   These are Firebase client configuration values; do not paste passwords or service-account private keys into GitHub.
6. Save and trigger a new deployment.

## 4. Verify setup

Open:
- `https://idrees-typing-academy.pages.dev/api/health` — should return `{"ok":true,"database":"connected"}`.
- `https://idrees-typing-academy.pages.dev/api/auth/config` — should return `configured: true`.
- `https://idrees-typing-academy.pages.dev/login.html` — test Google sign-in.

## Available backend routes

- `GET /api/auth/session` — current account
- `POST /api/auth/firebase` — verify Firebase Google ID token and create a secure session
- `POST /api/auth/logout` — sign out
- `POST /api/challenge` — create a server-side test (signed in)
- `POST /api/start` — start server timer (signed in)
- `POST /api/submit` — validate result and issue permanent certificate (signed in)
- `GET /api/me` — saved history and dashboard stats
- `GET /api/leaderboard?language=English` — public leaderboard
- `GET /api/certificate?id=...` — public certificate verification

Guests can still practise and print local certificates. Only signed-in, server-validated assessments are saved to the shared database, public certificate registry and leaderboard.
