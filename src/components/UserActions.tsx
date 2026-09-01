"use client";

import { useState, useTransition } from "react";
import { setUserStatusAction, adjustBalanceAction } from "@/app/actions";
import type { LeaveType, UserStatus } from "@/lib/types";

export default function UserActions({
  userId,
  status,
  leaveTypes,
  year,
}: {
  userId: number;
  status: UserStatus;
  leaveTypes: LeaveType[];
  year: number;
}) {
  const [showAdjust, setShowAdjust] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState(leaveTypes[0]?.id ?? 0);
  const [delta, setDelta] = useState("0");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-3">
        <button
          className="text-xs text-blue-600 hover:underline"
          onClick={() => setShowAdjust((v) => !v)}
        >
          Adjust balance
        </button>
        <button
          disabled={isPending}
          className="text-xs text-slate-500 hover:underline"
          onClick={() =>
            startTransition(async () => {
              await setUserStatusAction(userId, status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
            })
          }
        >
          {status === "ACTIVE" ? "Deactivate" : "Activate"}
        </button>
      </div>

      {showAdjust && (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-2 w-72">
          <div className="flex gap-2">
            <select
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(Number(e.target.value))}
              className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs"
            >
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.5"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              className="w-20 border border-slate-300 rounded px-2 py-1 text-xs"
            />
          </div>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (required)"
            className="w-full border border-slate-300 rounded px-2 py-1 text-xs mt-2"
          />
          {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                if (!reason.trim()) {
                  setError("Reason is required.");
                  return;
                }
                const res = await adjustBalanceAction(userId, leaveTypeId, year, Number(delta), reason.trim());
                if (!res.ok) setError(res.error);
                else {
                  setShowAdjust(false);
                  setReason("");
                  setDelta("0");
                }
              })
            }
            className="mt-2 bg-slate-900 text-white text-xs px-3 py-1 rounded hover:bg-slate-700"
          >
            Apply adjustment
          </button>
        </div>
      )}
    </div>
  );
}
