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
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Récupérer le host name pour le callback
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    
    // Le callback redirige vers le dashboard avec un indicateur de vérification
    const callbackUrl = `${baseUrl}/dashboard?status=verify&payment=freeze`;

    console.log(`Initiation paiement Streak Freeze FedaPay pour ${user.email} (500 XOF)`);

    const transaction = await createTransaction(
      500, // 500 XOF
      `Achat de Streak Freeze MannaDaily [userId: ${userId}]`,
      user.name || "Ami",
      user.email || `client-${userId}@mannadaily.app`,
      "", // Numéro vide, saisi sur la page hébergée sécurisée
      callbackUrl
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
 * Vérifie le statut d'une transaction FedaPay et crédite le freeze
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
      // Rechercher l'utilisateur par e-mail
      let user = null;
      if (verification.customer.email) {
        user = await db.user.findUnique({
          where: { email: verification.customer.email.toLowerCase().trim() },
        });
      }

      let userId = user?.id;

      // Clé unique pour éviter le double-crédit
      const txKey = `fedapay_freeze_${transactionId}`;
      const existingTx = await db.xPTransaction.findFirst({
        where: { reason: txKey },
      });

      if (existingTx) {
        // Déjà crédité
        console.log(`Transaction FedaPay ${transactionId} déjà créditée.`);
        
        // Récupérer le solde actuel de freezes
        const freeze = await db.streakFreeze.findUnique({
          where: { userId: userId || "" },
        });

        return NextResponse.json({
          status: "approved",
          freezesAvailable: freeze ? freeze.freezesAvailable : 0,
          alreadyProcessed: true,
        });
      }

      if (!userId) {
        // Fallback: Si l'utilisateur n'est pas trouvé par email, on cherche dans la description de la transaction
        // Notre format : "Achat de Streak Freeze MannaDaily [userId: CLID]"
        const desc = (verification as any).description || "";
        const match = desc.match(/\[userId:\s*([^\]]+)\]/);
        if (match && match[1]) {
          userId = match[1];
        }
      }

      if (!userId) {
        return NextResponse.json({ error: "Utilisateur introuvable pour cette transaction" }, { status: 404 });
      }

      // Créditer le freeze au joueur de manière transactionnelle
      const result = await db.$transaction(async (tx) => {
        // 1. Enregistrer la transaction pour empêcher le double-crédit
        await tx.xPTransaction.create({
          data: {
            userId,
            amount: 0,
            reason: txKey,
          },
        });

        // 2. Créditer le freeze
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

      console.log(`Streak Freeze crédité avec succès pour l'utilisateur ${userId}. Nouveaux freezes dispos : ${result.freezesAvailable}`);

      return NextResponse.json({
        status: "approved",
        freezesAvailable: result.freezesAvailable,
        alreadyProcessed: false,
      });
    }

    return NextResponse.json({
      status: verification.status,
      freezesAvailable: 0,
    });
  } catch (error: unknown) {
    console.error("Error verifying payment:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
