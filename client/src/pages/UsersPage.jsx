import { useEffect, useState } from 'react';
import { UserPlus, KeyRound, Copy, Check } from 'lucide-react';
import { usersApi } from '../api/usersApi.js';
import Modal from '../components/ui/Modal.jsx';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'staff' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Password reset flow: confirm -> result (shown once, with copy button).
  const [resetTarget, setResetTarget] = useState(null);
  const [resetResult, setResetResult] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setUsers(await usersApi.list());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await usersApi.create(form);
      setForm({ fullName: '', email: '', password: '', role: 'staff' });
      setFormOpen(false);
      load();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(user) {
    await usersApi.update(user.id, { isActive: !user.is_active });
    load();
  }

  async function confirmReset() {
    setResetting(true);
    try {
      const result = await usersApi.resetPassword(resetTarget.id);
      setResetTarget(null);
      setResetResult(result);
      setCopied(false);
    } finally {
      setResetting(false);
    }
  }

  function copyPassword() {
    navigator.clipboard.writeText(resetResult.temporaryPassword);
    setCopied(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Administrator, Staff 1, and Staff 2 access are managed here.</p>
        <button onClick={() => setFormOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-surface-dark">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Loading\u2026</td></tr>}
            {!loading && users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-ink dark:text-ink-dark">{u.full_name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300">{u.role}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold ${u.is_active ? 'text-status-ready' : 'text-status-action'}`}>
                    {u.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => setResetTarget(u)} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-primary-600" title="Reset password">
                      <KeyRound size={13} /> Reset
                    </button>
                    <button onClick={() => toggleActive(u)} className="text-xs font-medium text-primary-600 hover:underline">
                      {u.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add User">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <div className="rounded-lg bg-status-action/10 px-3 py-2 text-sm text-status-action">{error}</div>}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Full Name</label>
            <input required value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Temporary Password</label>
            <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Role</label>
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm">
              <option value="staff">Staff</option>
              <option value="administrator">Administrator</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
              {submitting ? 'Creating\u2026' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Step 1: confirm */}
      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset Password">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Generate a new temporary password for <span className="font-medium text-ink dark:text-ink-dark">{resetTarget?.full_name}</span>?
          Their current password will stop working immediately.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setResetTarget(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
          <button onClick={confirmReset} disabled={resetting} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            {resetting ? 'Resetting\u2026' : 'Reset Password'}
          </button>
        </div>
      </Modal>

      {/* Step 2: show the new password once - it's never retrievable again after this closes */}
      <Modal open={!!resetResult} onClose={() => setResetResult(null)} title="New Temporary Password">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Share this with <span className="font-medium text-ink dark:text-ink-dark">{resetResult?.email}</span> through
          a secure channel. It won&apos;t be shown again after you close this.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5">
          <code className="flex-1 font-mono text-sm text-ink dark:text-ink-dark">{resetResult?.temporaryPassword}</code>
          <button onClick={copyPassword} className="flex items-center gap-1.5 rounded-md bg-primary-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-700">
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="mt-5 flex justify-end">
          <button onClick={() => setResetResult(null)} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">Done</button>
        </div>
      </Modal>
    </div>
  );
}
