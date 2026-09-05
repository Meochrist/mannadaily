import { NextResponse } from "next/server";
import { initServerDb } from "@/server/db";

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

    const db = initServerDb();

    const existing = db.prepare("SELECT id FROM push_subscriptions WHERE endpoint = ?").get(fcmToken);

    if (existing) {
      db.prepare("UPDATE push_subscriptions SET userId = ? WHERE endpoint = ?").run(userId, fcmToken);
    } else {
      db.prepare(`
        INSERT INTO push_subscriptions (id, userId, endpoint, p256dh, auth) VALUES (?, ?, ?, ?, ?)
      `).run(crypto.randomUUID(), userId, fcmToken, fcmToken, fcmToken);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur register push:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
