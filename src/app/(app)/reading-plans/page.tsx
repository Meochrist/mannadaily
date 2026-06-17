import React from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ReadingPlansClient from "@/components/reading-plans/ReadingPlansClient";
import { Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReadingPlansPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;

  // Récupérer les plans avec les jours et lectures associées
  const plans = await db.readingPlan.findMany({
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          readings: {
            orderBy: { id: "asc" }
          }
        }
      }
    },
    orderBy: {
      duration: "asc"
    }
  });

  // Récupérer les inscriptions de l'utilisateur
  const enrollments = await db.readingPlanEnrollment.findMany({
    where: { userId }
  });

  // Récupérer la progression (jours complétés) de l'utilisateur
  const progress = await db.readingPlanProgress.findMany({
    where: { userId }
  });

  // Récupérer les préférences de rappel de l'utilisateur
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      readingReminders: true,
      notificationTime: true
    }
  });

  return (
    <div className="flex flex-col h-full space-y-6 max-w-7xl mx-auto p-4">
      {/* Page Title & Navigation Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-850 to-indigo-950 text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
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
            <span className="text-xl font-black">{enrollments.filter(e => !e.completed).length}</span>
          </div>
        </div>
      </div>

      {/* Render the Client Component */}
      <ReadingPlansClient
        initialPlans={plans}
        initialEnrollments={enrollments}
        initialProgress={progress}
        initialReadingReminders={user?.readingReminders ?? true}
        initialNotificationTime={user?.notificationTime ?? "19:00"}
      />
    </div>
  );
}
