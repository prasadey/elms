import { requireUser } from "@/lib/authz";
import { getBalancesForUser } from "@/lib/leave-service";
import { getDb } from "@/lib/db";
import { todayIST } from "@/lib/dates";
import ApplyLeaveForm from "@/components/ApplyLeaveForm";

export default async function ApplyLeavePage() {
  const user = await requireUser();
  const year = Number(todayIST().slice(0, 4));
  const balances = getBalancesForUser(user.id, year);
  const db = getDb();
  const holidays = db.prepare("SELECT date FROM holidays").all() as { date: string }[];

  const leaveTypes = balances.map(({ type, available }) => ({
    id: type.id,
    code: type.code,
    name: type.name,
    available,
    halfDayAllowed: Boolean(type.half_day_allowed),
    backdateDays: type.backdate_days,
    minNoticeDays: type.min_notice_days,
    requiresDocument: Boolean(type.requires_document),
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Creative Banner ── */}
      <div className="relative bg-gradient-to-br from-[#0a0e27] via-[#0f1640] to-[#0d1235] border border-indigo-900/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Animated glow */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-purple-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #818cf8 1px, transparent 0)", backgroundSize: "28px 28px" }} />

        <div className="relative z-10 flex items-center justify-between gap-4 p-6">
          {/* Text */}
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Leave Application
            </div>
            <h1 className="text-2xl font-extrabold text-white">Apply for Leave</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">
              Weekends, holidays, overlaps and balances are validated automatically.
            </p>
          </div>

          {/* SVG illustration */}
          <div className="hidden sm:block flex-shrink-0">
            <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-32 drop-shadow-xl">
              {/* Form card */}
              <rect x="8" y="10" width="118" height="110" rx="12" fill="#111827" stroke="#374151" strokeWidth="1"/>
              <rect x="8" y="10" width="118" height="28" rx="12" fill="#4f46e5"/>
              <rect x="8" y="28" width="118" height="10" rx="0" fill="#4f46e5"/>
              <text x="67" y="27" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Leave Request</text>

              {/* Form fields */}
              <rect x="18" y="48" width="98" height="10" rx="4" fill="#1f2937" stroke="#374151" strokeWidth="0.8"/>
              <text x="23" y="56" fill="#9ca3af" fontSize="6.5">From Date</text>
              <rect x="18" y="64" width="98" height="10" rx="4" fill="#1f2937" stroke="#374151" strokeWidth="0.8"/>
              <text x="23" y="72" fill="#9ca3af" fontSize="6.5">To Date</text>
              <rect x="18" y="80" width="98" height="10" rx="4" fill="#1f2937" stroke="#374151" strokeWidth="0.8"/>
              <text x="23" y="88" fill="#9ca3af" fontSize="6.5">Leave Type</text>

              {/* Submit button */}
              <rect x="18" y="96" width="98" height="16" rx="6" fill="#4f46e5"/>
              <text x="67" y="107" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">Submit Request</text>

              {/* Calendar card */}
              <rect x="138" y="8" width="56" height="56" rx="10" fill="#111827" stroke="#374151" strokeWidth="1"/>
              <rect x="138" y="8" width="56" height="18" rx="10" fill="#7c3aed"/>
              <rect x="138" y="18" width="56" height="8" rx="0" fill="#7c3aed"/>
              <text x="166" y="20" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">Aug 2026</text>
              {[1,2,3,4,5,6,7,8,9].map((n,i) => {
                const row=Math.floor(i/3), col=i%3;
                const hl=[5,6,7].includes(n);
                return (
                  <g key={n}>
                    {hl && <rect x={143+col*16} y={30+row*14} width="12" height="10" rx="3" fill="#14b8a630"/>}
                    <text x={149+col*16} y={38+row*14} textAnchor="middle" fill={hl?"#14b8a6":"#d1d5db"} fontSize="7">{n}</text>
                  </g>
                );
              })}

              {/* Paper airplane flying */}
              <g transform="translate(142,72)">
                <polygon points="0,0 18,8 0,16 4,8" fill="#14b8a6" opacity="0.9"/>
                <line x1="4" y1="8" x2="18" y2="8" stroke="#14b8a680" strokeWidth="0.8"/>
                {/* trail dots */}
                <circle cx="-6" cy="8" r="1.5" fill="#14b8a650"/>
                <circle cx="-12" cy="9" r="1" fill="#14b8a630"/>
                <circle cx="-18" cy="10" r="0.8" fill="#14b8a620"/>
              </g>

              {/* Approval tick badge */}
              <rect x="138" y="98" width="56" height="24" rx="8" fill="#111827" stroke="#374151" strokeWidth="1"/>
              <circle cx="153" cy="110" r="8" fill="#14b8a620" stroke="#14b8a640" strokeWidth="1"/>
              <text x="153" y="114" textAnchor="middle" fill="#14b8a6" fontSize="9" fontWeight="bold">✓</text>
              <text x="168" y="106" fill="#d1d5db" fontSize="7" fontWeight="bold">Ready</text>
              <text x="168" y="116" fill="#9ca3af" fontSize="6">to submit</text>
            </svg>
          </div>
        </div>
      </div>

      <ApplyLeaveForm
        leaveTypes={leaveTypes}
        holidayDates={holidays.map((h) => h.date)}
        today={todayIST()}
      />
    </div>
  );
}
