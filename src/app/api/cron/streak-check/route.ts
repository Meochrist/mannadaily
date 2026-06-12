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

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    // 1. Trouver les utilisateurs ayant médité aujourd'hui
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

    // 2. Traiter les utilisateurs n'ayant pas médité (notif urgente si streak > 0)
    const usersToRemind = await db.user.findMany({
      where: meditatedUserIds.length > 0 ? {
        id: {
          notIn: meditatedUserIds,
        },
      } : {},
      include: {
        pushSubscriptions: true,
        streak: true,
      },
    });

    let urgentEmails = 0;
    let urgentPushs = 0;

    for (const user of usersToRemind) {
      if (user.id.startsWith("bot_") || user.email?.endsWith("@mascot.local")) {
        continue;
      }

      // On n'envoie de rappel urgent que si l'utilisateur a déjà un streak actif à sauver
      const streakCount = user.streak?.currentStreak || 0;
      if (streakCount === 0) continue;

      const userName = user.name || "Ami";
      const notification = getRandomNotification("urgent", userName, streakCount);

      // Email
      if (user.email && process.env.RESEND_API_KEY) {
        try {
          await resend.emails.send({
            from: "MannaDaily <onboarding@resend.dev>",
            to: user.email,
            subject: notification.title,
            html: generateNotificationEmail(notification, userName),
          });
          urgentEmails++;
        } catch (err) {
          console.error(`[Cron Streak] Erreur email urgent à ${user.email} :`, err);
        }
      }

      // Push
      if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
        try {
          await sendPushNotification(user.id, notification.title, notification.body);
          urgentPushs += user.pushSubscriptions.length;
        } catch (err) {
          console.error(`[Cron Streak] Erreur push urgent à ${user.id} :`, err);
        }
      }
    }

    // 3. Traiter les félicitations pour les paliers de streak (7, 30 jours)
    const activeUsers = await db.user.findMany({
      where: {
        id: {
          in: meditatedUserIds,
        },
      },
      include: {
        pushSubscriptions: true,
        streak: true,
      },
    });

    let milestoneEmails = 0;
    let milestonePushs = 0;

    for (const user of activeUsers) {
      if (user.id.startsWith("bot_") || user.email?.endsWith("@mascot.local")) {
        continue;
      }

      const streakCount = user.streak?.currentStreak || 0;
      if (streakCount !== 7 && streakCount !== 30) {
        continue;
      }

      const situation = streakCount === 7 ? "streak_milestone_7" : "streak_milestone_30";
      const userName = user.name || "Ami";
      const notification = getRandomNotification(situation, userName, streakCount);

      // Email
      if (user.email && process.env.RESEND_API_KEY) {
        try {
          await resend.emails.send({
            from: "MannaDaily <onboarding@resend.dev>",
            to: user.email,
            subject: notification.title,
            html: generateNotificationEmail(notification, userName),
          });
          milestoneEmails++;
        } catch (err) {
          console.error(`[Cron Streak] Erreur email milestone à ${user.email} :`, err);
        }
      }

      // Push
      if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
        try {
          await sendPushNotification(user.id, notification.title, notification.body);
          milestonePushs += user.pushSubscriptions.length;
        } catch (err) {
          console.error(`[Cron Streak] Erreur push milestone à ${user.id} :`, err);
        }
      }
    }

    console.log(
      `[Cron Streak Check] Urgents: Emails=${urgentEmails}, Pushs=${urgentPushs} | Milestones: Emails=${milestoneEmails}, Pushs=${milestonePushs}`
    );

    return NextResponse.json({
      success: true,
      remindedCount: usersToRemind.length,
      milestoneCount: activeUsers.filter(u => u.streak?.currentStreak === 7 || u.streak?.currentStreak === 30).length,
      urgentEmails,
      urgentPushs,
      milestoneEmails,
      milestonePushs,
    });
  } catch (error: unknown) {
    console.error("Erreur dans le cron de vérification de streak :", error);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
