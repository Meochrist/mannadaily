import { NextResponse } from "next/server";
import { initServerDb } from "@/server/db";
import { getRandomNotification } from "@/lib/notifications";
import { generateNotificationEmail } from "@/lib/emailTemplates";
import { sendPushNotification } from "@/lib/webPush";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

function getLocalHour(timezoneOffset: number | null): number {
  const nowUTC = new Date();
  const local = new Date(nowUTC.getTime() + (timezoneOffset ?? 0) * 60000);
  return local.getUTCHours();
}

function getLocalDateString(timezoneOffset: number | null): string {
  const nowUTC = new Date();
  const local = new Date(nowUTC.getTime() + (timezoneOffset ?? 0) * 60000);
  return local.toISOString().split("T")[0];
}

function getSituation(localHour: number, sessionsCompleted: number, dayCompleted: boolean): "morning" | "midday" | "afternoon" | "evening" | "urgent" {
  if (dayCompleted || sessionsCompleted >= 3) return "morning";
  if (sessionsCompleted >= 1 && localHour >= 18) return "evening";
  if (sessionsCompleted >= 1 && localHour >= 14) return "afternoon";
  if (localHour >= 5 && localHour < 11) return "morning";
  if (localHour >= 11 && localHour < 14) return "midday";
  if (localHour >= 14 && localHour < 18) return "afternoon";
  if (localHour >= 18 && localHour < 22) return "evening";
  return "urgent";
}

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

    const db = initServerDb();
    const allUsers = db.prepare("SELECT * FROM users").all() as any[];

    let emailsSent = 0;
    let pushsSent = 0;
    let usersNotified = 0;

    for (const user of allUsers) {
      if (user.id.startsWith("bot_") || user.email?.endsWith("@mascot.local")) {
        continue;
      }

      const localHour = getLocalHour(user.timezoneOffset);
      const localDateStr = getLocalDateString(user.timezoneOffset);

      let meditationProgress = null;
      if (user.meditationProgress) {
        try {
          meditationProgress = JSON.parse(user.meditationProgress);
        } catch {
          meditationProgress = null;
        }
      }

      const hasMeditatedToday = meditationProgress?.lastActivityDate === localDateStr;
      const sessionsCompleted = hasMeditatedToday && Array.isArray(meditationProgress?.sessionsCompleted) ? meditationProgress.sessionsCompleted.length : 0;
      const dayCompleted = meditationProgress?.dayCompleted === true || sessionsCompleted >= 3;

      if (dayCompleted) continue;

      const situation = getSituation(localHour, sessionsCompleted, dayCompleted);
      if (situation === "morning" && sessionsCompleted >= 1 && localHour < 10) continue;

      const userName = user.name || "Ami";
      let notification;

      const enrollments = db.prepare("SELECT * FROM reading_plan_enrollments WHERE userId = ? AND completed = 0").all(user.id);
      const activeEnrollment = enrollments[0] as any;

      if (activeEnrollment && user.readingReminders) {
        const readingProgress = db.prepare("SELECT * FROM reading_plan_progress WHERE userId = ? AND planId = ?").all(user.id, activeEnrollment.planId);
        const hasCompletedToday = readingProgress.some((p: any) => p.dayNumber === activeEnrollment.currentDay);

        if (!hasCompletedToday) {
          const dayData = db.prepare("SELECT * FROM reading_plan_days WHERE planId = ? AND dayNumber = ?").get(activeEnrollment.planId, activeEnrollment.currentDay) as any;
          const readings = dayData ? db.prepare("SELECT * FROM reading_plan_readings WHERE dayId = ?").all(dayData.id) as any[] : [];
          const chaptersStr = readings.map((r: any) => `${r.book} ${r.chapter}`).join(", ");
          const firstReading = readings[0] as any;
          const firstBook = firstReading?.book || "";
          const firstChapter = firstReading?.chapter ? String(firstReading.chapter) : "";

          notification = getRandomNotification(
            "reading_plan_reminder",
            userName,
            firstReading ? `${firstBook} ${firstChapter}` : "",
            { chapitres: chaptersStr, Livre: firstBook, Chapitre: firstChapter }
          );
        }
      }

      if (!notification) {
        notification = getRandomNotification(situation, userName, undefined, undefined, sessionsCompleted);
      }

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
          console.error(`[Cron] Erreur email à ${user.email} :`, emailErr);
        }
      }

      const pushSubs = db.prepare("SELECT * FROM push_subscriptions WHERE userId = ?").all(user.id);
      if (pushSubs.length > 0) {
        try {
          await sendPushNotification(user.id, notification.title, notification.body);
          pushsSent += pushSubs.length;
        } catch (pushErr) {
          console.error(`[Cron] Erreur push pour ${user.id} :`, pushErr);
        }
      }

      usersNotified++;
    }

    console.log(`[Cron Daily Reminder] Utilisateurs notifiés: ${usersNotified}, Emails: ${emailsSent}, Pushs: ${pushsSent}`);

    return NextResponse.json({
      success: true,
      usersProcessed: allUsers.length,
      usersNotified,
      emailsSent,
      pushsSent,
    });
  } catch (error: unknown) {
    console.error("Erreur cron daily-reminder :", error);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
