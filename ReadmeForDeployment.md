# 🚀 Deployment Guide — Express + TypeScript to Vercel

> Deploy your Node.js API to Vercel step by step.
> Follow every step in order. Do not skip.

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Install tsup](#2-install-tsup)
3. [Update package.json](#3-update-packagejson)
4. [Create tsup.config.ts](#4-create-tsupconfigts)
5. [Update tsconfig.json](#5-update-tsconfigjson)
6. [Create vercel.json](#6-create-verceljson)
7. [Test the Build Locally](#7-test-the-build-locally)
8. [Push to GitHub](#8-push-to-github)
9. [Deploy to Vercel](#9-deploy-to-vercel)
10. [Add Environment Variables](#10-add-environment-variables)
11. [Verify Deployment](#11-verify-deployment)
12. [Redeploy After Changes](#12-redeploy-after-changes)
13. [Common Errors & Fixes](#13-common-errors--fixes)

---

## 1. Prerequisites

Before starting, make sure you have:

- [ ] Code pushed to a GitHub repository
- [ ] A [Vercel account](https://vercel.com) — sign up free with your GitHub
- [ ] Node.js installed locally
- [ ] Your project runs locally with `npm run dev`

---

## 2. Install tsup

`tsup` bundles your TypeScript into a single JavaScript file for production.
It is faster and more reliable than `tsc` alone for Vercel deployments.

```bash
npm install tsup --save-dev
```

---

## 3. Update `package.json`

Open `package.json` and update the `scripts` section to exactly this:

```json
{
  "scripts": {
    "dev":   "tsx watch ./src/server.ts",
    "build": "tsup",
    "start": "node dist/server.js"
  }
}
```

**What each script does:**

| Script | When it runs | What it does |
|---|---|---|
| `dev` | Local development | Watches files, restarts on save |
| `build` | Vercel deployment | Bundles TypeScript → JavaScript into `dist/` |
| `start` | Vercel production | Runs the bundled `dist/server.js` |

---

## 4. Create `tsup.config.ts`

Create this file in your **project root** (same level as `package.json`):

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry:    ["src/server.ts"],  // your entry point
  format:   ["cjs"],            // CommonJS — most compatible with Vercel
  target:   "node18",           // match your Node.js version
  outDir:   "dist",
  clean:    true,               // delete dist/ before each build
  bundle:   true,               // bundle all imports into one file
  splitting: false,
  sourcemap: true,              // helps debug production errors
});
```

> ⚠️ **Keep `format: ["cjs"]` only.**
> Using both `["esm", "cjs"]` creates two output files and Vercel picks the wrong one.
> CJS (CommonJS) is the most compatible format for Vercel Node.js deployments.

---

## 5. Update `tsconfig.json`

Add these two lines at the bottom of your `tsconfig.json`,
inside the outer `{}` but **outside** `compilerOptions`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": []
}
```

> `"include": ["src/**/*"]` — tells TypeScript to only compile files inside `src/`.
> `"exclude": []` — overrides the default which excludes `node_modules` differently.

---

## 6. Create `vercel.json`

Create this file in your **project root**:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/server.js"
    }
  ]
}
```

**What each part does:**

| Part | Meaning |
|---|---|
| `"builds"` | Tells Vercel which file to run and which runtime to use |
| `"src": "dist/server.js"` | The bundled output file that `tsup` creates |
| `"use": "@vercel/node"` | Use Vercel's Node.js runtime |
| `"routes"` | Send ALL incoming requests to your server |
| `"src": "/(.*)"` | Match any URL path |
| `"dest": "dist/server.js"` | Forward it to your server |

---

## 7. Test the Build Locally

**Before pushing to GitHub, always test the build locally first.**

```bash
npm run build
```

**Expected output:**
```
dist/server.js    XX kb
dist/server.js.map  XX kb
```

Then test the built file runs:

```bash
node dist/server.js
```

```bash
curl http://localhost:5000/
# Expected: { "message": "DevPulse API is running ✅" }
```

> ✅ If this works locally, it will work on Vercel.
> ❌ If this fails locally, fix it before pushing — Vercel will fail for the same reason.

---

## 8. Push to GitHub

Add all changed files and push:

```bash
git add .
git commit -m "chore: add vercel deployment config"
git push
```

**Files that should be committed:**

```
✅ package.json        — updated scripts
✅ tsup.config.ts      — new bundler config
✅ tsconfig.json       — updated include/exclude
✅ vercel.json         — new Vercel routing config
```

**Files that must NOT be committed** — confirm these are in `.gitignore`:

```
❌ .env               — contains secrets
❌ dist/              — generated on build, not committed
❌ node_modules/      — installed on deploy automatically
```

Your `.gitignore` should contain:

```
node_modules/
dist/
.env
logger.txt
```

---

## 9. Deploy to Vercel

### Option A — Vercel CLI (recommended)

```bash
# Install Vercel CLI globally if not already installed
npm install -g vercel

# Login to your Vercel account
vercel login
# Opens browser — log in with GitHub

# Deploy to production
vercel --prod
```

**First time running `vercel --prod`**, it asks a few questions:

```
? Set up and deploy? → Y
? Which scope? → your account name
? Link to existing project? → N (first time)
? What is your project name? → devpulse (or press enter for default)
? In which directory is your code? → ./ (press enter)
? Want to override settings? → N
```

After this, every future `vercel --prod` deploys instantly with no questions.

### Option B — Vercel Dashboard (alternative)

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Framework Preset → **Other**
4. Build Command → `npm run build`
5. Output Directory → `dist`
6. Click Deploy

---

## 10. Add Environment Variables

> ⚠️ **Critical step.** Vercel cannot read your local `.env` file.
> You must add every variable manually in the Vercel dashboard.

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project → **Settings** → **Environment Variables**
3. Add each variable from your `.env` file:

| Key | Value |
|---|---|
| `PORT` | `5000` |
| `CONNECTIONSTRING` | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | `your_secret_here` |
| `JWT_REFRESH_SECRET` | `your_refresh_secret_here` |

4. Set **Environment** to `Production` for all of them
5. Click **Save**
6. **Redeploy** — environment variables only take effect after a new deployment:

```bash
vercel --prod
```

---

## 11. Verify Deployment

After deployment, Vercel gives you a URL like:
`https://devpulse-abc123.vercel.app`

Test your live API:

```bash
# Health check
curl https://your-project.vercel.app/

# Register a user
curl -X POST https://your-project.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com","password":"secret123","role":"contributor"}'

# Login
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"secret123"}'

# Get all issues
curl https://your-project.vercel.app/api/issues
```

---

## 12. Redeploy After Changes

Every time you make changes:

```bash
# 1. Test locally first
npm run dev

# 2. Build and test the bundle
npm run build
node dist/server.js

# 3. Push to GitHub
git add .
git commit -m "your message"
git push

# 4. Deploy
vercel --prod
```

> 💡 If you connected your GitHub repo in the Vercel dashboard,
> pushing to `main` branch can trigger automatic deployments — no CLI needed.

---

## 13. Common Errors & Fixes

### ❌ `Cannot find module` after deploy

**Cause:** A package is in `devDependencies` but needed at runtime.

**Fix:** Move it to `dependencies`:
```bash
npm install <package-name> --save
```

---

### ❌ `dist/server.js not found`

**Cause:** Build did not run, or `tsup.config.ts` has wrong `outDir`.

**Fix:**
```bash
npm run build
# Check dist/ folder exists and contains server.js
ls dist/
```

---

### ❌ Environment variables undefined in production

**Cause:** Variables not added in Vercel dashboard, or added after last deploy.

**Fix:**
1. Go to Vercel → Project → Settings → Environment Variables
2. Add or update the variable
3. Run `vercel --prod` again — variables only load after redeploy

---

### ❌ `Database connection failed` in production

**Cause:** Wrong connection string in Vercel environment variables,
or database not allowing external connections.

**Fix:**
- Double check `CONNECTIONSTRING` value in Vercel dashboard — no extra spaces
- If using NeonDB: make sure `?sslmode=require` is at the end of the connection string
- If using local PostgreSQL: Vercel cannot reach `localhost` — use a cloud DB

---

### ❌ `504 Gateway Timeout`

**Cause:** Your server is not listening on the correct port,
or taking too long to respond.

**Fix:** Vercel manages the port — your app just needs to call `app.listen()`.
Make sure `server.ts` does not hardcode a port that conflicts:

```typescript
// ✅ Correct — reads from env, falls back to 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, ...);
```

---

### ❌ CORS error from frontend

**Cause:** Your `cors()` config only allows `localhost:3000`.

**Fix:** Update `app.ts` to allow your frontend's production URL:

```typescript
app.use(cors({
  origin: [
    "http://localhost:3000",           // local dev
    "https://your-frontend.vercel.app" // production frontend
  ],
  credentials: true,
}));
```

---

## ✅ Final Deployment Checklist

```
□ tsup installed as devDependency
□ package.json scripts: dev, build, start all correct
□ tsup.config.ts exists in root with format: ["cjs"]
□ tsconfig.json has include and exclude fields
□ vercel.json exists in root pointing to dist/server.js
□ npm run build succeeds locally
□ node dist/server.js runs locally
□ .env is in .gitignore
□ dist/ is in .gitignore
□ All files committed and pushed to GitHub
□ All environment variables added in Vercel dashboard
□ vercel --prod ran successfully
□ Live URL tested with curl or Postman
```