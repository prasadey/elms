"use client";

import { useState, useTransition } from "react";
import { addUserAction } from "@/app/actions";
import type { Role } from "@/lib/types";

export default function AddUserForm({ managers }: { managers: { id: number; name: string }[] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123!");
  const [role, setRole] = useState<Role>("EMPLOYEE");
  const [department, setDepartment] = useState("");
  const [managerId, setManagerId] = useState<number | "">(managers[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 grid sm:grid-cols-2 gap-4 shadow-xl"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        startTransition(async () => {
          const res = await addUserAction(
            name,
            email,
            role,
            department,
            role === "EMPLOYEE" ? (managerId === "" ? null : Number(managerId)) : null,
            password
          );
          if (!res.ok) {
            setError(res.error);
          } else {
            setSuccess(true);
            setName("");
            setEmail("");
            setDepartment("");
            setPassword("Password123!");
          }
        });
      }}
    >
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Full Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Anish Kumar"
          required
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@especiallyyours.com"
          required
          type="email"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Initial Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password123!"
          required
          type="text"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="EMPLOYEE">Employee</option>
          <option value="MANAGER">Manager</option>
          <option value="HR">HR</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Department</label>
        <input
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="e.g. Engineering"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {role === "EMPLOYEE" && (
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Reporting Manager</label>
          <select
            value={managerId}
            onChange={(e) => setManagerId(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">No manager</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                Reports to {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="sm:col-span-2 flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50 shadow-md"
        >
          {isPending ? "Adding User..." : "+ Add New User"}
        </button>
        {error && <span className="text-xs text-rose-400 font-medium">⚠️ {error}</span>}
        {success && <span className="text-xs text-emerald-400 font-medium">✓ User successfully added.</span>}
      </div>
    </form>
  );
}
