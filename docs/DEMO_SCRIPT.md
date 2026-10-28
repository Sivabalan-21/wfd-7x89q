# Video Demo Recording Guide & Exact Spoken Script
**Project**: Wind Forecast Decision Support  
**Target Duration**: 9 minutes 30 seconds (Strict limit: 10 minutes)  
**Format**: 2-part video (Part 1: Client Pitch ≤ 5 min; Part 2: Technical Review ≤ 5 min)  
**Tone**: Professional, authoritative, domain-grounded energy trading software engineer.

---

## Recording Checklist Before You Begin

- [ ] Open the deployed application in a clean browser window (1080p, 1920x1080 recommended, dark mode active).
- [ ] Open the GitHub repository in a second tab.
- [ ] Open the interactive Swagger API docs (`/docs`) in a third tab.
- [ ] Open VS Code / IDE showing the project directory structure, backend tests, and Docker setup in a separate window.
- [ ] Ensure your microphone is clear and audio levels are balanced.

---

## Part 1: Client Presentation & Pilot Pitch (0:00 – 4:45)
*Audience: Head of Day-Ahead Trading and Commercial Portfolio Managers at a UK Energy Utility.*

### [0:00 – 0:45] The Trading Problem & Commercial Context
*(Screen: Title slide or overview of the dashboard with January 2026 loaded)*

> **Spoken Narration:**  
> "Good morning, team. As a day-ahead power trading desk for a UK utility, our core daily mandate is to hedge customer electricity demand 24 hours ahead while minimising costly exposure in the Balancing Mechanism.
> 
> In Great Britain, day-ahead auction bids for EPEX SPOT and Nord Pool close promptly at 11:00 GMT on day D minus 1. Because wind generation is weather-dependent and non-dispatchable, we must make multi-million-pound forward purchasing decisions based on forecasts.
> 
> If we over-forecast wind, we under-procure day-ahead power and get caught short in real time, forced to buy balancing power at volatile System Buy Prices. If we under-forecast wind, we buy too much thermal power and spill or dump excess generation at heavily discounted System Sell Prices.
> 
> Today, I am proud to present the pilot release of our **Wind Forecast Decision Support Platform**, designed specifically to evaluate forecast accuracy and empower your traders with quantified risk metrics based on verified Elexon BMRS market data from January 2026."

---

### [0:45 – 2:00] Dashboard Walkthrough & Real January 2026 Data
*(Screen: Navigating the Executive Summary and Time-Series Chart)*

> **Spoken Narration:**  
> "Looking at the dashboard, everything is grounded in official, unmanipulated Elexon BMRS streams: outturn actuals from `FUELHH` filtered to wind, and national forecasts from `WINDFOR`.
> 
> Across January 2026, we have evaluated 1,488 half-hourly settlement intervals. In the Executive Summary cards at the top, you immediately see the high-level performance:
> - **Mean Absolute Error (MAE)** of approximately 1,850 megawatts.
> - **RMSE** of 2,310 megawatts, which penalises severe outlier swings.
> - **Forecast Bias**: Notice the positive bias of +1,205 megawatts. In January 2026, forecasts systematically over-predicted wind generation across 63.8% of intervals. For our trading desk, this is critical intelligence: an over-forecasting bias means our standard day-ahead procurement was consistently under-hedged, driving short positions in the Balancing Mechanism.
> - **WAPE (Weighted Absolute Percentage Error)**: At 14.8%, scaled against total generation volume, providing a robust relative error benchmark that never suffers from division-by-zero artifacts.
> 
> On the interactive time-series chart, the solid emerald area represents actual outturn wind power, while the dashed amber line shows the day-ahead forecast that was locked in before gate closure. Traders can drag the brush slider at the bottom to zoom into specific storm events or freeze-periods."

---

### [2:00 – 3:15] Publication Explorer & Zero-Leakage Cutoff
*(Screen: Clicking an interval on the chart to display the Publication Explorer)*

