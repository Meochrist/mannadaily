import React from "react";
import { redirect } from "next/navigation";
import { LEVELS } from "@/types";
import { cn } from "@/lib/utils";
import { getLevelFromXP, getXPProgress } from "@/lib/gamification";
import MannyMessage from "@/components/mascot/MannyMessage";
import XPBar from "@/components/gamification/XPBar";
import StreakCounter from "@/components/gamification/StreakCounter";
import BadgeCard from "@/components/gamification/BadgeCard";
import { 
  Award, 
  Calendar, 
  CheckCircle2, 
  Trophy,
  Zap,
  Share2
} from "lucide-react";
import ShareCard from "@/components/sharing/ShareCard";
import { query, queryOne, execute } from "@/server/db";
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

interface ProgressData {
  progress: {
    totalXP: number;
    level: string;
    levelNumber: number;
    levelName: string;
    xpRequired: number;
    xpNext: number | null;
    progressPercent: number;
    versesLearned: number;
    sessionsTotal: number;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActivityAt: string;
  };
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: string | null;
  }>;
}

export default async function ProgressPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("mannadaily_token")?.value;
  
  let userId: string | undefined;
  let userName = "Ami";

  if (token) {
    const decoded = decodeToken(token);
    if (decoded?.userId) {
      userId = decoded.userId;
    }
  }

  let data: ProgressData = {
    progress: {
      totalXP: 0,
      level: "Semence",
      levelNumber: 1,
      levelName: "Semence",
      xpRequired: 0,
      xpNext: 100,
      progressPercent: 0,
      versesLearned: 0,
      sessionsTotal: 0,
    },
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityAt: new Date().toISOString(),
    },
    badges: [],
  };

  let signUpDate: Date | null = null;
  let completeDaysCount = 0;

  if (userId) {
    try {
      const user = await queryOne(
        "SELECT id, name, createdAt FROM users WHERE id = $1",
        [userId]
      ) as any;
      if (user) {
        signUpDate = new Date(user.createdAt);
        userName = user.name || "Ami";
      }

      let progress = await queryOne(
        "SELECT * FROM user_progress WHERE userId = $1",
        [userId]
      ) as any;

      if (!progress) {
        await execute(
          "INSERT INTO user_progress (id, userId, totalXP, level, versesLearned, sessionsTotal, lingots) VALUES ($1, $2, 0, 'Semence', 0, 0, 0)",
          [crypto.randomUUID(), userId]
        );
        progress = await queryOne(
          "SELECT * FROM user_progress WHERE userId = $1",
          [userId]
        ) as any;
      }

      let streak = await queryOne(
        "SELECT * FROM streaks WHERE userId = $1",
        [userId]
      ) as any;

      if (!streak) {
        await execute(
          "INSERT INTO streaks (id, userId, currentStreak, longestStreak, lastActivityAt) VALUES ($1, $2, 0, 0, $3)",
          [crypto.randomUUID(), userId, new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()]
        );
        streak = await queryOne(
          "SELECT * FROM streaks WHERE userId = $1",
          [userId]
        ) as any;
      }

      const userBadges = await query(
        `SELECT ub.badgeId, ub.earnedAt, b.id, b.name, b.description, b.icon
         FROM user_badges ub
         JOIN badges b ON ub.badgeId = b.id
         WHERE ub.userId = $1`,
        [userId]
      ) as any[];

      const levelInfo = getLevelFromXP(progress.totalXP);
      const progressPercent = getXPProgress(progress.totalXP);

      data = {
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
        badges: userBadges.map((ub: any) => ({
          id: ub.badgeId,
          name: ub.name,
          description: ub.description,
          icon: ub.icon,
          earnedAt: ub.earnedAt,
        })),
      };

      // Calculer les jours complets (matin + soir)
      const sessions = await query(
        "SELECT createdAt, period FROM daily_sessions WHERE userId = $1 ORDER BY createdAt DESC",
        [userId]
      ) as any[];

      const daysMap = new Map<string, Set<string>>();
      for (const s of sessions) {
        const dateStr = new Date(s.createdAt).toISOString().split("T")[0];
        if (!daysMap.has(dateStr)) {
          daysMap.set(dateStr, new Set());
        }
        daysMap.get(dateStr)!.add(s.period);
      }

      for (const periods of daysMap.values()) {
        if (periods.has("morning") && periods.has("evening")) {
          completeDaysCount++;
        }
      }
    } catch (error) {
      console.error("Error fetching progress data:", error);
    }
  }

  // 5 badges du système
  const allSystemBadges = [
    { name: "Premier Pas", description: "Terminez votre première session quotidienne", icon: "Compass" },
    { name: "Fidèle Étoile", description: "Atteignez une série de 7 jours consécutifs", icon: "Flame" },
    { name: "Guerrier de la Parole", description: "Atteignez une série de 30 jours consécutifs", icon: "Crown" },
    { name: "Scribe de l'Esprit", description: "Apprenez 10 versets de la Bible", icon: "BookOpen" },
    { name: "Pilier de Foi", description: "Complétez 50 sessions au total", icon: "Shield" },
  ];

  const badgesToDisplay = allSystemBadges.map((sysBadge) => {
    const earned = data.badges.find((b) => b.name === sysBadge.name);
    return {
      ...sysBadge,
      earnedAt: earned ? (earned.earnedAt ? new Date(earned.earnedAt) : new Date()) : null,
    };
  });

  const formattedDate = signUpDate 
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(signUpDate)
    : "Non disponible";

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-12">
      {/* En-tête */}
      <section className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Ma Progression</h1>
          <p className="text-slate-500 font-medium">
            Découvre ton avancée, tes badges spirituels et tes statistiques de croissance en Christ.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-2xl text-sm border border-indigo-100/50">
          <Calendar className="w-4 h-4 text-indigo-500" />
          Inscrit le : {formattedDate}
        </div>
      </section>

      {/* Message Manny */}
      <section className="flex justify-center md:justify-start">
        <MannyMessage
          mood="happy"
          message={`"Voici ton parcours spirituel, ${userName} !"\\nChaque moment passé dans la Parole est une semence précieuse qui produit des fruits d'éternité.`}
          size={110}
        />
      </section>

      {/* XP & Streak */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <XPBar
            currentXP={data.progress.totalXP}
            levelName={data.progress.levelName}
            progressPercent={data.progress.progressPercent}
          />
        </div>
        <div>
          <StreakCounter
            currentStreak={data.streak.currentStreak}
            longestStreak={data.streak.longestStreak}
          />
        </div>
      </section>

      {/* Roadmap */}
      <section className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b pb-4 mb-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">
            Roadmap Spirituelle
          </h2>
        </div>

        <p className="text-sm font-medium text-slate-500">
          Progresse en accumulant de l'XP à travers tes méditations et proclamations pour élever ton esprit :
        </p>

        <div className="relative pt-6 pb-6">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 hidden md:block" />
          
          <div className="grid grid-cols-1 md:grid-cols-7 gap-6 relative z-10">
            {LEVELS.map((levelObj) => {
              const isCurrent = data.progress.levelName === levelObj.name;
              const isAchieved = data.progress.levelNumber >= levelObj.level;

              return (
                <div 
                  key={levelObj.level} 
                  className={cn(
                    "flex md:flex-col items-center gap-4 md:gap-3 text-left md:text-center p-3 rounded-2xl transition-all duration-300",
                    isCurrent && "bg-indigo-50/50 border border-indigo-100 shadow-sm"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-black transition-all duration-500",
                    isAchieved 
                      ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg ring-4 ring-indigo-100" 
                      : "bg-slate-100 text-slate-400"
                  )}>
                    {isAchieved ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <span>{levelObj.level}</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h4 className={cn(
                      "font-extrabold text-sm tracking-tight",
                      isAchieved ? "text-slate-800" : "text-slate-400"
                    )}>
                      {levelObj.name}
                    </h4>
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                      {levelObj.xpRequired} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 border-b pb-4 mb-6">
          <Zap className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">
            Mes Statistiques de croissance
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 text-center space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Sessions quotidiennes</span>
            <span className="text-4xl font-black text-slate-800 block">{data.progress.sessionsTotal}</span>
            <p className="text-xs text-slate-400 font-semibold">Temps passé dans la présence de Dieu</p>
          </div>

          <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 text-center space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Versets mémorisés</span>
            <span className="text-4xl font-black text-slate-800 block">{data.progress.versesLearned}</span>
            <p className="text-xs text-slate-400 font-semibold">Vérités divines ancrées dans ton esprit</p>
          </div>

          <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 text-center space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Jours complets</span>
            <span className="text-4xl font-black text-emerald-600 block">{completeDaysCount}</span>
            <p className="text-xs text-slate-400 font-semibold">Matin et soir complétés</p>
          </div>

          <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 text-center space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Expérience Totale</span>
            <span className="text-4xl font-black text-indigo-600 block">{data.progress.totalXP} XP</span>
            <p className="text-xs text-slate-400 font-semibold">Cumul des pas de foi accomplis</p>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">
              Mes Badges Spirituels
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            {data.badges.length} sur {allSystemBadges.length} obtenus
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {badgesToDisplay.map((badge, index) => (
            <BadgeCard
              key={index}
              name={badge.name}
              description={badge.description}
              icon={badge.icon}
              earnedAt={badge.earnedAt}
            />
          ))}
        </div>
      </section>

      {/* Partager */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Share2 className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">
            Partager ma progression
          </h2>
        </div>
        <ShareCard
          type="streak"
          streakValue={data.streak.currentStreak}
          levelName={data.progress.levelName}
        />
      </section>
    </div>
  );
}