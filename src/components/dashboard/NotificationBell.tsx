'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { NotificationItem } from '@/types';

type NotificationsResponse = {
  notifications: NotificationItem[];
  unread_count: number;
};

export function NotificationBell() {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  async function loadNotifications() {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) return;
      const data = (await response.json()) as NotificationsResponse;
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  async function markRead(ids: string[]) {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) return;
    const data = (await response.json()) as NotificationsResponse;
    setNotifications(data.notifications ?? []);
    setUnreadCount(data.unread_count ?? 0);
  }

  async function markAllRead() {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    if (!response.ok) return;
    const data = (await response.json()) as NotificationsResponse;
    setNotifications(data.notifications ?? []);
    setUnreadCount(data.unread_count ?? 0);
  }

  async function handleItemClick(item: NotificationItem) {
    if (!item.read && item.source === 'stored') {
      await markRead([item.id]);
    } else if (!item.read) {
      setUnreadCount((count) => Math.max(0, count - 1));
      setNotifications((items) =>
        items.map((entry) =>
          entry.id === item.id ? { ...entry, read: true } : entry
        )
      );
    }

    if (item.href) {
      setOpen(false);
      router.push(item.href);
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) loadNotifications();
        }}
        className="btn-interactive relative rounded-full p-2 text-gray-500 hover:bg-gray-100"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-green hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">No notifications yet.</p>
            ) : (
              <ul>
                {notifications.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        'w-full border-b border-gray-100 px-4 py-3 text-left transition hover:bg-gray-50',
                        !item.read && 'bg-brand-green/5'
                      )}
                    >
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="mt-0.5 text-xs text-gray-600">{item.body}</p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        {formatRelativeTime(item.created_at)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t px-4 py-2">
            <Link
              href="/dashboard/account"
              className="text-xs font-medium text-gray-500 hover:text-gray-800"
              onClick={() => setOpen(false)}
            >
              Account settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
