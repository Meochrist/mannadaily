import { db } from "@/lib/db";

export const PAYMENT_PRODUCTS = {
  lingots_100: { amount: 500, title: "100 Lingots" },
  lingots_500: { amount: 2000, title: "500 Lingots" },
  freeze_pack: { amount: 1000, title: "Pack 5 Streak Freezes" },
  premium_month: { amount: 3000, title: "Premium 1 mois" },
} as const;

export type PaymentProduct = keyof typeof PAYMENT_PRODUCTS;

export function isPaymentProduct(value: unknown): value is PaymentProduct {
  return typeof value === "string" && value in PAYMENT_PRODUCTS;
}

export async function creditApprovedPayment({
  providerId,
  userId,
  product,
  amount,
}: {
  providerId: string;
  userId: string;
  product: PaymentProduct;
  amount: number;
}) {
  const expected = PAYMENT_PRODUCTS[product].amount;
  if (amount !== expected) throw new Error("Payment amount does not match the selected product");

  return db.$transaction(async (tx) => {
    try {
      await tx.payment.create({
        data: {
          provider: "fedapay",
          providerId,
          userId,
          product,
          amount,
          status: "approved",
          processedAt: new Date(),
        },
      });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        return { alreadyProcessed: true };
      }
      throw error;
    }

    if (product === "lingots_100" || product === "lingots_500") {
      const lingots = product === "lingots_100" ? 100 : 500;
      await tx.userProgress.upsert({
        where: { userId },
        update: { lingots: { increment: lingots } },
        create: { userId, totalXP: 0, level: "Semence", lingots },
      });
    } else if (product === "freeze_pack") {
      await tx.streakFreeze.upsert({
        where: { userId },
        update: { freezesAvailable: { increment: 5 } },
        create: { userId, freezesAvailable: 5 },
      });
    } else {
      const current = await tx.user.findUnique({ where: { id: userId }, select: { premiumUntil: true } });
      const start = current?.premiumUntil && current.premiumUntil > new Date() ? current.premiumUntil : new Date();
      await tx.user.update({
        where: { id: userId },
        data: {
          isPremium: true,
          premiumUntil: new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return { alreadyProcessed: false };
  });
}
