import os
os.environ["TESTING"] = "1"

import pytest
from typing import List
from app.models.schemas import ActualRecord, ForecastRecord

@pytest.fixture
def sample_actuals() -> List[ActualRecord]:
    """Sample half-hourly actual wind generation for 2026-01-02."""
    return [
        ActualRecord(startTime="2026-01-02T00:00:00Z", settlementDate="2026-01-02", settlementPeriod=1, fuelType="WIND", generation=10000.0),
        ActualRecord(startTime="2026-01-02T00:30:00Z", settlementDate="2026-01-02", settlementPeriod=2, fuelType="WIND", generation=10200.0),
        ActualRecord(startTime="2026-01-02T01:00:00Z", settlementDate="2026-01-02", settlementPeriod=3, fuelType="WIND", generation=10500.0),
        ActualRecord(startTime="2026-01-02T01:30:00Z", settlementDate="2026-01-02", settlementPeriod=4, fuelType="WIND", generation=10800.0),
        ActualRecord(startTime="2026-01-02T02:00:00Z", settlementDate="2026-01-02", settlementPeriod=5, fuelType="WIND", generation=11000.0),
    ]

@pytest.fixture
def sample_forecasts() -> List[ForecastRecord]:
    """
    Sample forecast publications for target interval 2026-01-02T01:00:00Z.
    Day-ahead gate closure for 2026-01-02 delivery is 2026-01-01 at 11:00:00Z.
    """
    return [
        # Eligible pre-cutoff forecasts
        ForecastRecord(publishTime="2026-01-01T04:30:00Z", startTime="2026-01-02T00:00:00Z", generation=9500.0),
        ForecastRecord(publishTime="2026-01-01T09:30:00Z", startTime="2026-01-02T00:00:00Z", generation=9800.0), # Latest eligible for 00:00
        
        ForecastRecord(publishTime="2026-01-01T04:30:00Z", startTime="2026-01-02T01:00:00Z", generation=10000.0),
        ForecastRecord(publishTime="2026-01-01T09:30:00Z", startTime="2026-01-02T01:00:00Z", generation=11200.0), # Latest eligible for 01:00
        
        ForecastRecord(publishTime="2026-01-01T09:30:00Z", startTime="2026-01-02T02:00:00Z", generation=11500.0), # Latest eligible for 02:00
        
        # Post-cutoff forecasts (published after 2026-01-01 11:00:00Z) -> MUST NOT BE SELECTED
        ForecastRecord(publishTime="2026-01-01T15:30:00Z", startTime="2026-01-02T01:00:00Z", generation=10490.0),
        ForecastRecord(publishTime="2026-01-01T22:30:00Z", startTime="2026-01-02T01:00:00Z", generation=10505.0),
        ForecastRecord(publishTime="2026-01-02T00:30:00Z", startTime="2026-01-02T01:00:00Z", generation=10510.0), # Intraday
    ]
