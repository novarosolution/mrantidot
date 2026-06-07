# Deploy Mr Antidot API on Render

Follow these steps in order.

## Why builds were ~8GB (free tier fails)

This repo is a **monorepo** (server + mobile). If Render installs from the workspace root, npm pulls **Expo / React Native** deps (multi‑GB). Fixes in this repo:

- **Root Directory** must be `server`
- `.renderignore` excludes `mobile/` from the upload
- `server/.npmrc` sets `workspaces=false` — **server-only** ~70MB install
- `render-build.sh` prunes devDependencies after compile

---

## Step 1 — MongoDB Atlas

1. Open [MongoDB Atlas](https://cloud.mongodb.com) → your cluster.
2. **Database Access** — user with read/write on your database.
3. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`) so Render can connect.
4. **Connect** → Drivers → copy the connection string.  
   Example shape: `mongodb+srv://USER:PASSWORD@cluster.mongodb.net/mrantidot?retryWrites=true&w=majority`  
   Replace `USER`, `PASSWORD`, and keep the database name **without dots** (e.g. `mrantidot` or `mrantidot-v2`).

## Step 2 — Push code (if you changed anything locally)

```bash
cd "/Users/kuldip/app mrantidot"
git add -A
git commit -m "deploy: Render production fixes"   # skip if nothing to commit
git push origin main
```

## Step 3 — Render web service

[Render Dashboard](https://dashboard.render.com) → your API service (or **New +** → **Web Service** → connect `novarosolution/mrantidot`).

### Settings

| Field | Value |
|-------|--------|
| **Root Directory** | `server` |
| **Runtime** | Node |
| **Build Command** | `bash render-build.sh` |
| **Start Command** | `npm start` |

### Environment variables

Click **Environment** → add:

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your Atlas connection string (from Step 1) |
| `JWT_SECRET` | Run locally: `openssl rand -hex 32` and paste the result |
| `CLIENT_URL` | `*` |
| `ADMIN_PHONE` | Your admin phone (optional) |
| `ADMIN_PASSWORD` | Your admin password (optional) |
| `ADMIN_EMAIL` | Your admin email (optional) |
| `ADMIN_NAME` | Your admin name (optional) |
| `ENSURE_ADMIN_ON_STARTUP` | `true` |

`PORT` is set by Render automatically — do not override.

### Deploy

**Manual Deploy** → **Deploy latest commit** → wait until status is **Live**.

## Step 4 — Verify API

```bash
curl https://YOUR-SERVICE-NAME.onrender.com/api/health
```

Expected:

```json
{"ok":true,"db":"connected","time":"..."}
```

If `"db":"disconnected"` or error: check `MONGO_URI` and Atlas network access.

## Step 5 — Seed database (first time)

From your Mac (uses your Atlas URI):

```bash
cd "/Users/kuldip/app mrantidot/server"
MONGO_URI="your-atlas-uri-here" npm run seed
```

## Step 6 — Mobile app / APK

Set the public API URL:

```bash
# mobile/.env or EAS build
EXPO_PUBLIC_API_URL=https://YOUR-SERVICE-NAME.onrender.com
```

Rebuild the app or restart Expo with that URL.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| JWT_SECRET error | Add `JWT_SECRET` in Render Environment (or redeploy latest code for auto-JWT) |
| MONGO_URI error | Add Atlas URI in Render Environment |
| Port timeout / no open ports | Start Command must be `npm start` or `bash render-start.sh` |
| **8GB / disk / build failed** | Root Directory = `server`, Build = `bash render-build.sh`, not repo root `npm install` |
| Works locally, not on Render | Atlas **Network Access** must allow Render (0.0.0.0/0) |

Support files: [`server/DEPLOY.md`](server/DEPLOY.md), [`render.yaml`](render.yaml)
