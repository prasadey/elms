import { requireRole } from "@/lib/authz";
import { getDb } from "@/lib/db";
import StatusChip from "@/components/StatusChip";
import RevokeButton from "@/components/RevokeButton";
import type { RequestStatus } from "@/lib/types";

interface Row {
  id: number;
  request_ref: string;
  employee_name: string;
  department: string | null;
  leave_type_name: string;
  from_date: string;
  to_date: string;
  working_days: number;
  status: RequestStatus;
  submitted_at: string;
}

export default async function HrRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; department?: string; q?: string }>;
}) {
  await requireRole("HR");
  const { status, department, q } = await searchParams;
  const db = getDb();

  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (status) {
    clauses.push("lr.status = ?");
    params.push(status);
  }
  if (department) {
    clauses.push("u.department = ?");
    params.push(department);
  }
  if (q) {
    clauses.push("(u.name LIKE ? OR lr.request_ref LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `SELECT lr.id, lr.request_ref, u.name as employee_name, u.department, lt.name as leave_type_name,
              lr.from_date, lr.to_date, lr.working_days, lr.status, lr.submitted_at
       FROM leave_requests lr
       JOIN users u ON u.id = lr.user_id
       JOIN leave_types lt ON lt.id = lr.leave_type_id
       ${where}
       ORDER BY lr.submitted_at DESC LIMIT 200`
    )
    .all(...params) as Row[];

  const departments = db
    .prepare("SELECT DISTINCT department FROM users WHERE department IS NOT NULL ORDER BY department")
    .all() as { department: string }[];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">All requests</h1>

      <form className="flex flex-wrap gap-2 text-sm" action="/hr/requests">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search name or request ID"
          className="border border-slate-300 rounded px-3 py-1.5"
        />
        <select name="status" defaultValue={status ?? ""} className="border border-slate-300 rounded px-3 py-1.5">
          <option value="">All statuses</option>
          <option value="PENDING_MANAGER">Pending Manager</option>
          <option value="PENDING_HR">Pending HR</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REVOKED">Revoked</option>
        </select>
        <select name="department" defaultValue={department ?? ""} className="border border-slate-300 rounded px-3 py-1.5">
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.department} value={d.department}>
              {d.department}
            </option>
          ))}
        </select>
        <button className="border border-slate-300 rounded px-3 py-1.5 hover:bg-slate-100">Filter</button>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Request</th>
              <th className="text-left px-4 py-2">Employee</th>
              <th className="text-left px-4 py-2">Dept</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Dates</th>
              <th className="text-left px-4 py-2">Days</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2 font-mono text-xs text-slate-500">{r.request_ref}</td>
                <td className="px-4 py-2">{r.employee_name}</td>
                <td className="px-4 py-2 text-slate-500">{r.department}</td>
                <td className="px-4 py-2">{r.leave_type_name}</td>
                <td className="px-4 py-2 text-slate-600">
                  {r.from_date === r.to_date ? r.from_date : `${r.from_date} → ${r.to_date}`}
                </td>
                <td className="px-4 py-2">{r.working_days}</td>
                <td className="px-4 py-2">
                  <StatusChip status={r.status} />
                </td>
                <td className="px-4 py-2 text-right">
                  {r.status === "APPROVED" && <RevokeButton requestId={r.id} />}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                  No matching requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
