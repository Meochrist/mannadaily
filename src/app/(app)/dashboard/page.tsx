import React from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDailyVerse } from "@/lib/verses";
import { getMascotState, type MeditationProgress } from "@/lib/mascots";
import RandomMascotMessage from "@/components/dashboard/RandomMascotMessage";
import GameMap from "@/components/dashboard/GameMap";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const userName = session?.user?.name || "Ami";

  if (userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { onboardingCompleted: true, createdAt: true }
    });

    if (user && user.onboardingCompleted === false) {
      const isNewUser = user.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (isNewUser) {
        redirect("/onboarding");
      }
    }
  }

  const dailyVerse = getDailyVerse();

  let totalXP = 0;
  let currentStreak = 0;
  let dayProgress = false;
  let inactivityDays = 0;
  let meditationProgressData: unknown = null;

  if (userId) {
    try {
      const progress = await db.userProgress.findUnique({
        where: { userId },
        select: { totalXP: true }
      });
      totalXP = progress?.totalXP ?? 0;

      const streak = await db.streak.findUnique({
        where: { userId },
        select: { currentStreak: true, lastActivityAt: true }
      });

      if (streak) {
        currentStreak = streak.currentStreak;
        const diffTime = Math.abs(new Date().getTime() - new Date(streak.lastActivityAt).getTime());
        inactivityDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todaySession = await db.dailySession.findFirst({
        where: { userId, createdAt: { gte: todayStart } },
        select: { id: true }
      });
      dayProgress = !!todaySession;

      const userWithMedProgress = await db.user.findUnique({
        where: { id: userId },
        select: { meditationProgress: true }
      });

      if (userWithMedProgress?.meditationProgress) {
        const mp = userWithMedProgress.meditationProgress as Record<string, unknown>;
        const todayStr = new Date().toISOString().split("T")[0];
        if (mp.lastActivityDate === todayStr) {
          meditationProgressData = mp;
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto p-2 sm:p-4 lg:h-[920px] lg:overflow-hidden min-h-0">
      <div className="flex-1 lg:max-w-[65%] h-full flex flex-col min-h-0 space-y-6">
        <div className="w-full flex-shrink-0">
          <RandomMascotMessage
            userName={userName}
            streakCount={currentStreak}
            dayProgress={dayProgress}
            inactivityDays={inactivityDays}
            className="max-w-none w-full"
            mood={getMascotState(meditationProgressData as MeditationProgress | null).mood}
          />
        </div>
        
        <GameMap 
          currentXP={totalXP} 
          userName={userName} 
          dailyVerse={dailyVerse} 
        />
      </div>

      <DashboardSidebar />
    </div>
  );
}
