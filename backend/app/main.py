import logging
import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes_health import router as health_router
from app.api.routes_wind import router as wind_router
from app.services.elexon_client import elexon_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("wind_forecast_app")

async def _background_cache_prewarm():
    """Background task to pre-warm cache without blocking server startup."""
    try:
        logger.info("Background cache pre-warming started...")
        await elexon_client.get_actual_wind_generation()
        await elexon_client.get_wind_forecasts()
        logger.info("Background cache pre-warming completed.")
    except Exception as e:
        logger.info(f"Background cache pre-warming deferred: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Wind Forecast Decision Support API...")
    if os.getenv("TESTING") != "1":
        asyncio.create_task(_background_cache_prewarm())
    yield
    logger.info("Shutting down Wind Forecast Decision Support API...")

use_lifespan = lifespan if os.getenv("TESTING") != "1" else None

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Decision support system for UK Day-Ahead electricity trading. "
        "Evaluates Elexon BMRS FUELHH actuals vs WINDFOR forecasts for January 2026 "
        "with strict day-ahead gate closure cutoff enforcement (zero lookahead leakage)."
    ),
    version="1.0.0",
    lifespan=use_lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, prefix=settings.API_V1_STR, tags=["system"])
app.include_router(wind_router, prefix=settings.API_V1_STR, tags=["wind"])

@app.get("/")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "status": "online",
        "documentation": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "metadata": f"{settings.API_V1_STR}/metadata"
    }
