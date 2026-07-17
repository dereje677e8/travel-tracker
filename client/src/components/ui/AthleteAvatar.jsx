import { athleteApi } from '../../api/athleteApi.js';
import { useAuthedImage } from '../../hooks/useAuthedImage.js';

function initials(name) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function AthleteAvatar({ athleteId, hasPhoto, fullName, size = 36 }) {
  const photoUrl = useAuthedImage(hasPhoto ? athleteApi.photoPath(athleteId) : null);

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={fullName}
        className="shrink-0 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
        style={{ width: size, height: size * 1.15 }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40 text-xs font-bold text-primary-700 dark:text-primary-300"
      style={{ width: size, height: size * 1.15 }}
    >
      {initials(fullName)}
    </div>
  );
}
