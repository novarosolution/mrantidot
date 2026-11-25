# Mr Antidot — customer app UI roadmap

A short, living plan for taking every customer screen to the same premium level as Home.
Reference: the Urban Company screenshots in `refrans/`, adapted to Mr Antidot's green brand and pest-control content.

## 1. Design rules (apply to every screen)

| Rule | What it means in practice |
| --- | --- |
| One surface language | White cards (radius 20, hairline border, soft shadow) on the light-grey canvas; 8 px grey bands between page sections. |
| One type scale | Inter: display 20–28 for titles, 15–16 bold for row titles, 13–14 body, 12 uppercase labels. |
| Content is managed, not hard-coded | Copy comes from the admin CMS (Content screen) or the service editor; empty content hides its section instead of showing filler. |
| Say it once | No title repeated as a section heading, no card that duplicates another screen (e.g. Settings no longer repeats the profile card). |
| Price honesty | "Starts at" always shows the cheapest bookable size; the server prices bookings, never the app. |
| Clear the docked tab bar | Every scroll view on a tab screen ends with `TAB_BAR_SCROLL_PAD`. |

## 2. Motion system (`mobile/lib/motion.ts`)

| Token | Value | Used for |
| --- | --- | --- |
| `duration.fast / base / slow` | 120 / 220 / 340 ms | taps / toggles / entrances |
| `spring` | friction 10, tension 68 | content settling into place |
| `springSnappy` | friction 7, tension 140 | selection, tab and chip changes |
| `stagger(i)` | 55 ms × i, capped at 6 items | sections and list rows entering one after another |
| `haptic()` | tap · select · success · warning · error | primary buttons, option picks, booking success |

Principles:
- **Entrances** — sections fade + slide up 16–20 px, staggered; they play once per screen visit, never on every re-render.
- **Press feedback** — every tappable card scales to ~0.97 with a spring back (`PressableScale`); primary actions add a light haptic.
- **Scroll** — heroes parallax and stretch on pull-down; floating headers fade their white bar and title in once the hero leaves.
- **Loading** — shimmer skeletons shaped like the real content, not spinners.
- **Success** — check-mark draw + confetti + success haptic after a booking.
- **Accessibility** — everything respects iOS/Android "Reduce motion" (`useReducedMotion`): entrances become instant, presses only dim.

## 3. Managing content

Every customer-facing label lives in **Admin → App content → Screens** (`customerUi` in the app config), grouped by screen: catalog, category page, service detail, cart, bookings, booking detail, offers, profile, account screens, help, auth, onboarding and review.

- Use the search box at the top of the Screens tab to find a label by its name or its current text.
- Words in braces are filled in by the app — keep them when editing: `{brand}`, `{price}`, `{count}`, `{code}`, `{duration}`, `{amount}`, `{service}`, `{type}`, `{active}`, `{total}`, `{contact}`, `{terms}`, `{privacy}`.
- Adding a label: add the key to `CustomerUiCopy` (`mobile/types/api.ts`) and `ICustomerUiCopy` (`server/src/models/AppContent.ts`), its default to **both** `DEFAULT_CUSTOMER_UI_COPY` objects, and a row in `CUSTOMER_UI_ADMIN_GROUPS` (`mobile/constants/customerUiCopy.ts`). The server drops keys it has no default for.
- Error messages from the API and a few developer-only screens (OTP demo code) stay in code.
- Website text lives in the same store under **Admin → App content → Website** (keys starting with `web…`, grouped in `WEBSITE_UI_ADMIN_GROUPS`). The website also reuses the app's labels (cart, service detail, bookings, auth), Brand (phone, email, WhatsApp, hours, trust badges) and Legal (FAQ, terms, privacy). Edits show on the website within about a minute.

## Website (`mranti/`, Next.js)

Everything on the website is managed from the app: **Admin → Manage → Website** (layout, photos, lists, social/SEO/announcement, blog, gallery, team, testimonials, messages, subscribers) and **Admin → App content → Website** (all text labels).

