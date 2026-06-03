# Server deploy checklist (Render / Railway / Fly)

## Render settings (required)

| Field | Value |
|-------|--------|
| Root Directory | `server` |
| **Build Command** | `bash render-build.sh` |
| **Start Command** | `bash render-start.sh` |
| Health Check | `/api/health` |

The repo auto-builds on Render when `RENDER` is set (even if Build = `npm install` and Start = `npm run dev`). **Recommended** commands below are faster and clearer.

Or use the repo root [`render.yaml`](../render.yaml) Blueprint.

### If deploy failed with JWT_SECRET or "No open ports"

1. **Environment** → add `JWT_SECRET` (32+ random characters; not `supersecret_change_me`).
2. **Environment** → add `MONGO_URI` (Atlas connection string).
3. **Start Command** → `bash render-start.sh` (not `npm run dev`).
4. **Build Command** → `bash render-build.sh` (not `npm install` only).
5. Redeploy.

## Required environment variables

Set these in the host dashboard (never commit real values):

| Variable | Notes |
|----------|--------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | MongoDB Atlas `mongodb+srv://.../mrantidot` — database name must **not** contain `.` |
| `JWT_SECRET` | Long random string (not `supersecret_change_me`) |
| `CLIENT_URL` | `*` or your app URL |

## Optional (admin sync on startup)

| Variable | Notes |
|----------|--------|
| `ADMIN_PHONE` | E.164 / local digits |
| `ADMIN_PASSWORD` | Strong password |
| `ADMIN_NAME` | Display name |
| `ADMIN_EMAIL` | Login email |
| `ADMIN_CITY` | City label |
| `ENSURE_ADMIN_ON_STARTUP` | `true` (default) |

`PORT` is set automatically by Render — do not hardcode.

## MongoDB Atlas

1. Create cluster + database user.
2. **Network Access** → allow `0.0.0.0/0` (or Render outbound IPs) so the API can connect.
3. Connection string → paste as `MONGO_URI`.

## Verify locally (production build)

```bash
cd server
npm install --include=dev
npm run build
NODE_ENV=production \
  MONGO_URI="your-atlas-uri" \
  JWT_SECRET="your-long-secret" \
  npm start
```

```bash
curl http://localhost:4000/api/health
# → {"ok":true,"db":"connected",...}
```

## After deploy

```bash
curl https://YOUR-SERVICE.onrender.com/api/health
```

Seed demo data once (from your machine, pointed at Atlas):

```bash
MONGO_URI="your-atlas-uri" npm run seed
```

Update mobile `EXPO_PUBLIC_API_URL` / EAS profile to `https://YOUR-SERVICE.onrender.com`.
