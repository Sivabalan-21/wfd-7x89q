import React from 'react';
import { Database, ShieldCheck, CheckCircle2, AlertCircle, FileText, ExternalLink } from 'lucide-react';
import { MetadataResponse } from '../types';

interface DataTransparencyProps {
  metadata?: MetadataResponse | null;
  notes?: string[];
}

export const DataTransparency: React.FC<DataTransparencyProps> = ({ metadata, notes }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 text-xs">
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
        <h3 className="font-bold text-white text-sm flex items-center">
          <Database className="w-4 h-4 mr-2 text-emerald-400" />
          Data Quality, Provenance & Market Transparency Audit
        </h3>
        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          Strict Elexon BMRS Grounding
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dataset Specifications */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-2">
          <h4 className="font-semibold text-slate-300 flex items-center">
            <FileText className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            Official Upstream Data Feeds
          </h4>
          <ul className="space-y-1.5 text-slate-400">
            <li className="flex items-start">
              <span className="text-emerald-400 mr-1.5">✓</span>
              <div>
                <strong className="text-slate-200">Outturn Actuals: </strong>
                Elexon BMRS <code className="text-emerald-300 bg-slate-900 px-1 rounded">FUELHH/stream</code> filtered to <code className="text-emerald-300 bg-slate-900 px-1 rounded">fuelType = WIND</code>. 48 half-hour settlement periods per day.
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-400 mr-1.5">✓</span>
              <div>
                <strong className="text-slate-200">Wind Forecasts: </strong>
                Elexon BMRS <code className="text-amber-300 bg-slate-900 px-1 rounded">WINDFOR/stream</code> (National Wind Generation Forecast). Includes publication timestamp (<code className="text-slate-300">publishTime</code>) and forecast horizon (<code className="text-slate-300">startTime</code>).
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-400 mr-1.5">✓</span>
              <div>
                <strong className="text-slate-200">Authenticity Guarantee: </strong>
                No synthetic or fabricated proxy data. All metrics ground directly in real observations recorded in January 2026.
              </div>
            </li>
          </ul>
        </div>

        {/* Leakage Prevention & Audit Notes */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-2">
          <h4 className="font-semibold text-slate-300 flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Methodological Safeguards & Leakage Prevention
          </h4>
          <ul className="space-y-1.5 text-slate-400">
            <li className="flex items-start">
              <span className="text-emerald-400 mr-1.5">✓</span>
              <div>
                <strong className="text-slate-200">Zero Lookahead Leakage: </strong>
                Only forecasts published strictly on or before Gate Closure on Day D-1 are eligible. Later revisions are flagged and barred from day-ahead scoring.
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-400 mr-1.5">✓</span>
              <div>
                <strong className="text-slate-200">Resolution Transparency: </strong>
                Base WINDFOR runs publish at hourly steps. The user can toggle between direct hourly matching and linear interpolation for the intermediate (:30) settlement periods.
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-400 mr-1.5">✓</span>
              <div>
                <strong className="text-slate-200">Timezone Standardization: </strong>
                All operational timestamps are anchored in <strong>UTC / GMT</strong>, matching National Grid ESO and GB Settlement Period definitions.
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Dynamic Data Quality Notes from Backend Matching Engine */}
      {notes && notes.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-1.5">
          <div className="font-semibold text-slate-300 flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            Active Matching Engine Audit Notes:
          </div>
          <div className="space-y-1 text-slate-400">
            {notes.map((note, i) => (
              <p key={i} className="text-[11px] leading-relaxed">
                • {note}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* External Elexon API Documentation Links */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
        <span>Verified against official Elexon Insights API endpoints:</span>
        <div className="flex space-x-3">
          <a
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-slate-400 hover:text-emerald-400 underline"
          >
            FUELHH Stream Docs <ExternalLink className="w-3 h-3 ml-1" />
          </a>
          <a
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-slate-400 hover:text-amber-400 underline"
          >
            WINDFOR Stream Docs <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
};
