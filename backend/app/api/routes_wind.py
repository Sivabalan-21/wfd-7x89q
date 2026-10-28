from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from datetime import datetime

from app.models.schemas import (
    ActualRecord,
    ForecastRecord,
    AccuracyResponse,
    PublicationExplorerResponse,
)
from app.services.elexon_client import elexon_client
from app.services.matching import match_day_ahead_forecasts, explore_publications_for_interval
from app.services.metrics import calculate_accuracy_metrics
from app.config import settings

router = APIRouter(prefix="/wind", tags=["wind"])

@router.get("/actuals", response_model=List[ActualRecord])
async def get_actuals(
    date_from: str = Query("2026-01-01", description="Start date (YYYY-MM-DD)"),
    date_to: str = Query("2026-01-31", description="End date (YYYY-MM-DD)"),
    force_refresh: bool = Query(False, description="Bypass cache and query Elexon live")
):
    """
    Retrieve outturn actual wind generation (FUELHH stream filtered to fuelType=WIND).
    """
    try:
        records = await elexon_client.get_actual_wind_generation(
            date_from=date_from,
            date_to=date_to,
            force_refresh=force_refresh
        )
        return records
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to retrieve actuals from Elexon: {str(e)}")

@router.get("/forecasts", response_model=List[ForecastRecord])
async def get_forecasts(
    publish_from: str = Query("2025-12-30T00:00:00Z", description="Publication start timestamp"),
    publish_to: str = Query("2026-02-01T23:59:59Z", description="Publication end timestamp"),
    force_refresh: bool = Query(False, description="Bypass cache and query Elexon live")
):
    """
    Retrieve national wind generation forecasts (WINDFOR stream).
    """
    try:
        records = await elexon_client.get_wind_forecasts(
            publish_from=publish_from,
            publish_to=publish_to,
            force_refresh=force_refresh
        )
        return records
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to retrieve forecasts from Elexon: {str(e)}")

@router.get("/accuracy", response_model=AccuracyResponse)
async def get_accuracy(
    date_from: str = Query("2026-01-01", description="Start settlement date (YYYY-MM-DD)"),
    date_to: str = Query("2026-01-31", description="End settlement date (YYYY-MM-DD)"),
    cutoff_hour: int = Query(settings.DEFAULT_CUTOFF_HOUR, ge=0, le=23, description="Day-ahead auction gate closure hour (UTC) on D-1"),
    cutoff_minute: int = Query(settings.DEFAULT_CUTOFF_MINUTE, ge=0, le=59, description="Day-ahead auction gate closure minute (UTC) on D-1"),
    interpolate: bool = Query(True, description="Enable linear interpolation for 30-min intermediate settlement periods"),
    force_refresh: bool = Query(False, description="Force fresh fetch from Elexon")
):
    """
    Evaluate quantitative forecast accuracy using strictly pre-cutoff day-ahead forecasts.
    Guarantees no lookahead bias / data leakage.
    Calculates MAE, RMSE, Bias, WAPE, and error distribution.
    """
    try:
        actuals = await elexon_client.get_actual_wind_generation(
            date_from=date_from,
            date_to=date_to,
            force_refresh=force_refresh
        )
        forecasts = await elexon_client.get_wind_forecasts(
            force_refresh=force_refresh
        )

        matched, notes = match_day_ahead_forecasts(
            actuals=actuals,
            forecasts=forecasts,
            cutoff_hour=cutoff_hour,
            cutoff_minute=cutoff_minute,
            interpolate_half_hourly=interpolate
        )

        metrics, distribution = calculate_accuracy_metrics(
            matched_records=matched,
            total_actual_intervals=len(actuals),
            total_forecast_intervals=len(forecasts)
        )

        cutoff_rule = (
            f"EPEX SPOT / Nord Pool GB Day-Ahead Auction benchmark: "
            f"Evaluated using latest forecast published on or before D-1 at {cutoff_hour:02d}:{cutoff_minute:02d} UTC."
        )

        return AccuracyResponse(
            metrics=metrics,
            distribution=distribution,
            cutoffHour=cutoff_hour,
            cutoffMinute=cutoff_minute,
            cutoffRule=cutoff_rule,
            matchedRecords=matched,
            dataQualityNotes=notes
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error evaluating forecast accuracy: {str(e)}")

@router.get("/latest-forecast")
async def get_latest_forecast():
    """
    Retrieve the most recently published forecast run in the dataset.
    """
    forecasts = await elexon_client.get_wind_forecasts()
    if not forecasts:
        return {"latestPublishTime": None, "forecastCount": 0, "horizon": None}

    latest_pub = max(f.publishTime for f in forecasts)
    latest_run = [f for f in forecasts if f.publishTime == latest_pub]
    latest_run.sort(key=lambda x: x.startTime)

    return {
        "latestPublishTime": latest_pub,
        "forecastCount": len(latest_run),
        "targetStart": latest_run[0].startTime if latest_run else None,
        "targetEnd": latest_run[-1].startTime if latest_run else None,
        "records": latest_run
    }

@router.get("/explore", response_model=PublicationExplorerResponse)
async def explore_publications(
    target_time: str = Query(..., description="Target delivery interval ISO UTC (e.g. 2026-01-15T12:00:00Z)"),
    cutoff_hour: int = Query(settings.DEFAULT_CUTOFF_HOUR, ge=0, le=23),
    cutoff_minute: int = Query(settings.DEFAULT_CUTOFF_MINUTE, ge=0, le=59)
):
    """
    Publication Explorer: Inspect all published forecast iterations for a specific target interval,
    clearly identifying which forecast was locked in before day-ahead auction cutoff.
    """
    actuals = await elexon_client.get_actual_wind_generation()
    forecasts = await elexon_client.get_wind_forecasts()

    return explore_publications_for_interval(
        target_time_str=target_time,
        actuals=actuals,
        forecasts=forecasts,
        cutoff_hour=cutoff_hour,
        cutoff_minute=cutoff_minute
    )
