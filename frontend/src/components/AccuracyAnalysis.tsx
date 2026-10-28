import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { AccuracyMetrics, ErrorDistributionBucket } from '../types';
import { BarChart3, HelpCircle, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AccuracyAnalysisProps {
  metrics: AccuracyMetrics;
  distribution: ErrorDistributionBucket[];
}

export const AccuracyAnalysis: React.FC<AccuracyAnalysisProps> = ({
  metrics,
  distribution,
}) => {
  const getBarColor = (label: string) => {
    if (label.includes('Under')) return '#06b6d4'; // Cyan for underforecasting
    if (label.includes('Over')) return '#f59e0b'; // Amber for overforecasting
    return '#10b981'; // Emerald for accurate / near-zero
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-white text-sm flex items-center">
            <BarChart3 className="w-4 h-4 mr-2 text-purple-400" />
            Forecast Error Distribution & Quantitative Analysis
          </h3>
          <p className="text-xs text-slate-400">
            Evaluating {metrics.totalMatchedIntervals} matched intervals across January 2026.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1 text-amber-400">
            <ArrowUpRight className="w-4 h-4" />
            <span>Overforecast: <strong>{metrics.overforecastCount} ({metrics.overforecastPercentage}%)</strong></span>
          </div>
          <div className="flex items-center space-x-1 text-cyan-400">
            <ArrowDownRight className="w-4 h-4" />
            <span>Underforecast: <strong>{metrics.underforecastCount} ({metrics.underforecastPercentage}%)</strong></span>
          </div>
        </div>
      </div>

      {/* Distribution Histogram */}
      <div>
        <h4 className="text-xs font-semibold text-slate-300 mb-2">
          Signed Error Distribution: (Forecast MW - Actual MW)
        </h4>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="rangeLabel"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg text-xs shadow-xl space-y-1">
                        <div className="font-semibold text-white">{d.rangeLabel}</div>
                        <div className="text-slate-300">Intervals: <strong>{d.count}</strong></div>
                        <div className="text-emerald-400">Share: <strong>{d.percentage}%</strong></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.rangeLabel)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Plain Language Metric Definitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Mean Absolute Error (MAE)</span>
          </div>
          <div className="font-mono text-white text-base font-bold">{metrics.mae.toLocaleString()} MW</div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Average divergence between forecast and reality. Every MW of MAE must be hedged or absorbed in the balancing market.
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1">
          <div className="flex items-center space-x-1.5 text-purple-400 font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Root Mean Squared Error (RMSE)</span>
          </div>
          <div className="font-mono text-white text-base font-bold">{metrics.rmse.toLocaleString()} MW</div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Square root of mean squared errors. Heavily penalizes large forecasting misses, capturing extreme volumetric trading risk.
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1">
          <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Forecast Bias</span>
          </div>
          <div className="font-mono text-white text-base font-bold">
            {metrics.bias > 0 ? `+${metrics.bias.toLocaleString()}` : metrics.bias.toLocaleString()} MW
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Directional drift: (1/N) * Σ(F - A). Positive bias indicates persistent over-forecasting, risking costly short balancing positions.
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>WAPE Error</span>
          </div>
          <div className="font-mono text-white text-base font-bold">
            {metrics.wape !== null ? `${metrics.wape}%` : 'N/A'}
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Σ|Error| / ΣActual * 100%. Relative error scaled to total wind outturn, immune to division-by-zero distortions at low generation.
          </p>
        </div>
      </div>
    </div>
  );
};
