import { NextResponse } from "next/server";
import { execute } from "@/server/db";

export const dynamic = "force-dynamic";

function decodeToken(token: string): { userId: string; email: string; exp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: payload.userId, email: payload.email, exp: payload.exp };
  } catch {
    return null;
  }
}

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = decodeToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;
    const body = await req.json().catch(() => ({}));
    const { endpoint } = body;

    if (endpoint) {
      await execute("DELETE FROM push_subscriptions WHERE userId = $1 AND endpoint = $2", [userId, endpoint]);
    } else {
      await execute("DELETE FROM push_subscriptions WHERE userId = $1", [userId]);
    }

    return NextResponse.json({ success: true, message: "Désabonnement push réussi" });
  } catch (error: unknown) {
    console.error("Erreur dans l'API de désabonnement push :", error);
    const message = error instanceof Error ? error.message : "Erreur interne du serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
