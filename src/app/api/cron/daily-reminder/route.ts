import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRandomNotification } from "@/lib/notifications";
import { generateNotificationEmail } from "@/lib/emailTemplates";
import { sendPushNotification } from "@/lib/webPush";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET env variable is not configured");
      return NextResponse.json({ error: "Non autorisé - Secret non configuré" }, { status: 401 });
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const now = new Date();
    const hours = now.getUTCHours();

    // Détermination de la situation selon l'heure UTC du cron Vercel
    let situation: "morning" | "midday" | "evening" | "urgent" = "morning";
    if (hours === 7) {
      situation = "morning";
    } else if (hours === 12) {
      situation = "midday";
    } else if (hours === 18) {
      situation = "evening";
    } else if (hours === 21) {
      situation = "urgent";
    } else {
      // Choix par défaut basé sur l'heure
      if (hours < 10) situation = "morning";
      else if (hours < 15) situation = "midday";
      else if (hours < 20) situation = "evening";
      else situation = "urgent";
    }

    // Récupérer le début de la journée d'aujourd'hui en UTC
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    // Trouver les utilisateurs ayant déjà médité aujourd'hui
    const sessionsToday = await db.dailySession.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
      select: {
        userId: true,
      },
    });

    const meditatedUserIds = Array.from(new Set(sessionsToday.map((s) => s.userId)));

    // Trouver les utilisateurs n'ayant pas médité aujourd'hui
    const usersToRemind = await db.user.findMany({
      where: meditatedUserIds.length > 0 ? {
        id: {
          notIn: meditatedUserIds,
        },
      } : {},
      include: {
        pushSubscriptions: true,
      },
    });

    let emailsSent = 0;
    let pushsSent = 0;

    for (const user of usersToRemind) {
      // Ignorer les comptes de bots
      if (user.id.startsWith("bot_") || user.email?.endsWith("@mascot.local")) {
        continue;
      }

      const userName = user.name || "Ami";
      const notification = getRandomNotification(situation, userName);

      // 1. Envoi de l'email via Resend
      if (user.email && process.env.RESEND_API_KEY) {
        try {
          await resend.emails.send({
            from: "MannaDaily <onboarding@resend.dev>",
            to: user.email,
            subject: notification.title,
            html: generateNotificationEmail(notification, userName),
          });
          emailsSent++;
        } catch (emailErr) {
          console.error(`[Cron] Erreur d'envoi d'email à ${user.email} :`, emailErr);
        }
      }

      // 2. Envoi de la notification push
      if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
        try {
          await sendPushNotification(user.id, notification.title, notification.body);
          pushsSent += user.pushSubscriptions.length;
        } catch (pushErr) {
          console.error(`[Cron] Erreur d'envoi push pour l'utilisateur ${user.id} :`, pushErr);
        }
      }
    }

    console.log(`[Cron Daily Reminder] Situation: ${situation}, Emails: ${emailsSent}, Pushs: ${pushsSent}`);

    return NextResponse.json({
      success: true,
      situation,
      usersProcessed: usersToRemind.length,
      emailsSent,
      pushsSent,
    });
  } catch (error: unknown) {
    console.error("Erreur d'exécution du cron daily-reminder :", error);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
