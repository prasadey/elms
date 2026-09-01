import { requireRole } from "@/lib/authz";
import { getDb } from "@/lib/db";

interface Row {
  id: number;
  entity_type: string;
  entity_id: number;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  before_state: string | null;
  after_state: string | null;
  comment: string | null;
  created_at: string;
}

export default async function HrAuditLogPage() {
  await requireRole("HR");
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT al.id, al.entity_type, al.entity_id, u.name as actor_name, al.actor_role, al.action,
              al.before_state, al.after_state, al.comment, al.created_at
       FROM audit_log al LEFT JOIN users u ON u.id = al.actor_id
       ORDER BY al.created_at DESC LIMIT 300`
    )
    .all() as Row[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Audit log</h1>
        <p className="text-sm text-slate-500">Append-only. Not editable by anyone, including HR and Admin.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase">
            <tr>
              <th className="text-left px-3 py-2">When (UTC)</th>
              <th className="text-left px-3 py-2">Entity</th>
              <th className="text-left px-3 py-2">Action</th>
              <th className="text-left px-3 py-2">Actor</th>
              <th className="text-left px-3 py-2">Before → After</th>
              <th className="text-left px-3 py-2">Comment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 whitespace-nowrap text-slate-400">{r.created_at}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {r.entity_type}#{r.entity_id}
                </td>
                <td className="px-3 py-2 whitespace-nowrap font-medium text-slate-700">{r.action}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {r.actor_name ?? "system"} <span className="text-slate-400">({r.actor_role ?? "-"})</span>
                </td>
                <td className="px-3 py-2 max-w-xs truncate" title={`${r.before_state ?? ""} -> ${r.after_state ?? ""}`}>
                  {r.before_state ?? "—"} → {r.after_state ?? "—"}
                </td>
                <td className="px-3 py-2 max-w-xs truncate" title={r.comment ?? ""}>
                  {r.comment ?? ""}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                  No activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
