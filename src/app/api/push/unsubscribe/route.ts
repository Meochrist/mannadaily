import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const { endpoint } = body;

    if (endpoint) {
      // Supprimer l'abonnement pour cet endpoint spécifique
      await db.pushSubscription.deleteMany({
        where: {
          userId,
          endpoint,
        },
      });
    } else {
      // Par défaut, supprimer toutes les souscriptions de l'utilisateur connecté
      await db.pushSubscription.deleteMany({
        where: {
          userId,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Désabonnement push réussi" });
  } catch (error: unknown) {
    console.error("Erreur dans l'API de désabonnement push :", error);
    const message = error instanceof Error ? error.message : "Erreur interne du serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
