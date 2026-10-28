import math
from typing import List, Dict, Any, Optional, Tuple
from app.models.schemas import (
    MatchedIntervalRecord,
    AccuracyMetrics,
    ErrorDistributionBucket,
)

def calculate_accuracy_metrics(
    matched_records: List[MatchedIntervalRecord],
    total_actual_intervals: int,
    total_forecast_intervals: int
) -> Tuple[AccuracyMetrics, List[ErrorDistributionBucket]]:
    """
    Calculate quantitative forecast accuracy metrics and error distribution.
    Handles empty data and zero-denominator edge cases cleanly.
    """
    n = len(matched_records)
    if n == 0:
        empty_metrics = AccuracyMetrics(
            totalMatchedIntervals=0,
            totalActualIntervals=total_actual_intervals,
            totalForecastIntervals=total_forecast_intervals,
            mae=0.0,
            rmse=0.0,
            bias=0.0,
            wape=None,
            meanActual=0.0,
            meanForecast=0.0,
            maxOverforecast=0.0,
            maxUnderforecast=0.0,
            overforecastCount=0,
            underforecastCount=0,
            exactMatchCount=0,
            overforecastPercentage=0.0,
            underforecastPercentage=0.0
        )
        return empty_metrics, []

    errors = [m.signedError for m in matched_records]
    abs_errors = [m.absoluteError for m in matched_records]
    actuals = [m.actualGeneration for m in matched_records]
    forecasts = [m.forecastGeneration for m in matched_records]

    sum_abs_err = sum(abs_errors)
    sum_err = sum(errors)
    sum_sq_err = sum(e ** 2 for e in errors)
    sum_act = sum(actuals)
    sum_fc = sum(forecasts)

    mae = round(sum_abs_err / n, 2)
    rmse = round(math.sqrt(sum_sq_err / n), 2)
    bias = round(sum_err / n, 2)

    # WAPE: sum(|F - A|) / sum(A) * 100 with zero denominator protection
    wape = round((sum_abs_err / sum_act) * 100.0, 2) if sum_act > 0 else None

    mean_actual = round(sum_act / n, 2)
    mean_forecast = round(sum_fc / n, 2)

    max_over = round(max(errors), 2)
    max_under = round(min(errors), 2)

    over_count = sum(1 for e in errors if e > 0)
    under_count = sum(1 for e in errors if e < 0)
    exact_count = sum(1 for e in errors if e == 0)

    over_pct = round((over_count / n) * 100.0, 1)
    under_pct = round((under_count / n) * 100.0, 1)

    metrics = AccuracyMetrics(
        totalMatchedIntervals=n,
        totalActualIntervals=total_actual_intervals,
        totalForecastIntervals=total_forecast_intervals,
        mae=mae,
        rmse=rmse,
        bias=bias,
        wape=wape,
        meanActual=mean_actual,
        meanForecast=mean_forecast,
        maxOverforecast=max_over,
        maxUnderforecast=max_under,
        overforecastCount=over_count,
        underforecastCount=under_count,
        exactMatchCount=exact_count,
        overforecastPercentage=over_pct,
        underforecastPercentage=under_pct
    )

    # Calculate Error Distribution Histogram Buckets
    buckets_def = [
        ("<-4000 MW (Severe Under)", float("-inf"), -4000.0),
        ("-4000 to -2000 MW", -4000.0, -2000.0),
        ("-2000 to -500 MW", -2000.0, -500.0),
        ("-500 to +500 MW (Accurate)", -500.0, 500.0),
        ("+500 to +2000 MW", 500.0, 2000.0),
        ("+2000 to +4000 MW", 2000.0, 4000.0),
        (">+4000 MW (Severe Over)", 4000.0, float("inf")),
    ]

    distribution: List[ErrorDistributionBucket] = []
    for label, min_val, max_val in buckets_def:
        count = sum(1 for e in errors if min_val <= e < max_val)
        pct = round((count / n) * 100.0, 1)
        distribution.append(
            ErrorDistributionBucket(
                rangeLabel=label,
                minError=min_val if min_val != float("-inf") else -99999.0,
                maxError=max_val if max_val != float("inf") else 99999.0,
                count=count,
                percentage=pct
            )
        )

    return metrics, distribution
