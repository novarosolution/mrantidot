# Render deploy — 2GB RAM (free tier)

Copy these settings into [Render Dashboard](https://dashboard.render.com).

## Render settings

| Field | Value |
|-------|--------|
| **Plan** | Free (512MB–2GB) |
| **Root Directory** | `server` |
| **Build Command** | `bash render-build.sh` |
| **Start Command** | `npm start` |
| **Health Check** | `/api/health` |

## Environment variables

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `NODE_OPTIONS` | `--max-old-space-size=512` |
| `MONGO_URI` | MongoDB Atlas URI (no `.` in DB name) |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `MONGO_MAX_POOL_SIZE` | `5` (optional, default 5) |
| `CLIENT_URL` | `*` |

Do **not** set `PORT` — Render sets it automatically.

## Memory tuning (already in code)

| Setting | Why |
|---------|-----|
| Server-only install (~27MB) | `.renderignore` + `workspaces=false` — no mobile/Expo |
| `npm prune --omit=dev` after build | No TypeScript/tsx in runtime |
| `--max-old-space-size=512` | Node heap cap — avoids OOM on 2GB |
| Mongo `maxPoolSize: 5` | Small connection pool |
| No `morgan` in production | Less I/O and memory |
| JSON body limit 2MB | Prevents huge request spikes |
| Graceful SIGTERM shutdown | Clean deploys on Render |

## Deploy checklist

- [ ] Atlas **Network Access** → `0.0.0.0/0`
- [ ] Render **Root Directory** = `server`
- [ ] Build = `bash render-build.sh`, Start = `npm start`
- [ ] `MONGO_URI` + `JWT_SECRET` in Environment
- [ ] **Clear build cache** once if old 8GB/mobile build failed
- [ ] Manual Deploy → wait for **Live**
- [ ] `curl https://YOUR-SERVICE.onrender.com/api/health`

## Verify locally

```bash
cd server
bash render-build.sh
NODE_ENV=production MONGO_URI="your-uri" JWT_SECRET="test" npm start
```

Expected log: `[server] API on :4000 (production) heap=XXMB` — typically under 80MB.
