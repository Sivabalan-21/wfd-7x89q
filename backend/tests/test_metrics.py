import pytest
from app.models.schemas import MatchedIntervalRecord
from app.services.metrics import calculate_accuracy_metrics

def test_metrics_calculation_standard():
    records = [
        MatchedIntervalRecord(
            targetTime="2026-01-01T00:00:00Z",
            forecastPublishTime="2025-12-31T09:30:00Z",
            forecastGeneration=1000.0,
            actualGeneration=800.0,
            signedError=200.0,
            absoluteError=200.0,
            percentageError=25.0,
            leadTimeHours=14.5,
            isInterpolated=False
        ),
        MatchedIntervalRecord(
            targetTime="2026-01-01T01:00:00Z",
            forecastPublishTime="2025-12-31T09:30:00Z",
            forecastGeneration=1200.0,
            actualGeneration=1500.0,
            signedError=-300.0,
            absoluteError=300.0,
            percentageError=20.0,
            leadTimeHours=15.5,
            isInterpolated=False
        ),
        MatchedIntervalRecord(
            targetTime="2026-01-01T02:00:00Z",
            forecastPublishTime="2025-12-31T09:30:00Z",
            forecastGeneration=1000.0,
            actualGeneration=1000.0,
            signedError=0.0,
            absoluteError=0.0,
            percentageError=0.0,
            leadTimeHours=16.5,
            isInterpolated=False
        ),
    ]

    metrics, dist = calculate_accuracy_metrics(records, total_actual_intervals=3, total_forecast_intervals=10)
    
    assert metrics.totalMatchedIntervals == 3
    # MAE = (200 + 300 + 0) / 3 = 500 / 3 = 166.67
    assert metrics.mae == 166.67
    # RMSE = sqrt((200^2 + (-300)^2 + 0^2) / 3) = sqrt((40000 + 90000) / 3) = sqrt(43333.33) = 208.17
    assert metrics.rmse == 208.17
    # Bias = (200 - 300 + 0) / 3 = -100 / 3 = -33.33
    assert metrics.bias == -33.33
    # WAPE = sum(|err|) / sum(act) * 100 = 500 / 3300 * 100 = 15.15%
    assert metrics.wape == 15.15
    assert metrics.overforecastCount == 1
    assert metrics.underforecastCount == 1
    assert metrics.exactMatchCount == 1
    assert len(dist) == 7

def test_metrics_empty_dataset():
    metrics, dist = calculate_accuracy_metrics([], total_actual_intervals=0, total_forecast_intervals=0)
    assert metrics.totalMatchedIntervals == 0
    assert metrics.mae == 0.0
    assert metrics.wape is None
    assert dist == []

def test_metrics_zero_actual_wape_protection():
    # If actual wind generation was zero across all intervals
    records = [
        MatchedIntervalRecord(
            targetTime="2026-01-01T00:00:00Z",
            forecastPublishTime="2025-12-31T09:30:00Z",
            forecastGeneration=100.0,
            actualGeneration=0.0,
            signedError=100.0,
            absoluteError=100.0,
            percentageError=None,
            leadTimeHours=14.5,
            isInterpolated=False
        )
    ]
    metrics, _ = calculate_accuracy_metrics(records, 1, 1)
    assert metrics.wape is None  # Handled safely without ZeroDivisionError
