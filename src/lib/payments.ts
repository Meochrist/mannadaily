import { initServerDb } from '@/server/db';

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

  const db = initServerDb();

  try {
    // Vérifier si le paiement a déjà été traité (idempotence)
    const existing = db.prepare('SELECT id FROM payments WHERE providerId = ?').get(providerId);
    if (existing) {
      return { alreadyProcessed: true };
    }

    // Enregistrer le paiement
    db.prepare(`
      INSERT INTO payments (id, provider, providerId, userId, product, amount, status, processedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'approved', ?)
    `).run(crypto.randomUUID(), "fedapay", providerId, userId, product, amount, new Date().toISOString());

    if (product === "lingots_100" || product === "lingots_500") {
      const lingots = product === "lingots_100" ? 100 : 500;
      db.prepare(`
        INSERT INTO user_progress (id, userId, totalXP, level, versesLearned, sessionsTotal, lingots)
        VALUES (?, ?, 0, 'Semence', 0, 0, ?)
        ON CONFLICT(userId) DO UPDATE SET lingots = lingots + ?
      `).run(crypto.randomUUID(), userId, lingots, lingots);
    } else if (product === "freeze_pack") {
      db.prepare(`
        INSERT INTO streak_freeze (id, userId, freezesAvailable, lastUsedAt)
        VALUES (?, ?, 5, NULL)
        ON CONFLICT(userId) DO UPDATE SET freezesAvailable = freezesAvailable + 5
      `).run(crypto.randomUUID(), userId);
    } else {
      // Premium
      const start = new Date();
      db.prepare(`
        UPDATE users SET isPremium = 1, premiumUntil = ?
        WHERE id = ?
      `).run(new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), userId);
    }

    return { alreadyProcessed: false };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return { alreadyProcessed: true };
    }
    throw error;
  }
}
