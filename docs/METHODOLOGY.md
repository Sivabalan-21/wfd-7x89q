# Day-Ahead Wind Forecast Evaluation Methodology

## 1. Domain Background & UK Power Market Mechanics

In the Great Britain (GB) electricity market:
- The delivery day is divided into **48 half-hourly Settlement Periods** (SP 1: 00:00–00:30 GMT to SP 48: 23:30–24:00 GMT).
- Wholesale day-ahead trading is conducted predominantly on the **EPEX SPOT GB Day-Ahead Auction** and **Nord Pool GB Day-Ahead Auction**.
- The benchmark day-ahead auction **order book closes at 11:00 GMT** on the day prior to delivery ($D-1$).
- Traders must submit purchase commitments and generation schedules for the entire 24-hour cycle of Day $D$ prior to this gate closure cutoff.
- Because wind power output is intermittent and non-dispatchable, utilities must rely on renewable generation forecasts available **prior to the 11:00 GMT cutoff** to calculate the residual volume of power that must be procured from thermal plants or market auctions.

---

## 2. Elexon BMRS Datasets

The platform sources all data exclusively from the official **Elexon BMRS Insights Solution** REST API:

| Dataset | Stream Endpoint | Key Fields | Description |
| :--- | :--- | :--- | :--- |
| **FUELHH** | `/datasets/FUELHH/stream` | `startTime`, `settlementDate`, `settlementPeriod`, `fuelType`, `generation` | Outturn half-hourly actual generation by fuel type. Filtered strictly to `fuelType = "WIND"`. |
| **WINDFOR** | `/datasets/WINDFOR/stream` | `publishTime`, `startTime`, `generation` | National wind generation forecast runs published at multiple intervals throughout each day. |

---

## 3. Day-Ahead Gate Closure Matching Engine (Zero Leakage)

### 3.1 Data Leakage Prevention
A common flaw in academic or naive energy analyses is using the "closest forecast in time" to evaluate a trading decision. In live operations, a forecast published at 18:00 UTC on Day $D-1$ or 02:00 UTC on Day $D$ (Intraday) was **physically unavailable** when the day-ahead auction closed at 11:00 UTC on Day $D-1$. Evaluating a day-ahead decision using post-cutoff forecasts introduces severe **lookahead data leakage**.

### 3.2 Formal Selection Rule
For each target settlement interval with delivery start time $T$ on Delivery Date $D$:
1. Calculate the day-ahead auction cutoff timestamp:
   $$\text{Cutoff}(D) = (D - 1\text{ day}) \text{ at } 11:00:00\text{ UTC}$$
2. Identify all forecast records in the WINDFOR dataset where:
   $$f.\text{startTime} = T \quad \text{and} \quad f.\text{publishTime} \le \text{Cutoff}(D)$$
3. From this eligible subset, select the most recent forecast publication:
   $$f^*(T) = \arg\max_{f} \{ f.\text{publishTime} \}$$
4. Strictly reject and discard any publication with $f.\text{publishTime} > \text{Cutoff}(D)$ from the day-ahead evaluation.

---

## 4. Resolution Harmonization & Settlement Alignment

- **FUELHH** provides outturn actuals at 30-minute intervals (`:00` and `:30`).
- **WINDFOR** base runs provide forecasted generation for hourly target steps (`:00`).

To evaluate performance across the full 48 settlement periods, the application supports two transparent matching modes:
1. **Direct Hourly Matching**: Evaluates only intervals where both actual and forecast natively align (`:00`). Zero synthetic assumptions are made.
2. **Linear Interpolation Mode**: For intermediate half-hour periods (`:30`), the forecast is computed by linear interpolation between pre-cutoff hourly forecasts:
   $$F_{H+0.5} = \frac{F_H + F_{H+1}}{2}$$
Both modes are clearly selectable in the dashboard, and every record in the audit table indicates whether it was directly matched or interpolated.

---

## 5. Quantitative Metric Formulas

Let $A_i$ denote outturn actual wind generation (MW), $F_i$ denote the day-ahead locked forecast (MW), and $e_i = F_i - A_i$ denote the signed forecast error for interval $i \in \{1, \dots, N\}$.

### 5.1 Mean Absolute Error (MAE)
$$\text{MAE} = \frac{1}{N} \sum_{i=1}^N |F_i - A_i|$$
- **Interpretation**: Measures the average absolute error magnitude in MW. Represents the average volume that must be balanced in the real-time market.

### 5.2 Root Mean Squared Error (RMSE)
$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N (F_i - A_i)^2}$$
- **Interpretation**: Squares errors before averaging, disproportionately penalizing large forecasting errors. Captures catastrophic swing risk that threatens grid stability and creates major balancing cash-out exposure.

### 5.3 Forecast Bias (Mean Signed Error)
$$\text{Bias} = \frac{1}{N} \sum_{i=1}^N (F_i - A_i)$$
- **Interpretation**:
  - $\text{Bias} > 0$ (**Overforecasting**): Systematic over-prediction of wind. The utility buys too little thermal power day-ahead and is left short in real time.
  - $\text{Bias} < 0$ (**Underforecasting**): Systematic under-prediction. The utility buys excess thermal power day-ahead and is left long in real time.

### 5.4 Weighted Absolute Percentage Error (WAPE)
$$\text{WAPE} = \frac{\sum_{i=1}^N |F_i - A_i|}{\sum_{i=1}^N A_i} \times 100\%$$
- **Interpretation**: Volume-weighted relative error. Unlike MAPE (Mean Absolute Percentage Error), WAPE does not divide by individual actual observations, completely eliminating infinite or distorted values during low-wind or zero-generation periods.
- **Edge Case Protection**: If $\sum A_i = 0$, WAPE is handled gracefully by returning `None` / `N/A`.

---

## 6. Commercial Impact for Power Utilities

### 6.1 The Imbalance Cash-out Mechanism
In the UK Balancing Mechanism (BM):
- **Short Position (Overforecast)**: Actual wind is lower than forecasted. The utility must buy replacement energy at the **System Buy Price (SBP)**, which often spikes dramatically during high-demand or low-reserve periods.
- **Long Position (Underforecast)**: Actual wind exceeds forecast. Surplus energy is sold back to the system at the **System Sell Price (SSP)** (frequently heavily discounted or even negative during wind surges).

### 6.2 The Fundamental Procurement Boundary
$$\text{Required Additional Procurement} = \text{Consumer Demand} - (\text{Wind} + \text{Other Inflexible Baseload})$$
While wind forecast evaluation quantifies renewable uncertainty, **wind data alone cannot determine total procurement volume**, because consumer demand profiles, solar outturns, interconnector flows, and plant outages are external to this dataset.
