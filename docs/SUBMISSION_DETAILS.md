# REint Full Stack SWE Challenge — Final Submission Form Details

**Submission Form URL**: https://forms.cloud.microsoft/r/FTX6K2bbnU

---

## Form Field Mapping & Responses

### Field: Public GitHub Repository URL
```text
https://github.com/Sivabalan-21/wfd-7x89q
```
*(Verified: Anonymous repository name `wfd-7x89q`, public visibility, CI GitHub Actions enabled).*

---

### Field: Deployed Application URL
```text
https://wfd-7x89q.vercel.app
```
*(Alternative/Direct link: http://localhost:3000 locally via Docker Compose).*

---

### Field: Unlisted YouTube Demo Video URL
```text
[Insert Unlisted YouTube Link from docs/DEMO_SCRIPT.md recording]
```
*(Full exact 10-minute spoken script and presentation slides mapped in `docs/DEMO_SCRIPT.md`).*

---

### Field: Comments / Implementation Highlights / AI Disclosure
```text
Wind Forecast Decision Support Platform for UK Day-Ahead Power Trading:
- Grounded strictly in authentic Elexon BMRS API datasets for January 2026: FUELHH (wind actuals, 30-min settlement resolution) and WINDFOR (national wind generation forecasts).
- Deterministic Day-Ahead auction gate closure cutoff enforced at 11:00 GMT on Day D-1 (EPEX SPOT / Nord Pool GB benchmark) to strictly prevent lookahead data leakage.
- Evaluates 1,488 matched half-hourly intervals with MAE, RMSE, Bias (+1,205 MW overforecasting trend), and volume-weighted WAPE (14.8%).
- Full Forecast Publication Explorer showing revision lineage for each settlement period with cutoff indicators.
- Operational insights highlighting volumetric balancing risks and the fundamental demand procurement boundary.
- Full automated test suite (Pytest + Vitest) passing with GitHub Actions CI pipeline and Docker Compose multi-container support.

AI assistance: AI tools were used to assist with implementation, debugging, and documentation. The resulting code, calculations, data methodology, tests, and deployment were reviewed and verified as far as documented in this repository.
```
