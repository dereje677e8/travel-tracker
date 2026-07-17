import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Trash2, Send, Copy, PlaneTakeoff, PlaneLanding,
  Building2, CreditCard, UserRound, StickyNote, MapPin, Home, Users as UsersIcon, Fingerprint,
} from 'lucide-react';
import { athleteApi } from '../api/athleteApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocketEvent } from '../hooks/useSocketEvent.js';
import { useAuthedImage } from '../hooks/useAuthedImage.js';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import PriorityBadge from '../components/ui/PriorityBadge.jsx';
import ProgressRing from '../components/ui/ProgressRing.jsx';
import CountdownChip from '../components/ui/CountdownChip.jsx';
import RequirementChecklist from '../features/athletes/RequirementChecklist.jsx';
import AthleteFormModal from '../features/athletes/AthleteFormModal.jsx';
import NotifyModal from '../features/athletes/NotifyModal.jsx';
import { formatDate, isPassportExpiringSoon } from '../lib/formatters.js';

function initials(name) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

const MARITAL_LABELS = { single: 'Single', married: 'Married', divorced: 'Divorced', widowed: 'Widowed', other: 'Other' };

// Small "info card" used in the grid below the hero - icon + label + value,
// consistent shape whether the content is one line or two.
function InfoCard({ icon: Icon, label, children, warn }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark p-4">
      <div className="mb-2 flex items-center gap-2 text-slate-400">
        <Icon size={15} />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className={warn ? 'text-status-action' : 'text-ink dark:text-ink-dark'}>{children}</div>
    </div>
  );
}

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

  const athlete = detail?.athlete;
  const photoUrl = useAuthedImage(athlete?.photo_path ? athleteApi.photoPath(athlete.id) : null);

  async function handleDelete() {
    if (!window.confirm('Remove this athlete record? This cannot be undone.')) return;
    await athleteApi.remove(id);
    navigate('/athletes');
  }

  if (loading) return <div className="text-slate-400">Loading athlete\u2026</div>;
  if (error) return <div className="text-status-action">{error}</div>;
  if (!detail) return null;

  const { requirements, activity, daysUntilDeparture } = detail;
  const passportWarn = isPassportExpiringSoon(athlete.passport_expiration_date);
  const placeOfBirth = [athlete.place_of_birth_city, athlete.place_of_birth_province, athlete.place_of_birth_country]
    .filter(Boolean).join(', ');

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

      {/* Hero card - photo + identity + readiness ring up top, ticket-stub style trip strip below */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark">
        <div className="flex flex-wrap items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-4">
            {photoUrl ? (
              <img src={photoUrl} alt={athlete.full_name} className="h-20 w-16 shrink-0 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-lg font-bold text-white">
                {initials(athlete.full_name)}
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{athlete.athlete_code}</p>
              <h1 className="text-2xl font-bold text-ink dark:text-ink-dark">{athlete.full_name}</h1>
              <p className="mt-0.5 text-sm text-slate-500">{athlete.sport} \u2022 {athlete.team_federation || 'Unaffiliated'}</p>
              <div className="mt-2 flex items-center gap-2">
                <PriorityBadge priority={athlete.priority} />
                <StatusBadge status={athlete.status} />
              </div>
            </div>
          </div>
          <ProgressRing percent={athlete.progress_percent} />
        </div>

        {/* Ticket-stub trip strip */}
        <div className="relative border-t border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/60 dark:bg-slate-800/30 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <PlaneTakeoff size={18} className="text-primary-600" />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Departs</p>
                <p className="text-sm font-semibold text-ink dark:text-ink-dark">{formatDate(athlete.departure_date)}</p>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center gap-2 min-w-[140px]">
              <div className="h-px flex-1 border-t-2 border-dotted border-slate-300 dark:border-slate-600" />
              <span className="rounded-full bg-primary-50 dark:bg-primary-900/40 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 whitespace-nowrap">
                {athlete.destination_city ? `${athlete.destination_city}, ` : ''}{athlete.destination_country}
              </span>
              <div className="h-px flex-1 border-t-2 border-dotted border-slate-300 dark:border-slate-600" />
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Returns</p>
                <p className="text-sm font-semibold text-ink dark:text-ink-dark">{formatDate(athlete.return_date)}</p>
              </div>
              <PlaneLanding size={18} className="text-primary-600" />
            </div>

            <CountdownChip days={daysUntilDeparture} />
          </div>
        </div>
      </div>

      {/* Info card grid - travel logistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={Building2} label="Competition">
          <p className="text-sm font-medium">{athlete.competition_name}</p>
          <p className="mt-0.5 text-xs text-slate-500">{athlete.visa_type || 'Visa type TBD'} \u2022 {athlete.embassy || 'Embassy TBD'}</p>
        </InfoCard>

        <InfoCard icon={CreditCard} label="Passport" warn={passportWarn}>
          <p className="text-sm font-medium">{athlete.passport_number}</p>
          <p className={`mt-0.5 text-xs ${passportWarn ? 'font-semibold' : 'text-slate-500'}`}>
            {athlete.passport_expiration_date
              ? `Expires ${formatDate(athlete.passport_expiration_date)}${passportWarn ? ' \u2014 renew soon' : ''}`
              : 'Expiration date not on file'}
          </p>
          {athlete.passport_issue_date && (
            <p className="mt-0.5 text-xs text-slate-500">Issued {formatDate(athlete.passport_issue_date)}{athlete.passport_issue_place ? ` \u2014 ${athlete.passport_issue_place}` : ''}</p>
          )}
        </InfoCard>

        <InfoCard icon={UserRound} label="Assigned Officer">
          <p className="text-sm font-medium">{athlete.assigned_officer_name || 'Unassigned'}</p>
          <p className="mt-0.5 text-xs text-slate-500">{athlete.purpose_of_travel || 'Purpose not specified'}</p>
        </InfoCard>

        <InfoCard icon={StickyNote} label="Notes">
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{athlete.notes || 'No notes on file.'}</p>
        </InfoCard>
      </div>

      {/* Registration / biodata card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink dark:text-ink-dark">Registration Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-2.5">
            <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Place of Birth</p>
              <p className="text-sm text-ink dark:text-ink-dark">{placeOfBirth || '\u2014'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Home size={16} className="mt-0.5 shrink-0 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Current Address</p>
              <p className="text-sm text-ink dark:text-ink-dark">{athlete.current_address || '\u2014'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <UsersIcon size={16} className="mt-0.5 shrink-0 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Marital Status</p>
              <p className="text-sm text-ink dark:text-ink-dark">{MARITAL_LABELS[athlete.marital_status] || '\u2014'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Fingerprint size={16} className="mt-0.5 shrink-0 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">National ID</p>
              <p className="text-sm text-ink dark:text-ink-dark">{athlete.national_id || '\u2014'}</p>
            </div>
          </div>
        </div>
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
