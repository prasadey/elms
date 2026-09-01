import { requireRole } from "@/lib/authz";
import { getDb } from "@/lib/db";
import { todayIST, daysSince } from "@/lib/dates";

export default async function HrReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  await requireRole("HR");
  const db = getDb();
  const { year: yearParam } = await searchParams;
  const year = yearParam ? Number(yearParam) : Number(todayIST().slice(0, 4));

  const utilisation = db
    .prepare(
      `SELECT u.department as department, lt.code as leave_type, SUM(lr.working_days) as days
       FROM leave_requests lr JOIN users u ON u.id = lr.user_id JOIN leave_types lt ON lt.id = lr.leave_type_id
       WHERE lr.status = 'APPROVED' AND strftime('%Y', lr.from_date) = ?
       GROUP BY u.department, lt.code ORDER BY u.department, lt.code`
    )
    .all(String(year)) as { department: string; leave_type: string; days: number }[];

  const lopSummary = db
    .prepare(
      `SELECT u.name as employee_name, u.department, lr.from_date, lr.to_date, lr.working_days
       FROM leave_requests lr JOIN users u ON u.id = lr.user_id JOIN leave_types lt ON lt.id = lr.leave_type_id
       WHERE lt.code = 'LOP' AND lr.status = 'APPROVED' AND strftime('%Y', lr.from_date) = ?
       ORDER BY lr.from_date DESC`
    )
    .all(String(year)) as { employee_name: string; department: string; from_date: string; to_date: string; working_days: number }[];

  const ageing = db
    .prepare(
      `SELECT lr.request_ref, u.name as employee_name, lr.status, lr.submitted_at
       FROM leave_requests lr JOIN users u ON u.id = lr.user_id
       WHERE lr.status IN ('PENDING_MANAGER','PENDING_HR')
       ORDER BY lr.submitted_at ASC`
    )
    .all() as { request_ref: string; employee_name: string; status: string; submitted_at: string }[];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Reports — {year}</h1>
        <div className="flex gap-2">
          <form action="/hr/reports" className="flex gap-2">
            <select name="year" defaultValue={String(year)} className="border border-slate-300 rounded px-2 py-1 text-sm">
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button className="border border-slate-300 rounded px-3 py-1 text-sm hover:bg-slate-100">Go</button>
          </form>
          <a
            href={`/api/export/register?year=${year}`}
            className="border border-slate-300 rounded px-3 py-1 text-sm hover:bg-slate-100"
          >
            Export leave register (CSV)
          </a>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Department-wise utilisation (approved days)
        </h2>
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Department</th>
                <th className="text-left px-4 py-2">Leave type</th>
                <th className="text-left px-4 py-2">Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {utilisation.map((r, i) => (
                <tr key={i}>
                  <td className="px-4 py-2">{r.department}</td>
                  <td className="px-4 py-2">{r.leave_type}</td>
                  <td className="px-4 py-2">{r.days}</td>
                </tr>
              ))}
              {utilisation.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    No approved leave yet in {year}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Loss of Pay summary (for payroll)
        </h2>
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Employee</th>
                <th className="text-left px-4 py-2">Dept</th>
                <th className="text-left px-4 py-2">Dates</th>
                <th className="text-left px-4 py-2">Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lopSummary.map((r, i) => (
                <tr key={i}>
                  <td className="px-4 py-2">{r.employee_name}</td>
                  <td className="px-4 py-2">{r.department}</td>
                  <td className="px-4 py-2">
                    {r.from_date === r.to_date ? r.from_date : `${r.from_date} → ${r.to_date}`}
                  </td>
                  <td className="px-4 py-2">{r.working_days}</td>
                </tr>
              ))}
              {lopSummary.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No LOP in {year}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Pending-approvals ageing
        </h2>
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Request</th>
                <th className="text-left px-4 py-2">Employee</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Days pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ageing.map((r, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 font-mono text-xs">{r.request_ref}</td>
                  <td className="px-4 py-2">{r.employee_name}</td>
                  <td className="px-4 py-2">{r.status}</td>
                  <td className="px-4 py-2">{daysSince(r.submitted_at)}</td>
                </tr>
              ))}
              {ageing.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    Nothing pending.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
