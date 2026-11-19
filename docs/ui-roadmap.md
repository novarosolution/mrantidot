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

## 3. Screen status

| Screen | Layout | Motion (this pass) | Next |
| --- | --- | --- | --- |
| Home | Done — Urban-style feed | Already animated (hero carousel, sticky search) | Category grid tap ripple |
| Services | Done — search, pest tiles, filters | Staggered rows, pressed tiles | Sticky filter bar on scroll |
| Category (browse) | Done — summary, tiles, detailed rows | Staggered sections, shimmer loader | "Menu" pill to jump between sections |
| Service detail | Done — sizes, included/excluded, reviews | Hero parallax + stretch, staggered sections, option select haptic, shimmer loader | Before/after photos, admin-uploaded images per included item |
| Your cart (checkout) | Done — one page + bottom sheets | Staggered cards, CTA haptic, shimmer loader | Tip for technician (needs server support) |
| Booking success | Done | Check draw, confetti, success haptic | Add-to-calendar |
| Bookings / booking detail | Done | Existing | Live-tracking map polish |
| Offers | Done | Staggered coupons (existing) | Copy-code haptic |
| Profile | Done — reference layout | Staggered sections, pressed tiles | Refer & earn (needs backend) |
| Help · FAQ · About · Terms · Privacy | Done — list style | Staggered content | Search inside FAQ |
| Settings · Addresses · Payment methods | Done | Existing | Inline validation polish |

## 4. Phases

1. **Motion kit + entrances + press feedback** — shared tokens, haptics, staggered sections on detail, cart, category, profile and content pages. *(this pass)*
2. **Scroll effects** — service-detail hero parallax/stretch, header fade. *(this pass)*
3. **Loading + success** — shimmer skeletons for detail, cart and category; success haptic. *(this pass)*
4. **Content depth** — admin-uploaded photos for "What is included" tiles and before/after gallery on service detail.
5. **Engagement** — refer & earn, technician tip, add-to-calendar (each needs server work first).

## 5. Definition of done for a screen

- Matches the rules in section 1 and uses only kit components (`ListGroup`, `ServiceListRow`, `BottomSheet`, `PressableScale`, …).
- All copy either comes from CMS / service data or is a short, neutral label.
- Entrance + press motion in place, reduce-motion respected.
- Checked in the simulator at iPhone 17 Pro size, scrolled to the end above the tab bar.
- `npx tsc --noEmit -p .` clean in `mobile` (and `server` when the API changed).
