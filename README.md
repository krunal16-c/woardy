# WardrobeAI

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

- Node.js ≥ 18
- MySQL 8 (running, with a `test_db` database and `root/root` credentials, or set your own in `back/config/database.js`)
- Optional: Docker + Docker Compose for containerised setup

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/krunal16-c/Assignment4.git
cd Assignment4

# Backend
cd back && npm install

# Frontend
cd ../front && npm install
```

### 2. Configure environment

Copy and edit the backend env:

```bash
cp back/.env.example back/.env   # or edit back/.env directly
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_HOST` | no | Override MySQL host (default: localhost via socket) |
| `ENCRYPTION_KEY` | **recommended** | 64-char hex key for AES-256-GCM — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GOOGLE_CLIENT_ID` | for Google Calendar | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | for Google Calendar | From Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | for Google Calendar | `http://localhost:3333/api/google-calendar/callback` |
| `FRONTEND_URL` | no | Default `http://localhost:8888` |
| `PORT` | no | Default `3333` |

### 3. Start servers

```bash
# Terminal 1 — backend (auto-syncs DB schema on start)
cd back && npm run dev

# Terminal 2 — frontend
cd front && npm run dev
```

Open **http://localhost:8888**

---

## Docker Setup

```bash
docker compose up --build
```

Services: `sql-database` (MySQL 8) · `njs-backend` (:3333) · `rjs-frontend` (:8888)

The backend reads `DATABASE_HOST=sql-database` from the compose environment and connects via TCP instead of a Unix socket.

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
