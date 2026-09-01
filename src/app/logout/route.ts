import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const cookieStore = await cookies();
  
  // Clear all Auth.js / NextAuth session cookies
  cookieStore.delete("authjs.session-token");
  cookieStore.delete("__Secure-authjs.session-token");
  cookieStore.delete("authjs.csrf-token");
  cookieStore.delete("authjs.callback-url");
  cookieStore.delete("next-auth.session-token");
  cookieStore.delete("__Secure-next-auth.session-token");

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("logged_out", "1");

  return NextResponse.redirect(loginUrl, {
    headers: {
      "Set-Cookie": "authjs.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly",
    },
  });
}
