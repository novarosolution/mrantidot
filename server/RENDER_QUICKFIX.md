# Render deploy — quick fix

## 1. Push latest code

```bash
git add server/
git commit -m "fix: Render production bootstrap and JWT auto-config"
git push origin main
```

## 2. Render → Environment (required)

| Variable | Example |
|----------|---------|
| `MONGO_URI` | `mongodb+srv://USER:PASS@cluster.mongodb.net/mrantidot?retryWrites=true&w=majority` |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | (optional) long random string — auto-generated if omitted |

## 3. Redeploy

Manual Deploy → wait for **Live**.

## 4. Test

```bash
curl https://YOUR-SERVICE.onrender.com/api/health
```

## Optional (faster / cleaner)

| Setting | Value |
|---------|--------|
| Build Command | `bash render-build.sh` |
| Start Command | `npm start` |

Even with **Build** = `npm install` and **Start** = `npm run dev`, the latest code redirects to the compiled server automatically.
