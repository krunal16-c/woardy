# woardy

A wardrobe management app that catalogues your clothes, pulls in calendar events and live weather, and generates 7-day outfit suggestions. Mark outfits as worn to track wear history, and get laundry reminders when items need washing.

---

## Features

| Feature | Description |
|---|---|
| **Wardrobe catalogue** | Upload photos (mobile camera or file), tag by category, colour and season |
| **7-day outfit planner** | Score-based algorithm picks outfits from weather forecast + calendar event type |
| **Wear tracking** | Tap "Mark as worn" on any day card; wears accumulate for laundry logic |
| **Laundry reminders** | Items worn 2+ times since last wash surface in the Laundry page; weekend banner nudges you |
| **Google Calendar** | Full OAuth 2.0 — connect once, events sync automatically |
| **Apple Calendar** | iCloud CalDAV — connect with an App-Specific Password, no Apple ID password required |
| **Weather** | Open-Meteo free API — no key needed; city geocoding + 7-day hourly/daily forecast |

---

## Tech Stack

**Frontend** — React 18 · Vite 4 · Tailwind CSS 3 · React Router 6  
**Backend** — Node.js 22 · Express 4 · Sequelize 6 · MySQL 8  
**Fonts/Icons** — Plus Jakarta Sans · Material Symbols Outlined (variable font, local fallback)  
**Calendar** — `googleapis` (Google OAuth 2.0) · iCloud CalDAV via `axios` + `fast-xml-parser`  
**Security** — `helmet` · `express-rate-limit` · AES-256-GCM credential encryption

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — required to run MySQL and the full stack
- Node.js ≥ 18 — only needed for local frontend/backend dev outside Docker

---

## Quick Start (Docker — recommended)

Docker Compose spins up MySQL, the Express API, and the React frontend in one command.

### 1. Clone

```bash
git clone https://github.com/krunal16-c/woardy.git
cd woardy
```

### 2. Set the encryption key

The backend encrypts stored calendar credentials with AES-256-GCM. Generate a persistent key once and add it to `back/.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Edit `back/.env` and paste the output as the value of `ENCRYPTION_KEY`. Without this, calendar credentials are lost every time the backend restarts.

### 3. Start everything

```bash
docker compose up --build
```

Services started:

| Service | URL |
|---|---|
| Frontend | http://localhost:8888 |
| Backend API | http://localhost:3333 |
| MySQL 8 | internal, port 3306 |

The backend reads `DATABASE_HOST=sql-database` from the compose environment and connects via TCP. DB schema is auto-synced on startup.

### 4. Optional — Google Calendar

| Variable | Where to get it |
|---|---|
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | same |
| `GOOGLE_REDIRECT_URI` | set to `http://localhost:3333/api/google-calendar/callback` |

Add these to `back/.env`, then restart: `docker compose restart njs-backend`.

---

## Local Dev Setup (no Docker)

Run the frontend and backend directly with Node.js. You still need MySQL — either via Docker (`docker compose up -d sql-database`) or Homebrew (`brew install mysql && brew services start mysql`).

When running MySQL locally via Homebrew, set `DATABASE_HOST=127.0.0.1` in `back/.env` so the backend uses TCP instead of the Linux socket path.

```bash
# Install deps
cd back && npm install
cd ../front && npm install

# Terminal 1 — backend
cd back && npm run dev

# Terminal 2 — frontend
cd front && npm run dev
```

Open **http://localhost:8888**

---

## Calendar Integration

### Google Calendar

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add `http://localhost:3333/api/google-calendar/callback` as an authorised redirect URI
4. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` in `back/.env`
5. In the app: Calendar → Connect Google Calendar → authenticate in the popup

### Apple Calendar

1. Sign in to [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → App-Specific Passwords
2. Generate a password (format `xxxx-xxxx-xxxx-xxxx`)
3. In the app: Calendar → Connect Apple Calendar → enter your iCloud email + the App-Specific Password

Credentials are stored encrypted (AES-256-GCM) in the database. Your Apple ID password is never used or stored.

---

## Project Structure

```
Assignment4/
├── back/                     # Express API
│   ├── config/database.js    # Sequelize connection
│   ├── models/               # Sequelize models
│   ├── routes/               # Express routers
│   ├── utils/                # Business logic & integrations
│   │   ├── encryption.js     # AES-256-GCM encrypt/decrypt
│   │   ├── googleCalendar.js # OAuth 2.0 token management
│   │   ├── appleCalendar.js  # CalDAV discovery + event fetch
│   │   └── outfitSuggester.js# Scoring algorithm
│   └── index.js              # App entry — middleware, routes, DB sync
├── front/                    # React + Vite SPA
│   ├── public/fonts/         # Self-hosted variable fonts
│   ├── src/
│   │   ├── components/       # Navbar
│   │   ├── pages/            # Dashboard, Wardrobe, Calendar, OutfitPlanner, Laundry
│   │   ├── api.service.js    # Centralised fetch helpers
│   │   └── App.jsx           # Router root
│   └── tailwind.config.cjs   # Custom colours, fonts, shadows
└── docker-compose.yml
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/wardrobe` | List all wardrobe items |
| `POST` | `/api/wardrobe` | Add item (multipart/form-data with optional image) |
| `DELETE` | `/api/wardrobe/:id` | Remove item + image file |
| `GET` | `/api/outfits` | List saved outfit suggestions |
| `POST` | `/api/outfits/generate` | Generate 7-day suggestions |
| `PUT` | `/api/outfits/:id/worn` | Mark outfit worn |
| `PUT` | `/api/outfits/:id/unworn` | Undo worn |
| `GET` | `/api/laundry` | Items needing washing (wornSinceWash ≥ 2) |
| `PUT` | `/api/laundry/wash` | Reset wornSinceWash to 0 |
| `GET` | `/api/weather?city=London` | 7-day forecast via Open-Meteo |
| `GET` | `/api/settings` | Get user settings (city, country) |
| `POST` | `/api/settings` | Save settings |
| `GET` | `/api/google-calendar/auth-url` | Get OAuth URL |
| `GET` | `/api/google-calendar/callback` | OAuth callback (redirect) |
| `GET` | `/api/google-calendar/events` | Fetch Google events |
| `DELETE` | `/api/google-calendar/disconnect` | Revoke + remove token |
| `POST` | `/api/apple-calendar/connect` | Store Apple credentials |
| `GET` | `/api/apple-calendar/events` | Fetch iCloud events |
| `DELETE` | `/api/apple-calendar/disconnect` | Remove Apple credentials |
