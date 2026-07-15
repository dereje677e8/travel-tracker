export default function StatCard({ label, value, icon: Icon, accentColor = 'text-primary-600' }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-ink dark:text-ink-dark">{value}</p>
        </div>
        {Icon && (
          <div className={`rounded-xl bg-primary-50 dark:bg-primary-900/40 p-2.5 ${accentColor}`}>
            <Icon size={20} strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
}
