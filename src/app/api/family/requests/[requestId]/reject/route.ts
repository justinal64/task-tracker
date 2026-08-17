import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { requireParentSession } from "@/lib/session";
import type { PrivilegeRequest } from "@/lib/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await requireParentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { requestId } = await params;

    const familyRef = db.collection("families").doc(user.familyId);
    const requestRef = familyRef.collection("requests").doc(requestId);
    const requestSnap = await requestRef.get();
    if (!requestSnap.exists) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const request = requestSnap.data() as PrivilegeRequest;
    if (request.status !== "pending") {
      return NextResponse.json({ error: "This request isn't awaiting approval." }, { status: 400 });
    }

    await requestRef.update({ status: "rejected", resolvedAt: Date.now(), resolvedBy: user.uid });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[requests/reject]", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
