import webpush from "web-push";
import { db } from "./db";

// Configuration des détails VAPID
const vapidEmail = process.env.VAPID_EMAIL || "mailto:contact@mannadaily.app";
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

/**
 * Génère des clés VAPID uniques.
 * Utile pour le premier paramétrage.
 */
export function generateVAPIDKeys() {
  const keys = webpush.generateVAPIDKeys();
  console.log("\n==================================================");
  console.log("🔑 NOUVELLES CLÉS VAPID GÉNÉRÉES POUR LE PROJET :");
  console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
  console.log("Mettez à jour votre fichier .env.local avec ces clés !");
  console.log("==================================================\n");
  return keys;
}

interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Sauvegarde ou met à jour la subscription Push d'un utilisateur en base de données.
 */
export async function saveSubscription(userId: string, subscription: PushSubscriptionInput) {
  const { endpoint, keys } = subscription;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error("Objet de souscription push invalide.");
  }

  return await db.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    create: {
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });
}

/**
 * Envoie une notification push à tous les appareils abonnés d'un utilisateur.
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  icon?: string
) {
  // Si les clés VAPID ne sont pas configurées, on ignore silencieusement
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn("[WebPush] Les clés VAPID ne sont pas configurées dans l'environnement. Envoi annulé.");
    return;
  }

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return;
  }

  const payload = JSON.stringify({
    title,
    body,
    icon: icon || "/icon-192x192.png",
  });

  const promises = subscriptions.map((sub) => {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    return webpush.sendNotification(pushSub, payload).catch(async (error: any) => {
      // 404 (Not Found) ou 410 (Gone) signifie que la souscription a expiré ou a été révoquée
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log(`[WebPush] Suppression d'un abonnement expiré : ${sub.endpoint}`);
        await db.pushSubscription.delete({
          where: { id: sub.id },
        });
      } else {
        console.error(`[WebPush] Erreur d'envoi à l'endpoint ${sub.endpoint} :`, error);
      }
    });
  });

  await Promise.all(promises);
}
