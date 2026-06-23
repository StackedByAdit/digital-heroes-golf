'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import type { Charity, GolfScore, Profile } from '@/types';
import type { AdminUserRow } from '@/app/api/admin/users/route';

type UserDetail = {
  profile: Profile;
  scores: GolfScore[];
  charity: Charity | null;
};

export function UserManager() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [scoreForm, setScoreForm] = useState({ score: 36, score_date: format(new Date(), 'yyyy-MM-dd') });
  const [editingScore, setEditingScore] = useState<GolfScore | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (planFilter) params.set('plan', planFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Failed to load users');

      setUsers(data.users ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, planFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    async function loadCharities() {
      const response = await fetch('/api/charities?include_inactive=true');
      const data = await response.json();
      if (response.ok) setCharities(data.charities ?? []);
    }
    loadCharities();
  }, []);

  async function openUser(userId: string) {
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Failed to load user');

      setSelectedUser(data);
      setEditForm(data.profile);
      setPanelOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load user');
    }
  }

  async function saveUser() {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editForm.full_name,
          subscription_status: editForm.subscription_status,
          subscription_plan: editForm.subscription_plan,
          charity_id: editForm.charity_id,
          charity_percentage: editForm.charity_percentage,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Update failed');

      toast.success('User updated');
      setSelectedUser({ ...selectedUser, profile: data.profile });
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword() {
    if (!selectedUser) return;
    try {
      const response = await fetch(
        `/api/admin/users/${selectedUser.profile.id}/reset-password`,
        { method: 'POST' }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Reset failed');
      toast.success(data.message ?? 'Reset email sent');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Reset failed');
    }
  }

  async function addScore(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedUser) return;
    try {
      const response = await fetch(
        `/api/admin/users/${selectedUser.profile.id}/scores`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scoreForm),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Failed to add score');
      setSelectedUser({ ...selectedUser, scores: data.scores });
      setScoreForm({ score: 36, score_date: format(new Date(), 'yyyy-MM-dd') });
      toast.success('Score added');
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add score');
    }
  }

  async function updateScore(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedUser || !editingScore) return;
    try {
      const response = await fetch(
        `/api/admin/users/${selectedUser.profile.id}/scores`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingScore.id,
            score: scoreForm.score,
            score_date: scoreForm.score_date,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Failed to update score');
      setSelectedUser({ ...selectedUser, scores: data.scores });
      setEditingScore(null);
      toast.success('Score updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update score');
    }
  }

  async function deleteScore(scoreId: string) {
    if (!selectedUser || !confirm('Delete this score?')) return;
    try {
      const response = await fetch(
        `/api/admin/users/${selectedUser.profile.id}/scores`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: scoreId }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Failed to delete score');
      setSelectedUser({ ...selectedUser, scores: data.scores });
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete score');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search name or email…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="min-w-[220px] flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="cancelled">Cancelled</option>
          <option value="past_due">Past due</option>
        </select>
        <select
          value={planFilter}
          onChange={(event) => {
            setPlanFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">All plans</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <p className="px-6 py-10 text-sm text-gray-500">Loading users…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Plan</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Charity</th>
                  <th className="px-4 py-3 text-left font-semibold">Scores</th>
                  <th className="px-4 py-3 text-left font-semibold">Joined</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 font-medium">{user.full_name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3 capitalize">{user.subscription_plan ?? '—'}</td>
                    <td className="px-4 py-3 capitalize">{user.subscription_status}</td>
                    <td className="px-4 py-3">{user.charity_name ?? '—'}</td>
                    <td className="px-4 py-3">{user.score_count}</td>
                    <td className="px-4 py-3">{formatDate(user.created_at.slice(0, 10))}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openUser(user.id)}
                        className="rounded-md border px-2 py-1 text-xs font-medium hover:bg-gray-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((current) => current - 1)}
          className="rounded-lg border px-3 py-1 disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((current) => current + 1)}
          className="rounded-lg border px-3 py-1 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {panelOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">{selectedUser.profile.full_name}</h2>
              <button type="button" onClick={() => setPanelOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <section className="space-y-3">
                <h3 className="font-semibold">Profile</h3>
                <input
                  value={editForm.full_name ?? ''}
                  onChange={(event) =>
                    setEditForm({ ...editForm, full_name: event.target.value })
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Full name"
                />
                <input
                  value={selectedUser.profile.email}
                  readOnly
                  className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm"
                />
                <select
                  value={editForm.subscription_status ?? ''}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      subscription_status: event.target.value as Profile['subscription_status'],
                    })
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="past_due">Past due</option>
                </select>
                <select
                  value={editForm.subscription_plan ?? ''}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      subscription_plan: (event.target.value || null) as Profile['subscription_plan'],
                    })
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">No plan</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <select
                  value={editForm.charity_id ?? ''}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      charity_id: event.target.value || null,
                    })
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">No charity</option>
                  {charities.map((charity) => (
                    <option key={charity.id} value={charity.id}>
                      {charity.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={editForm.charity_percentage ?? 10}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      charity_percentage: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveUser}
                    disabled={saving}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={resetPassword}
                    className="rounded-lg border px-4 py-2 text-sm"
                  >
                    Reset password
                  </button>
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-semibold">Scores</h3>
                <ul className="mb-4 space-y-2">
                  {selectedUser.scores.map((score) => (
                    <li
                      key={score.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <span>
                        {score.score} on {score.score_date}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingScore(score);
                            setScoreForm({
                              score: score.score,
                              score_date: score.score_date,
                            });
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => deleteScore(score.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <form
                  onSubmit={editingScore ? updateScore : addScore}
                  className="grid grid-cols-2 gap-2"
                >
                  <input
                    type="number"
                    min={1}
                    max={45}
                    value={scoreForm.score}
                    onChange={(event) =>
                      setScoreForm({ ...scoreForm, score: Number(event.target.value) })
                    }
                    className="rounded-lg border px-3 py-2 text-sm"
                  />
                  <input
                    type="date"
                    value={scoreForm.score_date}
                    onChange={(event) =>
                      setScoreForm({ ...scoreForm, score_date: event.target.value })
                    }
                    className="rounded-lg border px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="col-span-2 inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    {editingScore ? 'Update score' : 'Add score'}
                  </button>
                </form>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
