# Wind Forecast Decision Support — Architecture & Design

## 1. System Overview

**Wind Forecast Decision Support** is an end-to-end, high-performance web platform engineered for a UK electricity utility's Day-Ahead power trading desk. The system enables power traders and quantitative risk analysts to:
1. Ingest national wind generation actuals and forecast streams directly from official Elexon BMRS feeds.
2. Evaluate historical day-ahead forecast accuracy for January 2026 under strict, auditable market gate closure cutoffs without lookahead bias.
3. Quantify volumetric imbalances, forecast bias, and extreme divergence events to inform commercial hedging decisions.

```
+---------------------------------------------------------------------------------+
|                                 WEB BROWSER                                     |
|  React 18 • TypeScript • Tailwind CSS • Recharts • Vite SPA                     |
|  - Executive Summary Cards     - Interactive Time-Series (MW & Zoom Brush)      |
|  - Forecast Publication Explorer - Error Histogram & Quantitative Metrics       |
|  - Operational Trading Insights - Audit Log Table & CSV Export                  |
+---------------------------------------------------------------------------------+
                                       │
                      HTTP / JSON REST API (Port 8000)
                                       │
+---------------------------------------------------------------------------------+
|                               PYTHON BACKEND                                    |
|  FastAPI • Pydantic v2 • HTTPX • Pandas • Uvicorn                              |
|                                                                                 |
|  ┌─────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐  |
|  │   API Endpoints     │  │  Day-Ahead Matching   │  │   Accuracy Metrics    │  |
|  │ - /api/health       │  │  - Zero-Leakage Gate  │  │   - MAE, RMSE, Bias   │  |
|  │ - /api/metadata     │  │    Closure Cutoff     │  │   - WAPE (Guarded)    │  |
|  │ - /api/wind/actuals │  │  - Chronological Sort │  │   - Error Buckets     │  |
|  │ - /api/wind/forecast│  │  - 30-min Interp      │  │   - Over/Under Counts │  |
|  │ - /api/wind/accuracy│  │  - Leakage Guard      │  │                       │  |
|  └──────────┬──────────┘  └───────────┬───────────┘  └───────────┬───────────┘  |
|             │                         │                          │              |
|             └─────────────────────────┼──────────────────────────┘              |
|                                       │                                         |
|                       ┌───────────────┴───────────────┐                         |
|                       │   Elexon BMRS Client          │                         |
|                       │   - In-Memory Fast Cache      │                         |
|                       │   - Disk Cache (JSON Storage) │                         |
|                       │   - Exponential Retry Backoff │                         |
|                       └───────────────┬───────────────┘                         |
+---------------------------------------┼-----------------------------------------+
                                        │ HTTPS
                                        ▼
+---------------------------------------------------------------------------------+
|                           ELEXON BMRS INSIGHTS API                              |
|  - /datasets/FUELHH/stream (Actuals: fuelType=WIND, 30-min Settlement Periods)  |
|  - /datasets/WINDFOR/stream (Forecasts: National Wind Generation, Multi-Run)    |
+---------------------------------------------------------------------------------+
```

---

## 2. Directory Structure

