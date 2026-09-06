import { NextResponse } from "next/server";
import { query } from "@/server/db";
import { verifyTransaction } from "@/lib/fedapay";
import { creditApprovedPayment, isPaymentProduct, PAYMENT_PRODUCTS } from "@/lib/payments";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[character] || character));

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const transactionId = String(payload?.entity?.id || "");
    const event = payload?.event;
    if (!/^\d+$/.test(transactionId)) return NextResponse.json({ error: "Invalid transaction" }, { status: 400 });

    if (event === "transaction.canceled" || event === "transaction.declined") {
      return NextResponse.json({ received: true, status: event.split(".")[1] });
    }
    if (event !== "transaction.approved" && !(event === "transaction.update" && payload?.entity?.status === "approved")) {
      return NextResponse.json({ received: true, status: "ignored" });
    }

    const verification = await verifyTransaction(transactionId);
    if (verification.status !== "approved") {
      return NextResponse.json({ error: "Transaction is not approved" }, { status: 400 });
    }

    const metadata = verification.metadata || {};
    const product = metadata.product;
    if (!isPaymentProduct(product)) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

    const metadataUserId = metadata.userId;
    const userId = typeof metadataUserId === "string" ? metadataUserId : null;
    if (!userId) return NextResponse.json({ error: "Missing user identifier" }, { status: 400 });

    const user = await query("SELECT id, name, email FROM users WHERE id = $1", [userId]);
    if (!user[0]) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const result = await creditApprovedPayment({
      providerId: transactionId,
      userId,
      product,
      amount: verification.amount,
    });

    if (!result.alreadyProcessed && user[0].email && resend) {
      const title = escapeHtml(PAYMENT_PRODUCTS[product].title);
      const name = escapeHtml(user[0].name || "Ami");
      await resend.emails.send({
        from: "MannaDaily <onboarding@resend.dev>",
        to: user[0].email,
        subject: "MannaDaily - Confirmation d'achat !",
        html: `<p>Bonjour ${name},</p><p>Votre achat <strong>${title}</strong> a été crédité sur votre compte MannaDaily.</p>`,
      });
    }

    return NextResponse.json({ received: true, status: "approved", ...result });
  } catch (error) {
    console.error("Erreur lors du traitement du webhook FedaPay:", error);
    return NextResponse.json({ error: "Erreur interne lors du traitement du webhook" }, { status: 500 });
  }
}
