# NOAA Weather Dashboard

Real-time geospatial dashboard showing live NWS (National Weather Service) alerts plotted on a dark US map. Auto-refreshes every 60 seconds. Alerts are color-coded by severity, filterable by state/event type/keyword, and include a click-through detail popup.

---

## Architecture

```
Browser (React 19 + Leaflet)
    │  HTTP poll — /api/alerts every 60 s
    ▼
Express proxy  (port 3001)
    │  CORS headers  •  60-second in-memory cache
    ▼
https://api.weather.gov/alerts/active   (GeoJSON)
```

## Tech Stack

| Layer | Library | Notes |
|---|---|---|
| Frontend | React 19 + Vite 7 | Fast HMR, ESM |
| Mapping | Leaflet 1.9 + react-leaflet 5 | Free, no API key |
| Tiles | CartoDB Dark Matter | Free, no key |
| Styling | Tailwind CSS 3 | Utility-first dark theme |
| HTTP | axios | Promise-based, used in hook |
| Dates | date-fns 3 | Lightweight, tree-shakeable |
| Proxy/cache | Express + node-cache | CORS bypass, 60 s TTL |

## File Structure

```
noaa-dashboard/          ← Vite frontend (root)
├── src/
│   ├── App.jsx                    Layout, filter state, alert selection
│   ├── hooks/useAlerts.js         60s polling hook with countdown timer
│   ├── utils/severity.js          Color/style tokens per severity level
│   ├── utils/formatters.js        Date helpers, state lookup, pluralise
│   └── components/
│       ├── Header.jsx             Top bar: branding, live dot, countdown, refresh
│       ├── AlertPopup.jsx         Slide-in detail panel (right)
│       ├── Sidebar.jsx            Sidebar container + severity summary
│       ├── FilterPanel.jsx        Keyword, state, severity chips, event list
│       ├── AlertList.jsx          Scrollable memoised alert list
│       ├── MapView.jsx            MapContainer + tile layer + MapController
│       └── AlertGeoJSON.jsx       Imperative polygon rendering, dimming, hover
└── backend/
    ├── server.js                  Express proxy with node-cache
    └── package.json
```

---

## Running Locally

### Prerequisites
- Node.js ≥ 18  •  npm ≥ 9

### 1 — Start the backend proxy

```bash
cd noaa-dashboard/backend
npm install
npm run dev          # nodemon, auto-restarts
# → http://localhost:3001
# Test: http://localhost:3001/health
```

### 2 — Start the frontend

```bash
cd noaa-dashboard        # the project root
npm install
npm run dev
# → http://localhost:5173
```

Vite proxies `/api/*` → `http://localhost:3001` automatically during development.

---

## Features

| Feature | Detail |
|---|---|
| Dark map | CartoDB Dark Matter base tiles |
| Alert polygons | GeoJSON polygons from NWS, rendered with Leaflet |
| Color coding | Red = Extreme · Orange = Severe · Yellow = Moderate · Blue = Minor |
| Sidebar | Severity summary, keyword search, state dropdown, severity chips, event-type list |
| Detail popup | Headline, effective/expiry times, area, description, instructions, link to weather.gov |
| Auto-refresh | Polls every 60 seconds; countdown shown in header |
| Manual refresh | Header refresh button |
| Filter dimming | Non-matching polygons dimmed on map, not removed (context preserved) |
| Fly-to | Clicking an alert in the list flies the map to its bounding box |

---

## Severity Color Reference

| Level | Color | Hex |
|---|---|---|
| Extreme | Red | `#ef4444` |
| Severe | Orange | `#f97316` |
| Moderate | Yellow | `#eab308` |
| Minor | Blue | `#3b82f6` |
| Unknown | Gray | `#6b7280` |

---

## Deployment

### Frontend — Vercel / Netlify

```bash
npm run build        # outputs to /dist
# deploy /dist
```

Set `VITE_API_BASE` or update `vite.config.js` proxy target to point at your deployed backend URL.

### Backend — Railway / Render / Fly.io

```bash
cd backend
# push to platform; set PORT env var if needed (defaults 3001)
```

Update `ALLOWED_ORIGINS` in `backend/server.js` to include your production frontend domain.

### NOAA API Notes

- Endpoint: `GET https://api.weather.gov/alerts/active`
- Returns a GeoJSON `FeatureCollection`; some features have `null` geometry (zone-based alerts only shown in list)
- NOAA requires a descriptive `User-Agent` header — update the contact email in `backend/server.js`
- Unofficial rate limit ≈ 500 req/hour per IP; the 60-second proxy cache keeps usage far below this
