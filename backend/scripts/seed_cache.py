import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.elexon_client import elexon_client

async def seed():
    print("Fetching and seeding January 2026 actuals from Elexon...")
    actuals = await elexon_client.get_actual_wind_generation(
        date_from="2026-01-01",
        date_to="2026-01-31",
        force_refresh=True
    )
    print(f"Successfully cached {len(actuals)} actual records.")

    print("Fetching and seeding forecasts from Elexon (2025-12-30 to 2026-02-01)...")
    forecasts = await elexon_client.get_wind_forecasts(
        publish_from="2025-12-30T00:00:00Z",
        publish_to="2026-02-01T23:59:59Z",
        force_refresh=True
    )
    print(f"Successfully cached {len(forecasts)} forecast records.")
    print("Cache pre-seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed())
