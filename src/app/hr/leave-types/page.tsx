import { requireRole } from "@/lib/authz";
import { getDb, toPlainRows } from "@/lib/db";
import LeaveTypeRow from "@/components/LeaveTypeRow";
import type { LeaveType } from "@/lib/types";

export default async function HrLeaveTypesPage() {
  await requireRole("HR");
  const db = getDb();
  const types = toPlainRows(db.prepare("SELECT * FROM leave_types ORDER BY code").all() as LeaveType[]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Leave types</h1>
      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
        <div className="grid grid-cols-6 gap-2 px-4 py-2 text-xs font-medium text-slate-400 uppercase">
          <span>Code</span>
          <span className="col-span-2">Name / rule</span>
          <span>Quota</span>
          <span>Carry-fwd cap</span>
          <span>Active</span>
        </div>
        {types.map((t) => (
          <LeaveTypeRow key={t.id} type={t} />
        ))}
      </div>
    </div>
  );
}
