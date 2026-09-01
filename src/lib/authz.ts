import { auth } from "@/auth";
import type { Role } from "@/lib/types";

export class ForbiddenError extends Error {
  status = 403;
  constructor(message = "Forbidden") {
    super(message);
  }
}

export class UnauthorizedError extends Error {
  status = 401;
  constructor(message = "Unauthorized") {
    super(message);
  }
}

export interface SessionUser {
  id: number;
  role: Role;
  department: string | null;
  name: string;
  email: string;
}

/** Resolves the authenticated user server-side, or throws. Call this at the
 * top of every server action / route handler — never trust the client. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  return {
    id: session.user.id,
    role: session.user.role,
    department: session.user.department,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  };
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new ForbiddenError();
  return user;
}
