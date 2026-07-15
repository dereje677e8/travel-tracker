/**
 * The app's signature visual flourish: a departure-board-style countdown,
 * tying the UI back to the subject (airports/travel) rather than a generic badge.
 */
export default function CountdownChip({ days }) {
  if (days === null || days === undefined) return null;
  const urgent = days <= 7;
  const label = days < 0 ? 'DEPARTED' : days === 0 ? 'TODAY' : `${days}D`;
  return (
    <span
      className={`flip-digits inline-block rounded-md border px-2 py-0.5 text-xs font-semibold
        ${urgent ? 'border-status-action/40 bg-status-action/10 text-status-action' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}
    >
      {label}
    </span>
  );
}
