import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    // Sauvegarder le token FCM
    await db.pushSubscription.upsert({
      where: {
        endpoint: token,
      },
      update: {
        userId: session.user.id,
        p256dh: token,
        auth: token,
      },
      create: {
        userId: session.user.id,
        endpoint: token,
        p256dh: token,
        auth: token,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur register push:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