- **Data:** the site has no database of its own. It reads the API server-side (`MRANTIDOT_API_URL`): services, offers, login/register, bookings, addresses, `GET /api/website` (sections, photos, lists, SEO, announcement) and `/api/website/{blog,gallery,team,testimonials,reviews}`. Contact form and newsletter post to `/api/website/{contact,subscribe}` (new messages notify admins in the app).
- **Freshness:** public data is cached 60 s; after any admin save the API calls the site's `/api/revalidate` (shared `WEBSITE_API_KEY`), so changes show immediately.
- **Photos:** uploaded from the app to `POST /api/website/admin/media` → Vercel Blob (`BLOB_READ_WRITE_TOKEN` on the API; local `uploads/` in development). The site serves every image through `next/image`.
- **Sections:** home/about render `pages.home` / `pages.about` from the API in the admin's order; each key maps to one component in `mranti/components/site/sections.tsx`. Adding a section = add its key to `HOME_SECTIONS`/`ABOUT_SECTIONS` (`server/src/utils/websiteContent.ts`), a component in the registry, and a name in the app's Pages screen.
- **Rate limits:** the site sends `X-Website-Key` + the visitor's IP, so the API limits per visitor instead of per Vercel server. Set `TRUST_PROXY=1` on the API when it runs behind a proxy (Render).
- **SEO:** per-page title/description and share image from the admin, `sitemap.xml`, `robots.txt`, JSON-LD (business, services, FAQ, articles, breadcrumbs). Old URLs (`/services/<old-slug>`, `/book-service`, `/signup`, `/user/*`, `/verify-email`) redirect.
- **Look & motion:**
  - The home hero is a full-screen photo slideshow (Photos → Hero slideshow, up to 6). Each photo crossfades with a slow zoom, and the menu sits transparent on top.
  - Inner pages get full-width photo headers (Photos → Page headers).
  - "Trusted by" shows a moving strip of client logos (Lists → Clients), and "Our work" is a drag/scroll reel of gallery photos. Both are sections in Pages & sections.
  - Numbers count up, sections reveal and parallax as you scroll, and desktop scrolling is smoothed with Lenis.
  - Everything respects "reduce motion".
- **Customer pages:**
  - Service detail: photo hero, sticky section nav, shared size picker with a bottom book bar, and a pinned "How it works" story.
  - Booking: sticky stepper, missing-step shake, animated totals and coupon minimums.
  - Success: check, confetti, price breakdown and an add-to-calendar file.
  - Login and register: photo panel.
  - My bookings and account: tabs, a live status timeline, and a cancel sheet.
  - Also upgraded: blog post with share buttons, gallery lightbox, privacy/terms contents list, and the footer CTA band.
  - Motion helpers live in `mranti/components/site/motion.tsx`: `RevealGroup`, `TextReveal`, `ImageReveal`, `PinnedSteps`, `HorizontalPin`, `TiltCard`, `AnimatedNumber` and `BackToTop`. Pinned or scrubbed effects run on desktop only, and everything respects "reduce motion".
  - Customer-page labels are in **App content → Website → Customer pages**. The website also reads the app's booking copy (`factLabel*`, cancel texts).
- **Photos:** real job photos come from `mranti/public/frontend/images/gallery`. Five free stock photos from Pexels (Pexels License: free commercial use, no credit needed) are in `mranti/public/frontend/images/stock`. Every photo can be replaced from the app.

## Web admin (`mobile/`, Expo web)

The app's admin also runs in a browser, at **`https://mrantidot.com/admin`** (the website's own domain):
- It is the same code as the app.
- On the web, only admins can sign in. Customers are pointed to the website.

Local run: `npx expo start --web` in `mobile/` (served at `/`, talks to the local API on port 4001).

