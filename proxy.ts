import NextAuth from "next-auth";
import authConfig from "./auth.config";

// Next 16: the export MUST be named `proxy` (or default). Runs on Node runtime.
const { auth } = NextAuth(authConfig);
export function proxy(...args: Parameters<typeof auth>): ReturnType<typeof auth> {
  return auth(...args);
}

export const config = {
  // Guard everything except static assets & the auth API.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
