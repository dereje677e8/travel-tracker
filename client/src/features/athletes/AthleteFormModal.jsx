import { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';
import { athleteApi } from '../../api/athleteApi.js';
import { usersApi } from '../../api/usersApi.js';

const EMPTY = {
  fullName: '', gender: 'female', dateOfBirth: '', passportNumber: '', passportExpirationDate: '',
  sport: '', teamFederation: '', destinationCountry: '', destinationCity: '', competitionName: '',
  purposeOfTravel: 'Competition', visaType: '', embassy: '', departureDate: '', returnDate: '',
  assignedOfficerId: '', priority: 'medium', notes: '',
};

const FIELDS = [
  ['fullName', 'Full Name', 'text', true],
  ['gender', 'Gender', 'select-gender', true],
  ['dateOfBirth', 'Date of Birth', 'date', true],
  ['passportNumber', 'Passport Number', 'text', true],
  ['passportExpirationDate', 'Passport Expiration Date', 'date', false],
  ['sport', 'Sport', 'text', true],
  ['teamFederation', 'Team / Federation', 'text', false],
  ['destinationCountry', 'Destination Country', 'text', true],
  ['destinationCity', 'Destination City', 'text', false],
  ['competitionName', 'Competition / Event Name', 'text', true],
  ['purposeOfTravel', 'Purpose of Travel', 'text', false],
  ['visaType', 'Visa Type', 'text', false],
  ['embassy', 'Embassy', 'text', false],
  ['departureDate', 'Departure Date', 'date', true],
  ['returnDate', 'Return Date', 'date', true],
  ['assignedOfficerId', 'Assigned Officer', 'select-officer', false],
  ['priority', 'Priority', 'select-priority', true],
];

// Shared by edit-prefill and duplicate-prefill - same source athlete shape,
// different destination (update vs create).
function fieldsFromAthlete(source) {
  return {
    fullName: source.full_name, gender: source.gender, dateOfBirth: source.date_of_birth,
    passportNumber: source.passport_number, passportExpirationDate: source.passport_expiration_date || '',
    sport: source.sport, teamFederation: source.team_federation || '',
    destinationCountry: source.destination_country, destinationCity: source.destination_city || '',
    competitionName: source.competition_name, purposeOfTravel: source.purpose_of_travel || '',
    visaType: source.visa_type || '', embassy: source.embassy || '',
    departureDate: source.departure_date, returnDate: source.return_date,
    assignedOfficerId: source.assigned_officer_id || '',
    priority: source.priority, notes: source.notes || '',
  };
}

/**
 * athlete: full athlete record -> edit mode (PATCH on submit).
 * duplicateFrom: full athlete record -> create mode, pre-filled from it.
 * Neither -> blank create mode.
 */
export default function AthleteFormModal({ open, onClose, onSaved, athlete, duplicateFrom }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [officers, setOfficers] = useState([]);

  useEffect(() => {
    if (!open) return;
    // Directory is available to any authenticated user (staff included) -
    // it's a separate, minimal endpoint from the admin-only /users list.
    usersApi.directory().then(setOfficers).catch(() => setOfficers([]));
  }, [open]);

  useEffect(() => {
    if (athlete) {
      setForm(fieldsFromAthlete(athlete));
    } else if (duplicateFrom) {
      // Everything carries over except identity - the whole point is "same
      // trip/team, slightly different person or dates," and the person
      // editing can change whatever doesn't apply (most often the name,
      // passport, and dates for a different athlete on the same trip).
      setForm(fieldsFromAthlete(duplicateFrom));
    } else {
      setForm(EMPTY);
    }
    setErrors({});
    setServerError(null);
  }, [athlete, duplicateFrom, open]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setServerError(null);
    setErrors({});
    try {
      // assignedOfficerId comes off a <select> as a string ('' when unset) -
      // the API expects a positive integer or null, not an empty string.
      // Same for passportExpirationDate - '' should mean "not set", not a
      // literal empty-string date.
      const payload = {
        ...form,
        assignedOfficerId: form.assignedOfficerId ? Number(form.assignedOfficerId) : null,
        passportExpirationDate: form.passportExpirationDate || null,
      };
      if (athlete) {
        await athleteApi.update(athlete.id, payload);
        onSaved();
      } else {
        const result = await athleteApi.create(payload);
        onSaved(result);
      }
      onClose();
    } catch (err) {
      if (err.fields) setErrors(err.fields);
      else setServerError(err.message || 'Failed to save athlete');
    } finally {
      setSubmitting(false);
    }
  }

  const title = athlete ? 'Edit Athlete' : duplicateFrom ? 'Duplicate Athlete' : 'Add Athlete';

  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && <div className="rounded-lg bg-status-action/10 px-3 py-2 text-sm text-status-action">{serverError}</div>}

        {duplicateFrom && (
          <div className="flex items-center gap-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 px-3 py-2 text-sm text-primary-700 dark:text-primary-300">
            <Copy size={15} />
            Pre-filled from {duplicateFrom.full_name} \u2014 review and edit before saving as a new athlete.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.map(([key, label, type, required]) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                {label}{required && <span className="text-status-action"> *</span>}
              </label>
              {type === 'select-gender' ? (
                <select value={form[key]} onChange={(e) => update(key, e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm">
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              ) : type === 'select-priority' ? (
                <select value={form[key]} onChange={(e) => update(key, e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              ) : type === 'select-officer' ? (
                <select value={form[key]} onChange={(e) => update(key, e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm">
                  <option value="">Unassigned</option>
                  {officers.map((o) => (
                    <option key={o.id} value={o.id}>{o.full_name} ({o.role === 'administrator' ? 'Admin' : 'Staff'})</option>
                  ))}
                </select>
              ) : (
                <input
                  type={type}
                  required={required}
                  value={form[key]}
                  onChange={(e) => update(key, e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              )}
              {errors[key] && <p className="mt-1 text-xs text-status-action">{errors[key]}</p>}
            </div>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Notes</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            {submitting ? 'Saving\u2026' : athlete ? 'Save Changes' : duplicateFrom ? 'Save as New Athlete' : 'Add Athlete'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
