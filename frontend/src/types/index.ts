export interface ActualRecord {
  startTime: string;
  settlementDate?: string;
  settlementPeriod?: number;
  fuelType: string;
  generation: number;
}

export interface ForecastRecord {
  publishTime: string;
  startTime: string;
  generation: number;
}

export interface MatchedIntervalRecord {
  targetTime: string;
  settlementDate?: string;
  settlementPeriod?: number;
  forecastPublishTime: string;
  forecastGeneration: number;
  actualGeneration: number;
  signedError: number;
  absoluteError: number;
  percentageError?: number | null;
  leadTimeHours: number;
  isInterpolated: boolean;
}

export interface AccuracyMetrics {
  totalMatchedIntervals: number;
  totalActualIntervals: number;
  totalForecastIntervals: number;
  mae: number;
  rmse: number;
  bias: number;
  wape: number | null;
  meanActual: number;
  meanForecast: number;
  maxOverforecast: number;
  maxUnderforecast: number;
  overforecastCount: number;
  underforecastCount: number;
  exactMatchCount: number;
  overforecastPercentage: number;
  underforecastPercentage: number;
}

export interface ErrorDistributionBucket {
  rangeLabel: string;
  minError: number;
  maxError: number;
  count: number;
  percentage: number;
}

export interface ForecastPublicationOption {
  publishTime: string;
  generation: number;
  leadTimeHours: number;
  isEligibleDayAhead: boolean;
  isSelected: boolean;
}

export interface PublicationExplorerResponse {
  targetTime: string;
  actualGeneration?: number | null;
  dayAheadCutoff: string;
  selectedForecast?: ForecastPublicationOption | null;
  allPublications: ForecastPublicationOption[];
  selectionRule: string;
}

export interface AccuracyResponse {
  metrics: AccuracyMetrics;
  distribution: ErrorDistributionBucket[];
  cutoffHour: number;
  cutoffMinute: number;
  cutoffRule: string;
  matchedRecords: MatchedIntervalRecord[];
  dataQualityNotes: string[];
}

export interface MetadataResponse {
  projectName: string;
  datasetActual: string;
  datasetForecast: string;
  dateRangeAnalyzed: string;
  actualIntervalsCount: number;
  forecastIntervalsCount: number;
  latestPublishTime?: string | null;
  targetResolution: string;
  timezone: string;
  dayAheadCutoffRule: string;
  dataFreshness: string;
  apiStatus: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
  elexonApiReachable: boolean;
  cachedActualsCount: number;
  cachedForecastsCount: number;
}