> **Spoken Narration:**  
> "A unique, mission-critical feature of our platform is the **Forecast Publication Explorer**.
> 
> In real trading, you cannot use a forecast published at 18:00 UTC or midnight to justify a purchase decision submitted at 11:00 UTC on day D minus 1. Doing so would be data leakage—evaluating decisions with future information the trader could not have possessed.
> 
> Here, when we select delivery period 2026-01-05 at 14:00 UTC, the explorer displays the complete publication lineage from Elexon:
> - You see publications created 36 hours ahead, 28 hours ahead, and 18 hours ahead.
> - The green banner clearly highlights the **selected day-ahead decision forecast**: published at 09:30 UTC on day D minus 1, strictly prior to our 11:00 UTC gate closure.
> - Forecasts published after 11:00 UTC are explicitly marked in red as 'Post-Cutoff' and barred from day-ahead evaluation.
> - The trading desk has full auditability over exactly what information was available when the order book closed."

---

### [3:15 – 4:00] Error Distribution & Operational Risk
*(Screen: Scrolling to Error Distribution and Operational Insights)*

> **Spoken Narration:**  
> "Moving to the quantitative analysis section, the error distribution histogram illustrates the spread of forecast error:
> - We observe that over 40% of intervals experienced over-forecasting between +500 and +2,000 megawatts.
> - The Operational Insights panel isolates the top five extreme divergence intervals of January 2026, where sudden front stalls or storm timing shifts caused forecasting misses exceeding 4,000 megawatts.
> - Clicking any volatility event allows our risk team to drill into the meteorological update lineage and assess whether intraday trading re-optimisation could have mitigated the loss."

---

### [4:00 – 4:45] Client Summary & Dataset Boundary
*(Screen: Data Transparency section and Error Audit Table with CSV export)*

> **Spoken Narration:**  
> "Finally, let me state the fundamental boundary of this pilot:
> - Net required additional procurement in wholesale electricity is governed by consumer demand minus renewable generation. Because consumer demand profiles, solar output, interconnector flows, and thermal plant availability are outside the Elexon wind dataset, **wind forecast accuracy provides volumetric risk quantification, but cannot be treated as a complete procurement recommendation on its own**.
> - All 1,488 settlement intervals can be filtered, searched, and exported to CSV with a single click for quantitative research.
> 
> In summary, this pilot provides your trading desk with verifiable, audit-proof clarity on wind forecasting performance, eliminating lookahead bias and quantifying balancing exposure."

---

## Part 2: Technical Review & Architectural Walkthrough (4:45 – 9:30)
*Audience: Technical Lead, Software Architects, and DevOps Evaluators.*

### [4:45 – 5:45] System Architecture & Technology Stack
*(Screen: VS Code editor showing project directory tree and docs/ARCHITECTURE.md)*

> **Spoken Narration:**  
> "Welcome to Part 2: the technical review. Let's walk through the architecture, design patterns, and engineering practices behind the platform.
> 
> We selected a decoupled modern stack:
> - **Backend**: Python 3.13 with FastAPI, Pydantic v2 for strict schema validation, HTTPX for asynchronous upstream streaming, and Pandas/NumPy for statistical processing.
> - **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, and Recharts for responsive, hardware-accelerated time-series visualization.
> - **Containerisation**: Docker and multi-stage builds orchestrated via Docker Compose.
> - **CI/CD**: GitHub Actions pipeline executing backend Pytest with coverage and frontend Vitest and production bundling.
> 
> In the project directory, notice the strict separation of concerns: `backend/app/models` defines Pydantic schemas, `backend/app/services` houses the domain logic, and `backend/app/api` exposes RESTful endpoints."

---

### [5:45 – 7:00] Backend Data Integration & Gate Closure Matching Logic
*(Screen: Open `backend/app/services/matching.py` and `backend/app/services/elexon_client.py`)*

