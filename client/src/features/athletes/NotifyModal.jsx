import { useState } from 'react';
import Modal from '../../components/ui/Modal.jsx';
import { notificationsApi } from '../../api/notificationsApi.js';

export default function NotifyModal({ open, onClose, athleteId, onSent }) {
  const [channel, setChannel] = useState('email');
  const [recipient, setRecipient] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSend(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await notificationsApi.send({ athleteId, channel, recipient, customMessage: customMessage || undefined });
      onSent?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send notification');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Send Travel Update">
      <form onSubmit={handleSend} className="space-y-4">
        {error && <div className="rounded-lg bg-status-action/10 px-3 py-2 text-sm text-status-action">{error}</div>}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Channel</label>
          <div className="flex gap-2">
            {['email', 'whatsapp'].map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setChannel(c)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium capitalize
                  ${channel === c ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
            {channel === 'email' ? 'Recipient Email' : 'Recipient WhatsApp Number'}
          </label>
          <input
            required
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={channel === 'email' ? 'officer@federation.org' : '+2519xxxxxxxx'}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Custom Message (optional)</label>
          <textarea
            rows={3}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Leave blank to auto-generate from the athlete's current status"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
          <button type="submit" disabled={submitting} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            {submitting ? 'Sending\u2026' : 'Send Update'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
