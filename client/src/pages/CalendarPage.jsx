import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Stamp, PlaneTakeoff, PlaneLanding } from 'lucide-react';
import { calendarApi } from '../api/calendarApi.js';

const EVENT_META = {
  departure: { label: 'Departure', icon: PlaneTakeoff, color: 'bg-status-progress' },
  return: { label: 'Return', icon: PlaneLanding, color: 'bg-primary-500' },
  visa_appointment: { label: 'Visa Appointment', icon: Stamp, color: 'bg-accent' },
};

function toISODate(d) { return d.toISOString().slice(0, 10); }

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await calendarApi.events(toISODate(monthStart), toISODate(monthEnd));
      setEvents(data);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  useEffect(() => { load(); }, [load]);

  const eventsByDate = {};
  for (const e of events) {
    (eventsByDate[e.date] ||= []).push(e);
  }

  const daysInMonth = monthEnd.getDate();
  const leadingBlanks = monthStart.getDay();
  const cells = [...Array(leadingBlanks).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink dark:text-ink-dark">
          {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="rounded-lg border border-slate-300 dark:border-slate-600 p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCursor(new Date())} className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">Today</button>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="rounded-lg border border-slate-300 dark:border-slate-600 p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-4 text-xs text-slate-500">
        {Object.entries(EVENT_META).map(([key, meta]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${meta.color}`} /> {meta.label}
          </span>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const dateStr = toISODate(new Date(cursor.getFullYear(), cursor.getMonth(), day));
            const dayEvents = eventsByDate[dateStr] || [];
            const isToday = dateStr === toISODate(new Date());
            return (
              <div key={idx} className={`min-h-24 rounded-lg border p-1.5 ${isToday ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/20' : 'border-slate-100 dark:border-slate-800'}`}>
                <p className={`mb-1 text-xs font-medium ${isToday ? 'text-primary-700 dark:text-primary-300' : 'text-slate-400'}`}>{day}</p>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((e, i) => {
                    const meta = EVENT_META[e.type];
                    return (
                      <Link
                        key={i}
                        to={`/athletes/${e.athleteId}`}
                        className={`block truncate rounded px-1 py-0.5 text-[10px] font-medium text-white ${meta.color}`}
                        title={e.title}
                      >
                        {e.title}
                      </Link>
                    );
                  })}
                  {dayEvents.length > 3 && <p className="text-[10px] text-slate-400">+{dayEvents.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {loading && <p className="text-xs text-slate-400">Loading events\u2026</p>}
    </div>
  );
}
