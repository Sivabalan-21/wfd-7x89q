import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
} from 'recharts';
import { MatchedIntervalRecord } from '../types';
import { Activity, Layers, MousePointerClick } from 'lucide-react';

interface GenerationChartProps {
  records: MatchedIntervalRecord[];
  onSelectInterval: (interval: MatchedIntervalRecord) => void;
  selectedInterval?: MatchedIntervalRecord | null;
  isLoading: boolean;
}

export const GenerationChart: React.FC<GenerationChartProps> = ({
  records,
  onSelectInterval,
  selectedInterval,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 h-96 flex flex-col items-center justify-center animate-pulse">
        <Activity className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <span className="text-slate-400 text-sm">Loading January 2026 actuals & day-ahead forecasts...</span>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 h-96 flex flex-col items-center justify-center text-slate-400 text-sm">
        <Layers className="w-8 h-8 text-slate-600 mb-2" />
        <span>No matched intervals found for the selected date range and cutoff.</span>
      </div>
    );
  }

  // Format data for chart display
  const chartData = records.map((r) => ({
    targetTime: r.targetTime,
    displayTime: r.targetTime.slice(5, 16).replace('T', ' '),
    actualMW: r.actualGeneration,
    forecastMW: r.forecastGeneration,
    signedError: r.signedError,
    publishTime: r.forecastPublishTime,
    isInterpolated: r.isInterpolated,
    originalRecord: r,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3 rounded-lg shadow-2xl text-xs space-y-1.5 backdrop-blur z-50">
          <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>{data.targetTime.replace('T', ' ').replace('Z', ' UTC')}</span>
            {data.isInterpolated && (
              <span className="text-[10px] text-amber-400 font-normal px-1 rounded bg-amber-400/10">
                Interpolated :30
              </span>
            )}
          </div>
          <div className="flex justify-between items-center space-x-4">
            <span className="text-emerald-400 font-medium flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5" />
              Actual Generation:
            </span>
            <span className="font-mono font-bold text-white">
              {data.actualMW?.toLocaleString()} MW
            </span>
          </div>
          <div className="flex justify-between items-center space-x-4">
            <span className="text-amber-400 font-medium flex items-center">
              <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5" />
              Day-Ahead Forecast:
            </span>
            <span className="font-mono font-bold text-white">
              {data.forecastMW?.toLocaleString()} MW
            </span>
          </div>
          <div className="flex justify-between items-center space-x-4 pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">Signed Divergence (F - A):</span>
            <span className={`font-mono font-bold ${data.signedError > 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
              {data.signedError > 0 ? `+${data.signedError.toLocaleString()}` : data.signedError.toLocaleString()} MW
            </span>
          </div>
          <div className="text-[10px] text-slate-400 pt-0.5">
            Forecast published: {data.publishTime.replace('T', ' ').replace('Z', ' UTC')}
          </div>
          <div className="text-[10px] text-emerald-400/80 pt-1 flex items-center">
            <MousePointerClick className="w-3 h-3 mr-1" /> Click to inspect all publications in Explorer
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-white text-sm flex items-center">
            <Activity className="w-4 h-4 mr-2 text-emerald-400" />
            National Wind Generation: Actuals vs Day-Ahead Forecasts
          </h3>
          <p className="text-xs text-slate-400">
            30-minute settlement resolution (MW). Drag horizontal brush below to pan/zoom specific days.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1.5" />
            Actual (FUELHH)
          </span>
          <span className="flex items-center text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5" />
            Day-Ahead Locked (WINDFOR)
          </span>
        </div>
      </div>

      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload.length) {
                onSelectInterval(e.activePayload[0].payload.originalRecord);
              }
            }}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="displayTime"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MW`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="actualMW"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#actualGradient)"
              name="Actual Outturn (MW)"
            />
            <Line
              type="monotone"
              dataKey="forecastMW"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              name="Day-Ahead Forecast (MW)"
            />
            <Brush
              dataKey="displayTime"
              height={24}
              stroke="#0f766e"
              fill="#0f172a"
              tickFormatter={() => ''}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {selectedInterval && (
        <div className="flex items-center justify-between text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-emerald-300">
          <div className="flex items-center space-x-2">
            <span className="font-semibold">Selected Target Interval:</span>
            <span className="font-mono">{selectedInterval.targetTime.replace('T', ' ').replace('Z', ' UTC')}</span>
            <span>•</span>
            <span>Actual: {selectedInterval.actualGeneration.toLocaleString()} MW</span>
            <span>•</span>
            <span>Forecast: {selectedInterval.forecastGeneration.toLocaleString()} MW</span>
          </div>
          <span className="text-[11px] text-slate-400 underline cursor-pointer hover:text-white">
            Inspect in Publication Explorer ↓
          </span>
        </div>
      )}
    </div>
  );
};
