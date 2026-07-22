import React from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLevelFromXP, getXPProgress } from "@/lib/gamification";
import { getDailyVerse } from "@/lib/verses";
import { getMascotMoodFromProgress, type MeditationProgress } from "@/lib/mascots";
import RandomMascotMessage from "@/components/dashboard/RandomMascotMessage";
import XPBar from "@/components/gamification/XPBar";
import StreakCounter from "@/components/gamification/StreakCounter";
import BadgeCard from "@/components/gamification/BadgeCard";
import LingotsCounter from "@/components/gamification/LingotsCounter";
import PushOptIn from "@/components/notifications/PushOptIn";
import GameMap from "@/components/dashboard/GameMap";
import VerseSelector from "@/components/dashboard/VerseSelector";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { BookOpen } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const userName = session?.user?.name || "Ami";

  let meditationProgressData = null;

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

  // Récupérer le verset quotidien dynamique via notre système de rotation
  const dailyVerse = getDailyVerse();

  // Initialisation des données par défaut
  let totalXP = 0;
  let levelName = "Semence";
  let progressPercent = 0;
  let versesLearned = 0;
  let sessionsTotal = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let badges: Array<{ id: string; name: string; description: string; icon: string; earnedAt: string }> = [];
  let lingots = 0;
  let freezesAvailable = 0;
  let dayProgress = false;
  let inactivityDays = 0;
  let morningDone = false;
  let eveningDone = false;

  if (userId) {
    try {
      // 1. Récupération directe de la progression de l&apos;utilisateur avec sélection ciblée
      let progress = await db.userProgress.findUnique({
        where: { userId },
        select: {
          totalXP: true,
          level: true,
          versesLearned: true,
          sessionsTotal: true,
          lingots: true,
          morningSessionToday: true,
          eveningSessionToday: true,
          lastSessionDate: true,
        }
      });

      if (!progress) {
        // En cas de création, on crée les valeurs par défaut
        const createdProgress = await db.userProgress.create({
          data: {
            userId,
            totalXP: 0,
            level: "Semence",
            versesLearned: 0,
            sessionsTotal: 0,
            lingots: 0,
            morningSessionToday: false,
            eveningSessionToday: false,
          },
          select: {
            totalXP: true,
            level: true,
            versesLearned: true,
            sessionsTotal: true,
            lingots: true,
            morningSessionToday: true,
            eveningSessionToday: true,
            lastSessionDate: true,
          }
        });
        progress = createdProgress;
      }

      totalXP = progress.totalXP;
      versesLearned = progress.versesLearned;
      sessionsTotal = progress.sessionsTotal;
      lingots = progress.lingots;

      // Détecter si on est sur un jour différent de la dernière session pour l'affichage
      const todayStr = new Date().toISOString().split("T")[0];
      const isToday = progress.lastSessionDate === todayStr;
      morningDone = isToday ? progress.morningSessionToday : false;
      eveningDone = isToday ? progress.eveningSessionToday : false;

      // Récupérer le streak freeze avec sélection ciblée
      const streakFreeze = await db.streakFreeze.findUnique({
        where: { userId },
        select: { freezesAvailable: true }
      });
      freezesAvailable = streakFreeze ? streakFreeze.freezesAvailable : 0;

      // Calcul des niveaux et pourcentage de progression en local
      const levelInfo = getLevelFromXP(totalXP);
      levelName = levelInfo.name;
      progressPercent = getXPProgress(totalXP);

      // 2. Récupération directe du streak avec sélection ciblée
      let streak = await db.streak.findUnique({
        where: { userId },
        select: {
          currentStreak: true,
          longestStreak: true,
          lastActivityAt: true,
        }
      });

      if (!streak) {
        const createdStreak = await db.streak.create({
          data: {
            userId,
            currentStreak: 0,
            longestStreak: 0,
            lastActivityAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          select: {
            currentStreak: true,
            longestStreak: true,
            lastActivityAt: true,
          }
        });
        streak = createdStreak;
      }

      currentStreak = streak.currentStreak;
      longestStreak = streak.longestStreak;

      // Calcul de inactivityDays
      const diffTime = Math.abs(new Date().getTime() - new Date(streak.lastActivityAt).getTime());
      inactivityDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Vérifier la progression de la journée (session de méditation créée aujourd'hui) avec sélection ciblée
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todaySession = await db.dailySession.findFirst({
        where: {
          userId,
          createdAt: {
            gte: todayStart,
          },
        },
        select: { id: true }
      });
      dayProgress = !!todaySession;

      // Récupérer la progression de méditation du jour pour calculer l'humeur de la mascotte
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

      // 3. Récupération directe des badges
      // 3. Récupération directe des badges avec sélection ciblée et limite aux 3 premiers
      const userBadges = await db.userBadge.findMany({
        where: { userId },
        take: 3,
        select: {
          earnedAt: true,
          badge: {
            select: {
              id: true,
              name: true,
              description: true,
              icon: true,
            }
          }
        }
      });

      badges = userBadges.map((ub) => ({
        id: ub.badge.id,
        name: ub.badge.name,
        description: ub.badge.description,
        icon: ub.badge.icon,
        earnedAt: ub.earnedAt.toISOString(),
      }));

    } catch (error) {
      console.error("Error fetching user data directly in DashboardPage:", error);
    }
  }

  const defaultBadges = [
    {
      name: "Premier Pas",
      description: "Terminez votre première session quotidienne",
      icon: "Compass",
      earnedAt: null,
    },
    {
      name: "Fidèle Étoile",
      description: "Atteignez une série de 7 jours consécutifs",
      icon: "Flame",
      earnedAt: null,
    },
    {
      name: "Guerrier de la Parole",
      description: "Atteignez une série de 30 jours consécutifs",
      icon: "Crown",
      earnedAt: null,
    },
  ];

  const badgesToDisplay = defaultBadges.map((db) => {
    const earned = badges.find((b) => b.name === db.name);
    return {
      ...db,
      earnedAt: earned ? earned.earnedAt : null,
    };
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto p-2 sm:p-4 lg:h-[920px] lg:overflow-hidden min-h-0">
      {/* COLONNE DE GAUCHE : LA CARTE DU PARCOURS DE JEU COMPLÈTE */}
      <div className="flex-1 lg:max-w-[65%] h-full flex flex-col min-h-0 space-y-6">
        {/* MESSAGE D'ACCUEIL ALÉATOIRE D'UNE MASCOTTE */}
        <div className="w-full flex-shrink-0">
          <RandomMascotMessage
            userName={userName}
            streakCount={currentStreak}
            dayProgress={dayProgress}
            inactivityDays={inactivityDays}
            className="max-w-none w-full"
            mood={getMascotMoodFromProgress(meditationProgressData as MeditationProgress | null)}
          />
        </div>
        
        {/* LA CARTE DU PARCOURS */}
        <GameMap 
          currentXP={totalXP} 
          userName={userName} 
          dailyVerse={dailyVerse} 
        />
      </div>

      {/* COLONNE DE DROITE : SYNCHRONISÉE AVEC L'API */}
      <DashboardSidebar />
    </div>
  );
}
