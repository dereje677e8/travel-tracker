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

export function formatAppointmentTime(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':');
  const hour = Number(h);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${period}`;
}
