import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, CheckCircle2, Clock, AlertTriangle, PlaneTakeoff, Stamp, ShieldAlert } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { dashboardApi } from '../api/dashboardApi.js';
import StatCard from '../components/ui/StatCard.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import CountdownChip from '../components/ui/CountdownChip.jsx';
import { formatDate, daysUntil, formatAppointmentTime } from '../lib/formatters.js';
import { useSocketEvent } from '../hooks/useSocketEvent.js';

const STATUS_COLORS = {
  new: '#94A3B8',
  preparing_documents: '#F59E0B',
  in_progress: '#3B82F6',
  almost_ready: '#8B5CF6',
  ready_for_travel: '#10B981',
};

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await dashboardApi.summary();
      setSummary(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  // Real-time: any athlete/requirement mutation elsewhere refreshes the dashboard.
  useSocketEvent('athlete:created', load);
  useSocketEvent('athlete:updated', load);
  useSocketEvent('requirement:updated', load);

  if (loading) return <div className="text-slate-400">Loading dashboard\u2026</div>;
  if (!summary) return null;

  const { totals, byDestination, upcomingDepartures, upcomingVisaAppointments, passportsExpiringSoon, recentUpdates, progressBuckets } = summary;

  const pieData = progressBuckets.map((b) => ({ name: b.status, value: b.count, color: STATUS_COLORS[b.status] }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Total Athletes" value={totals.totalAthletes} icon={Users} />
        <StatCard label="Ready for Travel" value={totals.readyForTravel} icon={CheckCircle2} accentColor="text-status-ready" />
        <StatCard label="In Progress" value={totals.inProgress} icon={Clock} accentColor="text-primary-600" />
        <StatCard label="Action Required" value={totals.actionRequired} icon={AlertTriangle} accentColor="text-status-action" />
        <StatCard label="Traveling This Week" value={totals.travelingThisWeek} icon={PlaneTakeoff} accentColor="text-accent-dark" />
        <StatCard label="Passports Expiring" value={totals.passportsExpiringSoon} icon={ShieldAlert} accentColor="text-status-action" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Progress chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink dark:text-ink-dark">Progress Overview</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* By destination */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-ink dark:text-ink-dark">Athletes by Destination</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byDestination}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="destination_country" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0E7C86" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Upcoming departures - flight-board styled */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Upcoming Departures</h2>
            <Link to="/athletes" className="text-xs font-medium text-primary-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {upcomingDepartures.length === 0 && <p className="text-sm text-slate-400">No upcoming departures.</p>}
            {upcomingDepartures.map((a) => (
              <Link
                key={a.id}
                to={`/athletes/${a.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flip-digits text-xs text-slate-400 w-16">{a.athlete_code}</span>
                  <div>
                    <p className="text-sm font-medium text-ink dark:text-ink-dark">{a.full_name}</p>
                    <p className="text-xs text-slate-500">{a.destination_country} \u2022 {formatDate(a.departure_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={a.status} />
                  <CountdownChip days={daysUntil(a.departure_date)} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming visa appointments */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark p-5">
          <div className="mb-3 flex items-center gap-2">
            <Stamp size={16} className="text-accent-dark" />
            <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Upcoming Visa Appointments</h2>
          </div>
          <div className="space-y-2">
            {upcomingVisaAppointments.length === 0 && <p className="text-sm text-slate-400">None pending.</p>}
            {upcomingVisaAppointments.map((v) => (
              <Link key={v.id} to={`/athletes/${v.id}`} className="block rounded-xl border border-slate-100 dark:border-slate-800 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <p className="text-sm font-medium text-ink dark:text-ink-dark">{v.full_name}</p>
                <p className="text-xs text-slate-500">{formatDate(v.appointment_date)}{v.appointment_time ? ` \u2022 ${formatAppointmentTime(v.appointment_time)}` : ''} \u2022 {v.embassy || 'Embassy TBD'}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Passports expiring soon */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark p-5">
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert size={16} className="text-status-action" />
            <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Passports Expiring Soon</h2>
          </div>
          <p className="mb-2 text-xs text-slate-400">Within 6 months, or already expired.</p>
          <div className="space-y-2">
            {passportsExpiringSoon.length === 0 && <p className="text-sm text-slate-400">None flagged.</p>}
            {passportsExpiringSoon.map((p) => (
              <Link key={p.id} to={`/athletes/${p.id}`} className="block rounded-xl border border-slate-100 dark:border-slate-800 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <p className="text-sm font-medium text-ink dark:text-ink-dark">{p.full_name}</p>
                <p className="text-xs font-medium text-status-action">Expires {formatDate(p.passport_expiration_date)}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent updates */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink dark:text-ink-dark">Recent Updates</h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentUpdates.length === 0 && <p className="py-2 text-sm text-slate-400">No recent activity.</p>}
          {recentUpdates.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-ink dark:text-ink-dark">
                <span className="font-medium">{u.user_name || 'System'}</span>{' '}
                <span className="text-slate-500">{u.action.replace(/_/g, ' ').replace(/\./g, ' \u2192 ')}</span>
                {u.athlete_name && <span className="text-slate-500"> \u2014 {u.athlete_name}</span>}
              </span>
              <span className="shrink-0 text-xs text-slate-400">{new Date(u.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
