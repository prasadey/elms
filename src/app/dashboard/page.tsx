import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { getDb } from "@/lib/db";
import { getBalancesForUser } from "@/lib/leave-service";
import { todayIST } from "@/lib/dates";
import StatusChip from "@/components/StatusChip";
import CancelButton from "@/components/CancelButton";
import type { RequestStatus } from "@/lib/types";

interface RequestRow {
  id: number;
  request_ref: string;
  leave_type_name: string;
  from_date: string;
  to_date: string;
  working_days: number;
  status: RequestStatus;
  submitted_at: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; status?: string }>;
}) {
  const user = await requireUser();
  const db = getDb();
  const { year: yearParam, status: statusParam } = await searchParams;
  const year = yearParam ? Number(yearParam) : Number(todayIST().slice(0, 4));

  const balances = getBalancesForUser(user.id, year);

  const clauses = ["lr.user_id = ?", "strftime('%Y', lr.from_date) = ?"];
  const params: (string | number)[] = [user.id, String(year)];
  if (statusParam) {
    clauses.push("lr.status = ?");
    params.push(statusParam);
  }
  const myRequests = db
    .prepare(
      `SELECT lr.id, lr.request_ref, lt.name as leave_type_name, lr.from_date, lr.to_date, lr.working_days, lr.status, lr.submitted_at
       FROM leave_requests lr JOIN leave_types lt ON lt.id = lr.leave_type_id
       WHERE ${clauses.join(" AND ")}
       ORDER BY lr.submitted_at DESC`
    )
    .all(...params) as RequestRow[];

  const monthPrefix = todayIST().slice(0, 7); // YYYY-MM
  const teamAway = db
    .prepare(
      `SELECT u.name as employee_name, lr.from_date, lr.to_date, lt.code as leave_code
       FROM leave_requests lr 
       JOIN users u ON u.id = lr.user_id
       JOIN leave_types lt ON lt.id = lr.leave_type_id
       WHERE lr.status = 'APPROVED' AND lr.user_id != ?
       AND (strftime('%Y-%m', lr.from_date) = ? OR strftime('%Y-%m', lr.to_date) = ?)
       ORDER BY lr.from_date`
    )
    .all(user.id, monthPrefix, monthPrefix) as { employee_name: string; from_date: string; to_date: string; leave_code: string }[];

  const holidays = db
    .prepare(`SELECT date, name FROM holidays WHERE date >= ? ORDER BY date LIMIT 6`)
    .all(todayIST()) as { date: string; name: string }[];

  return (
    <div className="space-y-8">
      {/* ── Creative Dashboard Banner ── */}
      <div className="relative bg-gradient-to-r from-[#0a0e27] via-[#0f1640] to-[#0a0e27] border border-indigo-900/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Animated glow blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute -bottom-10 left-20 w-64 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Dot grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #818cf8 1px, transparent 0)", backgroundSize: "28px 28px" }} />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6">
          {/* Left: greeting */}
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Welcome Back</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{user.department ?? "General"} Department</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hello, {user.name.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              Manage your leave entitlements, check approval status, and view team calendar.
            </p>
            <div className="mt-4">
              <Link
                href="/apply"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.03] active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Apply New Leave
              </Link>
            </div>
          </div>

          {/* Right: mini SVG illustration */}
          <div className="hidden sm:block flex-shrink-0">
            <svg viewBox="0 0 260 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-64 h-40 drop-shadow-xl">
              {/* Calendar card */}
              <rect x="8" y="10" width="110" height="140" rx="14" fill="#111827" stroke="#374151" strokeWidth="1" />
              <rect x="8" y="10" width="110" height="36" rx="14" fill="#4f46e5" />
              <rect x="8" y="34" width="110" height="12" rx="0" fill="#4f46e5" />
              <text x="63" y="33" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">Aug 2026</text>
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <text key={i} x={20 + i * 14} y="58" textAnchor="middle" fill="#6b7280" fontSize="7" fontWeight="bold">{d}</text>
              ))}
              {Array.from({ length: 21 }, (_, i) => i + 1).map((n, i) => {
                const row = Math.floor(i / 7), col = i % 7;
                const hl = [11, 12, 13].includes(n), td = n === 24;
                return (
                  <g key={n}>
                    {hl && <rect x={13 + col * 14} y={62 + row * 14} width="12" height="11" rx="3" fill="#14b8a630" />}
                    {td && <rect x={13 + col * 14} y={62 + row * 14} width="12" height="11" rx="3" fill="#4f46e5" />}
                    <text x={19 + col * 14} y={71 + row * 14} textAnchor="middle" fill={td ? "white" : hl ? "#14b8a6" : "#d1d5db"} fontSize="7">{n}</text>
                  </g>
                );
              })}

              {/* Approval card */}
              <rect x="132" y="10" width="120" height="68" rx="12" fill="#111827" stroke="#374151" strokeWidth="1" />
              <circle cx="157" cy="38" r="14" fill="#14b8a620" stroke="#14b8a640" strokeWidth="1.5" />
              <text x="157" y="43" textAnchor="middle" fill="#14b8a6" fontSize="14" fontWeight="bold">✓</text>
              <text x="178" y="30" fill="#f0fdf4" fontSize="9" fontWeight="bold">Approved</text>
              <text x="178" y="43" fill="#9ca3af" fontSize="7.5">by Manager</text>
              <rect x="140" y="58" width="44" height="14" rx="5" fill="#14b8a620" stroke="#14b8a640" strokeWidth="0.8" />
              <text x="162" y="68" textAnchor="middle" fill="#14b8a6" fontSize="7.5" fontWeight="bold">APPROVED</text>

              {/* Notification card */}
              <rect x="132" y="90" width="120" height="60" rx="12" fill="#111827" stroke="#374151" strokeWidth="1" />
              <circle cx="152" cy="112" r="10" fill="#4f46e520" />
              <text x="152" y="116" textAnchor="middle" fill="#818cf8" fontSize="11">🔔</text>
              <text x="168" y="107" fill="#e5e7eb" fontSize="8" fontWeight="600">3 Pending</text>
              <text x="168" y="119" fill="#9ca3af" fontSize="7">Awaiting approval</text>
              <rect x="140" y="132" width="36" height="12" rx="4" fill="#f59e0b20" stroke="#f59e0b40" strokeWidth="0.8" />
              <text x="158" y="141" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="bold">PENDING</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Leave Balances Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Leave Balances &amp; Entitlements ({year})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Accrued and available working days for the calendar year</p>
          </div>
          <span className="text-xs bg-slate-900 text-slate-400 px-3 py-1 rounded-full border border-slate-800">
            Year {year}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {balances.map(({ type, balance, available }) => {
            const quota = type.annual_quota ?? 0;
            const pct = quota > 0 ? Math.min(100, Math.round((available / quota) * 100)) : 100;

            return (
              <div
                key={type.id}
                className="group relative bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl shadow-slate-950/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                    {type.code}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {type.annual_quota === null ? "Unlimited" : `${available} Available`}
                  </span>
                </div>

                <div className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                  {type.name}
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white tracking-tight">{available}</span>
                  <span className="text-xs font-medium text-slate-400">
                    / {type.annual_quota ?? "∞"} days
                  </span>
                </div>

                {/* Progress bar */}
                {type.annual_quota !== null && (
                  <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${pct > 50
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : pct > 20
                            ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                            : "bg-gradient-to-r from-rose-500 to-red-400"
                        }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Used: <strong className="text-slate-200">{balance.used}</strong></span>
                  <span>On Hold: <strong className="text-amber-400">{balance.on_hold}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Grid: My Requests & Sidebar */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Requests Table */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              My Leave History &amp; Status
            </h2>
            <form className="flex gap-2 text-xs items-center" action="/dashboard">
              <a
                href="/api/export/my-requests"
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1.5 transition-colors font-medium"
              >
                📥 Export CSV
              </a>
              <select
                name="year"
                defaultValue={String(year)}
                className="bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                {[year - 1, year, year + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                name="status"
                defaultValue={statusParam ?? ""}
                className="bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING_MANAGER">Pending Manager</option>
                <option value="PENDING_HR">Pending HR</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REVOKED">Revoked</option>
              </select>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                Filter
              </button>
            </form>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Leave Type</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3">Days</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {myRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-indigo-300 font-semibold">{r.request_ref}</td>
                      <td className="px-4 py-3 font-medium text-slate-200">{r.leave_type_name}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {r.from_date === r.to_date ? (
                          <span>{r.from_date}</span>
                        ) : (
                          <span>
                            {r.from_date} <span className="text-slate-600">→</span> {r.to_date}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-200">{r.working_days}d</td>
                      <td className="px-4 py-3">
                        <StatusChip status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(r.status === "PENDING_MANAGER" || r.status === "PENDING_HR") && (
                          <CancelButton requestId={r.id} />
                        )}
                      </td>
                    </tr>
                  ))}
                  {myRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-24 opacity-60">
                            <rect x="20" y="10" width="80" height="80" rx="12" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                            <rect x="30" y="25" width="60" height="6" rx="3" fill="#334155" />
                            <rect x="30" y="38" width="45" height="6" rx="3" fill="#334155" />
                            <rect x="30" y="51" width="52" height="6" rx="3" fill="#334155" />
                            <circle cx="90" cy="75" r="18" fill="#1e293b" stroke="#534dbeff" strokeWidth="2" />
                            <text x="90" y="80" textAnchor="middle" fill="#818cf8" fontSize="16">?</text>
                          </svg>
                          <div className="text-sm font-semibold text-slate-400">No leave requests found for {year}.</div>
                          <div className="text-xs text-slate-500">Click &quot;Apply New Leave&quot; to get started.</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Sidebar: Team Away & Holidays */}
        <div className="space-y-6">
          {/* Team Away Card */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Team Away This Month</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                {monthPrefix}
              </span>
            </h2>

            <div className="space-y-2">
              {teamAway.length === 0 && (
                <p className="text-xs text-slate-500 py-3 text-center bg-slate-950/50 rounded-xl border border-slate-800/50">
                  No other team members are away this month.
                </p>
              )}
              {teamAway.map((t, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl text-xs flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="font-medium text-slate-200">{t.employee_name}</div>
                    <div className="text-[10px] text-indigo-400">{t.leave_code}</div>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 font-mono">
                    {t.from_date === t.to_date ? t.from_date : `${t.from_date} → ${t.to_date}`}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming Holidays Card */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
              <span>Upcoming Holidays</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">2026</span>
            </h2>

            <div className="space-y-2">
              {holidays.length === 0 && (
                <p className="text-xs text-slate-500 py-3 text-center bg-slate-950/50 rounded-xl border border-slate-800/50">
                  No upcoming holidays scheduled.
                </p>
              )}
              {holidays.map((h, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl text-xs flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="font-medium text-slate-200 flex items-center gap-2">
                    <span>🎉</span>
                    <span>{h.name}</span>
                  </div>
                  <div className="text-right text-[11px] text-emerald-400 font-mono font-medium">
                    {h.date}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
