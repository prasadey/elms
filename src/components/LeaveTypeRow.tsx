"use client";

import { useState, useTransition } from "react";
import { updateLeaveTypeAction } from "@/app/actions";
import type { LeaveType } from "@/lib/types";

export default function LeaveTypeRow({ type }: { type: LeaveType }) {
  const [quota, setQuota] = useState(type.annual_quota ?? "");
  const [cap, setCap] = useState(type.carry_forward_cap ?? "");
  const [active, setActive] = useState(Boolean(type.active));
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function save(nextActive = active) {
    setSaved(false);
    startTransition(async () => {
      await updateLeaveTypeAction(
        type.id,
        quota === "" ? null : Number(quota),
        cap === "" ? null : Number(cap),
        nextActive
      );
      setSaved(true);
    });
  }

  return (
    <div className="grid grid-cols-6 gap-2 px-4 py-2 items-center text-sm">
      <span className="font-mono text-xs text-slate-500">{type.code}</span>
      <span className="col-span-2 text-slate-600 text-xs">
        {type.name}
        <br />
        <span className="text-slate-400">{type.accrual_rule}</span>
      </span>
      <input
        type="number"
        value={quota}
        onChange={(e) => setQuota(e.target.value === "" ? "" : Number(e.target.value))}
        onBlur={() => save()}
        className="w-16 border border-slate-300 rounded px-2 py-1 text-xs"
        placeholder="∞"
      />
      <input
        type="number"
        value={cap}
        onChange={(e) => setCap(e.target.value === "" ? "" : Number(e.target.value))}
        onBlur={() => save()}
        className="w-16 border border-slate-300 rounded px-2 py-1 text-xs"
        placeholder="—"
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => {
            setActive(e.target.checked);
            save(e.target.checked);
          }}
        />
        {isPending && <span className="text-xs text-slate-400">saving…</span>}
        {saved && !isPending && <span className="text-xs text-emerald-600">saved</span>}
      </div>
    </div>
  );
}
