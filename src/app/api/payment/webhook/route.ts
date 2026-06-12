import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyTransaction } from "@/lib/fedapay";

export const dynamic = "force-dynamic";

/**
 * POST /api/payment/webhook
 * Traite les notifications asynchrones instantanées (Webhooks) de FedaPay
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("Webhook FedaPay reçu :", JSON.stringify(payload));

    const event = payload.event;
    const transaction = payload.entity;

    if (event === "transaction.approved" && transaction && transaction.status === "approved") {
      const transactionId = String(transaction.id);
      
      // Sécurité : Re-vérifier l'état de la transaction directement auprès de FedaPay
      const verification = await verifyTransaction(transactionId);
      if (verification.status !== "approved") {
        console.warn(`Webhook FedaPay suspect : FedaPay renvoie le statut ${verification.status} lors de la re-vérification de ${transactionId}`);
        return NextResponse.json({ error: "Statut non approuvé lors de la vérification" }, { status: 400 });
      }

      // Clé unique pour empêcher le double-crédit
      const txKey = `fedapay_freeze_${transactionId}`;
      const existingTx = await db.xPTransaction.findFirst({
        where: { reason: txKey },
      });

      if (existingTx) {
        console.log(`Webhook FedaPay : transaction ${transactionId} déjà créditée.`);
        return NextResponse.json({ received: true, alreadyProcessed: true }, { status: 200 });
      }

      // Rechercher l'utilisateur par e-mail
      let user = null;
      if (verification.customer.email) {
        user = await db.user.findUnique({
          where: { email: verification.customer.email.toLowerCase().trim() },
        });
      }

      let userId = user?.id;

      if (!userId) {
        // Fallback: description
        const desc = transaction.description || "";
        const match = desc.match(/\[userId:\s*([^\]]+)\]/);
        if (match && match[1]) {
          userId = match[1];
        }
      }

      if (!userId) {
        console.warn(`Webhook FedaPay : Impossible d'identifier l'utilisateur pour la transaction ${transactionId}`);
        return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
      }

      // Créditer de manière transactionnelle
      const result = await db.$transaction(async (tx) => {
        await tx.xPTransaction.create({
          data: {
            userId,
            amount: 0,
            reason: txKey,
          },
        });

        const streakFreeze = await tx.streakFreeze.upsert({
          where: { userId },
          update: {
            freezesAvailable: { increment: 1 },
          },
          create: {
            userId,
            freezesAvailable: 1,
          },
        });

        return streakFreeze;
      });

      console.log(`Webhook FedaPay : Streak Freeze crédité avec succès pour l'utilisateur ${userId}. Total : ${result.freezesAvailable}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("Erreur lors du traitement du webhook FedaPay:", error);
    return NextResponse.json(
      { error: "Erreur interne lors du traitement du webhook" },
      { status: 500 }
    );
  }
}