```
wfd-7x89q/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions automated test & build pipeline
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI initialization, CORS, lifespan
│   │   ├── config.py              # Environment settings via Pydantic Settings
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py         # Type-safe Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── elexon_client.py   # Resilient async HTTPX streaming client
│   │   │   ├── matching.py        # Day-ahead gate closure matching engine
│   │   │   └── metrics.py         # MAE, RMSE, Bias, WAPE, and histogram logic
│   │   └── api/
│   │       ├── __init__.py
│   │       ├── routes_health.py   # /api/health, /api/metadata
│   │       └── routes_wind.py     # /api/wind/actuals, /forecasts, /accuracy, /explore
│   ├── data_cache/                # Pre-seeded authentic January 2026 data
│   │   ├── actuals_wind_2026-01-01_2026-01-31.json
│   │   └── windfor_2025-12-30_2026-02-01.json
│   ├── tests/
│   │   ├── conftest.py            # Test fixtures and mock data
│   │   ├── test_matching.py       # Cutoff, zero-leakage, and interpolation tests
│   │   ├── test_metrics.py        # MAE, RMSE, Bias, and WAPE math verification
│   │   └── test_api.py            # Route integration and mock client tests
│   ├── requirements.txt           # Production dependencies
│   ├── requirements-dev.txt       # Dev & test dependencies
│   └── Dockerfile                 # Production Python 3.13 image
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx         # Brand header, live Elexon status pill
│   │   │   ├── ControlPanel.tsx   # Date presets, custom date, cutoff selector
│   │   │   ├── ExecutiveSummary.tsx # High-level KPI summary cards
│   │   │   ├── GenerationChart.tsx  # Interactive Recharts MW time-series & brush
│   │   │   ├── PublicationExplorer.tsx # Revision audit trail per delivery interval
│   │   │   ├── AccuracyAnalysis.tsx # Error histogram and metric definitions
│   │   │   ├── OperationalInsights.tsx # Commercial trading risk analysis
│   │   │   ├── ErrorTable.tsx     # Sortable, searchable audit table with CSV export
│   │   │   └── DataTransparency.tsx # Data provenance and methodology audit
│   │   ├── services/
│   │   │   └── api.ts             # Type-safe API client
│   │   ├── types/
│   │   │   └── index.ts           # Shared TypeScript interfaces
│   │   ├── App.tsx                # Master container and state orchestration
│   │   ├── main.tsx               # React DOM entry point
│   │   └── index.css              # Tailwind CSS imports
│   ├── tests/
│   │   └── App.test.tsx           # Component rendering unit test
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── nginx.conf                 # Production reverse proxy configuration
│   └── Dockerfile                 # Multi-stage build (Node 22 -> Nginx Alpine)
├── docs/
│   ├── ARCHITECTURE.md            # System architecture document (this file)
│   ├── METHODOLOGY.md             # Market methodology and mathematics
│   └── DEMO_SCRIPT.md             # Timed 10-minute presentation script
├── docker-compose.yml             # Local multi-container development environment
├── .dockerignore
├── .gitignore
├── .env.example
└── README.md                      # Primary project overview and setup instructions
```

---

## 3. Key Design Decisions

### 3.1 Strict Day-Ahead Market Timing
In Great Britain, power trading on the day-ahead auction (EPEX SPOT / Nord Pool) occurs on Day $D-1$ for delivery throughout Day $D$. Bidding closes at 11:00 GMT (Gate Closure). Using forecasts published after this cutoff to evaluate trading decisions is invalid and constitutes **lookahead data leakage**. Our matching engine enforces this cutoff deterministically.

### 3.2 Dual-Layer Caching Architecture
Fetching large historical streams from Elexon across an entire month (thousands of records) takes 1–3 seconds. To provide instantaneous (~10ms) responses in the dashboard, the backend utilizes:
1. **In-Memory Cache**: Stored in Python dictionaries for zero-latency retrieval during multi-turn exploration.
2. **Disk-Based JSON Storage**: Persisted in `data_cache/` so cold container restarts do not burden upstream Elexon servers.
3. **On-Demand Refresh**: Users can force a live upstream query via the UI or `force_refresh=true` parameter.

### 3.3 Resolution Harmonization (Hourly vs 30-Minute)
Elexon `FUELHH` publishes actuals at 30-minute intervals (48 settlement periods daily). `WINDFOR` forecasts publish at hourly target intervals (`:00`). The engine supports:
- **Direct Matching**: Evaluates exact hourly intervals with zero synthetic assumptions.
- **Interpolated Mode**: Calculates intermediate half-hour settlement periods (`:30`) by linear interpolation of pre-cutoff hourly forecasts.
All intervals carry an explicit `isInterpolated` boolean tag in the API and UI.
