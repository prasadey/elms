"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";

interface UserOption {
  id: number;
  name: string;
  email: string;
  role: "EMPLOYEE" | "MANAGER" | "HR";
  department: string | null;
}

export default function UserSwitcher({
  currentUserId,
  users,
}: {
  currentUserId: number;
  users: UserOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  function handleSwitch(email: string) {
    setIsOpen(false);
    startTransition(async () => {
      await signIn("dev-directory", { email, callbackUrl: window.location.pathname });
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 hover:bg-slate-800 text-xs text-slate-200 transition-colors shadow-sm"
        title="Quick Switch User (Demo Mode)"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <div className="text-left hidden md:block">
          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
            {currentUser?.name}
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {currentUser?.role}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">{currentUser?.email}</div>
        </div>
        <svg className="w-3.5 h-3.5 text-slate-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-2 text-slate-200 backdrop-blur-xl divide-y divide-slate-800">
            <div className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400 flex items-center justify-between">
              <span>Switch User Role (Demo)</span>
              <span className="text-[9px] bg-slate-800 text-indigo-400 px-1.5 py-0.5 rounded border border-slate-700">7 Accounts</span>
            </div>
            <div className="py-1 max-h-80 overflow-y-auto space-y-1">
              {users.map((u) => {
                const isSelected = u.id === currentUserId;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSwitch(u.email)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 font-medium"
                        : "hover:bg-slate-800/80 text-slate-300"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-100 flex items-center gap-1.5">
                        {u.name}
                        {isSelected && <span className="text-[10px] text-emerald-400">✓</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        u.role === 'HR' 
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : u.role === 'MANAGER'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                      <div className="text-[9px] text-slate-500 mt-0.5">{u.department}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
