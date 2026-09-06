import { NextResponse } from "next/server";
import { query } from "@/server/db";
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
      return NextResponse.json({ error: "Non autorisé - Secret non configuré" }, { status: 401 });
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const sessionsToday = await query("SELECT DISTINCT userId FROM daily_sessions WHERE createdAt >= $1", [startOfToday.toISOString()]);
    const meditatedUserIds = sessionsToday.map((s: any) => s.userId);

    const allUsers = await query("SELECT * FROM users");
    const usersToRemind = allUsers.filter((u: any) => !meditatedUserIds.includes(u.id));

    let urgentEmails = 0;
    let urgentPushs = 0;

    for (const user of usersToRemind) {
      if (user.id.startsWith("bot_") || user.email?.endsWith("@mascot.local")) {
        continue;
      }

      const streak = await query("SELECT * FROM streaks WHERE userId = $1", [user.id]);
      const streakCount = streak[0]?.currentStreak || 0;
      if (streakCount === 0) continue;

      const userName = user.name || "Ami";
      const notification = getRandomNotification("urgent", userName, streakCount);

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

      const pushSubs = await query("SELECT * FROM push_subscriptions WHERE userId = $1", [user.id]);
      if (pushSubs.length > 0) {
        try {
          await sendPushNotification(user.id, notification.title, notification.body);
          urgentPushs += pushSubs.length;
        } catch (err) {
          console.error(`[Cron Streak] Erreur push urgent à ${user.id} :`, err);
        }
      }
    }

    let milestoneEmails = 0;
    let milestonePushs = 0;

    for (const userId of meditatedUserIds) {
      const user = await query("SELECT * FROM users WHERE id = $1", [userId]);
      if (!user[0] || user[0].id.startsWith("bot_") || user[0].email?.endsWith("@mascot.local")) {
        continue;
      }

      const streak = await query("SELECT * FROM streaks WHERE userId = $1", [userId]);
      const streakCount = streak[0]?.currentStreak || 0;
      if (streakCount !== 7 && streakCount !== 30) continue;

      const situation = streakCount === 7 ? "streak_milestone_7" : "streak_milestone_30";
      const userName = user[0].name || "Ami";
      const notification = getRandomNotification(situation, userName, streakCount);

      if (user[0].email && process.env.RESEND_API_KEY) {
        try {
          await resend.emails.send({
            from: "MannaDaily <onboarding@resend.dev>",
            to: user[0].email,
            subject: notification.title,
            html: generateNotificationEmail(notification, userName),
          });
          milestoneEmails++;
        } catch (err) {
          console.error(`[Cron Streak] Erreur email milestone à ${user[0].email} :`, err);
        }
      }

      const pushSubs = await query("SELECT * FROM push_subscriptions WHERE userId = $1", [userId]);
      if (pushSubs.length > 0) {
        try {
          await sendPushNotification(userId, notification.title, notification.body);
          milestonePushs += pushSubs.length;
        } catch (err) {
          console.error(`[Cron Streak] Erreur push milestone à ${userId} :`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      remindedCount: usersToRemind.length,
      urgentEmails,
      urgentPushs,
      milestoneEmails,
      milestonePushs,
    });
  } catch (error: unknown) {
    console.error("Erreur dans le cron de vérification de streak :", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
