import React from "react";
import { redirect } from "next/navigation";
import ReadingPlansClient from "@/components/reading-plans/ReadingPlansClient";
import { Calendar } from "lucide-react";
import { initServerDb } from "@/server/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function decodeToken(token: string): { userId: string; email: string; exp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: payload.userId, email: payload.email, exp: payload.exp };
  } catch {
    return null;
  }
}

export default async function ReadingPlansPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("mannadaily_token")?.value;
  
  let userId: string | undefined;
  if (token) {
    const decoded = decodeToken(token);
    if (decoded?.userId) {
      userId = decoded.userId;
    }
  }

  if (!userId) {
    redirect("/login");
  }

  try {
    const db = initServerDb();

    // Récupérer les plans avec les jours et lectures associées
    const plans = db.prepare(`
      SELECT * FROM reading_plans ORDER BY duration ASC
    `).all() as any[];

    // Pour chaque plan, récupérer les jours et lectures
    for (const plan of plans) {
      plan.days = db.prepare(`
        SELECT * FROM reading_plan_days WHERE planId = ? ORDER BY dayNumber ASC
      `).all(plan.id) as any[];
      
      for (const day of plan.days) {
        day.readings = db.prepare(`
          SELECT * FROM reading_plan_readings WHERE dayId = ? ORDER BY id ASC
        `).all(day.id) as any[];
      }
    }

    // Récupérer les inscriptions de l'utilisateur
    const enrollments = db.prepare(`
      SELECT * FROM reading_plan_enrollments WHERE userId = ?
    `).all(userId) as any[];

    // Récupérer la progression
    const progress = db.prepare(`
      SELECT * FROM reading_plan_progress WHERE userId = ?
    `).all(userId) as any[];

    // Récupérer les préférences de rappel
    const user = db.prepare(`
      SELECT readingReminders, notificationTime FROM users WHERE id = ?
    `).get(userId) as any;

    return (
      <div className="flex flex-col h-full space-y-6 max-w-7xl mx-auto p-4">
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-950 text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2 justify-center sm:justify-start">
              <Calendar className="w-8 h-8 text-indigo-300 animate-pulse" />
              Plans de Lecture
            </h1>
            <p className="text-indigo-200 text-sm max-w-md font-medium">
              Parcourez les Saintes Écritures de manière organisée et progressive. Cultivez votre foi jour après jour.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-950/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-indigo-500/20 text-center">
              <span className="block text-xs font-bold text-indigo-300 uppercase tracking-wider">Plans Actifs</span>
              <span className="text-xl font-black">{enrollments.filter((e: any) => !e.completed).length}</span>
            </div>
          </div>
        </div>

        <ReadingPlansClient
          initialPlans={plans}
          initialEnrollments={enrollments}
          initialProgress={progress}
          initialReadingReminders={user?.readingReminders ?? true}
          initialNotificationTime={user?.notificationTime ?? "19:00"}
        />
      </div>
    );
  } catch (error: unknown) {
    console.error("Error in reading plans page:", error);
    redirect("/login");
  }
}
