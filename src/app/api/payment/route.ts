import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createTransaction, verifyTransaction } from "@/lib/fedapay";
import { creditApprovedPayment, isPaymentProduct, PAYMENT_PRODUCTS } from "@/lib/payments";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function publicBaseUrl() {
  return process.env.NEXTAUTH_URL || "https://mannadaily.vercel.app";
}

async function resolveUserId(metadata: Record<string, unknown>, customerEmail?: string) {
  if (typeof metadata.userId === "string" && metadata.userId) return metadata.userId;
  if (!customerEmail) return null;
  const user = await db.user.findUnique({ where: { email: customerEmail.trim().toLowerCase() }, select: { id: true } });
  return user?.id ?? null;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const product = body?.product;
    if (!isPaymentProduct(product)) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

    const user = await db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const callbackUrl = `${publicBaseUrl()}/shop?status=verify&payment=${product}`;
    const transaction = await createTransaction(
      PAYMENT_PRODUCTS[product].amount,
      `${PAYMENT_PRODUCTS[product].title} MannaDaily`,
      user.name || "Ami",
      user.email || `client-${userId}@mannadaily.app`,
      "",
      callbackUrl,
      { userId, product },
    );

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error initiating FedaPay payment:", error);
    return NextResponse.json({ error: "Unable to initiate payment" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const transactionId = new URL(req.url).searchParams.get("transactionId");
    if (!transactionId || !/^\d+$/.test(transactionId)) {
      return NextResponse.json({ error: "Invalid transactionId" }, { status: 400 });
    }

    const verification = await verifyTransaction(transactionId);
    if (verification.status !== "approved") return NextResponse.json({ status: verification.status });

    const metadata = verification.metadata || {};
    const product = metadata.product;
    if (!isPaymentProduct(product)) return NextResponse.json({ error: "Invalid payment product" }, { status: 400 });

    const userId = await resolveUserId(metadata, verification.customer.email);
    if (!userId || userId !== currentUserId) return NextResponse.json({ error: "Payment does not belong to this user" }, { status: 403 });

    const result = await creditApprovedPayment({
      providerId: transactionId,
      userId,
      product,
      amount: verification.amount,
    });

    return NextResponse.json({ status: "approved", product, ...result });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json({ error: "Unable to verify payment" }, { status: 500 });
  }
}
