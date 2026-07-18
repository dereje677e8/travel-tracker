import { useState } from 'react';
import { Check, CalendarClock } from 'lucide-react';
import { REQUIRED_ITEMS } from '../../lib/constants.js';
import { athleteApi } from '../../api/athleteApi.js';
import { formatDate } from '../../lib/formatters.js';

export default function RequirementChecklist({ athleteId, requirements, onChanged }) {
  const [savingKey, setSavingKey] = useState(null);
  const byKey = Object.fromEntries(requirements.map((r) => [r.requirement_key, r]));

  async function toggle(key, current) {
    setSavingKey(key);
    try {
      // Preserve the current appointment date/time on a simple status toggle -
      // updateRequirementRow only overwrites them when explicitly sent.
      await athleteApi.updateRequirement(athleteId, key, {
        status: current === 'completed' ? 'pending' : 'completed',
      });
      onChanged();
    } finally {
      setSavingKey(null);
    }
  }

  // patch is a partial { appointmentDate, appointmentTime } - only the
  // field that actually changed is included, so the other stays as-is.
  async function setAppointment(key, currentStatus, patch) {
    setSavingKey(key);
    try {
      await athleteApi.updateRequirement(athleteId, key, { status: currentStatus, ...patch });
      onChanged();
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {REQUIRED_ITEMS.map(({ key, label }) => {
        const req = byKey[key] || { status: 'pending' };
        const completed = req.status === 'completed';
        const isAppointment = key === 'visa_appointment';
        return (
          <div key={key} className="flex items-center justify-between py-3 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => toggle(key, req.status)}
                disabled={savingKey === key}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors
                  ${completed ? 'border-status-ready bg-status-ready text-white' : 'border-slate-300 dark:border-slate-600'}
                  disabled:opacity-50`}
                aria-label={`Mark ${label} ${completed ? 'pending' : 'completed'}`}
              >
                {completed && <Check size={14} strokeWidth={3} />}
              </button>
              <div className="min-w-0">
                <p className={`text-sm font-medium ${completed ? 'text-ink dark:text-ink-dark' : 'text-slate-600 dark:text-slate-300'}`}>{label}</p>
                {completed && req.date_completed && (
                  <p className="text-xs text-slate-400">Completed {formatDate(req.date_completed)}</p>
                )}
                {!completed && isAppointment && (
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <CalendarClock size={13} className="shrink-0 text-slate-400" />
                    <input
                      type="date"
                      value={req.appointment_date || ''}
                      disabled={savingKey === key}
                      onChange={(e) => setAppointment(key, req.status, { appointmentDate: e.target.value || null })}
                      className="rounded border border-slate-300 dark:border-slate-600 bg-transparent px-1.5 py-0.5 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-50"
                      aria-label="Visa appointment date"
                    />
                    <input
                      type="time"
                      value={req.appointment_time ? req.appointment_time.slice(0, 5) : ''}
                      disabled={savingKey === key}
                      onChange={(e) => setAppointment(key, req.status, { appointmentTime: e.target.value || null })}
                      className="rounded border border-slate-300 dark:border-slate-600 bg-transparent px-1.5 py-0.5 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-50"
                      aria-label="Visa appointment time"
                    />
                    {req.appointment_date && (
                      <span className="text-xs text-slate-400 w-full sm:w-auto">
                        A reminder emails the assigned officer the day before.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <span className={`shrink-0 text-xs font-semibold uppercase tracking-wide ${completed ? 'text-status-ready' : 'text-status-preparing'}`}>
              {completed ? 'Completed' : 'Pending'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
