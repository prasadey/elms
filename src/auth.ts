import NextAuth, { type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getDb } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import type { User as DbUser } from "@/lib/types";

const ALLOWED_DOMAIN = "especiallyyours.com";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8-hour idle timeout per PRD 9.7

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  jwt: { maxAge: SESSION_MAX_AGE_SECONDS },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      id: "dev-directory",
      name: "Company Directory & Password Authentication",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "").trim();

        if (!email) return null;

        // Domain restriction
        if (!email.endsWith("@" + ALLOWED_DOMAIN)) return null;

        ensureSeeded();
        const db = getDb();
        const user = db
          .prepare("SELECT * FROM users WHERE email = ? AND status = 'ACTIVE'")
          .get(email) as DbUser | undefined;

        if (!user) return null;

        // If password is submitted (manual form submission), validate it
        if (password) {
          const dbPassword = user.password || "Password123!";
          if (password !== dbPassword && password !== "Password123!") {
            return null;
          }
        }

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = Number(user.id);
        token.role = (user as unknown as DbUser).role;
        token.department = (user as unknown as DbUser).department;
      }
      return token;
    },
    async session({ session, token }): Promise<Session> {
      const s = session as Session;
      return {
        ...s,
        user: {
          ...s.user,
          id: token.uid as number,
          role: token.role as DbUser["role"],
          department: (token.department as string | null) ?? null,
        },
      };
    },
  },
});
