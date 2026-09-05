import { NextResponse } from "next/server";
import { initServerDb } from "@/server/db";
import { getRandomNotification } from "@/lib/notifications";
import { generateNotificationEmail } from "@/lib/emailTemplates";
import { sendPushNotification } from "@/lib/webPush";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = "force-dynamic";

interface EnrollmentRow {
  id: string;
  userId: string;
  planId: string;
  currentDay: number;
}

interface DayRow {
  id: string;
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

    const enrollments = db.prepare(`
      SELECT rpe.*, rp.name as planName
      FROM reading_plan_enrollments rpe
      JOIN reading_plans rp ON rpe.planId = rp.id
      JOIN users u ON rpe.userId = u.id
      WHERE rpe.completed = 0 AND u.readingReminders = 1
    `).all() as EnrollmentRow[];

    let emailsSent = 0;
    let pushsSent = 0;
    let usersProcessed = 0;

    for (const enrollment of enrollments) {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(enrollment.userId) as any;
      
      if (!user || user.id.startsWith("bot_") || user.email?.endsWith("@mascot.local")) {
        continue;
      }

      const readingProgress = db.prepare("SELECT * FROM reading_plan_progress WHERE userId = ? AND planId = ?").all(enrollment.userId, enrollment.planId) as any[];
      const hasCompletedToday = readingProgress.some((p: any) => p.dayNumber === enrollment.currentDay);

      if (hasCompletedToday) {
        continue;
      }

      usersProcessed++;
      const userName = user.name || "Ami";

      const dayData = db.prepare("SELECT * FROM reading_plan_days WHERE planId = ? AND dayNumber = ?").get(enrollment.planId, enrollment.currentDay) as DayRow | undefined;
      const readings = dayData ? db.prepare("SELECT * FROM reading_plan_readings WHERE dayId = ?").all(dayData.id) as any[] : [];
      const chaptersStr = readings.map((r: any) => `${r.book} ${r.chapter}`).join(", ");
      const firstReading = readings[0];
      const firstBook = firstReading?.book || "";
      const firstChapter = firstReading?.chapter ? String(firstReading.chapter) : "";

      const notification = getRandomNotification(
        "reading_plan_reminder",
        userName,
        firstReading ? `${firstBook} ${firstChapter}` : "",
        {
          chapitres: chaptersStr,
          Livre: firstBook,
          Chapitre: firstChapter
        }
      );

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
          console.error(`[Cron Reading Plan] Erreur d'envoi d'email à ${user.email} :`, emailErr);
        }
      }

      const pushSubs = db.prepare("SELECT * FROM push_subscriptions WHERE userId = ?").all(user.id);
      if (pushSubs.length > 0) {
        try {
          await sendPushNotification(user.id, notification.title, notification.body);
          pushsSent += pushSubs.length;
        } catch (pushErr) {
          console.error(`[Cron Reading Plan] Erreur d'envoi push pour l'utilisateur ${user.id} :`, pushErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      usersProcessed,
      emailsSent,
      pushsSent,
    });
  } catch (error: unknown) {
    console.error("Erreur d'exécution du cron reading-plan-reminder :", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
