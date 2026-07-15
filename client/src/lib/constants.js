export const REQUIRED_ITEMS = [
  { key: 'visa_appointment', label: 'Visa Appointment' },
  { key: 'visa_application_form', label: 'Visa Application Form' },
  { key: 'invitation_letter', label: 'Invitation Letter' },
  { key: 'travel_ticket', label: 'Travel Ticket' },
  { key: 'travel_insurance', label: 'Travel Insurance' },
  { key: 'bank_statement', label: 'Bank Statement' },
  { key: 'eaf_letter', label: 'EAF Letter' },
];

// Full literal class strings (not built via template-literal interpolation) -
// Tailwind's content scanner matches raw text, so bg-${color} would never be
// picked up at build time. Every class the app can render must appear here
// as a complete, literal string.
export const STATUS_META = {
  new: { label: 'New', dot: 'bg-status-new', text: 'text-status-new', soft: 'bg-status-new/15' },
  preparing_documents: { label: 'Preparing Documents', dot: 'bg-status-preparing', text: 'text-status-preparing', soft: 'bg-status-preparing/15' },
  in_progress: { label: 'In Progress', dot: 'bg-status-progress', text: 'text-status-progress', soft: 'bg-status-progress/15' },
  almost_ready: { label: 'Almost Ready', dot: 'bg-status-almost', text: 'text-status-almost', soft: 'bg-status-almost/15' },
  ready_for_travel: { label: 'Ready for Travel', dot: 'bg-status-ready', text: 'text-status-ready', soft: 'bg-status-ready/15' },
};

export const PRIORITY_META = {
  high: { label: 'High', color: 'text-status-action' },
  medium: { label: 'Medium', color: 'text-accent-dark' },
  low: { label: 'Low', color: 'text-primary-500' },
};