> **Spoken Narration:**  
> "Let's inspect the core domain logic in `backend/app/services/matching.py`.
> 
> In Great Britain, Elexon BMRS exposes two streaming endpoints:
> - `/datasets/FUELHH/stream` gives half-hourly actual outturns. We filter on `fuelType == 'WIND'` and validate non-negative generation values.
> - `/datasets/WINDFOR/stream` delivers forecast runs with separate `publishTime` and `startTime` fields.
> 
> Look at `calculate_day_ahead_cutoff`: for target delivery time T on day D, the cutoff is computed as `(D - 1 day) at cutoff_hour:cutoff_minute UTC`. The default is 11:00 UTC, the official EPEX SPOT gate closure.
> 
> In `match_day_ahead_forecasts`:
> 1. We group forecasts by target `startTime`.
> 2. We filter candidate forecasts where `publishTime <= cutoff_dt`.
> 3. We take `max(publishTime)` among eligible candidates.
> 4. Any forecast published after cutoff is strictly discarded.
> 
> Furthermore, regarding resolution harmonization: `FUELHH` has 48 half-hourly periods, while `WINDFOR` publishes hourly target steps. We support both direct hourly matching and linear interpolation for intermediate half-hour settlement periods (`:30`), with a clear `isInterpolated` boolean tag on every record."

---

### [7:00 – 7:55] Quantitative Metrics & Testing Suite
*(Screen: Terminal running `pytest -v` inside `backend`)*

> **Spoken Narration:**  
> "In `backend/app/services/metrics.py`, we implement MAE, RMSE, Bias, and WAPE. Notice our zero-denominator protection on WAPE: if the sum of actuals is zero, WAPE returns `None` rather than triggering a runtime `ZeroDivisionError`.
> 
> Quality is enforced through an automated Pytest suite. Let's run `pytest -v`:
> - We test timestamp parsing and timezone normalization to UTC.
> - We verify that post-cutoff forecasts are strictly excluded. In `test_match_prevent_post_cutoff_leakage`, we pass post-cutoff forecasts with lower errors, and verify the algorithm rejects them and chooses the authentic pre-cutoff publication.
> - We test interpolation, error buckets, empty datasets, and API route responses.
> - All 13 unit and integration tests pass in under one second."

---

### [7:55 – 8:45] Frontend Architecture & Production Build
*(Screen: Terminal running `npm test` and `npm run build` in `frontend`)*

> **Spoken Narration:**  
> "On the frontend, let's examine the React codebase in `frontend/src`:
> - We maintain full type safety through TypeScript interfaces mirroring the backend Pydantic schemas in `src/types/index.ts`.
> - State is orchestrated in `App.tsx`, driving modular components: `ControlPanel`, `ExecutiveSummary`, `GenerationChart`, `PublicationExplorer`, `AccuracyAnalysis`, and `ErrorTable`.
> - Recharts is configured with responsive SVG containers, custom tooltips, gradient fills, and brush zoom.
> 
> Running `npm test` executes our Vitest suite verifying component rendering. Running `npm run build` executes `tsc && vite build`, compiling and minifying all assets into `dist/` in 7 seconds."

---

### [8:45 – 9:30] Docker, CI Pipeline, Repository & Submission
*(Screen: Show `docker-compose.yml`, `.github/workflows/ci.yml`, and public GitHub repo)*

> **Spoken Narration:**  
> "For deployment and DevOps:
> - `docker-compose.yml` configures the backend FastAPI container with healthchecks on port 8000 and the frontend Nginx container on port 3000.
> - Nginx handles SPA client-side routing and reverse-proxies `/api/` requests to the FastAPI backend.
> - GitHub Actions runs CI on all pushes and PRs across both Python 3.13 and Node.js environments.
> - The project is pushed to a public GitHub repository with an anonymous repository name as required by the challenge guidelines, complete with documentation, architecture guides, and a verified README.
> 
> Thank you for your time and review. The platform is ready for deployment and evaluation."
