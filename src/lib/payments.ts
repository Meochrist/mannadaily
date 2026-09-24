import { query, queryOne, execute } from '@/server/db';

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

  try {
    // Vérifier si le paiement a déjà été traité (idempotence)
    const existing = await queryOne('SELECT id FROM payments WHERE providerId = $1', [providerId]);
    if (existing) {
      return { alreadyProcessed: true };
    }

    // Enregistrer le paiement
    await execute(`
      INSERT INTO payments (id, provider, providerId, userId, product, amount, status, processedAt)
      VALUES ($1, $2, $3, $4, $5, $6, 'approved', $7)
    `, [crypto.randomUUID(), "fedapay", providerId, userId, product, amount, new Date().toISOString()]);

    if (product === "lingots_100" || product === "lingots_500") {
      const lingots = product === "lingots_100" ? 100 : 500;
      await execute(`
        INSERT INTO user_progress (id, userId, totalXP, level, versesLearned, sessionsTotal, lingots)
        VALUES ($1, $2, 0, 'Semence', 0, 0, $3)
        ON CONFLICT (userId) DO UPDATE SET lingots = user_progress.lingots + $4
      `, [crypto.randomUUID(), userId, lingots, lingots]);
    } else if (product === "freeze_pack") {
      await execute(`
        INSERT INTO streak_freeze (id, userId, freezesAvailable, lastUsedAt)
        VALUES ($1, $2, 5, NULL)
        ON CONFLICT (userId) DO UPDATE SET freezesAvailable = streak_freeze.freezesAvailable + 5
      `, [crypto.randomUUID(), userId]);
    } else {
      // Premium
      const start = new Date();
      await execute(`
        UPDATE users SET isPremium = 1, premiumUntil = $1
        WHERE id = $2
      `, [new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), userId]);
    }

    return { alreadyProcessed: false };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return { alreadyProcessed: true };
    }
    throw error;
  }
}
