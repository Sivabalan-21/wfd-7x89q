# Wind Forecast Decision Support Platform (UK Day-Ahead Power Trading)

[![CI Quality & Verification Suite](https://github.com/Sivabalan-21/wfd-7x89q/actions/workflows/ci.yml/badge.svg)](https://github.com/Sivabalan-21/wfd-7x89q/actions)
[![Deploy Frontend to GitHub Pages](https://github.com/Sivabalan-21/wfd-7x89q/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Sivabalan-21/wfd-7x89q/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python: 3.13](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React: 18](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

An institutional-grade energy analytics and decision support platform engineered for a UK electricity utility's Day-Ahead power trading team. The platform ingests real national wind generation actuals (`FUELHH`) and forecast runs (`WINDFOR`) from official **Elexon BMRS** market streams for **January 2026**, enforcing strict Day-Ahead auction gate closure cutoffs to quantify forecasting error, volumetric risk, and balancing cash-out exposure with **zero lookahead data leakage**.

---

## Deliverables & Verified Links

- **Public GitHub Repository**: [https://github.com/Sivabalan-21/wfd-7x89q](https://github.com/Sivabalan-21/wfd-7x89q) *(Anonymous repository name `wfd-7x89q`)*
- **Live Deployed Application**: [https://sivabalan-21.github.io/wfd-7x89q/](https://sivabalan-21.github.io/wfd-7x89q/) *(Accessible publicly in incognito browser)*
- **Backend API & Swagger Documentation**: `http://localhost:8000/docs` *(or Docker Compose port 8000)*
- **Backend Health Check**: `http://localhost:8000/api/health`
- **Demonstration Video Guide**: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) *(Exact 10-minute client pitch & technical review script)*
- **Submission Form Formatted Details**: [`docs/SUBMISSION_DETAILS.md`](docs/SUBMISSION_DETAILS.md)

---

## 1. Business Problem & Trading Context

In the Great Britain (GB) wholesale power market:
1. **The Day-Ahead Auction**: Day-ahead power purchase commitments are submitted to the **EPEX SPOT GB** and **Nord Pool GB** day-ahead auctions. Order books close strictly at **11:00 GMT (UTC)** on the day prior to physical delivery ($D-1$).
2. **Volumetric Uncertainty**: Renewable generation (wind) is intermittent and weather-dependent. To serve customer demand, the utility must decide how much dispatchable thermal generation or wholesale power to purchase one day in advance.
3. **The Balancing Risk**:
   - **Overforecasting Wind** ($F > A$): The utility under-procures power on day $D-1$. In real time, the wind deficit forces the utility to purchase shortfall energy in the Balancing Mechanism at volatile **System Buy Prices (SBP)**.
   - **Underforecasting Wind** ($F < A$): The utility over-procures thermal generation on day $D-1$. Surplus wind must be spilled or sold back to the system at discounted **System Sell Prices (SSP)**.
4. **The Critical Requirement**: A forecast is only valid for evaluating a trading decision if it was published **on or before the 11:00 UTC gate closure cutoff**. Evaluating decisions using later intraday forecasts constitutes **data leakage** (lookahead bias).

---

## 2. Core Platform Capabilities

### 1. Executive Summary & KPIs
- Evaluates **1,488 half-hour settlement periods** across the entire month of January 2026.
- High-level KPI cards displaying **MAE (MW)**, **RMSE (MW)**, **Forecast Bias (MW)**, **WAPE (%)**, and directional bias split.
- Upstream data freshness, latest publication timestamps, and Elexon API connection health.

### 2. Interactive Wind Generation Overview
- Time-series chart comparing outturn actual wind generation (`FUELHH`, MW) against the locked day-ahead forecast (`WINDFOR`, MW).
- Hardware-accelerated SVG rendering via Recharts with customizable date ranges, brush zoom, tooltips, and click-to-inspect interactivity.

### 3. Forecast Publication Explorer & Zero-Leakage Audit Trail
- For any chosen target delivery interval, inspect the full chronological lineage of forecast publications issued by Elexon leading up to delivery.
- Visually displays the **11:00 UTC cutoff boundary** on Day $D-1$.
- Highlights the exact forecast selected for day-ahead commitments, marking later revisions as "Post-Cutoff (Leakage - Excluded)".

### 4. Quantitative Error Distribution
- Histogram dividing forecast errors into discrete volumetric risk buckets (from severe underforecasting $<-4,000\text{ MW}$ to severe overforecasting $>+4,000\text{ MW}$).
- Clear mathematical and commercial definitions for MAE, RMSE, Bias, and WAPE.

### 5. Operational Insights & Trading Desk Risk
- Highlights the Top 5 extreme divergence events of January 2026 (swings exceeding $4,000\text{ MW}$).
- Commercial impact analysis explaining how bias and volatility translate into Balancing Mechanism cash-out exposure.
- **Mandatory Domain Disclaimer**: Transparently explains that required additional procurement depends on consumer demand and other available generation outside this dataset; wind data alone cannot formulate a complete procurement schedule.

### 6. Settlement Error Audit Table & CSV Export
- Searchable, sortable, paginated data table showing Target Delivery Time, Settlement Period (1–48), Forecast Publication Time, Forecast MW, Actual MW, Signed Error (MW), and Lead Time.
- One-click **CSV export** for quantitative research and risk reporting.

---

## 3. Technology Stack & Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (SPA)                        │
│  React 18 • TypeScript • Vite • Tailwind CSS • Recharts      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON REST API
┌──────────────────────────────▼──────────────────────────────┐
│                      Backend (FastAPI)                      │
│  Python 3.13 • FastAPI • Pydantic v2 • HTTPX • Pandas       │
├─────────────────────────────────────────────────────────────┤
│  Services:                                                  │
│   • ElexonClient (Async HTTPX, exponential backoff, cache)  │
│   • MatchingEngine (Zero-leakage Day-Ahead gate closure)    │
│   • MetricsCalculator (MAE, RMSE, Bias, guarded WAPE)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS Streaming
┌──────────────────────────────▼──────────────────────────────┐
│                  Official Elexon BMRS API                   │
│   • /datasets/FUELHH/stream (Actuals: fuelType=WIND)        │
│   • /datasets/WINDFOR/stream (National Wind Forecasts)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Elexon Datasets & Matching Methodology

### 4.1 Upstream Feeds
1. **Actual Generation**: Elexon BMRS `FUELHH/stream` filtered to `fuelType = "WIND"`. Provides 30-minute GB settlement periods.
2. **Forecast Generation**: Elexon BMRS `WINDFOR/stream`. Provides national wind generation forecasts published at multiple runs daily.

### 4.2 Gate Closure Selection Rule
For target interval $T$ on delivery day $D$:
$$\text{Cutoff} = (D - 1\text{ day}) \text{ at } 11:00\text{ UTC}$$
$$\mathcal{F}_{\text{eligible}}(T) = \{ f \in \text{WINDFOR} \mid f.\text{startTime} = T \land f.\text{publishTime} \le \text{Cutoff} \}$$
$$f^*(T) = \arg\max_{f \in \mathcal{F}_{\text{eligible}}(T)} (f.\text{publishTime})$$

Any publication where $f.\text{publishTime} > \text{Cutoff}$ is strictly excluded.

### 4.3 Metric Formulas

| Metric | Formula | Interpretation |
| :--- | :--- | :--- |
| **MAE** | $\frac{1}{N} \sum \|F_i - A_i\|$ | Average absolute volume (MW) requiring real-time balancing. |
| **RMSE** | $\sqrt{\frac{1}{N} \sum (F_i - A_i)^2}$ | Heavily penalizes large forecasting misses and swing events. |
| **Bias** | $\frac{1}{N} \sum (F_i - A_i)$ | Directional error drift. Positive = overforecast; Negative = underforecast. |
| **WAPE** | $\frac{\sum \|F_i - A_i\|}{\sum A_i} \times 100\%$ | Error scaled to total volume. Immune to zero-actual division errors. |

---

## 5. Local Setup & Execution Guide

### Prerequisites
- Python 3.11+ (Python 3.13 recommended)
- Node.js 18+ (Node 22 recommended) & npm
- Docker & Docker Compose (optional for containerized run)

### Option A: Local Native Setup (PowerShell / Windows)

#### 1. Backend Setup
```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements-dev.txt

# Run backend automated tests
pytest -v

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

#### 2. Frontend Setup
```powershell
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run frontend tests
npm test

# Start Vite development server
npm run dev
```
Frontend will be live at `http://localhost:3000`.

---

### Option B: Docker Compose (Full Stack)

```bash
# Build and start all containers in background
docker compose up -d --build

# Inspect logs
docker compose logs -f

# Verify containers
docker compose ps
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Backend Health Check: `http://localhost:8000/api/health`

---

## 6. Automated Testing Suite

### Backend Tests (Pytest)
```bash
cd backend
pytest -v --cov=app --cov-report=term-missing
```
**Test Coverage Includes:**
- Timestamp parsing and UTC normalization (`test_parse_iso_utc`)
- Day-ahead cutoff calculation on Day $D-1$ at 11:00 UTC (`test_calculate_day_ahead_cutoff`)
- **Strict Leakage Prevention**: Verified rejection of post-cutoff forecasts (`test_match_prevent_post_cutoff_leakage`)
- Settlement period interpolation for `:30` intermediate intervals (`test_match_interpolation_intermediate_half_hour`)
- Forecast Publication Explorer response generation (`test_explore_publications_for_interval`)
- Empty dataset handling (`test_empty_actuals_and_forecasts`, `test_metrics_empty_dataset`)
- Mathematical correctness of MAE, RMSE, Bias, and WAPE (`test_metrics_calculation_standard`)
- Zero-denominator division protection on WAPE (`test_metrics_zero_actual_wape_protection`)
- Endpoints integration: `/`, `/api/health`, `/api/metadata`, `/api/wind/accuracy`

### Frontend Tests (Vitest & Testing Library)
```bash
cd frontend
npm test
```
Verifies component rendering, KPI cards, and dashboard container initialization.

---

## 7. Environment Variables (`.env.example`)

```env
PROJECT_NAME="Wind Forecast Decision Support"
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS="*"
DEFAULT_CUTOFF_HOUR=11
DEFAULT_CUTOFF_MINUTE=0
REQUEST_TIMEOUT=30.0
MAX_RETRIES=3
CACHE_DIR=./data_cache
CACHE_TTL_SECONDS=86400
ELEXON_BASE_URL="https://data.elexon.co.uk/bmrs/api/v1"
VITE_API_URL=""
```

---

## 8. AI Assistance Disclosure

> **AI assistance**: AI tools were used to assist with implementation, debugging, and documentation. The resulting code, calculations, data methodology, tests, and deployment were reviewed and verified as far as documented in this repository.
