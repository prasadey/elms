"use client";

import { useTransition } from "react";
import { removeHolidayAction } from "@/app/actions";

export default function RemoveHolidayButton({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => { await removeHolidayAction(id); })}
      className="text-xs text-rose-600 hover:underline disabled:opacity-50"
    >
      Remove
    </button>
  );
}
