# Free Hosting + Free API Guide (GitHub-based)

This guide shows how to host this app for free from GitHub and use a free-tier API setup.

## Option A (Recommended): Vercel + GitHub + Firebase + Gemini API free tier

## Short answer to "Nikiweka tu `VITE_GEMINI_API_KEY` then Deploy?"

Ndiyo, **karibu** hiyo tu inatosha kwa Gemini side, lakini app hii pia inahitaji Firebase keys; hakikisha mambo haya 5 yapo sawa:

1. Repo ipo GitHub na imeunganishwa kwenye Vercel project sahihi.
2. Environment variables zimewekwa kwa environment unayotaka (Production/Preview/Development).
3. Variable names zote ni exact (hakuna typo/space), hasa:
   - `VITE_GEMINI_API_KEY`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Firebase Console: washa **Email/Password** na **Google Sign-In** chini ya Authentication providers.
5. Baada ya kuweka env vars/providers, fanya **Redeploy** (ili build mpya isome config).

Ukikosa hatua ya 5, app inaweza kuendelea kuonyesha error ya missing config hata kama ume-set vars.

### 1) Push your code to GitHub
1. Create a repo on GitHub.
2. Push this project.

### 2) Create a Vercel project
1. Go to Vercel dashboard.
2. Click **Add New → Project** and import your GitHub repo.
3. Framework preset should auto-detect **Vite**.

### 3) Add environment variables
In Vercel project settings, add all required client vars:
- `VITE_GEMINI_API_KEY`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### 3.1) Configure Firebase Authentication
- Enable **Email/Password** sign-in provider.
- Enable **Google** sign-in provider.
- Add your Vercel domain (`*.vercel.app`) in Authorized domains if needed.

### 3.2) Apply Firestore security rules
- This repo includes `firestore.rules` with per-user contact isolation.
- Deploy rules from Firebase CLI before going live.

### 4) Deploy
- Trigger deploy from main branch.
- Vercel gives a free `.vercel.app` URL.

## Option B: GitHub Pages (frontend only) + serverless proxy

Use this only if you do not want Vercel/Netlify.

- GitHub Pages is static hosting.
- Because this app calls Gemini directly from client-side code, your key can be exposed in browser bundles.
- For better security, place API calls behind a free serverless function (Cloudflare Workers / Vercel Functions / Netlify Functions) and keep secret keys server-side.

## Free API strategy notes

- Gemini offers a free tier suitable for prototypes and low-traffic projects.
- Track request quotas and model availability in Google AI Studio billing/quota pages.
- If free quota ends, requests fail until quota resets or you upgrade.

## Security checklist (important)

- Never hardcode API keys in source files.
- Treat client-side keys as public-by-design; apply app restrictions where possible.
- For production, move Gemini calls to a backend endpoint and keep secret keys server-side.
- Restrict key usage where possible and rotate keys if leaked.

## Quick `.env.local` example

```bash
VITE_GEMINI_API_KEY=your_real_key_here
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

## Troubleshooting

- **Error: Missing Gemini API key**
  - Ensure `.env.local` exists locally and Vercel environment variable is set in cloud.
- **Error: Firebase config missing / auth not initialized**
  - Ensure all `VITE_FIREBASE_*` values are present and redeploy.
- **Build passes but app fails on deploy**
  - Confirm env var names are exactly correct and Firebase Auth providers are enabled.
- **CORS or blocked requests**
  - Use a backend proxy if provider restrictions apply.
