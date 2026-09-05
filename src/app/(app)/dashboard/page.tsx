import React from "react";
import { getDailyVerse } from "@/lib/verses";
import RandomMascotMessage from "@/components/dashboard/RandomMascotMessage";
import GameMap from "@/components/dashboard/GameMap";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { isAdminEmail } from "@/lib/features";
import { initServerDb } from "@/server/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Décoder un JWT simple
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

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("mannadaily_token")?.value;
  
  let userId: string | undefined;
  let userName = "Ami";
  let isAdmin = false;
  let totalXP = 0;
  let currentStreak = 0;
  let dayProgress = false;
  let inactivityDays = 0;
  let sessionsCompletedToday = 0;
  let dayCompletedToday = false;

  if (token) {
    const decoded = decodeToken(token);
    if (decoded?.userId) {
      userId = decoded.userId;
    }
  }

  if (userId) {
    try {
      const db = initServerDb();
      
      const user = db.prepare("SELECT id, name, email, meditationProgress FROM users WHERE id = ?").get(userId) as any;
      if (user) {
        userName = user.name || "Ami";
        isAdmin = isAdminEmail(user.email);
      }

      const progress = db.prepare("SELECT totalXP FROM user_progress WHERE userId = ?").get(userId) as any;
      totalXP = progress?.totalXP ?? 0;

      const streak = db.prepare("SELECT currentStreak, lastActivityAt FROM streaks WHERE userId = ?").get(userId) as any;
      if (streak) {
        currentStreak = streak.currentStreak;
        const diffTime = Math.abs(new Date().getTime() - new Date(streak.lastActivityAt).getTime());
        inactivityDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      if (user?.meditationProgress) {
        try {
          const mp = JSON.parse(user.meditationProgress);
          const now = new Date();
          const acceptable = new Set(
            [-1, 0, 1].map((delta) =>
              new Date(now.getTime() + delta * 86_400_000).toISOString().split("T")[0]
            )
          );
          if (typeof mp.lastActivityDate === "string" && acceptable.has(mp.lastActivityDate)) {
            const sessions = Array.isArray(mp.sessionsCompleted) ? mp.sessionsCompleted : [];
            sessionsCompletedToday = sessions.length;
            dayCompletedToday = Boolean(mp.dayCompleted) || sessions.length >= 3;
            dayProgress = dayCompletedToday;
          }
        } catch {
          // ignore
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  const dailyVerse = getDailyVerse();

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto p-2 sm:p-4 lg:h-[920px] lg:overflow-hidden min-h-0">
      <div className="flex-1 lg:max-w-[65%] h-full flex flex-col min-h-0 space-y-6">
        <div className="w-full flex-shrink-0">
          <RandomMascotMessage
            userName={userName}
            streakCount={currentStreak}
            dayProgress={dayCompletedToday}
            inactivityDays={inactivityDays}
            sessionsCompletedToday={sessionsCompletedToday}
            className="max-w-none w-full"
          />
        </div>
        
        <GameMap 
          currentXP={totalXP} 
          userName={userName} 
          dailyVerse={dailyVerse} 
          isAdmin={isAdmin}
        />
      </div>

      <DashboardSidebar />
    </div>
  );
}
