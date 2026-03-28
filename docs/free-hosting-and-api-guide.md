# Free Hosting + Free API Guide (GitHub-based)

This guide shows how to host this app for free from GitHub and use a free-tier API setup.

## Option A (Recommended): Vercel + GitHub + Gemini API free tier

## Short answer to "Nikiweka tu `VITE_GEMINI_API_KEY` then Deploy?"

Ndiyo, **karibu** hiyo tu inatosha kwa Vercel, lakini hakikisha mambo haya 4 yapo sawa:

1. Repo ipo GitHub na imeunganishwa kwenye Vercel project sahihi.
2. Environment Variable imewekwa kwa environment unayotaka (Production/Preview/Development).
3. Variable name ni **exactly** `VITE_GEMINI_API_KEY` (hakuna typo/space).
4. Baada ya kuweka env var, fanya **Redeploy** (ili build mpya isome key).

Ukikosa hatua ya 4, app inaweza kuendelea kuonyesha error ya missing key hata kama ume-set variable.

### 1) Push your code to GitHub
1. Create a repo on GitHub.
2. Push this project.

### 2) Create a Vercel project
1. Go to Vercel dashboard.
2. Click **Add New → Project** and import your GitHub repo.
3. Framework preset should auto-detect **Vite**.

### 3) Add environment variable
In Vercel project settings, add:
- `VITE_GEMINI_API_KEY` = your Gemini API key

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
- Use `VITE_GEMINI_API_KEY` only for prototype-level client-side use.
- For production, move Gemini calls to a backend endpoint and keep the key as a server secret.
- Restrict key usage where possible and rotate keys if leaked.

## Quick `.env.local` example

```bash
VITE_GEMINI_API_KEY=your_real_key_here
```

## Troubleshooting

- **Error: Missing Gemini API key**
  - Ensure `.env.local` exists locally and Vercel environment variable is set in cloud.
- **Build passes but app fails on deploy**
  - Confirm env var name is exactly `VITE_GEMINI_API_KEY`.
- **CORS or blocked requests**
  - Use a backend proxy if provider restrictions apply.
