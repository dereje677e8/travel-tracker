import { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';
import PhotoPicker from '../../components/ui/PhotoPicker.jsx';
import { athleteApi } from '../../api/athleteApi.js';
import { usersApi } from '../../api/usersApi.js';
import { useAuthedImage } from '../../hooks/useAuthedImage.js';
import { COUNTRIES } from '../../lib/countries.js';

const EMPTY = {
  fullName: '', gender: 'female', dateOfBirth: '',
  placeOfBirthCountry: '', placeOfBirthProvince: '', placeOfBirthCity: '',
  currentAddress: '', maritalStatus: '', nationalId: '',
  passportNumber: '', passportExpirationDate: '', passportIssueDate: '', passportIssuePlace: '',
  sport: '', teamFederation: '', destinationCountry: '', destinationCity: '', competitionName: '',
  purposeOfTravel: 'Competition', visaType: '', embassy: '', departureDate: '', returnDate: '',
  assignedOfficerId: '', priority: 'medium', notes: '',
};

// Section groupings, each a list of [key, label, type, required] tuples.
// type: text | date | select-gender | select-priority | select-officer |
// select-country | select-marital | textarea
const SECTIONS = [
  {
    title: 'Identity',
    fields: [
      ['fullName', 'Full Name', 'text', true],
      ['gender', 'Gender', 'select-gender', true],
      ['dateOfBirth', 'Date of Birth', 'date', true],
      ['nationalId', 'National ID', 'text', false],
      ['maritalStatus', 'Marital Status', 'select-marital', false],
    ],
  },
  {
    title: 'Place of Birth',
    fields: [
      ['placeOfBirthCountry', 'Country', 'select-country', false],
      ['placeOfBirthProvince', 'Province / State', 'text', false],
      ['placeOfBirthCity', 'City', 'text', false],
    ],
  },
  {
    title: 'Passport',
    fields: [
      ['passportNumber', 'Passport Number', 'text', true],
      ['passportExpirationDate', 'Expiration Date', 'date', false],
      ['passportIssueDate', 'Issue Date', 'date', false],
      ['passportIssuePlace', 'Place of Issue', 'text', false],
    ],
  },
  {
    title: 'Travel',
    fields: [
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
    ],
  },
];

function fieldsFromAthlete(source) {
  return {
    fullName: source.full_name, gender: source.gender, dateOfBirth: source.date_of_birth,
    placeOfBirthCountry: source.place_of_birth_country || '', placeOfBirthProvince: source.place_of_birth_province || '',
    placeOfBirthCity: source.place_of_birth_city || '', currentAddress: source.current_address || '',
    maritalStatus: source.marital_status || '', nationalId: source.national_id || '',
    passportNumber: source.passport_number, passportExpirationDate: source.passport_expiration_date || '',
    passportIssueDate: source.passport_issue_date || '', passportIssuePlace: source.passport_issue_place || '',
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
 * duplicateFrom: full athlete record -> create mode, pre-filled from it
 *   (photo is NOT carried over - a duplicate is a different person/record).
 * Neither -> blank create mode.
 */
export default function AthleteFormModal({ open, onClose, onSaved, athlete, duplicateFrom }) {
  const [form, setForm] = useState(EMPTY);
  const [photoBlob, setPhotoBlob] = useState(null); // pending upload, null = no change
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [officers, setOfficers] = useState([]);

  const existingPhotoUrl = useAuthedImage(athlete?.photo_path ? athleteApi.photoPath(athlete.id) : null);

  useEffect(() => {
    if (!open) return;
    usersApi.directory().then(setOfficers).catch(() => setOfficers([]));
  }, [open]);

  useEffect(() => {
    if (athlete) {
      setForm(fieldsFromAthlete(athlete));
    } else if (duplicateFrom) {
      setForm(fieldsFromAthlete(duplicateFrom));
    } else {
      setForm(EMPTY);
    }
    setPhotoBlob(null);
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
      const payload = {
        ...form,
        assignedOfficerId: form.assignedOfficerId ? Number(form.assignedOfficerId) : null,
        passportExpirationDate: form.passportExpirationDate || null,
        passportIssueDate: form.passportIssueDate || null,
        placeOfBirthCountry: form.placeOfBirthCountry || null,
        maritalStatus: form.maritalStatus || null,
      };

      let athleteId;
      if (athlete) {
        await athleteApi.update(athlete.id, payload);
        athleteId = athlete.id;
      } else {
        const result = await athleteApi.create(payload);
        athleteId = result.id;
      }

      // Photo uploads separately (multipart), after the athlete record
      // exists/is confirmed - keeps the main save fast and JSON-only.
      if (photoBlob) {
        await athleteApi.uploadPhoto(athleteId, photoBlob);
      }

      onSaved(athlete ? undefined : { id: athleteId });
      onClose();
    } catch (err) {
      if (err.fields) setErrors(err.fields);
      else setServerError(err.message || 'Failed to save athlete');
    } finally {
      setSubmitting(false);
    }
  }

  const title = athlete ? 'Edit Athlete' : duplicateFrom ? 'Duplicate Athlete' : 'Add Athlete';

  function renderField(key, label, type, required) {
    if (type === 'select-gender') {
      return (
        <select value={form[key]} onChange={(e) => update(key, e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm">
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
        </select>
      );
    }
    if (type === 'select-priority') {
      return (
        <select value={form[key]} onChange={(e) => update(key, e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm">
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      );
    }
    if (type === 'select-marital') {
      return (
        <select value={form[key]} onChange={(e) => update(key, e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm">
          <option value="">Not specified</option>
          <option value="single">Single</option>
          <option value="married">Married</option>
          <option value="divorced">Divorced</option>
          <option value="widowed">Widowed</option>
          <option value="other">Other</option>
        </select>
      );
    }
    if (type === 'select-country') {
      return (
        <select value={form[key]} onChange={(e) => update(key, e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm">
          <option value="">Select country\u2026</option>
          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      );
    }
    if (type === 'select-officer') {
      return (
        <select value={form[key]} onChange={(e) => update(key, e.target.value)} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm">
          <option value="">Unassigned</option>
          {officers.map((o) => (
            <option key={o.id} value={o.id}>{o.full_name} ({o.role === 'administrator' ? 'Admin' : 'Staff'})</option>
          ))}
        </select>
      );
    }
    return (
      <input
        type={type}
        required={required}
        value={form[key]}
        onChange={(e) => update(key, e.target.value)}
        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      <form onSubmit={handleSubmit} className="space-y-6">
        {serverError && <div className="rounded-lg bg-status-action/10 px-3 py-2 text-sm text-status-action">{serverError}</div>}

        {duplicateFrom && (
          <div className="flex items-center gap-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 px-3 py-2 text-sm text-primary-700 dark:text-primary-300">
            <Copy size={15} />
            Pre-filled from {duplicateFrom.full_name} \u2014 review and edit before saving as a new athlete. Photo is not duplicated.
          </div>
        )}

        <PhotoPicker
          existingPhotoUrl={athlete ? existingPhotoUrl : null}
          onChange={setPhotoBlob}
        />

        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">{section.title}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {section.fields.map(([key, label, type, required]) => (
                <div key={key}>
                  <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                    {label}{required && <span className="text-status-action"> *</span>}
                  </label>
                  {renderField(key, label, type, required)}
                  {errors[key] && <p className="mt-1 text-xs text-status-action">{errors[key]}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Current Address & Notes</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Current Address</label>
              <textarea
                rows={2}
                value={form.currentAddress}
                onChange={(e) => update('currentAddress', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
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
          </div>
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
