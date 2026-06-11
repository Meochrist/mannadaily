import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLevelFromXP, getXPProgress } from "@/lib/gamification";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    let progress = await db.userProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      progress = await db.userProgress.create({
        data: {
          userId,
          totalXP: 0,
          level: "Semence",
          versesLearned: 0,
          sessionsTotal: 0,
        },
      });
    }

    let streak = await db.streak.findUnique({
      where: { userId },
    });

    if (!streak) {
      streak = await db.streak.create({
        data: {
          userId,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const userBadges = await db.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
      },
    });

    const levelInfo = getLevelFromXP(progress.totalXP);
    const progressPercent = getXPProgress(progress.totalXP);

    return NextResponse.json({
      progress: {
        totalXP: progress.totalXP,
        level: progress.level,
        levelNumber: levelInfo.level,
        levelName: levelInfo.name,
        xpRequired: levelInfo.xpRequired,
        xpNext: levelInfo.xpNext,
        progressPercent,
        versesLearned: progress.versesLearned,
        sessionsTotal: progress.sessionsTotal,
      },
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActivityAt: streak.lastActivityAt,
      },
      userName: session.user.name || "Ami",
      userEmail: session.user.email,
      badges: userBadges.map((ub: (typeof userBadges)[number]) => ({
        id: ub.badge.id,
        name: ub.badge.name,
        description: ub.badge.description,
        icon: ub.badge.icon,
        earnedAt: ub.earnedAt,
      })),
    });
  } catch (error: unknown) {
    console.error("Error in progress fetching API:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
