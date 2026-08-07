import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { SESSION_COOKIE_NAME, SESSION_EXPIRES_IN_MS } from "@/lib/session";

/**
 * Shared by parent (email/password) and child (PIN -> custom token) sign-in:
 * both end with a fresh Firebase ID token that gets exchanged here for one
 * httpOnly session cookie, so there's a single session mechanism for both roles.
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "Missing idToken." }, { status: 400 });
    }

    // Reject stale tokens up front; createSessionCookie would also fail, but
    // this gives a clearer error and confirms the token before minting a cookie.
    await adminAuth.verifyIdToken(idToken);

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN_MS,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_EXPIRES_IN_MS / 1000,
    });
    return res;
  } catch (err) {
    console.error("[auth/session]", err);
    return NextResponse.json({ error: "Could not create session." }, { status: 401 });
  }
}
