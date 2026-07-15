import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, SlidersHorizontal } from 'lucide-react';
import { useAthletes } from '../hooks/useAthletes.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocketEvent } from '../hooks/useSocketEvent.js';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import PriorityBadge from '../components/ui/PriorityBadge.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import AthleteFormModal from '../features/athletes/AthleteFormModal.jsx';
import { formatDate } from '../lib/formatters.js';

const FILTER_PRESETS = [
  { value: '', label: 'All' },
  { value: 'ready_for_travel', label: 'Ready for Travel' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'new', label: 'Action Required' },
];

const MISSING_PRESETS = [
  { value: '', label: 'Any' },
  { value: 'visa_appointment', label: 'Missing Visa Appointment' },
  { value: 'invitation_letter', label: 'Missing Invitation Letter' },
  { value: 'travel_ticket', label: 'Missing Ticket' },
  { value: 'travel_insurance', label: 'Missing Insurance' },
  { value: 'bank_statement', label: 'Missing Bank Statement' },
  { value: 'eaf_letter', label: 'Missing EAF Letter' },
];

export default function AthletesListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [missing, setMissing] = useState('');
  const [travelWindow, setTravelWindow] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const params = useMemo(() => ({
    page, limit: 20, search: search || undefined, status: status || undefined,
    missing: missing || undefined, travelWindow: travelWindow || undefined,
  }), [page, search, status, missing, travelWindow]);

  const { data, meta, loading, error, refetch } = useAthletes(params);
  useSocketEvent('athlete:created', refetch);
  useSocketEvent('athlete:updated', refetch);
  useSocketEvent('requirement:updated', refetch);
  useSocketEvent('athlete:deleted', refetch);

  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, passport, sport, competition\u2026"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-surface dark:bg-surface-dark py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <Plus size={16} /> Add Athlete
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark p-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm">
              {FILTER_PRESETS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Missing Requirement</label>
            <select value={missing} onChange={(e) => { setMissing(e.target.value); setPage(1); }} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm">
              {MISSING_PRESETS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Travel Window</label>
            <select value={travelWindow} onChange={(e) => { setTravelWindow(e.target.value); setPage(1); }} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm">
              <option value="">Any time</option>
              <option value="week">Travel This Week</option>
              <option value="month">Travel This Month</option>
            </select>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Athlete</th>
              <th className="px-4 py-3">Sport</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Departure</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading athletes\u2026</td></tr>
            )}
            {error && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-status-action">{error}</td></tr>
            )}
            {!loading && !error && data.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No athletes match these filters.</td></tr>
            )}
            {!loading && data.map((a) => (
              <tr
                key={a.id}
                onClick={() => navigate(`/athletes/${a.id}`)}
                className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-ink dark:text-ink-dark">{a.full_name}</p>
                  <p className="text-xs text-slate-400">{a.athlete_code}</p>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.sport}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.destination_country}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(a.departure_date)}</td>
                <td className="px-4 py-3"><PriorityBadge priority={a.priority} /></td>
                <td className="px-4 py-3 w-32">
                  <div className="flex items-center gap-2">
                    <ProgressBar percent={a.progress_percent} size="sm" />
                    <span className="text-xs tabular-nums text-slate-500">{a.progress_percent}%</span>
                  </div>
                </td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">
            Showing page {meta.page} of {totalPages} ({meta.total} total)
          </p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 disabled:opacity-40">Prev</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      <AthleteFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={refetch} athlete={null} />
    </div>
  );
}
