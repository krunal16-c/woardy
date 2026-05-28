# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser (React SPA)               │
│  Dashboard · Wardrobe · Calendar · Planner · Laundry │
│                port 8888 (Vite dev / serve)          │
└────────────────────────┬────────────────────────────┘
                         │ REST JSON  /api/*
┌────────────────────────▼────────────────────────────┐
│              Express API  (port 3333)                │
│  helmet · cors · rate-limit · multer · Sequelize     │
└───┬──────────┬────────────┬──────────────┬──────────┘
    │          │            │              │
 MySQL 8    Open-Meteo  Google OAuth   iCloud
 test_db    (weather)   googleapis     CalDAV
```

---

## Frontend

### Stack

- **React 18** with hooks (no class components)
- **Vite 4** dev server on port 8888 (proxies `/api` and `/uploads` to `:3333`)
- **Tailwind CSS 3** — JIT, custom design tokens in `tailwind.config.cjs`
- **React Router 6** — client-side routing, `<BrowserRouter>`

### Design Tokens (`tailwind.config.cjs`)

| Token | Value | Use |
|---|---|---|
| `font-sans` | Plus Jakarta Sans | All body text |
| `shadow-card` | subtle warm lift | Item cards |
| `shadow-card-md` | stronger lift | Day cards |

Icons use **Material Symbols Outlined** as a variable font. Every icon is rendered via a single `<span className="material-symbols-outlined">` with inline `fontVariationSettings`:

```js
// FILL 0 = outline, FILL 1 = filled; wght 300/500 adjusts stroke weight
style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${filled ? 500 : 300}, 'GRAD' 0, 'opsz' 24` }}
```

Both fonts ship as local `.woff2` files in `front/public/fonts/` with Google Fonts CDN as a warm-loading fallback.

### Pages & Routing

| Route | Component | Responsibility |
|---|---|---|
| `/` | `Dashboard` | City picker, today's weather, stat cards, today's outfit |
| `/wardrobe` | `Wardrobe` | Item grid, category filter, add/delete with image upload |
| `/calendar` | `Calendar` | Manual events + Google/Apple connect UI |
| `/planner` | `OutfitPlanner` | 7-day card grid, generate, mark worn |
| `/laundry` | `Laundry` | Dirty items list, wash individual or all |

### API Layer (`src/api.service.js`)

All fetch calls live in one module. Errors are thrown as typed `Error` objects with `.status` and `.data` fields so components can pattern-match without parsing raw responses.

```js
const res = await fetch(`${BASE}/api/wardrobe`);
if (!res.ok) throw Object.assign(new Error(data.message), { status: res.status, data });
return data;
```

`IMG_BASE` is exported separately so image URLs are constructed consistently across components.

---

## Backend

### Stack

- **Express 4** — thin HTTP layer, no framework magic
- **Sequelize 6** — ORM with `sync({ alter: { drop: false } })` on startup (schema migrations without data loss)
- **MySQL 8** — primary data store

### Middleware Stack (in order)

```
helmet          → sets 14 security HTTP headers
cors            → whitelist frontend origins, allow credentials
rateLimit       → 200 req / 15 min per IP (auth routes: 10–20)
express.json    → 1 MB body limit
static /uploads → multer-saved item images
```

### Route Map

```
/api/wardrobe          routes/wardrobe.js
/api/calendar          routes/calendar.js       manual events
/api/outfits           routes/outfits.js
/api/laundry           routes/laundry.js
/api/weather           routes/weather.js
/api/settings          routes/settings.js
/api/google-calendar   routes/googleCalendar.js OAuth flow
/api/apple-calendar    routes/appleCalendar.js  CalDAV flow
```

### Models (Sequelize)

#### `WardrobeItem`
| Field | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | auto-increment |
| `name` | STRING | |
| `category` | ENUM | tops, bottoms, outerwear, shoes, accessories, dresses |
| `color` | STRING | |
| `tags` | JSON | season/style tags used by scorer |
| `imageUrl` | STRING | relative path under `/uploads/` |
| `wornCount` | INTEGER | lifetime wear count |
| `wornSinceWash` | INTEGER | resets on wash |
| `lastWorn` | DATE | |
| `lastWashed` | DATE | |

#### `OutfitSuggestion`
| Field | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `date` | DATEONLY | |
| `itemIds` | JSON | array of WardrobeItem ids |
| `weatherContext` | JSON | `{ temp, tempMin, tempMax, weatherCode, isRainy }` |
| `eventContext` | STRING | casual / formal / business / outdoor / sport / party |
| `status` | ENUM | suggested → worn |
| `wornAt` | DATE | |

#### `CalendarConnection`
| Field | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `provider` | ENUM | google, apple |
| `encryptedPayload` | TEXT | AES-256-GCM cipher (see Security) |
| `status` | STRING | connected / error |
| `accountHint` | STRING | masked email only, e.g. `te****@gmail.com` |
| `lastSyncAt` | DATE | |

#### `CalendarEvent`
| Field | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `date` | DATEONLY | |
| `title` | STRING | |
| `eventType` | ENUM | casual / formal / business / outdoor / sport / party |

#### `UserSettings`
Single row (id=1) storing `city` and `country`.

---

## Outfit Suggestion Algorithm (`utils/outfitSuggester.js`)

Called by `POST /api/outfits/generate`. Produces one outfit per day for 7 days.

### Inputs
- All wardrobe items from DB
- 7-day weather forecast from Open-Meteo (daily min/max temp + WMO weather code)
- Calendar events for the period (one event per day drives formality)

### Scoring

Each candidate item starts at **score = 10**, then receives bonuses/penalties:

| Signal | Effect |
|---|---|
| Temp < 5 °C + `winter`/`heavy` tag | +5 |
| Temp < 5 °C + `summer`/`light` tag | −6 |
| `outerwear` category when temp < 12 °C | +3 to +4 |
| `formal`/`business` tag on formal day | +5 |
| `sport`/`casual` tag on formal day | −4 |
| Worn < 2 days ago (`lastWorn`) | −8 |
| Worn 2–4 days ago | −3 |
| `wornSinceWash` ≥ 4 | −7 |
| `wornSinceWash` ≥ 2 | −2 |
| Already used in this 7-day run | −4 × times used |

The last penalty ensures variety across the week — an item used on Monday scores 4 pts lower on Tuesday, 8 pts lower on Wednesday, etc.

### Category Assembly

For each day the algorithm picks:

1. **Dress** (if formal/party/business event and a dress exists) — skips top+bottom if selected
2. **Top** (best-scoring from `tops`)
3. **Bottom** (best-scoring from `bottoms`)
4. **Outerwear** — only added when average temp < 18 °C
5. **Shoes** — always included if any exist
6. **Accessories** — only if best-scoring accessory scores > 8

`usedItemIds` accumulates across all 7 days so the variety penalty compounds correctly.

---

## Security Design

### HTTP Headers — helmet

Enabled with one override: `crossOriginResourcePolicy: 'cross-origin'` so the React frontend can load images from the Express `/uploads/` static route without CORP blocking.

### Rate Limiting — express-rate-limit

| Scope | Limit |
|---|---|
| All routes | 200 req / 15 min per IP |
| Auth routes (Google/Apple connect) | 10–20 req / 15 min per IP |
| `/uploads/*` static | exempt (images, no sensitive data) |

### Credential Encryption — AES-256-GCM (`utils/encryption.js`)

Google tokens and Apple App-Specific Passwords are never stored in plaintext.

```
Plaintext → AES-256-GCM(KEY, 96-bit random IV) → "ivHex:authTagHex:cipherHex"
```

- **96-bit IV** is generated fresh per encryption call (NIST recommended for GCM)
- **Auth tag** (128-bit) is stored alongside the ciphertext and verified on decrypt — prevents ciphertext tampering
- `KEY` is loaded from `ENCRYPTION_KEY` env var (64-char hex → 32-byte key). If unset, a random ephemeral key is used and a startup warning is logged

`accountHint` stores only the masked email (`te****@gmail.com`) — enough to identify the account in the UI, nothing usable for authentication.

---

## Calendar Integrations

### Google Calendar — OAuth 2.0

```
Frontend                  Backend                     Google
───────                   ───────                     ──────
GET /auth-url    →  createOAuth2Client()
                    getAuthUrl(client)       →  consent screen URL
                                     ←──────────  redirect to /callback
GET /callback   →  exchangeCode(code)       →  {access_token, refresh_token}
                    encrypt(tokens)
                    CalendarConnection.upsert()
                    redirect → /calendar?google=connected
GET /events     →  decrypt(payload)
                    oauth2Client.setCredentials()
                    calendar.events.list()   →  events
                    (auto-refresh if expired via 'tokens' event)
```

The `googleapis` client emits a `tokens` event whenever it auto-refreshes the access token. The handler re-encrypts and persists the new token so the refresh token is never lost.

### Apple Calendar — CalDAV

iCloud CalDAV uses a multi-step discovery protocol:

```
1. PROPFIND https://caldav.icloud.com/
   └─ find: current-user-principal href
2. PROPFIND <principal-url>
   └─ find: calendar-home-set href
3. REPORT <calendar-home-url>
   └─ time-range filter: today → +14 days
   └─ returns VCALENDAR/VEVENT iCal text
4. Parse SUMMARY + DTSTART with regex → CalendarEvent rows
```

Authentication uses HTTP Basic with the iCloud email + App-Specific Password on every request. The credential format is validated (regex `^[a-z]{4}-[a-z]{4}-[a-z]{4}-[a-z]{4}$`) before any network call is made.

---

## External APIs

### Open-Meteo (weather)

No API key required. Two calls per forecast generation:

```
1. GET https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1
   → latitude, longitude

2. GET https://api.open-meteo.com/v1/forecast
     ?latitude=...&longitude=...
     &daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max
     &forecast_days=7
```

WMO weather codes map to Material Symbols icons in both the Dashboard and OutfitPlanner components (`wb_sunny`, `partly_cloudy_day`, `cloud`, `foggy`, `rainy`, `ac_unit`, `thunderstorm`).

---

## Deployment

### Docker Compose

```yaml
sql-database  mysql:8.0          → internal network only
njs-backend   ./back             → port 3333
rjs-frontend  ./front            → port 8888
```

The backend detects Docker by checking `DATABASE_HOST != 'localhost'` and switches from a Unix socket to TCP accordingly. No code change is needed between local and containerised environments.

### Environment Differences

| Context | DB connection | ENCRYPTION_KEY |
|---|---|---|
| Local dev | Unix socket `/var/run/mysqld/mysqld.sock` | Optional (ephemeral key + warning) |
| Docker | TCP `sql-database:3306` | Should be set in compose env or secrets |
| Production | Set `DATABASE_HOST` to RDS/Cloud SQL host | Required |
