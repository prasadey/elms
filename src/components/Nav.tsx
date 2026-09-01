import Link from "next/link";
import { getDb, toPlainRows } from "@/lib/db";
import SignOutButton from "@/components/SignOutButton";
import NotificationBell, { type BellNotification } from "@/components/NotificationBell";
import type { Role } from "@/lib/types";

export default function Nav({
  user,
}: {
  user: { id: number; role: Role; name?: string | null; email?: string | null };
}) {
  const db = getDb();
  const notifications = toPlainRows(
    db
      .prepare(
        `SELECT id, template_key, payload, sent_at, read_at FROM notifications
       WHERE user_id = ? AND channel = 'IN_APP' ORDER BY sent_at DESC LIMIT 15`
      )
      .all(user.id) as BellNotification[]
  );
  const unreadRow = db
    .prepare(`SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND channel = 'IN_APP' AND read_at IS NULL`)
    .get(user.id) as { c: number };

  const links: { href: string; label: string; badge?: number }[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/apply", label: "Apply Leave" },
  ];

  if (user.role === "MANAGER" || user.role === "HR") {
    // Count pending approvals for badge
    let pendingCount = 0;
    if (user.role === "MANAGER") {
      const row = db.prepare("SELECT COUNT(*) as c FROM leave_requests WHERE status = 'PENDING_MANAGER' AND approver_stage1_id = ?").get(user.id) as { c: number };
      pendingCount = row.c;
    } else if (user.role === "HR") {
      const row = db.prepare("SELECT COUNT(*) as c FROM leave_requests WHERE status = 'PENDING_HR' AND approver_stage2_id = ?").get(user.id) as { c: number };
      pendingCount = row.c;
    }
    links.push({ href: "/approvals", label: "Approvals", badge: pendingCount });
  }

  if (user.role === "HR") {
    links.push({ href: "/hr", label: "HR Console" });
  }

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md group-hover:scale-105 transition-transform">
              E
            </div>
            <div>
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                ELMS
              </span>
              <span className="block text-[10px] text-slate-400 leading-none">EspeciallyYours</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1.5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="relative px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all flex items-center gap-1.5"
              >
                {l.label}
                {Boolean(l.badge && l.badge > 0) && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow-sm animate-pulse">
                    {l.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* User badge display */}
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <span>{user.name}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  user.role === "HR"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : user.role === "MANAGER"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {user.role}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* In-App Notifications Bell */}
          <NotificationBell notifications={notifications} unreadCount={unreadRow.c} />

          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
