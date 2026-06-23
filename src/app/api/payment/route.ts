import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createTransaction, verifyTransaction } from "@/lib/fedapay";

export const dynamic = "force-dynamic";

/**
 * POST /api/payment
 * Initie une transaction de paiement FedaPay pour l'achat de freeze
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const product = body.product || "freeze_pack";

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let amount = 500;
    let description = `Achat de Streak Freeze MannaDaily [userId: ${userId}]`;

    if (product === "lingots_100") {
      amount = 500;
      description = `Achat de 100 Lingots MannaDaily [userId: ${userId}]`;
    } else if (product === "lingots_500") {
      amount = 2000;
      description = `Achat de 500 Lingots MannaDaily [userId: ${userId}]`;
    } else if (product === "freeze_pack") {
      amount = 1000;
      description = `Achat de Pack 5 Streak Freezes MannaDaily [userId: ${userId}]`;
    } else if (product === "premium_month") {
      amount = 3000;
      description = `Abonnement Premium MannaDaily 1 mois [userId: ${userId}]`;
    }

    // Récupérer le host name pour le callback
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    
    // Le callback redirige vers le dashboard avec un indicateur de vérification
    const callbackUrl = `${baseUrl}/dashboard?status=verify&payment=${product}`;

    console.log(`Initiation paiement ${product} FedaPay pour ${user.email} (${amount} XOF)`);

    const transaction = await createTransaction(
      amount,
      description,
      user.name || "Ami",
      user.email || `client-${userId}@mannadaily.app`,
      "", // Numéro vide, saisi sur la page hébergée sécurisée
      callbackUrl,
      { userId, product }
    );

    return NextResponse.json({
      paymentUrl: transaction.paymentUrl,
      transactionId: transaction.transactionId,
    });
  } catch (error: unknown) {
    console.error("Error initiating FedaPay payment:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/payment
 * Vérifie le statut d'une transaction FedaPay et crédite le produit
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json({ error: "Missing transactionId" }, { status: 400 });
    }

    console.log(`Verification de la transaction FedaPay : ${transactionId}`);
    const verification = await verifyTransaction(transactionId);

    if (verification.status === "approved") {
      const product = verification.metadata?.product || "freeze_pack";
      let userId = verification.metadata?.userId;

      if (!userId) {
        // Fallback par e-mail
        if (verification.customer.email) {
          const userByEmail = await db.user.findUnique({
            where: { email: verification.customer.email.toLowerCase().trim() },
          });
          userId = userByEmail?.id;
        }
      }

      if (!userId) {
        // Fallback par description
        const desc = (verification as any).description || "";
        const match = desc.match(/\[userId:\s*([^\]]+)\]/);
        if (match && match[1]) {
          userId = match[1];
        }
      }

      if (!userId) {
        return NextResponse.json({ error: "Utilisateur introuvable pour cette transaction" }, { status: 404 });
      }

      // Clé unique pour empêcher le double-crédit
      const txKey = `fedapay_${product}_${transactionId}`;
      const existingTx = await db.xPTransaction.findFirst({
        where: { reason: txKey },
      });

      if (existingTx) {
        console.log(`Transaction FedaPay ${transactionId} déjà créditée.`);
        return NextResponse.json({
          status: "approved",
          product,
          alreadyProcessed: true,
        });
      }

      // Créditer le produit de manière transactionnelle
      await db.$transaction(async (tx) => {
        // 1. Enregistrer la transaction pour empêcher le double-crédit
        await tx.xPTransaction.create({
          data: {
            userId,
            amount: 0,
            reason: txKey,
          },
        });

        // 2. Créditer le produit spécifique
        if (product === "lingots_100") {
          await tx.userProgress.upsert({
            where: { userId },
            update: { lingots: { increment: 100 } },
            create: { userId, totalXP: 0, level: "Semence", lingots: 100 },
          });
        } else if (product === "lingots_500") {
          await tx.userProgress.upsert({
            where: { userId },
            update: { lingots: { increment: 500 } },
            create: { userId, totalXP: 0, level: "Semence", lingots: 500 },
          });
        } else if (product === "freeze_pack") {
          await tx.streakFreeze.upsert({
            where: { userId },
            update: { freezesAvailable: { increment: 5 } },
            create: { userId, freezesAvailable: 5 },
          });
        } else if (product === "premium_month") {
          const now = new Date();
          const premiumUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          await tx.user.update({
            where: { id: userId },
            data: {
              isPremium: true,
              premiumUntil,
            },
          });
        } else {
          // Fallback (ex: 1 freeze)
          await tx.streakFreeze.upsert({
            where: { userId },
            update: { freezesAvailable: { increment: 1 } },
            create: { userId, freezesAvailable: 1 },
          });
        }
      });

      console.log(`Produit ${product} crédité avec succès pour l'utilisateur ${userId}.`);

      return NextResponse.json({
        status: "approved",
        product,
        alreadyProcessed: false,
      });
    }

    return NextResponse.json({
      status: verification.status,
    });
  } catch (error: unknown) {
    console.error("Error verifying payment:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
