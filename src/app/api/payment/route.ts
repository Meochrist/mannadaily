import { NextResponse } from "next/server";
import { createTransaction, verifyTransaction } from "@/lib/fedapay";
import { creditApprovedPayment, isPaymentProduct, PAYMENT_PRODUCTS } from "@/lib/payments";
import { query } from "@/server/db";

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

function publicBaseUrl() {
  return process.env.NEXTAUTH_URL || "https://mannadaily.vercel.app";
}

async function resolveUserId(metadata: Record<string, unknown>, customerEmail?: string) {
  if (typeof metadata.userId === "string" && metadata.userId) return metadata.userId;
  if (!customerEmail) return null;
  
  const user = await query("SELECT id FROM users WHERE email = $1", [customerEmail.trim().toLowerCase()]);
  return user[0]?.id ?? null;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = decodeToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;
    const body = await req.json();
    const product = body?.product;
    if (!isPaymentProduct(product)) return NextResponse.json({ error: "Invalid product" }, { status: 400 });

    const user = await query("SELECT name, email FROM users WHERE id = $1", [userId]);
    if (!user[0]) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const callbackUrl = `${publicBaseUrl()}/shop?status=verify&payment=${product}`;
    const transaction = await createTransaction(
      PAYMENT_PRODUCTS[product].amount,
      `${PAYMENT_PRODUCTS[product].title} MannaDaily`,
      user[0].name || "Ami",
      user[0].email || `client-${userId}@mannadaily.app`,
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
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = decodeToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const currentUserId = decoded.userId;
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
