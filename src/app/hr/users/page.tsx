import { requireRole } from "@/lib/authz";
import { getDb, toPlainRows } from "@/lib/db";
import { todayIST } from "@/lib/dates";
import AddUserForm from "@/components/AddUserForm";
import UserActions from "@/components/UserActions";
import type { User, LeaveType } from "@/lib/types";

export default async function HrUsersPage() {
  await requireRole("HR");
  const db = getDb();
  const users = toPlainRows(db.prepare("SELECT * FROM users ORDER BY role, name").all() as User[]);
  const managers = users.filter((u) => u.role === "MANAGER" && u.status === "ACTIVE");
  const leaveTypes = toPlainRows(
    db.prepare("SELECT * FROM leave_types WHERE active = 1 ORDER BY code").all() as LeaveType[]
  );
  const year = Number(todayIST().slice(0, 4));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-xl font-semibold text-slate-900">Users</h1>

      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Add user</h2>
        <AddUserForm managers={managers.map((m) => ({ id: m.id, name: m.name }))} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Roster</h2>
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">
                    {u.name}{" "}
                    <span className="text-xs font-normal text-slate-400">
                      {u.role} · {u.department} · {u.status}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
                <UserActions userId={u.id} status={u.status} leaveTypes={leaveTypes} year={year} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
