import pytest
import pytest_asyncio
import httpx
from unittest.mock import patch, AsyncMock
from app.main import app
from app.models.schemas import ActualRecord, ForecastRecord

@pytest_asyncio.fixture
async def async_client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_root_endpoint(async_client):
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "documentation" in data

@pytest.mark.asyncio
async def test_health_endpoint(async_client):
    # Test health check endpoint without breaking async_client
    response = await async_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "elexonApiReachable" in data

@pytest.mark.asyncio
async def test_metadata_endpoint(async_client):
    mock_actuals = [
        ActualRecord(startTime="2026-01-01T00:00:00Z", fuelType="WIND", generation=5000.0)
    ]
    mock_forecasts = [
        ForecastRecord(publishTime="2025-12-31T09:30:00Z", startTime="2026-01-01T00:00:00Z", generation=5200.0)
    ]
    with patch("app.api.routes_health.elexon_client.get_actual_wind_generation", new_callable=AsyncMock) as m_act, \
         patch("app.api.routes_health.elexon_client.get_wind_forecasts", new_callable=AsyncMock) as m_fc:
        m_act.return_value = mock_actuals
        m_fc.return_value = mock_forecasts

        response = await async_client.get("/api/metadata")
        assert response.status_code == 200
        data = response.json()
        assert data["actualIntervalsCount"] == 1
        assert data["forecastIntervalsCount"] == 1
        assert "Elexon BMRS" in data["datasetActual"]

@pytest.mark.asyncio
async def test_accuracy_endpoint_mocked(async_client):
    mock_actuals = [
        ActualRecord(startTime="2026-01-02T01:00:00Z", fuelType="WIND", generation=10000.0)
    ]
    mock_forecasts = [
        ForecastRecord(publishTime="2026-01-01T09:30:00Z", startTime="2026-01-02T01:00:00Z", generation=11000.0),
        # Post-cutoff publication
        ForecastRecord(publishTime="2026-01-01T15:30:00Z", startTime="2026-01-02T01:00:00Z", generation=10100.0)
    ]
    with patch("app.api.routes_wind.elexon_client.get_actual_wind_generation", new_callable=AsyncMock) as m_act, \
         patch("app.api.routes_wind.elexon_client.get_wind_forecasts", new_callable=AsyncMock) as m_fc:
        m_act.return_value = mock_actuals
        m_fc.return_value = mock_forecasts

        response = await async_client.get("/api/wind/accuracy?date_from=2026-01-02&date_to=2026-01-02&cutoff_hour=11")
        assert response.status_code == 200
        data = response.json()
        metrics = data["metrics"]
        assert metrics["totalMatchedIntervals"] == 1
        assert metrics["mae"] == 1000.0
        assert metrics["bias"] == 1000.0
        # Verify matched record chose pre-cutoff publication
        assert data["matchedRecords"][0]["forecastPublishTime"] == "2026-01-01T09:30:00Z"
