import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: "Firebase admin not configured" }, { status: 500 });
    }

    const snapshot = await adminDb.collection("staff").get();
    const staffMembers = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      role: doc.data().role,
      status: doc.data().status,
    }));

    return NextResponse.json({
      count: snapshot.size,
      staff: staffMembers,
    });
  } catch (error) {
    console.error("staff-count error", error);
    return NextResponse.json({ error: "Failed to fetch staff count" }, { status: 500 });
  }
}
