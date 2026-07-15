import { PRIORITY_META } from '../../lib/constants.js';

export default function PriorityBadge({ priority }) {
  const meta = PRIORITY_META[priority] || { label: priority, color: 'text-ink' };
  return <span className={`text-xs font-semibold uppercase tracking-wide ${meta.color}`}>{meta.label}</span>;
}
