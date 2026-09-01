"use client";

import { useState, useTransition } from "react";
import { addHolidayAction } from "@/app/actions";

export default function HolidayForm() {
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await addHolidayAction(date, name);
          if (!res.ok) setError(res.error);
          else {
            setDate("");
            setName("");
          }
        });
      }}
    >
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
        className="border border-slate-300 rounded px-3 py-2 text-sm"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Holiday name"
        required
        className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
      />
      <button
        disabled={isPending}
        className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50"
      >
        Add
      </button>
      {error && <span className="text-sm text-rose-600 self-center">{error}</span>}
    </form>
  );
}
