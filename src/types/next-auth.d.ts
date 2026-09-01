import type { Role } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      role: Role;
      department: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: Role;
    department?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: number;
    role?: Role;
    department?: string | null;
  }
}