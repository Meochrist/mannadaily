import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate a secure random token for the widget
    const token = crypto.randomBytes(32).toString("hex");

    // Store the token in the user's record
    await db.user.update({
      where: { id: session.user.id },
      data: { widgetToken: token },
    });

    return NextResponse.json({ token, userId: session.user.id });
  } catch (error: unknown) {
    console.error("Error generating widget token:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
