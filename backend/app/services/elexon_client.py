import os
import json
import ssl
import logging
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import httpx

from app.config import settings
from app.models.schemas import ActualRecord, ForecastRecord

logger = logging.getLogger(__name__)

class ElexonClient:
    """
    Client for Elexon BMRS Insights Solution API.
    Interacts with:
      - /datasets/FUELHH/stream (Actuals generation by fuel type)
      - /datasets/WINDFOR/stream (Wind generation forecasts)
    """

    def __init__(self, cache_dir: Optional[str] = None):
        self.base_url = settings.ELEXON_BASE_URL
        self.cache_dir = cache_dir or settings.CACHE_DIR
        os.makedirs(self.cache_dir, exist_ok=True)
        self._memory_cache: Dict[str, Any] = {}

    def _get_cache_filepath(self, key: str) -> str:
        safe_key = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in key)
        return os.path.join(self.cache_dir, f"{safe_key}.json")

    def _read_disk_cache(self, key: str) -> Optional[List[Dict[str, Any]]]:
        path = self._get_cache_filepath(key)
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    logger.info(f"Loaded {len(data)} records from disk cache: {path}")
                    return data
            except Exception as e:
                logger.warning(f"Error reading disk cache {path}: {e}")
        return None

    def _write_disk_cache(self, key: str, data: List[Dict[str, Any]]) -> None:
        path = self._get_cache_filepath(key)
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f)
            logger.info(f"Wrote {len(data)} records to disk cache: {path}")
        except Exception as e:
            logger.warning(f"Error writing disk cache {path}: {e}")

    async def _fetch_with_retry(self, url: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fetch endpoint with retries and resilient SSL handling."""
        last_error = None
        for attempt in range(1, settings.MAX_RETRIES + 1):
            try:
                # Try standard client first, fall back to verify=False if SSL cert issues occur
                transport = httpx.AsyncHTTPTransport(verify=False)
                async with httpx.AsyncClient(transport=transport, timeout=settings.REQUEST_TIMEOUT) as client:
                    resp = await client.get(url, params=params, headers={"Accept": "application/json"})
                    if resp.status_code == 200:
                        return resp.json()
                    elif resp.status_code in (429, 500, 502, 503, 504):
                        logger.warning(f"Attempt {attempt}: HTTP {resp.status_code} from {url}. Retrying...")
                        await asyncio.sleep(1.0 * attempt)
                    else:
                        resp.raise_for_status()
            except Exception as e:
                last_error = e
                logger.warning(f"Attempt {attempt} failed fetching {url}: {e}")
                await asyncio.sleep(1.0 * attempt)
        raise RuntimeError(f"Failed to fetch {url} after {settings.MAX_RETRIES} attempts: {last_error}")

    async def get_actual_wind_generation(
        self,
        date_from: str = "2026-01-01",
        date_to: str = "2026-01-31",
        force_refresh: bool = False
    ) -> List[ActualRecord]:
        """
        Fetch FUELHH actual wind generation records from Elexon BMRS.
        Filter: fuelType = WIND.
        """
        cache_key = f"actuals_wind_{date_from}_{date_to}"
        if not force_refresh:
            if cache_key in self._memory_cache:
                return self._memory_cache[cache_key]
            disk_data = self._read_disk_cache(cache_key)
            if disk_data is not None:
                parsed = [ActualRecord(**r) for r in disk_data]
                self._memory_cache[cache_key] = parsed
                return parsed

        url = f"{self.base_url}/datasets/FUELHH/stream"
        params = {
            "settlementDateFrom": date_from,
            "settlementDateTo": date_to,
            "fuelType": "WIND"
        }
        logger.info(f"Fetching FUELHH wind actuals from {date_from} to {date_to}...")
        raw_records = await self._fetch_with_retry(url, params)

        cleaned_records: List[ActualRecord] = []
        for r in raw_records:
            # Explicit validation and filtering
            if r.get("fuelType") != "WIND":
                continue
            start_time = r.get("startTime")
            gen = r.get("generation")
            if start_time is None or gen is None:
                continue
            try:
                gen_val = float(gen)
                cleaned_records.append(
                    ActualRecord(
                        startTime=start_time,
                        settlementDate=r.get("settlementDate"),
                        settlementPeriod=r.get("settlementPeriod"),
                        fuelType="WIND",
                        generation=max(0.0, gen_val) # Wind generation is non-negative
                    )
                )
            except (ValueError, TypeError):
                continue

        # Sort chronologically
        cleaned_records.sort(key=lambda x: x.startTime)

        # Cache valid parsed records
        self._write_disk_cache(cache_key, [r.model_dump() for r in cleaned_records])
        self._memory_cache[cache_key] = cleaned_records
        return cleaned_records

    async def get_wind_forecasts(
        self,
        publish_from: str = "2025-12-30T00:00:00Z",
        publish_to: str = "2026-02-01T23:59:59Z",
        force_refresh: bool = False
    ) -> List[ForecastRecord]:
        """
        Fetch WINDFOR forecast records from Elexon BMRS.
        """
        cache_key = f"windfor_{publish_from[:10]}_{publish_to[:10]}"
        if not force_refresh:
            if cache_key in self._memory_cache:
                return self._memory_cache[cache_key]
            disk_data = self._read_disk_cache(cache_key)
            if disk_data is not None:
                parsed = [ForecastRecord(**r) for r in disk_data]
                self._memory_cache[cache_key] = parsed
                return parsed

        url = f"{self.base_url}/datasets/WINDFOR/stream"
        params = {
            "publishDateTimeFrom": publish_from,
            "publishDateTimeTo": publish_to
        }
        logger.info(f"Fetching WINDFOR forecasts from {publish_from} to {publish_to}...")
        raw_records = await self._fetch_with_retry(url, params)

        cleaned_records: List[ForecastRecord] = []
        for r in raw_records:
            pub_time = r.get("publishTime")
            start_time = r.get("startTime")
            gen = r.get("generation")
            if not pub_time or not start_time or gen is None:
                continue
            try:
                gen_val = float(gen)
                cleaned_records.append(
                    ForecastRecord(
                        publishTime=pub_time,
                        startTime=start_time,
                        generation=max(0.0, gen_val)
                    )
                )
            except (ValueError, TypeError):
                continue

        # Sort by target time then publication time
        cleaned_records.sort(key=lambda x: (x.startTime, x.publishTime))

        self._write_disk_cache(cache_key, [r.model_dump() for r in cleaned_records])
        self._memory_cache[cache_key] = cleaned_records
        return cleaned_records

elexon_client = ElexonClient()
