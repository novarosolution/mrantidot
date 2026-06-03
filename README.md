# Mr Antidot

Home-services booking platform: customers book technicians, technicians complete jobs with **camera + GPS photo verification**, admins manage operations.

| Package | Path | Description |
|---------|------|-------------|
| **server** | `/server` | Express + MongoDB API |
| **mobile** | `/mobile` | Expo (React Native) app |

---

## Prerequisites

| Tool | Version / notes |
|------|-----------------|
| **Node.js** | 18+ |
| **MongoDB** | Local `mongodb://127.0.0.1:27017/mrantidot` or Atlas URI in `server/.env` |
| **Expo Go** (dev) | [iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) — same Wi‑Fi as your Mac |
| **EAS CLI** (optional) | For installable APK — `npm i -g eas-cli` |

Start MongoDB if needed:

```bash
brew services start mongodb-community
# or: mongod --dbpath ~/data/db
```

---

## Quick start (fresh clone)

```bash
git clone <repo-url> mrantidot && cd mrantidot
npm install

cp server/.env.example server/.env
cp mobile/.env.example mobile/.env
```

### Server `.env` (`server/.env`)

```env
MONGO_URI=mongodb://127.0.0.1:27017/mrantidot
JWT_SECRET=supersecret_change_me
PORT=4000
CLIENT_URL=*
```

### Mobile `.env` (`mobile/.env`) — **LAN IP, not localhost**

Phones and emulators **cannot** reach `http://localhost:4000` on your computer.

1. Find your LAN IP:
   - **macOS:** `ipconfig getifaddr en0`
   - **Windows:** `ipconfig` → IPv4 on Wi‑Fi
   - **Linux:** `hostname -I | awk '{print $1}'`

2. Set:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.4:4000
```

Use your real IP. Mac and phone must be on the **same Wi‑Fi**. The API listens on `0.0.0.0:4000`.

**Alternative:** `cd mobile && npx expo start --tunnel` (slower; tunnel URL for API still needs a public backend for APK builds).

### Seed + run

```bash
npm run seed          # demo users, 6 services, sample bookings
npm run dev:server    # API on :4000

# new terminal
npm run dev:mobile    # or: cd mobile && npx expo start
```

Scan the QR code with **Expo Go**. Verify API from the phone browser: `http://YOUR_LAN_IP:4000/api/health` → `{"ok":true,"db":"connected",...}`.

---

## npm scripts (root)

| Script | Description |
|--------|-------------|
| `npm run dev:server` | Start API (`ts-node-dev`) |
| `npm run seed` | Seed / refresh demo data |
| `npm run dev:mobile` | `npx expo start` |
| `npm run build:apk` | EAS Android APK (`preview` profile) |

---

## Login cheatsheet

Use **phone or email** as `identifier` on the login screen.

| Role | Phone | Password |
|------|-------|----------|
| **Admin** | `9000000001` (or `ADMIN_PHONE` in `server/.env`) | `admin123` (or `ADMIN_PASSWORD`) |

