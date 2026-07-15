import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { activityLogApi } from '../api/activityLogApi.js';
import { useSocketEvent } from '../hooks/useSocketEvent.js';

export default function ActivityLogPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setEntries(await activityLogApi.recent(100));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useSocketEvent('athlete:created', load);
  useSocketEvent('athlete:updated', load);
  useSocketEvent('requirement:updated', load);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark p-5">
      <h2 className="mb-4 text-sm font-semibold text-ink dark:text-ink-dark">Full Activity Log</h2>
      {loading && <p className="text-sm text-slate-400">Loading\u2026</p>}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {!loading && entries.length === 0 && <p className="py-2 text-sm text-slate-400">No activity recorded yet.</p>}
        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between py-3 text-sm">
            <div>
              <span className="font-medium text-ink dark:text-ink-dark">{e.user_name || 'System'}</span>{' '}
              <span className="text-slate-500">{e.action.replace(/_/g, ' ').replace(/\./g, ' \u2192 ')}</span>
              {e.entity_type === 'athlete' && (
                <>
                  {' '}\u2014 <Link to={`/athletes/${e.entity_id}`} className="text-primary-600 hover:underline">view athlete</Link>
                </>
              )}
            </div>
            <span className="shrink-0 text-xs text-slate-400">{new Date(e.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
