# Wardrobe Management App

## Project Overview

A full-stack wardrobe management application that lets users catalogue clothing items, plan outfits based on weather forecasts and calendar events, and track laundry cycles. The backend exposes a REST API; the frontend is a single-page React app that consumes it.

## Tech Stack

### Frontend
- React 18
- Vite 4 (dev server on port 8888)
- Tailwind CSS 3
- React Router 6

### Backend
- Node.js 22
- Express 4
- Sequelize 6 (ORM)
- MySQL 8
- multer (image uploads)
- helmet + express-rate-limit (security)

## Dev Commands

```bash
# Start full stack (MySQL + backend + frontend) via Docker
docker compose up --build

# Or start only the DB, then run backend/frontend locally
docker compose up -d sql-database
cd back && npm run dev       # port 3333
cd front && npm run dev      # port 8888

# Run backend tests
cd back && npm test
```

## Local Setup Notes

- **MySQL runs in Docker** — `docker compose up -d sql-database` starts the DB container.
- **ENCRYPTION_KEY** must be set in `back/.env` before starting. Generate with:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  Without it, stored calendar credentials are lost on every restart.
- When running the backend outside Docker, `DATABASE_HOST` in `back/.env` should be `127.0.0.1` (TCP) not `localhost` (which triggers a Linux socket path that doesn't exist on macOS).
- Docker Compose sets `DATABASE_HOST=sql-database` automatically for the containerised backend.

## Development Methodology — TDD / Spec-Driven

This is the most important section. All backend code follows a strict test-first discipline.

### Rules

1. **Write the test before the implementation.** The spec file is the contract — it defines the function signature, expected return shape, and edge cases. No implementation code is written until a failing test exists.

2. **File locations:**
   - Utility function specs: `back/utils/__tests__/<module>.test.js`
   - Route integration specs: `back/routes/__tests__/<module>.test.js`

3. **Naming convention:** `<module>.test.js` (e.g. `outfitSuggester.test.js`, `wardrobe.test.js`)

4. **Red -> Green -> Refactor cycle is mandatory:**
   - Write the failing test first (Red)
   - Write the minimum code to make it pass (Green)
   - Refactor if needed, keeping tests green (Refactor)

5. **Modifying existing logic:** update or add tests first, then change the implementation.

6. **Do not ship code without passing tests.** Run `cd back && npm test` before committing any backend change.

### Scope

| Code type | Test required | Location |
|---|---|---|
| New utility function | Yes — unit test | `back/utils/__tests__/` |
| New route with business logic | Yes — integration test | `back/routes/__tests__/` |
| Simple CRUD route (no logic) | Recommended | `back/routes/__tests__/` |
| Frontend components | Optional | — |

### Example: adding a utility function

```
# 1. Create the spec
back/utils/__tests__/myHelper.test.js   <- write this first

# 2. Run — expect it to fail
cd back && npm test

# 3. Implement
back/utils/myHelper.js

# 4. Run again — all green
cd back && npm test
```

## Project Structure

```
Assignment4/
├── back/                        # Express API
│   ├── config/
│   │   └── database.js          # Sequelize connection
│   ├── models/
│   │   ├── WardrobeItem.model.js
│   │   ├── CalendarEvent.model.js
│   │   ├── OutfitSuggestion.model.js
│   │   ├── UserSettings.model.js
│   │   └── CalendarConnection.model.js
│   ├── routes/
│   │   ├── wardrobe.js          # CRUD + image upload
│   │   ├── outfits.js           # Outfit generation & worn tracking
│   │   ├── calendar.js          # Manual calendar events
│   │   ├── laundry.js           # Laundry tracker
│   │   ├── weather.js           # Open-Meteo proxy
│   │   ├── settings.js          # User settings (city)
│   │   ├── googleCalendar.js    # Google Calendar OAuth
│   │   └── appleCalendar.js     # Apple Calendar (CalDAV)
│   ├── utils/
│   │   ├── outfitSuggester.js   # Core scoring & suggestion logic
│   │   ├── encryption.js        # AES-256-GCM for stored credentials
│   │   ├── googleCalendar.js    # Google API helpers
│   │   └── appleCalendar.js     # CalDAV helpers
│   ├── uploads/                 # Uploaded clothing images (gitignored)
│   ├── index.js                 # Express app entry point
│   └── package.json
│
└── front/                       # React SPA
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Wardrobe.jsx
    │   │   ├── OutfitPlanner.jsx
    │   │   ├── Calendar.jsx
    │   │   └── Laundry.jsx
    │   ├── components/
    │   │   └── Navbar.jsx
    │   ├── api.service.js       # Axios wrapper for all API calls
    │   ├── App.jsx
    │   └── main.jsx
    ├── vite.config.js           # Port 8888, @ alias
    └── package.json
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/wardrobe` | List all wardrobe items |
| POST | `/api/wardrobe` | Add item (multipart/form-data with optional image) |
| DELETE | `/api/wardrobe/:id` | Delete item and its image file |
| GET | `/api/outfits` | List saved outfit suggestions |
| POST | `/api/outfits/generate` | Generate 7-day outfit suggestions from weather + calendar |
| PUT | `/api/outfits/:id/worn` | Mark outfit as worn (increments wear counts) |
| PUT | `/api/outfits/:id/unworn` | Undo worn mark |
| GET | `/api/calendar` | List calendar events |
| POST | `/api/calendar` | Create calendar event |
| DELETE | `/api/calendar/:id` | Delete calendar event |
| GET | `/api/laundry` | List items needing a wash (wornSinceWash >= 2) |
| PUT | `/api/laundry/wash` | Mark items as washed (resets wornSinceWash) |
| GET | `/api/weather?city=` | Fetch 7-day forecast via Open-Meteo |
| GET | `/api/settings` | Get user settings (city) |
| POST | `/api/settings` | Update user settings |
| GET/POST | `/api/google-calendar/*` | Google Calendar OAuth flow |
| GET/POST | `/api/apple-calendar/*` | Apple CalDAV integration |

Static uploads are served at `/uploads/:filename`.

## Environment Variables

Create `back/.env`:

```dotenv
# Server
PORT=3333
NODE_ENV=development

# Database
DATABASE_HOST=localhost        # set to container name in Docker

# CORS
FRONTEND_URL=http://localhost:8888

# Encryption (for stored calendar credentials)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=<64-char hex string>

# Google Calendar OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3333/api/google-calendar/callback
```

The database credentials are hardcoded to `root/root` with database `test_db` in `back/config/database.js`. Change them there or extend the config to read from `.env` if needed.
