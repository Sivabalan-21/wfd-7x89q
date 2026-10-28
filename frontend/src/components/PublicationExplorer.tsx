import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, AlertCircle, ArrowRight, CheckCircle, Ban, Clock } from 'lucide-react';
import { MatchedIntervalRecord, PublicationExplorerResponse } from '../types';
import { fetchPublicationExplore } from '../services/api';

interface PublicationExplorerProps {
  selectedInterval?: MatchedIntervalRecord | null;
  cutoffHour: number;
}

export const PublicationExplorer: React.FC<PublicationExplorerProps> = ({
  selectedInterval,
  cutoffHour,
}) => {
  const [data, setData] = useState<PublicationExplorerResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedInterval) return;
    setLoading(true);
    setError(null);
    fetchPublicationExplore(selectedInterval.targetTime, cutoffHour, 0)
      .then((res) => setData(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedInterval?.targetTime, cutoffHour]);

  if (!selectedInterval) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-xs">
        <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="font-medium text-slate-300">Forecast Publication Evolution Explorer</p>
        <p className="mt-1">
          Click on any interval in the time-series chart or select a row in the error table to inspect how forecasts evolved leading up to the Day-Ahead cutoff.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-white text-sm flex items-center">
            <History className="w-4 h-4 mr-2 text-cyan-400" />
            Forecast Publication Explorer: Target Interval {selectedInterval.targetTime.replace('T', ' ').replace('Z', ' UTC')}
          </h3>
          <p className="text-xs text-slate-400">
            Audit trail of all published forecast revisions from Elexon WINDFOR stream for this delivery interval.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
            Actual: <strong className="text-emerald-400">{selectedInterval.actualGeneration.toLocaleString()} MW</strong>
          </span>
          <span className="bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md border border-amber-500/20 font-medium">
            Cutoff: D-1 @ {cutoffHour.toString().padStart(2, '0')}:00 UTC
          </span>
        </div>
      </div>

      {/* Methodology Rule Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
        <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Strict Day-Ahead Market Selection Rule:</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          {data?.selectionRule || `To participate in the UK Day-Ahead auction, trading bids for all settlement periods of Day D are submitted before gate closure on Day D-1 at ${cutoffHour.toString().padStart(2, '0')}:00 UTC. The trading algorithm selects the latest forecast published on or before this cutoff.`}
        </p>
        <p className="text-amber-400/90 text-[11px]">
          • Any publication created AFTER the gate closure cutoff is marked "Post-Cutoff" and strictly excluded to avoid data leakage.
        </p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
          Loading publication history...
        </div>
      ) : error ? (
        <div className="py-4 text-center text-xs text-rose-400 bg-rose-500/10 rounded-lg">
          Error: {error}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Publication Timestamp</th>
                <th className="py-2.5 px-3">Lead Time</th>
                <th className="py-2.5 px-3">Forecasted Generation</th>
                <th className="py-2.5 px-3">Divergence vs Actual</th>
                <th className="py-2.5 px-3">Day-Ahead Eligibility</th>
                <th className="py-2.5 px-3">Decision Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {data?.allPublications && data.allPublications.length > 0 ? (
                data.allPublications.map((pub, idx) => {
                  const diff = pub.generation - (selectedInterval.actualGeneration || 0);
                  return (
                    <tr
                      key={idx}
                      className={`transition ${
                        pub.isSelected
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/15 font-semibold'
                          : !pub.isEligibleDayAhead
                          ? 'bg-slate-950/40 text-slate-500 opacity-70 hover:opacity-100'
                          : 'hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 px-3 flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{pub.publishTime.replace('T', ' ').replace('Z', ' UTC')}</span>
                      </td>
                      <td className="py-2.5 px-3">{pub.leadTimeHours} hrs ahead</td>
                      <td className="py-2.5 px-3 text-white font-bold">{pub.generation.toLocaleString()} MW</td>
                      <td className="py-2.5 px-3">
                        <span className={diff > 0 ? 'text-amber-400' : 'text-cyan-400'}>
                          {diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()} MW
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {pub.isEligibleDayAhead ? (
                          <span className="inline-flex items-center text-emerald-400 text-[11px]">
                            <CheckCircle className="w-3 h-3 mr-1" /> Eligible (Pre-Cutoff)
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-rose-400 text-[11px]">
                            <Ban className="w-3 h-3 mr-1" /> Post-Cutoff (Leakage)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        {pub.isSelected ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500 text-slate-950">
                            ★ Selected for Day-Ahead Bids
                          </span>
                        ) : pub.isEligibleDayAhead ? (
                          <span className="text-slate-400 text-[11px]">Superseded by later run</span>
                        ) : (
                          <span className="text-rose-400/80 text-[11px]">Published after Gate Closure</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500">
                    No discrete hourly publication runs logged for this exact settlement period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
