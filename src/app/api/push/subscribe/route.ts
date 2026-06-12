import { auth } from "@/lib/auth";
import { saveSubscription } from "@/lib/webPush";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { subscription } = body;

    if (!subscription) {
      return NextResponse.json({ error: "Abonnement manquant" }, { status: 400 });
    }

    await saveSubscription(userId, subscription);

    return NextResponse.json({ success: true, message: "Abonnement push enregistré" });
  } catch (error: unknown) {
    console.error("Erreur dans l'API de souscription push :", error);
    const message = error instanceof Error ? error.message : "Erreur interne du serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
