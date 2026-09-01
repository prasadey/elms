"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyLeaveAction } from "@/app/actions";
import type { HalfDayFlag } from "@/lib/types";

interface LeaveTypeOption {
  id: number;
  code: string;
  name: string;
  available: number;
  halfDayAllowed: boolean;
  backdateDays: number;
  minNoticeDays: number;
  requiresDocument: boolean;
}

function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr + "T00:00:00Z").getUTCDay();
  return day === 0 || day === 6;
}

function computeWorkingDays(from: string, to: string, half: HalfDayFlag, holidays: Set<string>): number {
  if (!from || !to || to < from) return 0;
  if (half !== "NONE") {
    if (from !== to) return 0;
    return isWeekend(from) || holidays.has(from) ? 0 : 0.5;
  }
  let count = 0;
  let cur = from;
  while (cur <= to) {
    if (!isWeekend(cur) && !holidays.has(cur)) count += 1;
    const d = new Date(cur + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1);
    cur = d.toISOString().slice(0, 10);
  }
  return count;
}

export default function ApplyLeaveForm({
  leaveTypes,
  holidayDates,
  today,
}: {
  leaveTypes: LeaveTypeOption[];
  holidayDates: string[];
  today: string;
}) {
  const router = useRouter();
  const holidays = useMemo(() => new Set(holidayDates), [holidayDates]);

  const [leaveTypeId, setLeaveTypeId] = useState(leaveTypes[0]?.id ?? 0);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [halfDayFlag, setHalfDayFlag] = useState<HalfDayFlag>("NONE");
  const [reason, setReason] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [insufficientPrompt, setInsufficientPrompt] = useState<{
    leaveTypeCode: string;
    available: number;
    requested: number;
  } | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  const selectedType = leaveTypes.find((t) => t.id === leaveTypeId);
  const workingDays = computeWorkingDays(fromDate, toDate, halfDayFlag, holidays);

  function submit(confirmLopConversion: boolean) {
    setError(null);
    setInsufficientPrompt(null);
    startTransition(async () => {
      const res = await applyLeaveAction({
        leaveTypeId,
        fromDate,
        toDate,
        halfDayFlag,
        reason,
        contactNumber: contactNumber || null,
        attachmentName,
        confirmLopConversion,
      });
      if (!res.ok) {
        if (res.code === "INSUFFICIENT_BALANCE") {
          setInsufficientPrompt(res.meta as { leaveTypeCode: string; available: number; requested: number });
        } else {
          setError(res.error);
        }
        return;
      }
      setSuccessRef(res.data.requestRef);
      setTimeout(() => router.push("/dashboard"), 1500);
    });
  }

  if (successRef) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-3">
        <div className="text-4xl">🎉</div>
        <h2 className="text-xl font-extrabold text-emerald-300">Request Submitted Successfully!</h2>
        <p className="text-sm text-slate-300 font-mono">
          Request ID: <strong className="text-emerald-400">{successRef}</strong>
        </p>
        <p className="text-xs text-slate-400">
          Your manager has been notified and will review your request. Redirecting to dashboard…
        </p>
      </div>
    );
  }

  return (
    <form
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl"
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
    >
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Select Leave Type
        </label>
        <select
          value={leaveTypeId}
          onChange={(e) => setLeaveTypeId(Number(e.target.value))}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
        >
          {leaveTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.code}) — {t.available} days available
            </option>
          ))}
        </select>
        {selectedType && (
          <div className="mt-2 text-xs text-slate-400 flex flex-wrap gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Code: {selectedType.code}
            </span>
            {selectedType.minNoticeDays > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Notice: {selectedType.minNoticeDays} days required for 3+ days
              </span>
            )}
            {selectedType.backdateDays > 0 && (
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                Backdating allowed up to {selectedType.backdateDays} days
              </span>
            )}
            {selectedType.requiresDocument && (
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                Medical Certificate required for 3+ days
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">From Date</label>
          <input
            type="date"
            value={fromDate}
            min={selectedType && selectedType.backdateDays > 0 ? undefined : today}
            onChange={(e) => {
              setFromDate(e.target.value);
              if (e.target.value > toDate) setToDate(e.target.value);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">To Date</label>
          <input
            type="date"
            value={toDate}
            min={fromDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
      </div>

      {selectedType?.halfDayAllowed && (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Half-Day Selection
          </label>
          <select
            value={halfDayFlag}
            onChange={(e) => setHalfDayFlag(e.target.value as HalfDayFlag)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="NONE">Full Day(s)</option>
            <option value="FIRST_HALF">First Half Only (0.5 day)</option>
            <option value="SECOND_HALF">Second Half Only (0.5 day)</option>
          </select>
        </div>
      )}

      {/* Live Working Days Calculation Badge */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Total Working Days Deducted</div>
          <div className="text-xs text-slate-500 mt-0.5">Excludes weekends &amp; official company holidays</div>
        </div>
        <div className="text-2xl font-extrabold text-indigo-400 font-mono">
          {workingDays} <span className="text-xs text-slate-400 font-normal">days</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Reason for Leave <span className="text-slate-500 font-normal">(Min 10 characters)</span>
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Please state clear reasons for leave request..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          required
          minLength={10}
        />
        <div className="text-[11px] text-slate-500 mt-1 text-right">
          {reason.length} / 10 min chars
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Contact Number <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <input
            type="tel"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            placeholder="+91 9876543210"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Attachment {selectedType?.requiresDocument && workingDays >= 3 && <span className="text-rose-400">*</span>}
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg"
            onChange={(e) => setAttachmentName(e.target.files?.[0]?.name ?? null)}
            className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-indigo-300 hover:file:bg-slate-700 cursor-pointer"
          />
          <p className="text-[11px] text-slate-500 mt-1">PDF or JPG, max 5MB</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-4 py-3 rounded-xl">
          ⚠️ {error}
        </div>
      )}

      {insufficientPrompt && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs p-4 rounded-xl space-y-3">
          <p className="font-semibold">
            Insufficient {insufficientPrompt.leaveTypeCode} balance: You have {insufficientPrompt.available} days available, but requested {insufficientPrompt.requested} days.
          </p>
          <p className="text-slate-300">
            Per company policy, you can convert excess leave days to <strong>Loss of Pay (LOP)</strong>. Would you like to proceed?
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              disabled={isPending}
              onClick={() => submit(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all"
            >
              Convert to LOP &amp; Submit Request
            </button>
            <button
              type="button"
              onClick={() => setInsufficientPrompt(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {workingDays <= 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs p-3 rounded-xl">
          Note: This date range falls entirely on weekends or company holidays. No working days will be deducted.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !reason || reason.trim().length < 10 || workingDays <= 0}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 active:scale-95"
      >
        {isPending ? "Submitting Request..." : "Submit Leave Application"}
      </button>
    </form>
  );
}
