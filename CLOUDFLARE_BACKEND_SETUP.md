# Idrees Typing Academy — Cloudflare backend setup

The Pages frontend is in this repository. The backend is implemented as Cloudflare Pages Functions and uses Cloudflare D1.

## Required one-time owner setup

1. In the Cloudflare dashboard, open **Workers & Pages → D1 SQL Database → Create database**. Name it `idrees-typing-db`.
2. Open that database's **Console** and execute the complete SQL in `migrations/0001_schema.sql`.
3. Open **Workers & Pages → Pages → idrees-typing-academy → Settings → Functions → D1 database bindings**. Add a binding:
   - Variable name: `DB`
   - D1 database: `idrees-typing-db`
   Save the binding and redeploy the latest deployment.
4. In Google Cloud Console, create an OAuth 2.0 Client ID of type **Web application**. Add this exact Authorized redirect URI:
   `https://idrees-typing-academy.pages.dev/api/auth/google/callback`
   If a custom domain is connected later, add its matching callback URI too. Configure the consent screen accurately; while the OAuth app is in Testing, only listed test accounts can sign in.
5. In Cloudflare Pages → Settings → Variables and Secrets, add these as **encrypted secrets** (not plain text):
   - `GOOGLE_CLIENT_ID` — the OAuth client ID
   - `GOOGLE_CLIENT_SECRET` — the OAuth client secret
6. Trigger a new deployment after saving the D1 binding and secrets.

## Test endpoints

- `GET /api/auth/session` — current signed-in account (or null)
- `GET /api/auth/google/start` — begin Google sign-in
- `POST /api/auth/logout` — sign out
- `POST /api/challenge` — create a server-side typing challenge (signed-in)
- `POST /api/start` — start its server timer (signed-in)
- `POST /api/submit` — validate result and issue permanent certificate (signed-in)
- `GET /api/me` — account history and dashboard stats
- `GET /api/leaderboard?language=English` — public leaderboard
- `GET /api/certificate?id=...` — public certificate verification

## Security notes

- The browser never receives the Google client secret or database credentials.
- Sessions are random, HttpOnly, Secure cookies; only SHA-256 session-token hashes are stored.
- Certificate IDs are random UUIDs. Public verification reads only issued certificate records.
- Guests can continue practising and can make local printable certificates. Only signed-in, server-validated attempts enter the global leaderboard and public certificate registry.
- Do not commit OAuth secrets, database credentials, or personal access tokens to GitHub.
- Google sign-in will not work until the owner completes the setup above. The code deployment alone does not create the D1 database or OAuth credentials.
