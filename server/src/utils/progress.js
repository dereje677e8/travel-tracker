/**
 * Single source of truth for progress % and status derivation, per the
 * spec's thresholds. Both the API and any reports must call these
 * rather than recompute the logic inline, so the rules can't drift.
 */
export const REQUIRED_ITEMS = [
  'visa_appointment',
  'visa_application_form',
  'invitation_letter',
  'travel_ticket',
  'travel_insurance',
  'bank_statement',
  'eaf_letter',
];

export function calculateProgress(requirements) {
  const total = REQUIRED_ITEMS.length;
  const completed = requirements.filter((r) => r.status === 'completed').length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

export function deriveStatus(percent) {
  if (percent === 0) return 'new';
  if (percent <= 40) return 'preparing_documents';
  if (percent <= 80) return 'in_progress';
  if (percent <= 99) return 'almost_ready';
  return 'ready_for_travel';
}

export const STATUS_LABELS = {
  new: 'New',
  preparing_documents: 'Preparing Documents',
  in_progress: 'In Progress',
  almost_ready: 'Almost Ready',
  ready_for_travel: 'Ready for Travel',
};
