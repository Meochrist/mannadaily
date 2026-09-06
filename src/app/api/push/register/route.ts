import { NextResponse } from "next/server";
import { query, queryOne, execute } from "@/server/db";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const userId = decoded.userId;

    const { token: fcmToken } = await req.json();
    if (!fcmToken) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    const existing = await queryOne("SELECT id FROM push_subscriptions WHERE endpoint = $1", [fcmToken]);

    if (existing) {
      await execute("UPDATE push_subscriptions SET userId = $1 WHERE endpoint = $2", [userId, fcmToken]);
    } else {
      await execute(`INSERT INTO push_subscriptions (id, userId, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4, $5)`,
        [crypto.randomUUID(), userId, fcmToken, fcmToken, fcmToken]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur register push:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
