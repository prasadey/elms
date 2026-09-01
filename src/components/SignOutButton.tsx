import { signOut } from "@/auth";

export default function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/logout" });
      }}
    >
      <button
        type="submit"
        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-all flex items-center gap-1.5 shadow-sm"
        title="Sign Out of Session"
      >
        <span>Sign Out</span>
        <span>🚪</span>
      </button>
    </form>
  );
}
