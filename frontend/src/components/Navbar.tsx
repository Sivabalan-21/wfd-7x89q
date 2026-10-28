import React from 'react';
import { Wind, Activity, Clock, ShieldCheck, Database, RefreshCw } from 'lucide-react';
import { HealthResponse } from '../types';

interface NavbarProps {
  health?: HealthResponse | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ health, onRefresh, isLoading }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <Wind className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">Wind Forecast Decision Support</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                UK Day-Ahead Desk
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Elexon BMRS Verified • National Wind Generation & Accuracy Evaluation
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-3 text-xs bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5">
            <div className="flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${health?.elexonApiReachable ? 'bg-emerald-400' : 'bg-amber-400'} animate-ping`} />
              <span className="text-slate-300">
                {health?.elexonApiReachable ? 'Elexon API: Online' : 'Elexon API: Cached'}
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center space-x-1 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Target: Jan 2026 (UTC)</span>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
            title="Refresh latest data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
