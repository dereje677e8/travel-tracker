import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal.jsx';
import { athleteApi } from '../../api/athleteApi.js';
import { usersApi } from '../../api/usersApi.js';

const EMPTY = {
  fullName: '', gender: 'female', dateOfBirth: '', passportNumber: '', sport: '',
  teamFederation: '', destinationCountry: '', destinationCity: '', competitionName: '',
  purposeOfTravel: 'Competition', visaType: '', embassy: '', departureDate: '', returnDate: '',
  assignedOfficerId: '', priority: 'medium', notes: '',
};

const FIELDS = [
  ['fullName', 'Full Name', 'text', true],
  ['gender', 'Gender', 'select-gender', true],
  ['dateOfBirth', 'Date of Birth', 'date', true],
  ['passportNumber', 'Passport Number', 'text', true],
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

export default function AthleteFormModal({ open, onClose, onSaved, athlete }) {
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
      setForm({
        fullName: athlete.full_name, gender: athlete.gender, dateOfBirth: athlete.date_of_birth,
        passportNumber: athlete.passport_number, sport: athlete.sport, teamFederation: athlete.team_federation || '',
        destinationCountry: athlete.destination_country, destinationCity: athlete.destination_city || '',
        competitionName: athlete.competition_name, purposeOfTravel: athlete.purpose_of_travel || '',
        visaType: athlete.visa_type || '', embassy: athlete.embassy || '',
        departureDate: athlete.departure_date, returnDate: athlete.return_date,
        assignedOfficerId: athlete.assigned_officer_id || '',
        priority: athlete.priority, notes: athlete.notes || '',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
    setServerError(null);
  }, [athlete, open]);

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
      const payload = {
        ...form,
        assignedOfficerId: form.assignedOfficerId ? Number(form.assignedOfficerId) : null,
      };
      if (athlete) {
        await athleteApi.update(athlete.id, payload);
      } else {
        await athleteApi.create(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err.fields) setErrors(err.fields);
      else setServerError(err.message || 'Failed to save athlete');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={athlete ? 'Edit Athlete' : 'Add Athlete'} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && <div className="rounded-lg bg-status-action/10 px-3 py-2 text-sm text-status-action">{serverError}</div>}

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
            {submitting ? 'Saving\u2026' : athlete ? 'Save Changes' : 'Add Athlete'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
