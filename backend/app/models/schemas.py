from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ActualRecord(BaseModel):
    startTime: str = Field(..., description="Target settlement interval start time (ISO UTC)")
    settlementDate: Optional[str] = Field(None, description="GB Settlement date (YYYY-MM-DD)")
    settlementPeriod: Optional[int] = Field(None, description="Settlement period (1-48)")
    fuelType: str = Field("WIND", description="Fuel type filter")
    generation: float = Field(..., description="Outturn generation in MW")

class ForecastRecord(BaseModel):
    publishTime: str = Field(..., description="Timestamp when the forecast was published (ISO UTC)")
    startTime: str = Field(..., description="Target settlement interval start time (ISO UTC)")
    generation: float = Field(..., description="Forecasted generation in MW")

class MatchedIntervalRecord(BaseModel):
    targetTime: str = Field(..., description="Target delivery interval (ISO UTC)")
    settlementDate: Optional[str] = None
    settlementPeriod: Optional[int] = None
    forecastPublishTime: str = Field(..., description="Forecast creation timestamp")
    forecastGeneration: float = Field(..., description="Forecasted wind generation in MW")
    actualGeneration: float = Field(..., description="Outturn actual wind generation in MW")
    signedError: float = Field(..., description="Forecast - Actual (MW). Positive = overforecast, Negative = underforecast")
    absoluteError: float = Field(..., description="|Forecast - Actual| (MW)")
    percentageError: Optional[float] = Field(None, description="Percentage error relative to actual")
    leadTimeHours: float = Field(..., description="Hours between forecast publication and target delivery")
    isInterpolated: bool = Field(False, description="True if half-hourly forecast was linearly interpolated from hourly points")

class AccuracyMetrics(BaseModel):
    totalMatchedIntervals: int
    totalActualIntervals: int
    totalForecastIntervals: int
    mae: float = Field(..., description="Mean Absolute Error in MW: (1/N) * sum(|F - A|)")
    rmse: float = Field(..., description="Root Mean Squared Error in MW: sqrt((1/N) * sum((F - A)^2))")
    bias: float = Field(..., description="Mean Forecast Error / Bias in MW: (1/N) * sum(F - A)")
    wape: Optional[float] = Field(None, description="Weighted Absolute Percentage Error (%): sum(|F - A|) / sum(A) * 100")
    meanActual: float
    meanForecast: float
    maxOverforecast: float = Field(..., description="Maximum positive error (F - A) in MW")
    maxUnderforecast: float = Field(..., description="Maximum negative error (F - A) in MW")
    overforecastCount: int = Field(..., description="Count of intervals where forecast exceeded actual")
    underforecastCount: int = Field(..., description="Count of intervals where actual exceeded forecast")
    exactMatchCount: int = Field(..., description="Count of intervals with zero error")
    overforecastPercentage: float
    underforecastPercentage: float

class ErrorDistributionBucket(BaseModel):
    rangeLabel: str
    minError: float
    maxError: float
    count: int
    percentage: float

class ForecastPublicationOption(BaseModel):
    publishTime: str
    generation: float
    leadTimeHours: float
    isEligibleDayAhead: bool
    isSelected: bool

class PublicationExplorerResponse(BaseModel):
    targetTime: str
    actualGeneration: Optional[float] = None
    dayAheadCutoff: str
    selectedForecast: Optional[ForecastPublicationOption] = None
    allPublications: List[ForecastPublicationOption] = []
    selectionRule: str

class AccuracyResponse(BaseModel):
    metrics: AccuracyMetrics
    distribution: List[ErrorDistributionBucket]
    cutoffHour: int
    cutoffMinute: int
    cutoffRule: str
    matchedRecords: List[MatchedIntervalRecord]
    dataQualityNotes: List[str]

class MetadataResponse(BaseModel):
    projectName: str
    datasetActual: str = "Elexon BMRS FUELHH (fuelType=WIND)"
    datasetForecast: str = "Elexon BMRS WINDFOR"
    dateRangeAnalyzed: str = "January 2026 (2026-01-01 to 2026-01-31)"
    actualIntervalsCount: int
    forecastIntervalsCount: int
    latestPublishTime: Optional[str]
    targetResolution: str = "30-minute GB Settlement Periods (with hourly base forecasts)"
    timezone: str = "UTC / GMT (National Grid standard)"
    dayAheadCutoffRule: str
    dataFreshness: str
    apiStatus: str

class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str
    elexonApiReachable: bool
    cachedActualsCount: int
    cachedForecastsCount: int
