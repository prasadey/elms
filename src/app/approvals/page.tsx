import { requireRole } from "@/lib/authz";
import { getDb, toPlainRows } from "@/lib/db";
import { todayIST, daysSince } from "@/lib/dates";
import ApprovalCard, { type PendingRequest } from "@/components/ApprovalCard";

const PENDING_QUERY = `
  SELECT lr.id, lr.request_ref, lr.from_date, lr.to_date, lr.working_days, lr.reason,
         lr.attachment_name, lr.submitted_at, lr.status, lr.single_stage,
         u.id as employee_id, u.name as employee_name, u.department as department,
         lt.name as leave_type_name, lt.id as leave_type_id
  FROM leave_requests lr
  JOIN users u ON u.id = lr.user_id
  JOIN leave_types lt ON lt.id = lr.leave_type_id
  WHERE lr.status = ? AND lr.approver_stage1_id = ? AND lr.approver_stage1_id IS NOT NULL
`;

const PENDING_HR_QUERY = `
  SELECT lr.id, lr.request_ref, lr.from_date, lr.to_date, lr.working_days, lr.reason,
         lr.attachment_name, lr.submitted_at, lr.status, lr.single_stage,
         u.id as employee_id, u.name as employee_name, u.department as department,
         lt.name as leave_type_name, lt.id as leave_type_id
  FROM leave_requests lr
  JOIN users u ON u.id = lr.user_id
  JOIN leave_types lt ON lt.id = lr.leave_type_id
  WHERE lr.status = 'PENDING_HR' AND lr.approver_stage2_id = ?
`;

export default async function ApprovalsPage() {
  const user = await requireRole("MANAGER", "HR");
  const db = getDb();
  const today = todayIST();

  let myQueue: PendingRequest[] = [];
  if (user.role === "MANAGER") {
    myQueue = toPlainRows(db.prepare(PENDING_QUERY).all("PENDING_MANAGER", user.id) as PendingRequest[]);
  }
  if (user.role === "HR") {
    myQueue = toPlainRows(db.prepare(PENDING_HR_QUERY).all(user.id) as PendingRequest[]);
  }

  let delegateQueue: { manager: string; items: PendingRequest[] }[] = [];
  if (user.role === "HR") {
    const managersOnLeave = db
      .prepare(
        `SELECT DISTINCT u.id, u.name FROM users u
         JOIN leave_requests lr ON lr.user_id = u.id
         WHERE u.role = 'MANAGER' AND lr.status = 'APPROVED' AND lr.from_date <= ? AND lr.to_date >= ?`
      )
      .all(today, today) as { id: number; name: string }[];

    delegateQueue = managersOnLeave
      .map((m) => ({
        manager: m.name,
        items: toPlainRows(db.prepare(PENDING_QUERY).all("PENDING_MANAGER", m.id) as PendingRequest[]),
      }))
      .filter((g) => g.items.length > 0);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
            Approver Inbox ({user.role})
          </div>
          <h1 className="text-2xl font-extrabold text-white">Pending Approval Queue</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review and decide leave applications. Oldest requests are prioritised first.
          </p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-extrabold text-amber-400">{myQueue.length}</span>
          <div className="text-xs text-slate-400">Pending Review</div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Awaiting Your Decision ({myQueue.length})
          </h2>
          <span className="text-xs text-slate-500 font-mono">Sorted Oldest → Newest</span>
        </div>

        <div className="space-y-4">
          {myQueue
            .sort((a, b) => a.submitted_at.localeCompare(b.submitted_at))
            .map((r) => (
              <ApprovalCard key={r.id} request={r} ageDays={daysSince(r.submitted_at)} />
            ))}

          {myQueue.length === 0 && (
            <div className="text-center py-12 bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-base font-semibold text-slate-200">No pending leave requests!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your queue is clear. Any new requests submitted by team members will appear here.
              </p>
            </div>
          )}
        </div>
      </section>

      {delegateQueue.map((g) => (
        <section key={g.manager} className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
              HR Delegation
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Pending for {g.manager} (On Approved Leave Today)
            </h2>
          </div>
          <div className="space-y-4">
            {g.items.map((r) => (
              <ApprovalCard key={r.id} request={r} ageDays={daysSince(r.submitted_at)} delegated />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
