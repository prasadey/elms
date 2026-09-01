"use client";

import { useState, useTransition } from "react";
import { cancelRequestAction } from "@/app/actions";

export default function CancelButton({ requestId }: { requestId: number }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="inline-block text-right">
      <button
        disabled={isPending}
        onClick={() => {
          if (!confirm("Cancel this leave request?")) return;
          setError(null);
          startTransition(async () => {
            const res = await cancelRequestAction(requestId);
            if (!res.ok) setError(res.error);
          });
        }}
        className="text-xs text-rose-600 hover:underline disabled:opacity-50"
      >
        Cancel
      </button>
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}
