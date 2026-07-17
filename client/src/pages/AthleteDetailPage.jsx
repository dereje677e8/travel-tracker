import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Send, Plane, Building2, CreditCard, Copy } from 'lucide-react';
import { athleteApi } from '../api/athleteApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocketEvent } from '../hooks/useSocketEvent.js';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import PriorityBadge from '../components/ui/PriorityBadge.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import CountdownChip from '../components/ui/CountdownChip.jsx';
import RequirementChecklist from '../features/athletes/RequirementChecklist.jsx';
import AthleteFormModal from '../features/athletes/AthleteFormModal.jsx';
import NotifyModal from '../features/athletes/NotifyModal.jsx';
import { formatDate, isPassportExpiringSoon } from '../lib/formatters.js';

export default function AthleteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await athleteApi.detail(id);
      setDetail(data);
    } catch (err) {
      setError(err.message || 'Failed to load athlete');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useSocketEvent('requirement:updated', (payload) => {
    if (String(payload.athleteId) === String(id)) load();
  });
  useSocketEvent('athlete:updated', (payload) => {
    if (String(payload.id) === String(id)) load();
  });

  async function handleDelete() {
    if (!window.confirm('Remove this athlete record? This cannot be undone.')) return;
    await athleteApi.remove(id);
    navigate('/athletes');
  }

  if (loading) return <div className="text-slate-400">Loading athlete\u2026</div>;
  if (error) return <div className="text-status-action">{error}</div>;
  if (!detail) return null;

  const { athlete, requirements, activity, daysUntilDeparture } = detail;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/athletes" className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary-600">
          <ArrowLeft size={16} /> Back to Athletes
        </Link>
        <div className="flex gap-2">
          <button onClick={() => setNotifyOpen(true)} className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Send size={15} /> Notify
          </button>
          <button onClick={() => setEditOpen(true)} className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Pencil size={15} /> Edit
          </button>
          <button onClick={() => setDuplicateOpen(true)} className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Copy size={15} /> Duplicate
          </button>
          {user?.role === 'administrator' && (
            <button onClick={handleDelete} className="flex items-center gap-2 rounded-lg border border-status-action/30 px-3 py-2 text-sm font-medium text-status-action hover:bg-status-action/5">
              <Trash2 size={15} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{athlete.athlete_code}</p>
            <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">{athlete.full_name}</h1>
            <p className="mt-1 text-sm text-slate-500">{athlete.sport} \u2022 {athlete.team_federation || 'Unaffiliated'}</p>
          </div>
          <div className="flex items-center gap-3">
            <PriorityBadge priority={athlete.priority} />
            <StatusBadge status={athlete.status} />
            <CountdownChip days={daysUntilDeparture} />
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Travel Readiness</span>
            <span className="tabular-nums font-semibold text-ink dark:text-ink-dark">{athlete.progress_percent}%</span>
          </div>
          <ProgressBar percent={athlete.progress_percent} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <Plane size={18} className="mt-0.5 text-primary-600" />
            <div>
              <p className="text-xs text-slate-400">Destination</p>
              <p className="text-sm font-medium text-ink dark:text-ink-dark">{athlete.destination_city ? `${athlete.destination_city}, ` : ''}{athlete.destination_country}</p>
              <p className="text-xs text-slate-500">{formatDate(athlete.departure_date)} \u2192 {formatDate(athlete.return_date)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Building2 size={18} className="mt-0.5 text-primary-600" />
            <div>
              <p className="text-xs text-slate-400">Competition</p>
              <p className="text-sm font-medium text-ink dark:text-ink-dark">{athlete.competition_name}</p>
              <p className="text-xs text-slate-500">{athlete.visa_type || 'Visa type TBD'} \u2022 {athlete.embassy || 'Embassy TBD'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CreditCard size={18} className="mt-0.5 text-primary-600" />
            <div>
              <p className="text-xs text-slate-400">Passport</p>
              <p className="text-sm font-medium text-ink dark:text-ink-dark">{athlete.passport_number}</p>
              <p className={`text-xs ${isPassportExpiringSoon(athlete.passport_expiration_date) ? 'font-semibold text-status-action' : 'text-slate-500'}`}>
                {athlete.passport_expiration_date
                  ? `Expires ${formatDate(athlete.passport_expiration_date)}${isPassportExpiringSoon(athlete.passport_expiration_date) ? ' \u2014 renew soon' : ''}`
                  : 'Expiration date not on file'}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-400">Assigned Officer: {athlete.assigned_officer_name || 'Unassigned'}</p>

        {athlete.notes && (
          <div className="mt-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-sm text-slate-600 dark:text-slate-300">
            {athlete.notes}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Requirements checklist */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark p-5">
          <h2 className="mb-1 text-sm font-semibold text-ink dark:text-ink-dark">Travel Requirements</h2>
          <p className="mb-2 text-xs text-slate-400">Tracking only \u2014 no documents are uploaded or stored here.</p>
          <RequirementChecklist athleteId={athlete.id} requirements={requirements} onChanged={load} />
        </div>

        {/* Activity history */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink dark:text-ink-dark">Activity History</h2>
          <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
            {activity.length === 0 && <p className="text-sm text-slate-400">No activity recorded yet.</p>}
            {activity.map((a) => (
              <div key={a.id} className="border-l-2 border-primary-200 dark:border-primary-800 pl-3">
                <p className="text-sm text-ink dark:text-ink-dark">
                  <span className="font-medium">{a.user_name || 'System'}</span>{' '}
                  <span className="text-slate-500">{a.action.replace(/_/g, ' ').replace(/\./g, ' \u2192 ')}</span>
                </p>
                <p className="text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AthleteFormModal open={editOpen} onClose={() => setEditOpen(false)} onSaved={load} athlete={athlete} />
      <AthleteFormModal
        open={duplicateOpen}
        onClose={() => setDuplicateOpen(false)}
        onSaved={(result) => navigate(result?.id ? `/athletes/${result.id}` : '/athletes')}
        athlete={null}
        duplicateFrom={duplicateOpen ? athlete : null}
      />
      <NotifyModal open={notifyOpen} onClose={() => setNotifyOpen(false)} athleteId={athlete.id} />
    </div>
  );
}
