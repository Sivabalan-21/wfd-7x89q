import pytest
from datetime import datetime, timezone
from app.services.matching import (
    parse_iso_utc,
    calculate_day_ahead_cutoff,
    match_day_ahead_forecasts,
    explore_publications_for_interval
)
from app.models.schemas import ActualRecord, ForecastRecord

def test_parse_iso_utc():
    dt = parse_iso_utc("2026-01-02T14:30:00Z")
    assert dt.year == 2026
    assert dt.month == 1
    assert dt.day == 2
    assert dt.hour == 14
    assert dt.minute == 30
    assert dt.tzinfo == timezone.utc

def test_calculate_day_ahead_cutoff():
    # Delivery interval on 2026-01-05 14:00:00Z
    delivery_dt = datetime(2026, 1, 5, 14, 0, 0, tzinfo=timezone.utc)
    cutoff = calculate_day_ahead_cutoff(delivery_dt, cutoff_hour=11, cutoff_minute=0)
    
    # Must be on Day D - 1 (2026-01-04) at 11:00 UTC
    assert cutoff == datetime(2026, 1, 4, 11, 0, 0, tzinfo=timezone.utc)

def test_match_prevent_post_cutoff_leakage(sample_actuals, sample_forecasts):
    """
    CRITICAL METHODOLOGY TEST:
    Target interval 2026-01-02T01:00:00Z has post-cutoff forecasts:
      - 2026-01-01T15:30:00Z (gen=10490)
      - 2026-01-01T22:30:00Z (gen=10505)
      - 2026-01-02T00:30:00Z (gen=10510)
    The latest pre-cutoff forecast is:
      - 2026-01-01T09:30:00Z (gen=11200)
    Matching MUST pick 11200, NOT the post-cutoff ones.
    """
    matched, notes = match_day_ahead_forecasts(
        actuals=sample_actuals,
        forecasts=sample_forecasts,
        cutoff_hour=11,
        cutoff_minute=0,
        interpolate_half_hourly=False
    )
    
    # Find match for 2026-01-02T01:00:00Z
    m_0100 = next(m for m in matched if m.targetTime == "2026-01-02T01:00:00Z")
    
    # Verified selected forecast
    assert m_0100.forecastPublishTime == "2026-01-01T09:30:00Z"
    assert m_0100.forecastGeneration == 11200.0
    assert m_0100.actualGeneration == 10500.0
    assert m_0100.signedError == 700.0 # 11200 - 10500
    assert m_0100.absoluteError == 700.0
    assert m_0100.isInterpolated is False

def test_match_interpolation_intermediate_half_hour(sample_actuals, sample_forecasts):
    """
    Test interpolation for 30-min settlement intervals (:30).
    For 2026-01-02T00:30:00Z, intermediate between 00:00 (fc=9800) and 01:00 (fc=11200).
    Expected interpolated forecast: (9800 + 11200) / 2 = 10500.
    Actual at 00:30 is 10200.
    Error = 10500 - 10200 = 300.
    """
    matched, notes = match_day_ahead_forecasts(
        actuals=sample_actuals,
        forecasts=sample_forecasts,
        cutoff_hour=11,
        cutoff_minute=0,
        interpolate_half_hourly=True
    )
    
    m_0030 = next((m for m in matched if m.targetTime == "2026-01-02T00:30:00Z"), None)
    assert m_0030 is not None
    assert m_0030.isInterpolated is True
    assert m_0030.forecastGeneration == 10500.0
    assert m_0030.actualGeneration == 10200.0
    assert m_0030.signedError == 300.0

def test_explore_publications_for_interval(sample_actuals, sample_forecasts):
    result = explore_publications_for_interval(
        target_time_str="2026-01-02T01:00:00Z",
        actuals=sample_actuals,
        forecasts=sample_forecasts,
        cutoff_hour=11,
        cutoff_minute=0
    )
    
    assert result.targetTime == "2026-01-02T01:00:00Z"
    assert result.actualGeneration == 10500.0
    assert result.dayAheadCutoff == "2026-01-01T11:00:00Z"
    assert result.selectedForecast is not None
    assert result.selectedForecast.publishTime == "2026-01-01T09:30:00Z"
    assert result.selectedForecast.generation == 11200.0
    
    # 5 publications exist in sample_forecasts for this interval
    assert len(result.allPublications) == 5
    
    # Check eligibility flags
    pre_cutoff = [p for p in result.allPublications if p.isEligibleDayAhead]
    post_cutoff = [p for p in result.allPublications if not p.isEligibleDayAhead]
    assert len(pre_cutoff) == 2
    assert len(post_cutoff) == 3

def test_empty_actuals_and_forecasts():
    matched, notes = match_day_ahead_forecasts([], [])
    assert matched == []
    assert len(notes) > 0
