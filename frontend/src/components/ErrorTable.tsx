import React, { useState, useMemo } from 'react';
import { Table, Download, Search, ChevronLeft, ChevronRight, ArrowUpDown, Filter } from 'lucide-react';
import { MatchedIntervalRecord } from '../types';

interface ErrorTableProps {
  records: MatchedIntervalRecord[];
  onSelectInterval: (interval: MatchedIntervalRecord) => void;
  selectedInterval?: MatchedIntervalRecord | null;
}

export const ErrorTable: React.FC<ErrorTableProps> = ({
  records,
  onSelectInterval,
  selectedInterval,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof MatchedIntervalRecord>('targetTime');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const handleSort = (field: keyof MatchedIntervalRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.targetTime.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.forecastPublishTime.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.settlementPeriod?.toString() || '').includes(searchTerm);
      return matchSearch;
    });
  }, [records, searchTerm]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      if (typeof valA === 'string') {
        return sortAsc
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [filtered, sortField, sortAsc]);

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const downloadCSV = () => {
    const headers = [
      'Target Delivery Time (UTC)',
      'Settlement Date',
      'Settlement Period',
      'Forecast Publish Time (UTC)',
      'Forecast MW',
      'Actual MW',
      'Signed Error (F-A) MW',
      'Absolute Error MW',
      'Percentage Error (%)',
      'Lead Time (Hours)',
      'Interpolated',
    ];
    const rows = sorted.map((r) => [
      r.targetTime,
      r.settlementDate || '',
      r.settlementPeriod || '',
      r.forecastPublishTime,
      r.forecastGeneration,
      r.actualGeneration,
      r.signedError,
      r.absoluteError,
      r.percentageError || '',
      r.leadTimeHours,
      r.isInterpolated ? 'YES' : 'NO',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wind_forecast_accuracy_jan2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="font-bold text-white text-sm flex items-center">
            <Table className="w-4 h-4 mr-2 text-cyan-400" />
            Settlement Interval Error Audit Log
          </h3>
          <p className="text-xs text-slate-400">
            Target settlement period, pre-cutoff forecast, outturn generation, and signed variance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search date / period..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-700 rounded-md pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44"
            />
          </div>

          {/* CSV Export */}
          <button
            onClick={downloadCSV}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
            title="Download matched intervals as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th onClick={() => handleSort('targetTime')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                <span className="flex items-center">Target Delivery Time (UTC) <ArrowUpDown className="w-3 h-3 ml-1" /></span>
              </th>
              <th onClick={() => handleSort('settlementPeriod')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                <span className="flex items-center">SP <ArrowUpDown className="w-3 h-3 ml-1" /></span>
              </th>
              <th onClick={() => handleSort('forecastPublishTime')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                <span className="flex items-center">Forecast Published <ArrowUpDown className="w-3 h-3 ml-1" /></span>
              </th>
              <th onClick={() => handleSort('forecastGeneration')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                <span className="flex items-center">Forecast MW <ArrowUpDown className="w-3 h-3 ml-1" /></span>
              </th>
              <th onClick={() => handleSort('actualGeneration')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                <span className="flex items-center">Actual MW <ArrowUpDown className="w-3 h-3 ml-1" /></span>
              </th>
              <th onClick={() => handleSort('signedError')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                <span className="flex items-center">Signed Error (F-A) <ArrowUpDown className="w-3 h-3 ml-1" /></span>
              </th>
              <th onClick={() => handleSort('absoluteError')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                <span className="flex items-center">Abs Error <ArrowUpDown className="w-3 h-3 ml-1" /></span>
              </th>
              <th className="py-2.5 px-3">Lead Time</th>
              <th className="py-2.5 px-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {paginated.length > 0 ? (
              paginated.map((r, idx) => {
                const isSelected = selectedInterval?.targetTime === r.targetTime;
                return (
                  <tr
                    key={idx}
                    className={`transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 text-white font-semibold'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                    onClick={() => onSelectInterval(r)}
                  >
                    <td className="py-2 px-3 font-semibold text-slate-200">
                      {r.targetTime.replace('T', ' ').replace('Z', '')}
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      {r.settlementPeriod ? `SP ${r.settlementPeriod}` : '-'}
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      {r.forecastPublishTime.replace('T', ' ').replace('Z', '')}
                    </td>
                    <td className="py-2 px-3 text-white font-bold">{r.forecastGeneration.toLocaleString()}</td>
                    <td className="py-2 px-3 text-emerald-400 font-bold">{r.actualGeneration.toLocaleString()}</td>
                    <td className="py-2 px-3 font-bold">
                      <span className={r.signedError > 0 ? 'text-amber-400' : 'text-cyan-400'}>
                        {r.signedError > 0 ? `+${r.signedError.toLocaleString()}` : r.signedError.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300">{r.absoluteError.toLocaleString()}</td>
                    <td className="py-2 px-3 text-slate-400">{r.leadTimeHours}h</td>
                    <td className="py-2 px-3 font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInterval(r);
                        }}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 underline"
                      >
                        Explore
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="py-6 text-center text-slate-500 font-sans">
                  No matching intervals found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
        <span>
          Showing {(currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, sorted.length)} of {sorted.length} intervals
        </span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
