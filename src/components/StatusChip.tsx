import type { RequestStatus } from "@/lib/types";

const CONFIG: Record<RequestStatus, { style: string; label: string; icon: string }> = {
  PENDING_MANAGER: {
    style: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    label: "Pending Manager (Stage 1)",
    icon: "⏳",
  },
  PENDING_HR: {
    style: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    label: "Pending HR (Stage 2)",
    icon: "🛡️",
  },
  APPROVED: {
    style: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-semibold",
    label: "Approved",
    icon: "✓",
  },
  REJECTED: {
    style: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    label: "Rejected",
    icon: "✕",
  },
  CANCELLED: {
    style: "bg-slate-500/10 text-slate-400 border-slate-700",
    label: "Cancelled",
    icon: "🚫",
  },
  REVOKED: {
    style: "bg-orange-500/10 text-orange-300 border-orange-500/30",
    label: "Revoked by HR",
    icon: "↩",
  },
};

export default function StatusChip({ status }: { status: RequestStatus }) {
  const cfg = CONFIG[status] || {
    style: "bg-slate-700 text-slate-300 border-slate-600",
    label: status,
    icon: "•",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.style} transition-colors shadow-sm`}
    >
      <span className="text-[10px] leading-none">{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
}
