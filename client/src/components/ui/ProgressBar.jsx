export default function ProgressBar({ percent, size = 'md' }) {
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';
  const color = percent >= 100 ? 'bg-status-ready' : percent >= 41 ? 'bg-primary-500' : 'bg-accent';
  return (
    <div className="w-full">
      <div className={`w-full rounded-full bg-slate-200 dark:bg-slate-700 ${height}`}>
        <div
          className={`${height} rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}
