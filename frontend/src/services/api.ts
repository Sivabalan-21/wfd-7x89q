import {
  HealthResponse,
  MetadataResponse,
  ActualRecord,
  AccuracyResponse,
  PublicationExplorerResponse
} from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: HTTP ${res.status}`);
  return res.json();
}

export async function fetchMetadata(): Promise<MetadataResponse> {
  const res = await fetch(`${API_BASE}/api/metadata`);
  if (!res.ok) throw new Error(`Metadata fetch failed: HTTP ${res.status}`);
  return res.json();
}

export async function fetchActuals(
  dateFrom = '2026-01-01',
  dateTo = '2026-01-31',
  forceRefresh = false
): Promise<ActualRecord[]> {
  const url = `${API_BASE}/api/wind/actuals?date_from=${dateFrom}&date_to=${dateTo}&force_refresh=${forceRefresh}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch actuals: HTTP ${res.status}`);
  return res.json();
}

export async function fetchAccuracy(
  dateFrom = '2026-01-01',
  dateTo = '2026-01-31',
  cutoffHour = 11,
  cutoffMinute = 0,
  interpolate = true,
  forceRefresh = false
): Promise<AccuracyResponse> {
  const url = `${API_BASE}/api/wind/accuracy?date_from=${dateFrom}&date_to=${dateTo}&cutoff_hour=${cutoffHour}&cutoff_minute=${cutoffMinute}&interpolate=${interpolate}&force_refresh=${forceRefresh}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch accuracy evaluation: HTTP ${res.status}`);
  return res.json();
}

export async function fetchPublicationExplore(
  targetTime: string,
  cutoffHour = 11,
  cutoffMinute = 0
): Promise<PublicationExplorerResponse> {
  const url = `${API_BASE}/api/wind/explore?target_time=${encodeURIComponent(targetTime)}&cutoff_hour=${cutoffHour}&cutoff_minute=${cutoffMinute}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to explore forecast publications: HTTP ${res.status}`);
  return res.json();
}

export async function fetchLatestForecast(): Promise<any> {
  const res = await fetch(`${API_BASE}/api/wind/latest-forecast`);
  if (!res.ok) throw new Error(`Failed to fetch latest forecast run: HTTP ${res.status}`);
  return res.json();
}
