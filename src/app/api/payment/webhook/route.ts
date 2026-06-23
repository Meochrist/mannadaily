import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyTransaction } from "@/lib/fedapay";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    if (!transaction) {
      return NextResponse.json({ error: "No transaction entity found" }, { status: 400 });
    }

    const transactionId = String(transaction.id);

    // 1. Gestion de transaction.canceled
    if (event === "transaction.canceled") {
      console.log(`Webhook FedaPay : Transaction ${transactionId} annulée par le client.`);
      return NextResponse.json({ received: true, status: "canceled" }, { status: 200 });
    }

    // 2. Gestion de transaction.declined
    if (event === "transaction.declined") {
      console.warn(`Webhook FedaPay : Transaction ${transactionId} déclinée/refusée.`);
      
      const customerEmail = transaction.customer?.email;
      if (customerEmail && process.env.RESEND_API_KEY) {
        try {
          await resend.emails.send({
            from: "MannaDaily <onboarding@resend.dev>",
            to: customerEmail,
            subject: "MannaDaily - Échec de votre paiement ❌",
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #ef4444;">Votre paiement a échoué</h2>
                <p>Bonjour,</p>
                <p>Nous vous informons que votre tentative de paiement sur MannaDaily a été déclinée ou refusée par l'opérateur.</p>
                <p>N'hésitez pas à réessayez en choisissant un autre moyen de paiement ou en vérifiant votre solde mobile money.</p>
                <p>À bientôt dans Sa présence,</p>
                <p>L'équipe MannaDaily 🕊️</p>
              </div>
            `
          });
          console.log(`Email de notification de refus envoyé à ${customerEmail}`);
        } catch (mailErr) {
          console.error("Erreur envoi email refus:", mailErr);
        }
      }
      return NextResponse.json({ received: true, status: "declined" }, { status: 200 });
    }

    // 3. Gestion de transaction.approved
    if (event === "transaction.approved" || (event === "transaction.update" && transaction.status === "approved")) {
      // Sécurité : Re-vérifier l'état de la transaction auprès de FedaPay
      const verification = await verifyTransaction(transactionId);
      if (verification.status !== "approved") {
        console.warn(`Webhook FedaPay suspect : Statut ${verification.status} lors de la re-vérification de ${transactionId}`);
        return NextResponse.json({ error: "Statut non approuvé lors de la vérification" }, { status: 400 });
      }

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

      const user = await db.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        console.warn(`Webhook FedaPay : Utilisateur ${userId} introuvable en base`);
        return NextResponse.json({ error: "Utilisateur introuvable en base" }, { status: 404 });
      }

      // Clé unique pour empêcher le double-crédit
      const txKey = `fedapay_${product}_${transactionId}`;
      const existingTx = await db.xPTransaction.findFirst({
        where: { reason: txKey },
      });

      if (existingTx) {
        console.log(`Webhook FedaPay : transaction ${transactionId} déjà créditée.`);
        return NextResponse.json({ received: true, alreadyProcessed: true }, { status: 200 });
      }

      // Créditer de manière transactionnelle
      await db.$transaction(async (tx) => {
        // 1. Enregistrer la clé pour empêcher le double-crédit
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

      console.log(`Webhook FedaPay : Produit ${product} crédité avec succès pour l'utilisateur ${userId}.`);

      // Envoi de l'email de confirmation via Resend
      if (user.email && process.env.RESEND_API_KEY) {
        try {
          let productTitle = "Streak Freeze";
          if (product === "lingots_100") productTitle = "100 Lingots 💎";
          if (product === "lingots_500") productTitle = "500 Lingots 💎";
          if (product === "freeze_pack") productTitle = "Pack 5 Streak Freezes 🧊";
          if (product === "premium_month") productTitle = "Abonnement MannaDaily Premium 👑";

          await resend.emails.send({
            from: "MannaDaily <onboarding@resend.dev>",
            to: user.email,
            subject: "MannaDaily - Confirmation d'achat ! 🎉",
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4f46e5;">Merci pour votre achat sur MannaDaily !</h2>
                <p>Bonjour ${user.name || "Ami"},</p>
                <p>Votre paiement a été approuvé avec succès.</p>
                <p><strong>Produit acheté :</strong> ${productTitle}</p>
                <p>La ressource a été créditée sur votre compte et est disponible dès maintenant dans votre application.</p>
                <p>Merci pour votre soutien !</p>
                <p>À bientôt dans Sa présence,</p>
                <p>L'équipe MannaDaily 🕊️</p>
              </div>
            `
          });
          console.log(`Email de confirmation d'achat envoyé à ${user.email}`);
        } catch (mailErr) {
          console.error("Erreur envoi email confirmation:", mailErr);
        }
      }

      return NextResponse.json({ received: true, status: "approved" }, { status: 200 });
    }

    return NextResponse.json({ received: true, status: "ignored" }, { status: 200 });
  } catch (error: unknown) {
    console.error("Erreur lors du traitement du webhook FedaPay:", error);
    return NextResponse.json(
      { error: "Erreur interne lors du traitement du webhook" },
      { status: 500 }
    );
  }
}
