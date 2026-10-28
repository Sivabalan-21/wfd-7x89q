import React from 'react';
import { Calendar, Filter, Clock, Sliders, Info, Zap } from 'lucide-react';

interface ControlPanelProps {
  dateFrom: string;
  dateTo: string;
  cutoffHour: number;
  interpolate: boolean;
  onDateChange: (from: string, to: string) => void;
  onCutoffChange: (hour: number) => void;
  onInterpolateChange: (enabled: boolean) => void;
  onApply: () => void;
  isLoading: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  dateFrom,
  dateTo,
  cutoffHour,
  interpolate,
  onDateChange,
  onCutoffChange,
  onInterpolateChange,
  onApply,
  isLoading,
}) => {
  const presets = [
    { label: 'Full Jan 2026', from: '2026-01-01', to: '2026-01-31' },
    { label: 'Week 1 (Jan 1-7)', from: '2026-01-01', to: '2026-01-07' },
    { label: 'Week 2 (Jan 8-14)', from: '2026-01-08', to: '2026-01-14' },
    { label: 'Week 3 (Jan 15-21)', from: '2026-01-15', to: '2026-01-21' },
    { label: 'Week 4 (Jan 22-28)', from: '2026-01-22', to: '2026-01-28' },
    { label: 'Jan 29-31', from: '2026-01-29', to: '2026-01-31' },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        {/* Preset Date Filters */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center mr-1">
            <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Presets:
          </span>
          {presets.map((p) => {
            const active = dateFrom === p.from && dateTo === p.to;
            return (
              <button
                key={p.label}
                onClick={() => onDateChange(p.from, p.to)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition ${
                  active
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/60'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Action Trigger */}
        <button
          onClick={onApply}
          disabled={isLoading}
          className="self-end lg:self-auto flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isLoading ? 'Computing Metrics...' : 'Evaluate Cutoff'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 text-xs">
        {/* Date Range Inputs */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Target Delivery Range (January 2026)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={dateFrom}
              onChange={(e) => onDateChange(e.target.value, dateTo)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={dateTo}
              onChange={(e) => onDateChange(dateFrom, e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Day-Ahead Decision Cutoff Gate Closure */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-300 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Day-Ahead Auction Cutoff (D-1 UTC)
            </label>
            <span className="text-[10px] text-amber-400/90 font-mono">
              EPEX SPOT Gate: 11:00 UTC
            </span>
          </div>
          <select
            value={cutoffHour}
            onChange={(e) => onCutoffChange(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value={9}>09:00 UTC (Early Auction Bids)</option>
            <option value={10}>10:00 UTC (Pre-Auction Closure)</option>
            <option value={11}>11:00 UTC (EPEX SPOT GB Standard Gate Closure) [Recommended]</option>
            <option value={12}>12:00 UTC (Midday National Grid Day-Ahead Horizon)</option>
            <option value={14}>14:00 UTC (Afternoon Review)</option>
            <option value={17}>17:00 UTC (Day-Ahead Final Fix)</option>
            <option value={23}>23:00 UTC (Late Evening / Intraday Transition)</option>
          </select>
          <p className="text-[10px] text-slate-400 leading-tight">
            Strictly filters forecasts published ≤ this cutoff on day D-1. Eliminates lookahead bias.
          </p>
        </div>

        {/* Resolution & Interpolation Setting */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center">
              <Sliders className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              Interval Resolution
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              FUELHH 30-min Settlement
            </span>
          </label>
          <div className="flex items-center space-x-3 bg-slate-950 border border-slate-700 rounded-md p-1.5">
            <label className="flex items-center space-x-2 cursor-pointer flex-1">
              <input
                type="radio"
                name="interpMode"
                checked={interpolate}
                onChange={() => onInterpolateChange(true)}
                className="text-emerald-500 focus:ring-0"
              />
              <span className="text-slate-300">30-min Interpolated</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer flex-1">
              <input
                type="radio"
                name="interpMode"
                checked={!interpolate}
                onChange={() => onInterpolateChange(false)}
                className="text-emerald-500 focus:ring-0"
              />
              <span className="text-slate-300">Hourly Direct (:00)</span>
            </label>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            {interpolate
              ? 'Evaluates all 48 half-hour periods by interpolating pre-cutoff hourly forecasts.'
              : 'Direct matching on hourly target intervals (:00). Zero interpolation assumption.'}
          </p>
        </div>
      </div>
    </div>
  );
};
