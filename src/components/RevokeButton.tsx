"use client";

import { useState, useTransition } from "react";
import { revokeRequestAction } from "@/app/actions";

export default function RevokeButton({ requestId }: { requestId: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-rose-600 hover:underline">
        Revoke
      </button>
    );
  }

  return (
    <div className="text-left inline-block w-64 bg-rose-50 border border-rose-200 rounded-md p-2">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for revoking (required)"
        rows={2}
        className="w-full text-xs border border-rose-300 rounded px-2 py-1"
      />
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
      <div className="flex gap-2 mt-2">
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              if (!reason.trim()) {
                setError("Reason is required.");
                return;
              }
              const res = await revokeRequestAction(requestId, reason.trim());
              if (!res.ok) setError(res.error);
              else setOpen(false);
            })
          }
          className="bg-rose-600 text-white text-xs px-2 py-1 rounded hover:bg-rose-700"
        >
          Confirm revoke
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:underline">
          Cancel
        </button>
      </div>
    </div>
  );
}