Admin credentials are defined in **`server/.env`** (`ADMIN_PHONE`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_CITY`). The API **upserts** that user into MongoDB on every startup and when you run `npm run seed`.
| **Technician** | `9000000010` | `tech123` |
| **Technician** | `9000000011` | `tech123` |
| **Technician** | `9000000012` | `tech123` |
| **Technician** | `9000000013` | `tech123` |
| **Customer** | `9000000020` | `cust123` |
| **Customer** | `9000000021` | `cust123` |
| **Customer** | `9000000022` | `cust123` |

**OTP (mock):** any phone → code **`4700`** (creates customer if new).

**Register:** any new phone/email via Register screen (8+ char password).

---

## Coupon codes

Applied at booking; unknown codes = ₹0 discount (no error).

| Code | Discount (₹) |
|------|----------------|
| `ANTIDOT100` | 100 |
| `FIRST50` | 50 |

Pricing: `total = max(0, base + round(base×18% GST) − coupon)`.

---

## API smoke tests

```bash
curl http://localhost:4000/api/health
bash server/test/auth.sh
bash server/test/flow.sh
```

---

## Installable Android APK (EAS)

Standalone builds **embed** `EXPO_PUBLIC_API_URL` at compile time.  
`localhost` / LAN IP **do not work** on arbitrary phones — use a **public** API (deploy or ngrok).

### 1. Expose the API

| Method | `EXPO_PUBLIC_API_URL` example |
|--------|-------------------------------|
| Deploy (Render, Railway, Fly.io) | `https://your-api.onrender.com` |
| **ngrok** (dev test) | `https://xxxx.ngrok-free.app` |
| LAN only | `http://192.168.x.x:4000` — same Wi‑Fi only |

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
ngrok http 4000
```

### 2. Build APK

```bash
npm i -g eas-cli
cd mobile
eas login
eas init    # first time — links Expo project

# Replace URL, then:
EXPO_PUBLIC_API_URL=https://YOUR-PUBLIC-URL eas build -p android --profile preview
```

Or edit `mobile/eas.json` `preview.env.EXPO_PUBLIC_API_URL`, then:

```bash
npm run build:apk
```

EAS returns a **download link** for the `.apk` → install on any Android device (enable “Install unknown apps”).

### 3. Production profile

```bash
cd mobile
eas build -p android --profile production
```

Default: **AAB** for Google Play. For APK, set `"buildType": "apk"` under `production.android` in `eas.json`.

### 4. iOS (optional)

```bash
eas build -p ios --profile production
```

Requires an **Apple Developer** account ($99/yr), certificates via EAS, TestFlight for testers. Same public API URL requirement.

### App identity

- **Name:** Mr Antidot  
- **Package / bundle:** `com.mrantidot.app`  
- **Icon / splash:** `mobile/assets/icon.png`, `splash-icon.png`  
- **Permissions:** camera, location, photos (strings in `app.json`)

---

## Design / UI kit

The mobile app follows the **Mr Antidot HTML UI kit** (forest green `#1E8E4E`, lime `#A8E04E`, Sora + Plus Jakarta Sans). Tokens live in [`mobile/constants/theme.ts`](mobile/constants/theme.ts). Reference mockup notes: [`docs/ui-kit.html`](docs/ui-kit.html). Shared kit components: [`mobile/components/kit/`](mobile/components/kit/).

Fonts load via `@expo-google-fonts/sora` and `@expo-google-fonts/plus-jakarta-sans` on first launch (splash waits for fonts).

**Screens:** splash → onboarding → auth; customer 4-tab app; admin 4-tab dashboard; technician job steps with camera overlay. API contracts are unchanged — restyle only.

### Visual parity checklist

Compare each screen on device to the HTML kit frames:

| Area | Screen | Route / file |
|------|--------|----------------|
| Auth | Splash, onboarding | `(auth)/splash`, `(auth)/onboarding` |
| Auth | Login (overlap form, Google UI, forgot) | `(auth)/login` |
| Auth | Register, OTP (4 boxes) | `(auth)/register`, `(auth)/otp` |
| Customer | Home (bell, 8-icon grid, Popular card) | `(customer)/index` |
| Customer | Services list, Offers | `(customer)/services`, `(customer)/offers` |
| Customer | Service detail (hero pills, chips, review) | `service/[id]` |
| Customer | Book wizard (day strip, slots, address card, coupon) | `book/[serviceId]` |
| Customer | Bookings list, booking detail (live, timeline, phone) | `(customer)/bookings`, `booking/[id]` |
| Customer | Profile (chevrons, booking count) | `(customer)/profile` |
| Customer | Review (large stars, tags) | `review/[bookingId]` |
| Customer | Tab bar (green top indicator) | `(customer)/_layout` |
| Admin | Dashboard (header, KPIs, revenue chart, rows) | `(admin)/index` |
| Admin | Bookings, services (toggle), technicians, customers | `(admin)/bookings`, `services`, `technicians`, `customers` |
| Admin | Reports, team, verification | `(admin)/reports`, `team`, `booking/[id]` |
| Admin | Tab bar | `(admin)/_layout` |
| Tech | Jobs list (ref, progress chip) | `(tech)/index` |
| Tech | Job steps + camera overlay | `(tech)/job/[id]` |

Verify types: `cd mobile && npx tsc --noEmit`. Smoke APIs: `bash server/test/auth.sh` and `bash server/test/flow.sh` (run `npm run seed` first if DB is empty).

### Dynamic data APIs (MongoDB-backed)

| Endpoint | Description |
|----------|-------------|
| `GET/POST/PATCH/DELETE /addresses` | Customer saved addresses |
| `GET/POST/PATCH/DELETE /payment-methods` | Customer payment methods (metadata) |
| `GET /notifications`, `PATCH /notifications/:id/read` | In-app notification inbox |
| `GET /offers` | Active coupon offers (`ANTIDOT100`, `FIRST50` from seed) |
| `GET /services?category=Residential` | Filter services by category |
| `GET /services/:id/stats`, `/reviews` | Booking counts and real reviews |
| `GET /stats/admin?period=month` | KPI deltas + `revenueByMonth` chart data |
| `GET /admin/customers` | Customers with spend, VIP tag, booking count |
| `POST /bookings` | Accepts `addressId` or `address` string |

Seed creates 2 addresses and 2 payment methods per demo customer plus sample notifications.

---

## Tech stack

- **Backend:** Node, Express, TypeScript, Mongoose, JWT, multer, express-validator  
- **Mobile:** Expo SDK 56, Expo Router, Axios, AsyncStorage, expo-camera, expo-location, react-native-toast-message  

---

## Project structure

```
mrantidot/
├── package.json          # workspaces: server, mobile
├── README.md
├── server/
│   ├── src/
│   │   ├── index.ts      # Express app
│   │   ├── models/       # User, Service, Booking, Review
│   │   ├── routes/       # auth, services, bookings, reviews, upload, stats, admin
│   │   ├── seed/seed.ts  # idempotent demo data
│   │   └── middleware/
│   ├── test/
│   │   ├── auth.sh
│   │   └── flow.sh
│   └── .env.example
└── mobile/
    ├── app/              # Expo Router screens
    ├── components/ui/
    ├── context/AuthContext.tsx
    ├── lib/api.ts, upload.ts, pricing.ts
    ├── constants/theme.ts
    ├── eas.json          # APK preview + production profiles
    └── .env.example
```

---

## Deploy API on Render

Use the **server** folder only (avoids mobile yarn peer warnings and wrong start command).

| Setting | Value |
|---------|--------|
| **Root Directory** | `server` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/api/health` |

**Environment variables** (required):

| Variable | Example |
|----------|---------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/mrantidot-v2` — **no `.` in the database name** |
| `JWT_SECRET` | long random string |
| `CLIENT_URL` | `*` or your app origin |

Optional: `ADMIN_PHONE`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`, etc. (see `server/.env.example`).

Or connect the repo to [`render.yaml`](render.yaml) (Blueprint) — it sets `rootDir: server` automatically.

After deploy: `curl https://YOUR-SERVICE.onrender.com/api/health` → `"db":"connected"`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| App can’t reach API | Wrong `EXPO_PUBLIC_API_URL`; use LAN IP + same Wi‑Fi, or tunnel |
| APK login fails | Rebuild with a **public** API URL; seed that server |
| Port 4000 in use | `lsof -i :4000` → kill process or change `PORT` |
| Mongo connection error | Start `mongod` or fix `MONGO_URI`; names like `mrantidot-2.0` are invalid — use `mrantidot-v2` |
| Render exits status 1 | Set **Root Directory** to `server`, run `npm run build` in build step, set `MONGO_URI` + `JWT_SECRET` |
