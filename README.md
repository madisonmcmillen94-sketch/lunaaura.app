# LunaAura

A lunar / planetary / earth-activity guide for nervous-system self-awareness,
with a Firestore-backed journal and a once-a-day AI-generated reading.

## Stack

- **Frontend:** React + Vite, deployed as a static site.
- **Astronomy:** `astronomy-engine` (real moon phase / planet retrograde
  calculations, no API key needed).
- **Earth data:** live, free, no-key public feeds — USGS (earthquakes) and
  NOAA SWPC (planetary K-index / geomagnetic storms).
- **Journal:** Firebase Firestore, scoped to each visitor via Firebase
  Anonymous Auth (no email/password signup needed).
- **Daily AI reading:** a Vercel serverless function (`/api/forecast`) calls
  OpenAI **at most once per calendar day** and caches the result in
  Firestore — every visitor that day gets the same cached text, so cost
  stays flat no matter how much traffic the site gets.

## Local development

```bash
npm install
cp .env.local.example .env.local   # then fill in the Firebase client values below
npm run dev       # dev server (the /api function won't run here — see note below)
npm run build     # production build -> dist/
npm run preview   # serve the production build locally
```

Note: `npm run dev` / `vite preview` don't run Vercel serverless functions,
so `/api/forecast` will 404 locally and the page falls back to the
rule-based (non-AI) reading automatically — that's expected, not a bug.
The AI reading only comes alive once deployed on Vercel with the env vars
below set.

## One-time setup

### 1. Firebase (already done for the `lunaaura-8cf90` / "LunaAura 3" project)

Already configured in that project:
- A Web app was registered (gives you the `VITE_FIREBASE_*` values below).
- **Firestore** database exists.
- **Anonymous** sign-in is enabled (Authentication → Sign-in method).
- Firestore **rules** were published covering the `journals` collection
  (each entry readable/writable only by the anonymous user who owns it,
  matched on a `userId` field), the `forecasts` collection (public read,
  no client writes — only the server's Admin SDK can write it), and the
  `natalCharts` collection (one doc per user, keyed by their own uid —
  readable/writable only by that same user).

If you ever recreate the project, you need those same three things:
Firestore enabled, Anonymous auth enabled, and rules that include:

```
match /journals/{entryId} {
  allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
}
match /forecasts/{day} {
  allow read: if true;
  allow write: if false;
}
match /natalCharts/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` for local dev, and set the same
names in **Vercel → Project Settings → Environment Variables** for
production. Two different trust levels:

**Client-side (safe to expose — these are public identifiers, not secrets):**
From Firebase console → ⚙️ Project settings → General → Your apps → the web
app → SDK setup and configuration.
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

**Server-only (real secrets — set in Vercel, never in a `VITE_` var, never in chat):**
From Firebase console → ⚙️ Project settings → **Service accounts** →
Generate new private key (downloads a JSON file — copy the three fields out
of it):
```
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY       (paste the whole key, including the BEGIN/END lines)
```
From platform.openai.com → API keys:
```
OPENAI_API_KEY
```

### 3. Cost control on the OpenAI key

`/api/forecast` checks Firestore for today's cached reading before calling
OpenAI at all. If it's already there, it returns the cache and never touches
the OpenAI API. So the call volume is **~1 per day, period** — not per
visitor. At that rate, a `$100` credit balance lasts a very long time even
with real traffic. If you ever want a hard ceiling anyway, OpenAI lets you
set a monthly budget limit on the API key itself at platform.openai.com →
Settings → Limits.

### 4. Stripe (Plus + All Access subscription tiers)

The app is already wired up to gate features by tier (`free` / `plus` /
`all_access`), stored on `/users/{uid}.tier` in Firestore and written **only**
by the webhook below via the Admin SDK — Firestore rules block the client
from setting it directly. To turn on real checkout:

1. **Create the 4 Prices in Stripe** (dashboard.stripe.com → Product catalog
   → Add product). Two products, each with a monthly and a yearly Price:
   - **LunaAura Plus** — $2.99/mo, $24/yr
   - **LunaAura All Access** — $4.99/mo, $39/yr

   Copy each Price's ID (starts `price_`) into Vercel as:
   ```
   STRIPE_PRICE_PLUS_MONTHLY
   STRIPE_PRICE_PLUS_YEARLY
   STRIPE_PRICE_ALL_ACCESS_MONTHLY
   STRIPE_PRICE_ALL_ACCESS_YEARLY
   ```

2. **Add your Stripe secret key** to Vercel as `STRIPE_SECRET_KEY`. Start
   with the **test** key (`sk_test_...`) from Developers → API keys so you
   can run through checkout with Stripe's test card (`4242 4242 4242 4242`,
   any future expiry/CVC) before touching real cards. Switch to the live
   key later by updating this one env var.

