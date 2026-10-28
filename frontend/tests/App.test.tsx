import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from '../src/App';

// Mock globalThis.fetch to return predictable test data
globalThis.fetch = vi.fn().mockImplementation((url: string) => {
  if (url.includes('/api/health')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 'healthy',
          version: '1.0.0',
          timestamp: '2026-01-01T00:00:00Z',
          elexonApiReachable: true,
          cachedActualsCount: 1488,
          cachedForecastsCount: 19856,
        }),
    } as Response);
  }
  if (url.includes('/api/metadata')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          projectName: 'Wind Forecast Decision Support',
          datasetActual: 'Elexon BMRS FUELHH (fuelType=WIND)',
          datasetForecast: 'Elexon BMRS WINDFOR',
          dateRangeAnalyzed: 'January 2026',
          actualIntervalsCount: 1488,
          forecastIntervalsCount: 19856,
          latestPublishTime: '2026-02-01T22:30:00Z',
          targetResolution: '30-minute GB Settlement Periods',
          timezone: 'UTC / GMT',
          dayAheadCutoffRule: 'EPEX SPOT 11:00 UTC',
          dataFreshness: 'Live Elexon API',
          apiStatus: 'Connected',
        }),
    } as Response);
  }
  if (url.includes('/api/wind/accuracy')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          metrics: {
            totalMatchedIntervals: 1488,
            totalActualIntervals: 1488,
            totalForecastIntervals: 19856,
            mae: 1850.5,
            rmse: 2310.2,
            bias: 1205.4,
            wape: 14.8,
            meanActual: 12500.0,
            meanForecast: 13705.4,
            maxOverforecast: 4500.0,
            maxUnderforecast: -3200.0,
            overforecastCount: 950,
            underforecastCount: 538,
            exactMatchCount: 0,
            overforecastPercentage: 63.8,
            underforecastPercentage: 36.2,
          },
          distribution: [
            { rangeLabel: '-2000 to -500 MW', minError: -2000, maxError: -500, count: 200, percentage: 13.4 },
            { rangeLabel: '-500 to +500 MW (Accurate)', minError: -500, maxError: 500, count: 400, percentage: 26.9 },
            { rangeLabel: '+500 to +2000 MW', minError: 500, maxError: 2000, count: 600, percentage: 40.3 },
          ],
          cutoffHour: 11,
          cutoffMinute: 0,
          cutoffRule: 'EPEX SPOT Gate Closure (11:00 UTC)',
          matchedRecords: [
            {
              targetTime: '2026-01-05T14:00:00Z',
              settlementDate: '2026-01-05',
              settlementPeriod: 29,
              forecastPublishTime: '2026-01-04T09:30:00Z',
              forecastGeneration: 13500.0,
              actualGeneration: 12000.0,
              signedError: 1500.0,
              absoluteError: 1500.0,
              percentageError: 12.5,
              leadTimeHours: 28.5,
              isInterpolated: false,
            },
          ],
          dataQualityNotes: ['Matched 1488 intervals with zero leakage.'],
        }),
    } as Response);
  }
  return Promise.reject(new Error(`Unhandled URL: ${url}`));
});

describe('Wind Forecast Decision Support Dashboard', () => {
  it('renders application branding and header correctly', async () => {
    render(<App />);
    expect(screen.getByText('Wind Forecast Decision Support')).toBeInTheDocument();
    expect(screen.getByText('UK Day-Ahead Desk')).toBeInTheDocument();
  });
});
