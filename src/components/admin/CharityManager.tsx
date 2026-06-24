'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Pencil, Plus, Star, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CHARITY_CATEGORIES } from '@/lib/charity/categories';
import { cn } from '@/lib/utils';
import type { Charity, CharityCategory, CharityEvent } from '@/types';

type CharityRow = Charity & { event_count?: number };

export function CharityManager() {
  const [charities, setCharities] = useState<CharityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<CharityRow | null>(null);
  const [eventsCharity, setEventsCharity] = useState<CharityRow | null>(null);
  const [events, setEvents] = useState<CharityEvent[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'community' as CharityCategory,
    image_url: '',
    website_url: '',
    is_featured: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [eventForm, setEventForm] = useState({
    title: '',
    event_date: '',
    description: '',
  });
  const [editingEvent, setEditingEvent] = useState<CharityEvent | null>(null);

  const loadCharities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/charities?include_inactive=true');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Failed to load charities');

      const rows = (data.charities as Charity[]).map((charity) => ({
        ...charity,
        event_count: charity.upcoming_events?.length ?? 0,
      }));
      setCharities(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load charities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCharities();
  }, [loadCharities]);

  function openCreatePanel() {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      category: 'community',
      image_url: '',
      website_url: '',
      is_featured: false,
    });
    setImageFile(null);
    setPanelOpen(true);
  }

  function openEditPanel(charity: CharityRow) {
    setEditing(charity);
    setForm({
      name: charity.name,
      description: charity.description,
      category: charity.category ?? 'community',
      image_url: charity.image_url ?? '',
      website_url: charity.website_url ?? '',
      is_featured: charity.is_featured,
    });
    setImageFile(null);
    setPanelOpen(true);
  }

  async function handleSaveCharity(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      image_url: form.image_url || null,
      website_url: form.website_url || null,
      is_featured: form.is_featured,
    };

    try {
      const response = await fetch(
        editing ? `/api/charities/${editing.id}` : '/api/charities',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Save failed');

      const charityId = editing?.id ?? data.charity?.id;
      if (charityId && imageFile) {
        const uploadData = new FormData();
        uploadData.append('charity_id', charityId);
        uploadData.append('file', imageFile);

        const uploadResponse = await fetch('/api/admin/charities/upload-image', {
          method: 'POST',
          body: uploadData,
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error ?? 'Image upload failed');
        }
      }

      toast.success(editing ? 'Charity updated' : 'Charity created');
      setPanelOpen(false);
      await loadCharities();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function toggleField(charity: CharityRow, field: 'is_featured' | 'is_active') {
    try {
      const response = await fetch(`/api/charities/${charity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !charity[field] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Update failed');
      await loadCharities();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  }

  async function deactivateCharity(charity: CharityRow) {
    if (!confirm(`Deactivate ${charity.name}?`)) return;
    try {
      const response = await fetch(`/api/charities/${charity.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Delete failed');
      toast.success('Charity deactivated');
      await loadCharities();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  }

  async function openEvents(charity: CharityRow) {
    setEventsCharity(charity);
    try {
      const response = await fetch(`/api/charities/${charity.id}/events`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Failed to load events');
      setEvents(data.events ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load events');
    }
  }

  async function addEvent(event: React.FormEvent) {
    event.preventDefault();
    if (!eventsCharity) return;

    try {
      const response = await fetch(`/api/charities/${eventsCharity.id}/events`, {
        method: editingEvent ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingEvent ? { id: editingEvent.id, ...eventForm } : eventForm
        ),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Failed to save event');

      setEventForm({ title: '', event_date: '', description: '' });
      setEditingEvent(null);
      await openEvents(eventsCharity);
      await loadCharities();
      toast.success(editingEvent ? 'Event updated' : 'Event added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save event');
    }
  }

  async function removeEvent(eventId: string) {
    if (!eventsCharity) return;

    try {
      const response = await fetch(`/api/charities/${eventsCharity.id}/events`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Failed to delete event');

      await openEvents(eventsCharity);
      await loadCharities();
      toast.success('Event removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete event');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreatePanel}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add Charity
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <p className="px-6 py-10 text-sm text-gray-500">Loading charities…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Featured</th>
                  <th className="px-4 py-3 text-left font-semibold">Active</th>
                  <th className="px-4 py-3 text-left font-semibold">Events</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {charities.map((charity) => (
                  <tr key={charity.id} className={cn(!charity.is_active && 'opacity-60')}>
                    <td className="px-4 py-3 font-medium">{charity.name}</td>
                    <td className="px-4 py-3 capitalize text-gray-600">
                      {charity.category?.replace('_', ' ') ?? 'community'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleField(charity, 'is_featured')}
                        className={cn(
                          'rounded p-1',
                          charity.is_featured
                            ? 'text-amber-500'
                            : 'text-gray-300 hover:text-amber-400'
                        )}
                        aria-label="Toggle featured"
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleField(charity, 'is_active')}
                        className={cn(
                          'rounded-full px-2 py-1 text-xs font-semibold',
                          charity.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {charity.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">{charity.event_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditPanel(charity)}
                          className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEvents(charity)}
                          className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          Events
                        </button>
                        {charity.is_active && (
                          <button
                            type="button"
                            onClick={() => deactivateCharity(charity)}
                            className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">
                {editing ? 'Edit charity' : 'Add charity'}
              </h2>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="rounded-md p-1 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCharity} className="flex flex-1 flex-col overflow-hidden">
              <div className="space-y-4 overflow-y-auto px-6 py-4">
                <Field label="Name">
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    required
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="min-h-28 w-full rounded-lg border px-3 py-2 text-sm"
                    required
                  />
                </Field>
                <Field label="Category">
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value as CharityCategory,
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    {CHARITY_CATEGORIES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Image upload">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-3 text-sm text-gray-600 hover:bg-gray-50">
                    <Upload className="h-4 w-4" />
                    {imageFile ? imageFile.name : 'Choose JPEG, PNG, GIF, or WebP (max 5 MB)'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="sr-only"
                      onChange={(event) =>
                        setImageFile(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  {form.image_url && !imageFile && (
                    <p className="mt-2 truncate text-xs text-gray-500">
                      Current: {form.image_url}
                    </p>
                  )}
                </Field>
                <Field label="Image URL (optional override)">
                  <input
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    type="url"
                  />
                </Field>
                <Field label="Website URL">
                  <input
                    value={form.website_url}
                    onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    type="url"
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  />
                  Featured charity
                </label>
              </div>
              <div className="mt-auto flex justify-end gap-3 border-t px-6 py-4">
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Dialog.Root
        open={eventsCharity !== null}
        onOpenChange={(open) => !open && setEventsCharity(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold">
              Events — {eventsCharity?.name}
            </Dialog.Title>

            <ul className="mt-4 space-y-2">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start justify-between rounded-lg border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-gray-500">{event.event_date}</p>
                    {event.description && (
                      <p className="mt-1 text-gray-600">{event.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEvent(event);
                        setEventForm({
                          title: event.title,
                          event_date: event.event_date,
                          description: event.description ?? '',
                        });
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEvent(event.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <form onSubmit={addEvent} className="mt-6 space-y-3 border-t pt-4">
              <h3 className="font-medium">
                {editingEvent ? 'Edit event' : 'Add event'}
              </h3>
              <input
                placeholder="Title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
              <input
                type="date"
                value={eventForm.event_date}
                onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
              <textarea
                placeholder="Description"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
              >
                {editingEvent ? 'Update event' : 'Add event'}
              </button>
              {editingEvent && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent(null);
                    setEventForm({ title: '', event_date: '', description: '' });
                  }}
                  className="ml-2 rounded-lg border px-4 py-2 text-sm"
                >
                  Cancel edit
                </button>
              )}
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
