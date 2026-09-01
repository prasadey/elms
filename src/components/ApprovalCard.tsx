"use client";

import { useState, useTransition } from "react";
import { decideApprovalAction } from "@/app/actions";

export interface PendingRequest {
  id: number;
  request_ref: string;
  from_date: string;
  to_date: string;
  working_days: number;
  reason: string;
  attachment_name: string | null;
  submitted_at: string;
  status: string;
  single_stage: number;
  employee_id: number;
  employee_name: string;
  department: string | null;
  leave_type_name: string;
  leave_type_id: number;
}

export default function ApprovalCard({
  request,
  ageDays,
  delegated,
}: {
  request: PendingRequest;
  ageDays: number;
  delegated?: boolean;
}) {
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"APPROVED" | "REJECTED" | null>(null);

  function decide(decision: "APPROVED" | "REJECTED") {
    if (decision === "REJECTED" && !comment.trim()) {
      setError("A comment is mandatory when rejecting a leave request.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await decideApprovalAction(request.id, decision, comment.trim() || null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(decision);
    });
  }

  if (done) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-5 py-4 text-sm flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${done === "APPROVED" ? "bg-emerald-400" : "bg-rose-400"}`} />
          <span className="font-mono text-xs font-semibold text-indigo-300">{request.request_ref}</span>
          <span className="text-slate-300">
            Request from <strong>{request.employee_name}</strong> was {done === "APPROVED" ? "approved successfully" : "rejected"}.
          </span>
        </div>
        <span className="text-xs text-slate-500 font-mono">Updated</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-slate-700/80 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-white">{request.employee_name}</span>
            <span className="text-xs text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {request.department ?? "General"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span className="text-indigo-300 font-semibold">{request.leave_type_name}</span>
            <span>•</span>
            <span>
              {request.from_date === request.to_date
                ? request.from_date
                : `${request.from_date} → ${request.to_date}`}
            </span>
            <span className="font-bold text-slate-200">({request.working_days} working days)</span>
          </p>
        </div>

        <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-1">
          <span className="font-mono text-xs font-bold text-indigo-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {request.request_ref}
          </span>
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
              ageDays >= 3
                ? "bg-rose-500/10 text-rose-300 border-rose-500/30 animate-pulse"
                : "bg-amber-500/10 text-amber-300 border-amber-500/30"
            }`}
          >
            Pending {ageDays} {ageDays === 1 ? "day" : "days"} {ageDays >= 3 && "⚠️ Delegate Eligible"}
          </span>
        </div>
      </div>

      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-300">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Reason for Leave</div>
        <p className="leading-relaxed whitespace-pre-line">{request.reason}</p>
        {request.attachment_name && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-2 text-indigo-400">
            <span>📎 Supporting Document:</span>
            <span className="underline font-mono">{request.attachment_name}</span>
          </div>
        )}
      </div>

      {delegated && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 flex items-center gap-2">
          <span>ℹ️</span>
          <span>
            Acting as delegate for manager on approved leave — decision will be recorded with HR delegation stamp in audit log.
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-2">
        <div className="flex-1">
          <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
            Approver Comment <span className="text-slate-500">(Required for rejection)</span>
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment or feedback..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={isPending}
            onClick={() => decide("APPROVED")}
            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
          >
            {isPending ? "Processing..." : "✓ Approve"}
          </button>
          <button
            disabled={isPending}
            onClick={() => decide("REJECTED")}
            className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
          >
            {isPending ? "Processing..." : "✕ Reject"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-xl">
          {error}
        </div>
      )}
    </div>
  );
}
