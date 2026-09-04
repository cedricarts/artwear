# GitHub → Netlify auto-deploy setup

## 1. Before you push anything — get your real values into .env

```bash
cp .env.example .env
```

Open `.env` and fill in your real Firebase config (from Firebase
Console → Project Settings → General → "Your apps" → SDK setup and
config) and Cloudinary values (Cloudinary Console → Dashboard for
cloud name; Settings → Upload → your unsigned preset name).

Restart `npm run dev` after editing `.env` — Vite reads it once on
server start, not on hot-reload.

Confirm `.env` is NOT tracked:
```bash
git status
```
It should not appear in the list (`.gitignore` already excludes it —
see the updated file in this delivery). If it DOES show up, you're
on an older `.gitignore` — copy the one from this delivery over yours
before your first commit.

## 2. Initialize git and push to GitHub (skip what you've already done)

```bash
cd artwear-web            # your project root
git init                  # only if not already a repo
git add .
git commit -m "Add neumorphic redesign, admin home content, theme toggle"
```

On GitHub: create a new empty repository (no README/gitignore/license
— you already have those), then:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

**Double-check before this push**: run `git log --all -p -- src/firebase/firebase.js`
or just open the file — if it still contains your real API keys
instead of `import.meta.env.VITE_...`, STOP and apply the code changes
from this delivery first. Once real keys hit a public GitHub history,
even non-secret ones, they're in that history forever unless you
rewrite it — easier to not put them there.

## 3. Connect Netlify to the GitHub repo

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Choose **GitHub**, authorize if prompted, select your repo
3. Build settings (should auto-detect from `netlify.toml`, confirm anyway):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Before clicking Deploy** — add environment variables (this is the
   step people skip and then get a broken build with a blank white
   screen and no error): **Site settings → Environment variables → Add a variable**,
   one at a time, matching your `.env` exactly:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_CLOUDINARY_CLOUD_NAME`
   - `VITE_CLOUDINARY_UPLOAD_PRESET`
5. Deploy.

## 4. Auto-deploy on push — this part needs nothing extra

Once connected, Netlify's default behavior IS "push to main → auto
build → auto deploy." Nothing more to configure. Every `git push`
triggers a new build using whatever env vars are set in step 4 above.

If you ever change an env var value in Netlify's dashboard, you must
**trigger a new deploy manually** (Deploys tab → Trigger deploy →
Deploy site) — changing the dashboard value alone does not rebuild
the already-deployed site.

## 5. Add your Firebase domain to authorized domains

Firebase Auth will reject Google/email sign-in from a domain it
doesn't recognize. Once Netlify gives you a URL (e.g.
`yoursite.netlify.app`, or your custom domain if you set one):

Firebase Console → Authentication → Settings → **Authorized domains** → Add domain

Do this now, not after your first "why doesn't login work on the live
site" debugging session.

## What this does NOT cover — separate system, don't conflate

The **Yoco Cloud Functions secrets** (`YOCO_SECRET_KEY`,
`YOCO_WEBHOOK_SECRET`) from earlier in this build are set via
`firebase functions:secrets:set`, into Firebase's Secret Manager —
NOT into `.env`, and NOT into Netlify's environment variables.
Cloud Functions run on Firebase's infrastructure, not Netlify's;
Netlify only ever builds and serves your static frontend. Mixing
these up (e.g. trying to read `YOCO_SECRET_KEY` via
`import.meta.env` in frontend code) would attempt to ship your
payment secret key to every visitor's browser — don't.
