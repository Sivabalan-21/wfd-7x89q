from fastapi import APIRouter
from datetime import datetime, timezone
import httpx

from app.config import settings
from app.models.schemas import HealthResponse, MetadataResponse
from app.services.elexon_client import elexon_client

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def get_health():
    """
    Health check endpoint verifying backend operational state and Elexon connectivity.
    """
    reachable = False
    try:
        transport = httpx.AsyncHTTPTransport(verify=False)
        async with httpx.AsyncClient(transport=transport, timeout=5.0) as client:
            resp = await client.get(f"{settings.ELEXON_BASE_URL}/datasets/FUELHH/stream?publishDateTimeFrom=2026-01-01T00:00:00Z&publishDateTimeTo=2026-01-01T00:30:00Z")
            reachable = (resp.status_code == 200)
    except Exception:
        reachable = False

    cached_actuals = len(elexon_client._memory_cache.get("actuals_wind_2026-01-01_2026-01-31", []))
    cached_forecasts = len(elexon_client._memory_cache.get("windfor_2025-12-30_2026-02-01", []))

    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.now(timezone.utc).isoformat(),
        elexonApiReachable=reachable,
        cachedActualsCount=cached_actuals,
        cachedForecastsCount=cached_forecasts
    )

@router.get("/metadata", response_model=MetadataResponse)
async def get_metadata():
    """
    Metadata endpoint explaining datasets, coverage, resolution, and market decision assumptions.
    """
    actuals = await elexon_client.get_actual_wind_generation()
    forecasts = await elexon_client.get_wind_forecasts()

    latest_pub = max((f.publishTime for f in forecasts), default=None)

    return MetadataResponse(
        projectName=settings.PROJECT_NAME,
        datasetActual="Elexon BMRS FUELHH (fuelType=WIND)",
        datasetForecast="Elexon BMRS WINDFOR (National Wind Generation Forecast)",
        dateRangeAnalyzed="January 2026 (2026-01-01 to 2026-01-31)",
        actualIntervalsCount=len(actuals),
        forecastIntervalsCount=len(forecasts),
        latestPublishTime=latest_pub,
        targetResolution="30-minute GB Settlement Periods (with hourly base forecasts)",
        timezone="UTC / GMT (National Grid standard)",
        dayAheadCutoffRule="EPEX SPOT / Nord Pool GB Day-Ahead Auction Gate Closure (Default: D-1 at 11:00 UTC)",
        dataFreshness="Live / Cached Elexon BMRS API data for January 2026",
        apiStatus="Connected"
    )
