import React from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, ShieldAlert, Zap, Compass, Info } from 'lucide-react';
import { AccuracyMetrics, MatchedIntervalRecord } from '../types';

interface OperationalInsightsProps {
  metrics: AccuracyMetrics;
  records: MatchedIntervalRecord[];
  onSelectInterval: (interval: MatchedIntervalRecord) => void;
}

export const OperationalInsights: React.FC<OperationalInsightsProps> = ({
  metrics,
  records,
  onSelectInterval,
}) => {
  // Find top 3 overforecasting and top 3 underforecasting intervals
  const sortedByAbsError = [...records].sort((a, b) => b.absoluteError - a.absoluteError);
  const topSwings = sortedByAbsError.slice(0, 5);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-5">
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-sm flex items-center">
            <Compass className="w-4 h-4 mr-2 text-amber-400" />
            Trading Desk Operational Insights: Balancing Risk & Dispatch Strategy
          </h3>
          <p className="text-xs text-slate-400">
            Translating statistical forecast errors into commercial exposure for UK Day-Ahead purchase decisions.
          </p>
        </div>
      </div>

      {/* Mandatory Domain Disclaimer Alert */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs space-y-2">
        <div className="flex items-center space-x-2 text-amber-400 font-bold">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>Fundamental Market Boundary: Wind Forecasts Alone Do Not Determine Net Procurement</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          In wholesale electricity operations, <strong>Net Required Additional Procurement</strong> is governed by:
        </p>
        <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300">
          Required Thermal / Market Procurement = Total Consumer Demand - (Wind + Solar + Nuclear + Inflexible Baseload)
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          Because consumer demand, solar generation, interconnectors, and thermal plant outturns are outside this dataset, 
          wind forecast accuracy provides critical <em>volumetric uncertainty quantification</em>, but <strong>must never be treated as a complete procurement recommendation on its own</strong>.
        </p>
      </div>

      {/* Commercial Impact of Bias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Overforecasting Case */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>Overforecasting Impact (Forecast &gt; Actual)</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Occurred in <strong>{metrics.overforecastPercentage}%</strong> of intervals ({metrics.overforecastCount} intervals).
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
            <li>Day-ahead buyers rely on higher anticipated renewable generation and purchase less thermal baseload.</li>
            <li>In real time, actual wind falls short, leaving the utility short in the <strong>Balancing Mechanism (BM)</strong>.</li>
            <li>Shortfall must be resolved at the <strong>System Buy Price (SBP)</strong>, exposing the utility to price spikes when reserve margins are tight.</li>
          </ul>
        </div>

        {/* Underforecasting Case */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold">
            <TrendingDown className="w-4 h-4" />
            <span>Underforecasting Impact (Forecast &lt; Actual)</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Occurred in <strong>{metrics.underforecastPercentage}%</strong> of intervals ({metrics.underforecastCount} intervals).
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
            <li>Utility purchases excess thermal or market power on day D-1 believing wind will be low.</li>
            <li>Real-time wind arrives in surplus, creating a long imbalance position.</li>
            <li>Surplus energy is cashed out at <strong>System Sell Price (SSP)</strong> (often discounted) or incurs wind curtailment costs.</li>
          </ul>
        </div>
      </div>

      {/* Top 5 Extreme Forecasting Error Intervals */}
      <div>
        <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center">
          <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
          High-Risk Volatility Intervals (Top 5 Divergence Events in January 2026)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {topSwings.map((swing, idx) => (
            <div
              key={idx}
              onClick={() => onSelectInterval(swing)}
              className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-lg p-3 cursor-pointer transition text-xs space-y-1 group"
            >
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Rank #{idx + 1}</span>
                <span className="font-mono">{swing.targetTime.slice(5, 16).replace('T', ' ')}</span>
              </div>
              <div className="flex items-baseline space-x-1 font-mono">
                <span className={`text-base font-bold ${swing.signedError > 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {swing.signedError > 0 ? `+${swing.signedError.toLocaleString()}` : swing.signedError.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-normal">MW</span>
              </div>
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>Act: {swing.actualGeneration.toLocaleString()}</span>
                <span>Fc: {swing.forecastGeneration.toLocaleString()}</span>
              </div>
              <div className="text-[9px] text-emerald-400/80 group-hover:text-emerald-300 pt-1">
                Click to explore publication →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
