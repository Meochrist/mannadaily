import { NextRequest, NextResponse } from "next/server";
import { initServerDb } from "@/server/db";
import { calculateSM2 } from "@/lib/sm2";
import { awardXP, checkAndAwardBadges } from "@/lib/gamification";
import { addXPToLeague } from "@/lib/leaderboard";
import { trackEvent } from "@/lib/posthog";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const userId = decoded.userId;

    const { verseId, quality } = await request.json();

    if (!verseId || quality === undefined || quality < 0 || quality > 5) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const db = initServerDb();

    const memorization = db.prepare("SELECT * FROM verse_memorizations WHERE id = ?").get(verseId) as any;

    if (!memorization || memorization.userId !== userId) {
      return NextResponse.json({ error: "Fiche de mémorisation introuvable" }, { status: 404 });
    }

    const oldStatus = memorization.status;

    const sm2Result = calculateSM2(
      quality,
      memorization.interval,
      memorization.easeFactor,
      memorization.repetitions
    );

    let newStatus = "learning";
    if (sm2Result.repetitions >= 3 || quality === 5) {
      newStatus = "mastered";
    } else if (sm2Result.repetitions > 0) {
      newStatus = "reviewing";
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE verse_memorizations SET interval = ?, easeFactor = ?, repetitions = ?, nextReview = ?, lastReview = ?, status = ? WHERE id = ?
    `).run(sm2Result.interval, sm2Result.easeFactor, sm2Result.repetitions, sm2Result.nextReview.toISOString(), now, newStatus, verseId);

    let xpEarned = 0;
    let leveledUp = false;
    let newLevel = "";
    let newBadges: unknown[] = [];

    if (newStatus === "mastered" && oldStatus !== "mastered") {
      xpEarned = 25;
      
      db.prepare("UPDATE user_progress SET versesLearned = versesLearned + 1 WHERE userId = ?").run(userId);

      const xpResult = await awardXP(userId, "MEMORIZATION");
      leveledUp = xpResult.leveledUp;
      newLevel = xpResult.levelName;

      await addXPToLeague(userId, xpEarned);

      newBadges = await checkAndAwardBadges(userId);
    }

    trackEvent(userId, "verse_reviewed", { quality, mastered: newStatus === "mastered" });

    return NextResponse.json({
      success: true,
      memorization: { ...memorization, status: newStatus, interval: sm2Result.interval, easeFactor: sm2Result.easeFactor, repetitions: sm2Result.repetitions },
      xpEarned,
      leveledUp,
      newLevel,
      newBadges,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
