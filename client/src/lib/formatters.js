export function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date(new Date().toDateString());
  return Math.ceil((target - today) / 86400000);
}

export function isPassportExpiringSoon(expirationDate) {
  if (!expirationDate) return false;
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  return new Date(expirationDate + 'T00:00:00') <= sixMonthsFromNow;
}
