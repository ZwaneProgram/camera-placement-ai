import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}

// @auth/core imports JWT directly from "@auth/core/jwt", so the session
// callback's token parameter uses that type — augment it here too.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
