"use client";

import { useState, useTransition } from "react";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/actions";

export interface BellNotification {
  id: number;
  template_key: string;
  payload: string;
  sent_at: string;
  read_at: string | null;
}

export default function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: BellNotification[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-slate-200 transition-colors"
        aria-label="Notifications"
      >
        <span aria-hidden>🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <button
                className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                disabled={isPending}
                onClick={() => startTransition(async () => { await markAllNotificationsReadAction(); })}
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 && (
            <p className="text-sm text-slate-500 px-3 py-4">No notifications yet.</p>
          )}
          <ul className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`px-3 py-2 text-sm cursor-pointer ${n.read_at ? "bg-white text-slate-500" : "bg-blue-50 text-slate-800"}`}
                onClick={() => {
                  if (!n.read_at) startTransition(async () => { await markNotificationReadAction(n.id); });
                }}
              >
                <p>{n.payload}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{n.sent_at}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
