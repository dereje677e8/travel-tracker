import { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { reportsApi } from '../api/reportsApi.js';

export default function ReportsPage() {
  const [status, setStatus] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [exporting, setExporting] = useState(null);

  async function handleExport(kind) {
    setExporting(kind);
    try {
      const params = { status: status || undefined, destinationCountry: destinationCountry || undefined };
      if (kind === 'excel') await reportsApi.exportExcel(params);
      else await reportsApi.exportPdf(params);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark p-6">
        <h2 className="mb-1 text-lg font-semibold text-ink dark:text-ink-dark">Travel Readiness Report</h2>
        <p className="mb-5 text-sm text-slate-500">
          Includes athlete name, sport, competition, destination, dates, progress, status, and missing requirements.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm">
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="preparing_documents">Preparing Documents</option>
              <option value="in_progress">In Progress</option>
              <option value="almost_ready">Almost Ready</option>
              <option value="ready_for_travel">Ready for Travel</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Destination Country</label>
            <input
              value={destinationCountry}
              onChange={(e) => setDestinationCountry(e.target.value)}
              placeholder="e.g. France"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting === 'excel'}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <FileSpreadsheet size={16} /> {exporting === 'excel' ? 'Exporting\u2026' : 'Export Excel'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting === 'pdf'}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            <FileText size={16} /> {exporting === 'pdf' ? 'Exporting\u2026' : 'Export PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
