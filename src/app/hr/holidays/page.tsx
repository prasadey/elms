import { requireRole } from "@/lib/authz";
import { getDb } from "@/lib/db";
import HolidayForm from "@/components/HolidayForm";
import RemoveHolidayButton from "@/components/RemoveHolidayButton";

export default async function HrHolidaysPage() {
  await requireRole("HR");
  const db = getDb();
  const holidays = db.prepare("SELECT * FROM holidays ORDER BY date").all() as {
    id: number;
    date: string;
    name: string;
  }[];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Holiday calendar</h1>
      <HolidayForm />
      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
        {holidays.map((h) => (
          <div key={h.id} className="flex items-center justify-between px-4 py-2 text-sm">
            <span>
              {h.date} — {h.name}
            </span>
            <RemoveHolidayButton id={h.id} />
          </div>
        ))}
        {holidays.length === 0 && <p className="px-4 py-6 text-center text-slate-400 text-sm">No holidays configured.</p>}
      </div>
    </div>
  );
}
