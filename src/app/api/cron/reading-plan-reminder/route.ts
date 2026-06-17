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

    // Récupérer tous les enrollments actifs pour les utilisateurs acceptant les rappels
    const enrollments = await db.readingPlanEnrollment.findMany({
      where: {
        completed: false,
        user: {
          readingReminders: true
        }
      },
      include: {
        user: {
          include: {
            pushSubscriptions: true,
            readingProgress: true
          }
        },
        plan: {
          include: {
            days: {
              include: {
                readings: true
              }
            }
          }
        }
      }
    });

    let emailsSent = 0;
    let pushsSent = 0;
    let usersProcessed = 0;

    for (const enrollment of enrollments) {
      const { user, plan } = enrollment;
      
      // Ignorer les comptes de bots
      if (user.id.startsWith("bot_") || user.email?.endsWith("@mascot.local")) {
        continue;
      }

      // Vérifier si l'utilisateur a complété sa lecture du jour
      const hasCompletedToday = user.readingProgress.some(
        (p) => p.planId === enrollment.planId && p.dayNumber === enrollment.currentDay
      );

      if (hasCompletedToday) {
        continue;
      }

      usersProcessed++;
      const userName = user.name || "Ami";

      // Récupérer les chapitres du jour
      const dayData = plan.days.find((d) => d.dayNumber === enrollment.currentDay);
      const readings = dayData?.readings || [];
      const chaptersStr = readings.map((r) => `${r.book} ${r.chapter}`).join(", ");
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
          console.error(`[Cron Reading Plan] Erreur d'envoi d'email à ${user.email} :`, emailErr);
        }
      }

      // 2. Envoi de la notification push
      if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
        try {
          await sendPushNotification(user.id, notification.title, notification.body);
          pushsSent += user.pushSubscriptions.length;
        } catch (pushErr) {
          console.error(`[Cron Reading Plan] Erreur d'envoi push pour l'utilisateur ${user.id} :`, pushErr);
        }
      }
    }

    console.log(`[Cron Reading Plan Reminder] Rappels envoyés à ${usersProcessed} utilisateurs. Emails: ${emailsSent}, Pushs: ${pushsSent}`);

    return NextResponse.json({
      success: true,
      usersProcessed,
      emailsSent,
      pushsSent,
    });
  } catch (error: unknown) {
    console.error("Erreur d'exécution du cron reading-plan-reminder :", error);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
