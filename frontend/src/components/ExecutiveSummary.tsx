import React from 'react';
import { Target, TrendingUp, AlertTriangle, Scale, Percent, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AccuracyMetrics, MetadataResponse } from '../types';

interface ExecutiveSummaryProps {
  metrics?: AccuracyMetrics | null;
  metadata?: MetadataResponse | null;
  cutoffHour: number;
  dateRange: { from: string; to: string };
  isLoading: boolean;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  metrics,
  metadata,
  cutoffHour,
  dateRange,
  isLoading,
}) => {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-xl" />
        ))}
      </div>
    );
  }

  const isOverforecast = metrics.bias > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400 px-1">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-200">Executive Summary:</span>
          <span>{dateRange.from} to {dateRange.to}</span>
          <span>•</span>
          <span className="text-emerald-400 font-medium">{metrics.totalMatchedIntervals} Matched Intervals</span>
          <span>•</span>
          <span>Cutoff: D-1 @ {cutoffHour.toString().padStart(2, '0')}:00 UTC</span>
        </div>
        <div className="flex items-center space-x-2 font-mono text-[11px]">
          <span className="text-slate-500">Latest Pub:</span>
          <span className="text-slate-300">{metadata?.latestPublishTime || '2026-02-01T22:30:00Z'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* MAE Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Mean Abs Error (MAE)</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-2xl font-bold font-mono text-white">{metrics.mae.toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-medium">MW</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Average absolute divergence per delivery interval
          </p>
        </div>

        {/* RMSE Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Root Mean Sq (RMSE)</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-2xl font-bold font-mono text-white">{metrics.rmse.toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-medium">MW</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Penalizes large balancing outliers heavily
          </p>
        </div>

        {/* Bias Card */}
        <div className={`bg-slate-900/80 border rounded-xl p-4 relative overflow-hidden group transition ${
          isOverforecast ? 'border-amber-500/30' : 'border-indigo-500/30'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Forecast Bias</span>
            <Scale className={`w-4 h-4 ${isOverforecast ? 'text-amber-400' : 'text-indigo-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className={`text-2xl font-bold font-mono ${isOverforecast ? 'text-amber-400' : 'text-indigo-300'}`}>
              {metrics.bias > 0 ? `+${metrics.bias.toLocaleString()}` : metrics.bias.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">MW</span>
          </div>
          <div className="mt-1 flex items-center space-x-1 text-[11px]">
            <span className={`font-semibold ${isOverforecast ? 'text-amber-400' : 'text-indigo-400'}`}>
              {isOverforecast ? 'Overforecasting' : 'Underforecasting'}
            </span>
            <span className="text-slate-400">tendency</span>
          </div>
        </div>

        {/* WAPE Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">WAPE Error</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-2xl font-bold font-mono text-white">
              {metrics.wape !== null ? `${metrics.wape}%` : 'N/A'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Weighted by outturn volume: Σ|Err| / ΣActual
          </p>
        </div>

        {/* Over/Under Ratio Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Direction Split</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between font-mono text-xs">
            <span className="text-amber-400 font-bold">{metrics.overforecastPercentage}% Over</span>
            <span className="text-cyan-400 font-bold">{metrics.underforecastPercentage}% Under</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 flex overflow-hidden">
            <div className="bg-amber-400 h-full" style={{ width: `${metrics.overforecastPercentage}%` }} />
            <div className="bg-cyan-400 h-full" style={{ width: `${metrics.underforecastPercentage}%` }} />
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400">
            {metrics.overforecastCount} Over • {metrics.underforecastCount} Under
          </p>
        </div>

        {/* Mean Actual Generation */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Mean Generation</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-2xl font-bold font-mono text-white">{metrics.meanActual.toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-medium">MW</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Forecast Mean: {metrics.meanForecast.toLocaleString()} MW
          </p>
        </div>
      </div>
    </div>
  );
};
