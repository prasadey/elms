import { ensureSeeded } from "@/lib/seed";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; logged_out?: string }>;
}) {
  ensureSeeded();
  const { callbackUrl, error, logged_out } = await searchParams;
  const target = callbackUrl && callbackUrl !== "/login" ? callbackUrl : "/dashboard";

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: Animated illustration ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col items-center justify-center bg-gradient-to-br from-[#0a0e27] via-[#0f1640] to-[#0a0e27]">

        {/* Animated glow orbs */}
        <div className="absolute top-[-80px] left-[-80px] w-80 h-80 bg-indigo-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 bg-purple-600/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 right-20 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

        {/* Floating decorative circles */}
        <div className="absolute top-16 right-24 w-3 h-3 bg-indigo-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: "0.3s" }} />
        <div className="absolute top-32 left-20 w-2 h-2 bg-teal-400 rounded-full opacity-40 animate-bounce" style={{ animationDelay: "0.8s" }} />
        <div className="absolute bottom-32 left-16 w-4 h-4 bg-purple-400 rounded-full opacity-50 animate-bounce" style={{ animationDelay: "1.5s" }} />
        <div className="absolute bottom-20 right-32 w-2 h-2 bg-indigo-300 rounded-full opacity-50 animate-bounce" style={{ animationDelay: "0.5s" }} />

        <div className="relative z-10 flex flex-col items-center text-center px-10">
          {/* Logo mark */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-indigo-500/40 mb-6">
            E
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">EspeciallyYours</h1>
          <p className="text-indigo-300 font-medium mb-10">Leave Management System</p>

          {/* SVG Illustration */}
          <div className="w-full max-w-sm mb-10">
            <svg viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-2xl">
              {/* Background card */}
              <rect x="20" y="20" width="360" height="240" rx="20" fill="#1e2a5e" fillOpacity="0.7" stroke="#4f46e5" strokeWidth="1.5" strokeOpacity="0.4" />

              {/* Calendar grid */}
              <rect x="40" y="45" width="160" height="130" rx="12" fill="#111827" stroke="#374151" strokeWidth="1" />
              <rect x="40" y="45" width="160" height="32" rx="12" fill="#4f46e5" />
              <rect x="40" y="65" width="160" height="12" rx="0" fill="#4f46e5" />
              <text x="120" y="66" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">August 2026</text>
              {/* Day headers */}
              {["M","T","W","T","F","S","S"].map((d, i) => (
                <text key={i} x={52 + i * 21} y="95" textAnchor="middle" fill="#9ca3af" fontSize="8" fontWeight="bold">{d}</text>
              ))}
              {/* Calendar days */}
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21].map((n, i) => {
                const row = Math.floor(i / 7);
                const col = i % 7;
                const isHighlighted = [11,12,13].includes(n);
                const isToday = n === 24;
                return (
                  <g key={n}>
                    {isHighlighted && <rect x={44 + col * 21} y={100 + row * 18} width="18" height="14" rx="4" fill="#14b8a6" fillOpacity="0.3" />}
                    {isToday && <rect x={44 + col * 21} y={100 + row * 18} width="18" height="14" rx="4" fill="#4f46e5" />}
                    <text x={53 + col * 21} y={111 + row * 18} textAnchor="middle" fill={isToday ? "white" : isHighlighted ? "#14b8a6" : "#d1d5db"} fontSize="9">{n}</text>
                  </g>
                );
              })}
              {/* Check marks on highlighted */}
              <text x="71" y="110" fill="#14b8a6" fontSize="9">✓</text>
              <text x="92" y="110" fill="#14b8a6" fontSize="9">✓</text>

              {/* Approval badge */}
              <rect x="220" y="40" width="140" height="80" rx="14" fill="#111827" stroke="#374151" strokeWidth="1" />
              <circle cx="248" cy="72" r="16" fill="#14b8a680" />
              <text x="248" y="77" textAnchor="middle" fill="#14b8a6" fontSize="16" fontWeight="bold">✓</text>
              <text x="272" y="62" fill="#e5e7eb" fontSize="9" fontWeight="bold">Approved</text>
              <text x="272" y="76" fill="#9ca3af" fontSize="8">by Chandu</text>
              <text x="272" y="89" fill="#6b7280" fontSize="7">Aug 13, 2026</text>

              {/* Status chips */}
              <rect x="220" y="135" width="140" height="36" rx="10" fill="#111827" stroke="#374151" strokeWidth="1" />
              <rect x="232" y="143" width="50" height="18" rx="5" fill="#14b8a620" stroke="#14b8a640" strokeWidth="1" />
              <text x="257" y="155" textAnchor="middle" fill="#14b8a6" fontSize="8" fontWeight="bold">APPROVED</text>
              <rect x="292" y="143" width="56" height="18" rx="5" fill="#f59e0b20" stroke="#f59e0b40" strokeWidth="1" />
              <text x="320" y="155" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="bold">PENDING</text>

              {/* Leave balance arcs */}
              <rect x="40" y="185" width="320" height="60" rx="12" fill="#111827" stroke="#374151" strokeWidth="1" />
              {[
                { label: "CL", pct: 70, color: "#4f46e5", x: 75 },
                { label: "SL", pct: 50, color: "#14b8a6", x: 155 },
                { label: "EL", pct: 85, color: "#8b5cf6", x: 235 },
                { label: "LOP", pct: 20, color: "#f59e0b", x: 315 },
              ].map(({ label, pct, color, x }) => (
                <g key={label}>
                  <rect x={x - 30} y="193" width="60" height="6" rx="3" fill="#374151" />
                  <rect x={x - 30} y="193" width={60 * pct / 100} height="6" rx="3" fill={color} />
                  <text x={x} y="212" textAnchor="middle" fill="#9ca3af" fontSize="8" fontWeight="bold">{label}</text>
                  <text x={x} y="225" textAnchor="middle" fill={color} fontSize="9" fontWeight="bold">{pct}%</text>
                </g>
              ))}
            </svg>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {["Multi-stage Approvals", "Leave Balance Tracking", "Team Calendar", "Email Alerts"].map((f) => (
              <span key={f} className="text-xs bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 px-3 py-1 rounded-full backdrop-blur">
                ✓ {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: Login form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-950 relative overflow-hidden">
        {/* Subtle bg pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #818cf8 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center font-black text-white text-xl shadow-lg">E</div>
            <h1 className="mt-2 text-2xl font-extrabold text-white">EspeciallyYours ELMS</h1>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome back 👋</h2>
            <p className="text-sm text-slate-400 mt-1">Sign in to your company account to continue.</p>
          </div>

          {logged_out && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <span>✓</span><span>You have been logged out of all active sessions.</span>
            </div>
          )}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-4 py-3 rounded-xl">
              Sign-in failed. Please check your credentials.
            </div>
          )}

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-7 shadow-2xl backdrop-blur-xl">
            <LoginForm callbackUrl={target} />
          </div>

          <p className="text-center text-[11px] text-slate-500">
            Restricted to <span className="font-mono text-slate-400">@especiallyyours.com</span> accounts only.
          </p>
        </div>
      </div>
    </div>
  );
}