### Served at `/admin` on the website
- **Export:** `npm run export:web-admin` in `mobile/` sets `EXPO_WEB_BASE_URL=/admin`, which turns on `experiments.baseUrl` in `app.config.js` (only then — native builds never get a base path). Every script, asset and the favicon load from `/admin/…`, expo-router adds/strips `/admin` in page URLs, and the files land in `dist/admin/` (plus `dist/robots.txt`).
- **Admin deployment:** a Vercel project rooted at `mobile/`. `mobile/vercel.json` runs that export and serves `dist/` as-is: `/admin/*` real files first, then the SPA fallback to `/admin/index.html`; `/admin/api/*` and `/admin/uploads/*` go to the API; `/` redirects to `/admin`; `noindex` everywhere, long cache for the hashed `/admin/_expo/static` and `/admin/assets` files.
- **API from the browser:** `origin + /admin` (`mobile/lib/config.ts`), so calls go to `/admin/api/…` and photos to `/admin/uploads/…` on the same HTTPS origin — the page never calls the plain-HTTP API directly. `EXPO_PUBLIC_API_URL` still wins when it is set to something other than the live HTTP API (e.g. a future `https://api.mrantidot.com`).
- **Website:** with `ADMIN_ORIGIN` (the admin deployment's origin) set on the website, `mranti/proxy.ts` rewrites `/admin` + `/admin/*` to it and `/admin/api|uploads/*` to `MRANTIDOT_API_URL` — no redirect, the address bar stays on `mrantidot.com/admin`. Without `ADMIN_ORIGIN`, `/admin` shows a branded page (with an "Open admin" button when `ADMIN_URL` is set, e.g. `http://localhost:8081` in development).
- **Local check of the real build:** `npm run export:web-admin`, serve `mobile/dist` on port 8090 with `/admin/api` and `/admin/uploads` proxied to the API, open `http://localhost:8090/admin`. To test through the website: `ADMIN_ORIGIN=http://localhost:8090` in `mranti/.env.local`, then `http://localhost:3000/admin`.

### Desktop admin (browser windows ≥ 1024 px)
- **Sign-in:** split screen — brand panel with a real job photo from the website (`EXPO_PUBLIC_WEBSITE_URL`, or the page's own origin when served under the site) and the form: email/phone, password with show/hide, inline errors, Enter to submit, "Forgot password? Ask your primary admin to reset it." Narrow windows get a centred card. After a 401 the session is dropped and the sign-in screen shows "Session expired — sign in again".
- **Shell (`components/admin/WebAdminShell.tsx`):** grouped sidebar (Overview · Operations · Catalog · People · Website & content · Settings) with a sliding active indicator, an unread badge on Notifications and a collapse-to-icons toggle (remembered per browser). Top bar: page title, Refresh (remounts the current screens with fresh data) and the account menu (account/business settings, sign out).
- **Phone leftovers removed on wide windows:** no tab-bar padding under tab screens, the sticky save bars become a slim dock with desktop-sized buttons on the right, and the screen headers drop the bell/avatar the sidebar and top bar already show. KPI, stat and report grids show 4 tiles per row; `useAdminGridCellWidth` / `useAdminContentWidth` re-measure on resize and when the sidebar collapses.
- **Dialogs:** `confirmAsync`, `chooseAsync` and `notify` (`lib/confirm.ts`) show an in-app dialog in the browser (`components/admin/WebDialogHost.tsx`): real button labels, red destructive actions, several choices, Escape or a click outside to cancel, keyboard focus on the primary action. Native keeps `Alert.alert`.
- **Tables:** list screens switch between a table (wide web) and cards (phones) through `components/admin/AdminPagedList.tsx`. Table screens call `useWebWideContent()` and the shell widens its column from 1080 px to 1360 px while they are focused (`useWebContentMaxWidth()`). Clickable rows are `role="link"` on the web, so cells can hold their own buttons (Assign, Approve…).

### Admin areas
- **Business settings** (`settings-business`): tax, slots, booking rules, lists (pest/property/leave types, review tags), service area, payment types, messages, and **App status** — maintenance mode and a minimum app version. `components/AppStatusGate.tsx` (mounted in `app/_layout.tsx`) lays the maintenance / update screen over the app for customers and technicians; admins and the web admin always pass, and the app stays mounted underneath.
- **Bookings:** book on behalf of a customer (`booking-create`), internal notes, payment status (paid / refunded / unpaid), cancel with a required reason, origin (app / website / admin). Lists, dashboard, reports, payroll and data export page, filter and sort on the server.
- **Activity log:** every admin change (who, what, when; field names, never values), kept for a year.
- **Broadcast:** in-app message to all customers, all technicians, everyone or one person, with an optional link (service, offers or an https page); 5 per hour per admin. Technicians read them in their **inbox** (bell on the jobs screen, `app/(tech)/notifications.tsx`), next to their job updates; only https links open there.
- **Permissions:** only the primary admin (the one in the API's env) can create or promote admins, edit or disable other admins, or reset their passwords.

Long term, the API should get its own HTTPS domain (e.g. `api.mrantidot.com`).

### Going live (one time)
1. API env: `BLOB_READ_WRITE_TOKEN` (the website's existing Vercel Blob token), `WEBSITE_API_KEY` (new random secret), `WEBSITE_URL` (the site's https origin), `TRUST_PROXY=1` once the admin and website reach it through the website's proxy. While the API is also reachable directly on its own IP, a forged `X-Forwarded-For` could dodge the per-IP rate limits — firewall the API so only the proxy can reach it, or keep those limits generous. Deploy the API.
2. From this repo: `WEB_MONGODB_URI=<old website MongoDB> npm run import:website --workspace=server` (dry run), then add `-- --apply --upload-images` to copy blog, gallery, team, testimonials, messages and subscribers (and bundled photos to Blob).
3. Build and install the app (admin Website screens).
4. Website env on Vercel: `MRANTIDOT_API_URL`, `WEBSITE_API_KEY` (same value), `APP_BASE_URL`, and `ADMIN_ORIGIN` once the web admin is deployed (step 5). Remove the old `MONGODB_URI`, NextAuth, SMTP and WhatsApp variables. Deploy.
5. Web admin: create a Vercel project from `mobile/` (it builds with `npm run export:web-admin`; optional env `EXPO_PUBLIC_WEBSITE_URL=https://mrantidot.com`). No custom domain is needed — copy its URL (e.g. `https://mrantidot-admin.vercel.app`) into the website's `ADMIN_ORIGIN`, redeploy the website and open `https://mrantidot.com/admin`.

## 4. Screen status

| Screen | Layout | Motion (this pass) | Next |
| --- | --- | --- | --- |
| Home | Done — Urban-style feed | Already animated (hero carousel, sticky search) | Category grid tap ripple |
| Services | Done — search, pest tiles, filters | Staggered rows, pressed tiles | Sticky filter bar on scroll |
| Category (browse) | Done — summary, tiles, detailed rows | Staggered sections, shimmer loader | "Menu" pill to jump between sections |
| Service detail | Done — sizes, included/excluded, reviews | Hero parallax + stretch, staggered sections, option select haptic, shimmer loader | Before/after photos, admin-uploaded images per included item |
| Your cart (checkout) | Done — one page + bottom sheets | Staggered cards, CTA haptic, shimmer loader | Tip for technician (needs server support) |
| Booking success | Done | Check draw, confetti, success haptic | Add-to-calendar |
| Bookings / booking detail | Done | Shimmer loaders, staggered cards, filter + cancel/reschedule haptics | Live-tracking map polish |
| Offers | Done | Shimmer loader, staggered coupons | Copy-code haptic |
| Profile | Done — reference layout | Staggered sections, pressed tiles | Refer & earn (needs backend) |
| Help · FAQ · About · Terms · Privacy | Done — list style | Staggered content | Search inside FAQ |
| Notifications · Addresses | Done | Shimmer loaders, staggered rows, save/delete haptics | — |
| Login · Register · Onboarding | Done | Brand + heading glide in, success/error haptics | Real OTP provider |
| Settings · Payment methods | Done | Existing | Inline validation polish |

## 5. Phases

1. **Motion kit + entrances + press feedback** — shared tokens, haptics, staggered sections on detail, cart, category, profile and content pages. *(this pass)*
2. **Scroll effects** — service-detail hero parallax/stretch, header fade. *(this pass)*
3. **Loading + success** — shimmer skeletons for detail, cart and category; success haptic. *(this pass)*
4. **Content depth** — admin-uploaded photos for "What is included" tiles and before/after gallery on service detail.
5. **Engagement** — refer & earn, technician tip, add-to-calendar (each needs server work first).

## 6. Definition of done for a screen

- Matches the rules in section 1 and uses only kit components (`ListGroup`, `ServiceListRow`, `BottomSheet`, `PressableScale`, …).
- All copy either comes from CMS / service data or is a short, neutral label.
- Entrance + press motion in place, reduce-motion respected.
- Checked in the simulator at iPhone 17 Pro size, scrolled to the end above the tab bar.
- `npx tsc --noEmit -p .` clean in `mobile` (and `server` when the API changed).
