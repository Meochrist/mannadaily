import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRandomNotification } from "@/lib/notifications";
import { generateNotificationEmail } from "@/lib/emailTemplates";
import { sendPushNotification } from "@/lib/webPush";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

/** Calcule l'heure locale de l'utilisateur selon son fuseau horaire */
function getLocalHour(timezoneOffset: number | null): number {
  const nowUTC = new Date();
  const local = new Date(nowUTC.getTime() + (timezoneOffset ?? 0) * 60000);
  return local.getUTCHours();
}

/** Calcule la date locale (YYYY-MM-DD) de l'utilisateur selon son fuseau horaire */
function getLocalDateString(timezoneOffset: number | null): string {
  const nowUTC = new Date();
  const local = new Date(nowUTC.getTime() + (timezoneOffset ?? 0) * 60000);
  return local.toISOString().split("T")[0];
}

/** Détermine la situation selon l'heure locale et le nombre de sessions */
function getSituation(localHour: number, sessionsCompleted: number, dayCompleted: boolean): "morning" | "midday" | "afternoon" | "evening" | "urgent" {
  if (dayCompleted || sessionsCompleted >= 3) return "morning"; // Journée complète → pas de rappel urgent
  if (sessionsCompleted >= 1 && localHour >= 18) return "evening"; // A fait matin mais pas soir
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
      console.error("CRON_SECRET env variable is not configured");
      return NextResponse.json({ error: "Non autorisé - Secret non configuré" }, { status: 401 });
    }

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer tous les utilisateurs avec leurs subscriptions push et timezone
    const allUsers = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        meditationProgress: true,
        timezoneOffset: true,
        readingReminders: true,
        pushSubscriptions: true,
        readingPlans: {
          where: { completed: false },
          include: {
            plan: {
              include: {
                days: { include: { readings: true } },
              },
            },
          },
        },
        readingProgress: true,
      },
    });

    let emailsSent = 0;
    let pushsSent = 0;
    let usersNotified = 0;

    for (const user of allUsers) {
      // Ignorer les comptes de bots
      if (user.id.startsWith("bot_") || user.email?.endsWith("@mascot.local")) {
        continue;
      }

      // Calculer l'heure et la date locale de l'utilisateur
      const localHour = getLocalHour(user.timezoneOffset ?? null);
      const localDateStr = getLocalDateString(user.timezoneOffset ?? null);

      // Vérifier si l'utilisateur a médité aujourd'hui (date locale)
      const mp = user.meditationProgress as unknown as {
        lastActivityDate?: string;
        sessionsCompleted?: number[];
        dayCompleted?: boolean;
      } | null;

      const hasMeditatedToday = mp?.lastActivityDate === localDateStr;
      const sessionsCompleted = hasMeditatedToday && Array.isArray(mp?.sessionsCompleted) ? mp.sessionsCompleted.length : 0;
      const dayCompleted = mp?.dayCompleted === true || sessionsCompleted >= 3;

      // Si journée complète, pas de rappel
      if (dayCompleted) continue;

      // Déterminer la situation selon l'heure locale
      const situation = getSituation(localHour, sessionsCompleted, dayCompleted);

      // Ne pas envoyer le matin si déjà fait (sauf si c'est l'heure)
      if (situation === "morning" && sessionsCompleted >= 1 && localHour < 10) continue;

      const userName = user.name || "Ami";
      let notification;

      // Vérifier d'abord les plans de lecture
      const activeEnrollment = user.readingPlans[0];
      if (activeEnrollment && user.readingReminders) {
        const hasCompletedToday = user.readingProgress.some(
          (p: any) => p.planId === activeEnrollment.planId && p.dayNumber === activeEnrollment.currentDay
        );

        if (!hasCompletedToday) {
          const dayData = activeEnrollment.plan.days.find(
            (d: any) => d.dayNumber === activeEnrollment.currentDay
          );
          const readings = dayData?.readings || [];
          const chaptersStr = readings.map((r: any) => `${r.book} ${r.chapter}`).join(", ");
          const firstReading = readings[0];
          const firstBook = firstReading?.book || "";
          const firstChapter = firstReading?.chapter ? String(firstReading?.chapter) : "";

          notification = getRandomNotification(
            "reading_plan_reminder",
            userName,
            firstReading ? `${firstBook} ${firstChapter}` : "",
            {
              chapitres: chaptersStr,
              Livre: firstBook,
              Chapitre: firstChapter,
            }
          );
        }
      }

      // Sinon, notification de méditation
      if (!notification) {
        notification = getRandomNotification(situation, userName, undefined, undefined, sessionsCompleted);
      }

      // Envoi de l'email
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

      // Envoi de la notification push
      if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
        try {
          await sendPushNotification(user.id, notification.title, notification.body);
          pushsSent += user.pushSubscriptions.length;
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
