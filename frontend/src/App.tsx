import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchHealth,
  fetchMetadata,
  fetchAccuracy,
} from './services/api';
import {
  HealthResponse,
  MetadataResponse,
  AccuracyResponse,
  MatchedIntervalRecord,
} from './types';
import { Navbar } from './components/Navbar';
import { ControlPanel } from './components/ControlPanel';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { GenerationChart } from './components/GenerationChart';
import { AccuracyAnalysis } from './components/AccuracyAnalysis';
import { PublicationExplorer } from './components/PublicationExplorer';
import { OperationalInsights } from './components/OperationalInsights';
import { ErrorTable } from './components/ErrorTable';
import { DataTransparency } from './components/DataTransparency';
import { Activity, AlertTriangle, Layers, TrendingUp, History, Compass, FileCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  const [accuracyData, setAccuracyData] = useState<AccuracyResponse | null>(null);

  const [dateFrom, setDateFrom] = useState<string>('2026-01-01');
  const [dateTo, setDateTo] = useState<string>('2026-01-31');
  const [cutoffHour, setCutoffHour] = useState<number>(11);
  const [interpolate, setInterpolate] = useState<boolean>(true);

  const [selectedInterval, setSelectedInterval] = useState<MatchedIntervalRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (force = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const [h, m, acc] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchMetadata().catch(() => null),
        fetchAccuracy(dateFrom, dateTo, cutoffHour, 0, interpolate, force),
      ]);
      setHealth(h);
      setMetadata(m);
      setAccuracyData(acc);

      // Pre-select the highest divergence interval if none selected
      if (acc.matchedRecords && acc.matchedRecords.length > 0 && !selectedInterval) {
        const topDivergence = [...acc.matchedRecords].sort(
          (a, b) => b.absoluteError - a.absoluteError
        )[0];
        setSelectedInterval(topDivergence);
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to communicate with wind forecast backend API.');
    } finally {
      setIsLoading(false);
    }
  }, [dateFrom, dateTo, cutoffHour, interpolate]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        health={health}
        onRefresh={() => loadData(true)}
        isLoading={isLoading}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadData(true)}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Interactive Trading Control Panel */}
        <ControlPanel
          dateFrom={dateFrom}
          dateTo={dateTo}
          cutoffHour={cutoffHour}
          interpolate={interpolate}
          onDateChange={(from, to) => {
            setDateFrom(from);
            setDateTo(to);
          }}
          onCutoffChange={(hour) => setCutoffHour(hour)}
          onInterpolateChange={(enabled) => setInterpolate(enabled)}
          onApply={() => loadData(false)}
          isLoading={isLoading}
        />

        {/* Executive Summary Cards */}
        <ExecutiveSummary
          metrics={accuracyData?.metrics}
          metadata={metadata}
          cutoffHour={cutoffHour}
          dateRange={{ from: dateFrom, to: dateTo }}
          isLoading={isLoading}
        />

        {/* Main Interactive Wind Time-Series Chart */}
        <GenerationChart
          records={accuracyData?.matchedRecords || []}
          onSelectInterval={(inv) => setSelectedInterval(inv)}
          selectedInterval={selectedInterval}
          isLoading={isLoading}
        />

        {/* Forecast Publication Explorer & Cutoff Verification */}
        <PublicationExplorer
          selectedInterval={selectedInterval}
          cutoffHour={cutoffHour}
        />

        {/* Error Distribution & Quantitative Metrics */}
        {accuracyData && (
          <AccuracyAnalysis
            metrics={accuracyData.metrics}
            distribution={accuracyData.distribution}
          />
        )}

        {/* Operational Insights for Trading Desk */}
        {accuracyData && (
          <OperationalInsights
            metrics={accuracyData.metrics}
            records={accuracyData.matchedRecords}
            onSelectInterval={(inv) => setSelectedInterval(inv)}
          />
        )}

        {/* Audit Log Table with Search, Sort, Pagination & CSV Export */}
        <ErrorTable
          records={accuracyData?.matchedRecords || []}
          onSelectInterval={(inv) => setSelectedInterval(inv)}
          selectedInterval={selectedInterval}
        />

        {/* Data Quality, Provenance & Audit Guarantee */}
        <DataTransparency
          metadata={metadata}
          notes={accuracyData?.dataQualityNotes}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Wind Forecast Decision Support • UK Day-Ahead Trading Desk</span>
          <span>Data Grounded in Official Elexon BMRS API (FUELHH &amp; WINDFOR) • January 2026</span>
          <span className="text-slate-600 font-mono text-[11px]">UTC / GMT Standard</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
