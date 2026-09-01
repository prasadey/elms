import Link from "next/link";
import { requireRole } from "@/lib/authz";
import { getDb } from "@/lib/db";

export default async function HrHomePage() {
  await requireRole("HR");
  const db = getDb();
  const pending = db
    .prepare("SELECT COUNT(*) as c FROM leave_requests WHERE status IN ('PENDING_MANAGER','PENDING_HR')")
    .get() as { c: number };
  const activeUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE status = 'ACTIVE'").get() as { c: number };
  const approvedThisYear = db
    .prepare("SELECT COUNT(*) as c FROM leave_requests WHERE status = 'APPROVED' AND strftime('%Y', from_date) = strftime('%Y','now')")
    .get() as { c: number };

  const cards = [
    { href: "/hr/requests", label: "Company-Wide Requests", desc: "View all requests, apply filters, and revoke approved leave.", icon: "📑", color: "from-blue-500/20 to-indigo-500/20 text-blue-400" },
    { href: "/hr/users", label: "User Management & Balances", desc: "Add users, edit roles, deactivate accounts, and adjust balances with reasons.", icon: "👥", color: "from-purple-500/20 to-pink-500/20 text-purple-400" },
    { href: "/hr/leave-types", label: "Leave Type Configuration", desc: "Quotas, carry-forward caps, notice periods, and active status.", icon: "⚙️", color: "from-emerald-500/20 to-teal-500/20 text-emerald-400" },
    { href: "/hr/holidays", label: "Holiday Calendar Management", desc: "Manage company holidays for accurate working day calculations.", icon: "📅", color: "from-amber-500/20 to-orange-500/20 text-amber-400" },
    { href: "/hr/reports", label: "Analytics & Export Reports", desc: "Leave register CSV, department utilization, LOP summary, ageing.", icon: "📊", color: "from-cyan-500/20 to-blue-500/20 text-cyan-400" },
    { href: "/hr/audit-log", label: "Tamper-Evident Audit Log", desc: "Append-only record of every request, approval decision, and adjustment.", icon: "🔒", color: "from-violet-500/20 to-purple-500/20 text-violet-400" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
          <span>Human Resources Console</span>
          <span>•</span>
          <span className="text-slate-400">Srihari (HR Administrator)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">HR Control Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage employee rosters, leave policies, audit logs, and company-wide reports.
        </p>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Pending Approvals Company-Wide" value={pending.c} icon="⏳" highlight={pending.c > 0} />
        <Stat label="Active Employee Roster" value={activeUsers.c} icon="👥" />
        <Stat label="Approved Leaves (This Year)" value={approvedThisYear.c} icon="✓" />
      </div>

      {/* Module Cards Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl space-y-3 flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} border border-slate-700/50 flex items-center justify-center text-lg shadow-sm`}>
                  {c.icon}
                </span>
                <div>
                  <h2 className="font-bold text-base text-slate-100 group-hover:text-white transition-colors">
                    {c.label}
                  </h2>
                </div>
              </div>
              <span className="text-slate-600 group-hover:text-indigo-400 transition-colors text-sm font-bold">→</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, icon, highlight }: { label: string; value: number; icon: string; highlight?: boolean }) {
  return (
    <div className={`bg-slate-900/80 border rounded-2xl p-5 shadow-lg flex items-center justify-between ${highlight ? "border-amber-500/40 bg-amber-500/5" : "border-slate-800"}`}>
      <div>
        <div className="text-2xl font-extrabold text-white tracking-tight">{value}</div>
        <div className="text-xs text-slate-400 mt-0.5">{label}</div>
      </div>
      <span className="text-2xl opacity-80">{icon}</span>
    </div>
  );
}