3. **Create the webhook endpoint**: Stripe dashboard → Developers →
   Webhooks → Add endpoint. URL: `https://lunaaura-app.vercel.app/api/stripe-webhook`.
   Events to send: `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`. After creating it, open the endpoint and
   copy its **Signing secret** (`whsec_...`) into Vercel as `STRIPE_WEBHOOK_SECRET`.

4. **Firebase Admin credentials** — the webhook needs these to write the
   tier to Firestore, and they should already be set from step 1 of this
   README, but double-check they're actually present in Vercel (Project →
   Settings → Environment Variables): `FIREBASE_PROJECT_ID`,
   `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`. If they're missing,
   `/api/forecast`'s AI caching and the Stripe webhook will both silently
   fail — go back to Firebase console → Project settings → Service accounts
   → Generate new private key for the values.

5. **Redeploy** after adding the env vars (Vercel → Deployments → Redeploy,
   same as after any env var change) and test the full flow: Pricing page →
   choose a paid tier → Stripe's test checkout → land back on `/pricing` →
   confirm the nav badge shows the new tier (may take a few seconds for the
   webhook to land).

None of the above needs code changes — it's all Stripe dashboard + Vercel
env vars, both of which only you can do since they involve pasting secret
keys.

## Getting this into GitHub / Vercel

This folder has no `.git` yet. Repo `madisonmcmillen94-sketch/lunaaura.app`
is already created and empty on GitHub — push into that one:

1. Open a Codespace on that repo (or clone it locally).
2. Copy all files from this project into the repo folder (or upload+unzip
   this project's zip there).
3. In the repo's terminal:
   ```bash
   git add .
   git commit -m "Initial LunaAura build"
   git push
   ```
4. In Vercel: **Add New → Project → Import** the `lunaaura.app` repo.
   Framework preset: **Vite** (usually auto-detected). Build command
   `npm run build`, output directory `dist`.
5. Add all the environment variables from section 2 above in Vercel's
   project settings **before** the first deploy (or redeploy after adding
   them).
6. Deploy.

## Important: this will NOT automatically inherit the old LunaAura channel's Google ranking

Search ranking is tied to a **domain/URL**, not a brand name. A brand-new
site — even with the exact same name — starts with no ranking history of
its own. To actually benefit from LunaAura's past search visibility, you'd
need one of:

- The **same domain** the old presence used to live on (if you still own
  it), or
- **Backlinks** from the old YouTube channel (channel description, video
  descriptions, pinned comments) pointing at the new site, or
- A genuinely useful **content strategy** here (the Learn articles are a
  start) that Google indexes and ranks on its own merits over time.

If the plan is "relaunch LunaAura content on YouTube and link to this
site," that's the fastest real path to traffic — search ranking for a brand
new site typically takes weeks to months regardless.

## Honesty note on the content itself

The Forecast and Learn copy (and the AI prompt in `/api/forecast.ts`) are
written to be clear about what's real astronomy/geophysics (moon phases,
retrogrades, earthquakes, geomagnetic storms — all genuinely measured)
versus what's intuitive/spiritual framing (that these things affect *your*
nervous system specifically). Keeping that line visible is both more honest
and lower-risk than presenting it as established science.
