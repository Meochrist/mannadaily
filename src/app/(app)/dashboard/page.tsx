import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLevelFromXP, getXPProgress } from "@/lib/gamification";
import { getDailyVerse } from "@/lib/verses";
import RandomMascotMessage from "@/components/dashboard/RandomMascotMessage";
import XPBar from "@/components/gamification/XPBar";
import StreakCounter from "@/components/gamification/StreakCounter";
import BadgeCard from "@/components/gamification/BadgeCard";
import LingotsCounter from "@/components/gamification/LingotsCounter";
import PushOptIn from "@/components/notifications/PushOptIn";
import GameMap from "@/components/dashboard/GameMap";
import { BookOpen } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const userName = session?.user?.name || "Ami";

  if (userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { onboardingCompleted: true }
    });

    if (user && user.onboardingCompleted === false) {
      redirect("/onboarding");
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
      // 1. Récupération directe de la progression de l'utilisateur avec sélection ciblée
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

  const currentHour = new Date().getHours();
  const isMorningActive = currentHour >= 0 && currentHour < 17;
  const isEveningActive = currentHour >= 17 && currentHour < 24;

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
          />
        </div>
        
        {/* LA CARTE DU PARCOURS */}
        <GameMap 
          currentXP={totalXP} 
          userName={userName} 
          dailyVerse={dailyVerse} 
        />
      </div>

      {/* COLONNE DE DROITE : LE PANNEAU DE STATISTIQUES & DE BOUTIQUE */}
      <div className="w-full lg:w-[35%] flex-shrink-0 space-y-6 lg:overflow-y-auto lg:h-full lg:pr-2 pb-10 lg:pb-6 scrollbar-thin scrollbar-thumb-slate-200">
        {/* 1. LE VERSET DU JOUR (FORMAT EMBARQUÉ PREMIUM) */}
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
            <BookOpen className="w-48 h-48" />
          </div>

          <div className="space-y-3 relative z-10">
            <div className="inline-block px-3 py-0.5 bg-indigo-800/80 rounded-full border border-indigo-700/60 text-[10px] font-bold uppercase tracking-wider text-indigo-200">
              Verset du jour (Thème : {dailyVerse.theme})
            </div>
            <blockquote className="text-lg font-black leading-snug tracking-tight italic">
              « {dailyVerse.text} »
            </blockquote>
            <cite className="block text-xs font-bold text-indigo-300 not-italic uppercase tracking-widest">
              — {dailyVerse.reference}
            </cite>
          </div>
        </div>

        {/* 2. JOURNÉE SPIRITUELLE (JOUR & NUIT - JOSUÉ 1:8) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4 transition-colors">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Journée Spirituelle (Josué 1:8)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Médite la Parole jour et nuit pour réussir dans tes voies.
            </p>
          </div>

          {/* Barre de progression */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
              <span className="text-[10px] tracking-wide">Progression du Jour</span>
              <span>{morningDone && eveningDone ? "100%" : morningDone || eveningDone ? "50%" : "0%"}</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  morningDone && eveningDone 
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                    : morningDone || eveningDone 
                    ? "bg-amber-500" 
                    : "w-0"
                }`}
                style={{ width: morningDone && eveningDone ? "100%" : morningDone || eveningDone ? "50%" : "0%" }}
              />
            </div>
            <p className={`text-[10px] font-bold tracking-tight text-center mt-1 ${
              morningDone && eveningDone 
                ? "text-emerald-600 dark:text-emerald-400" 
                : morningDone || eveningDone 
                ? "text-amber-600 dark:text-amber-400" 
                : "text-slate-400 dark:text-slate-500"
            }`}>
              {morningDone && eveningDone 
                ? "Ta journée spirituelle est complète ! 🎉" 
                : morningDone 
                ? "Encore ta méditation du soir pour compléter ta journée 🌙" 
                : "Commence ta journée avec la méditation du matin 🌅"}
            </p>
          </div>

          {/* Boutons d'action Jour & Nuit */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Bouton Matin */}
            {morningDone ? (
              <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-750 text-slate-400 dark:text-slate-500 rounded-2xl text-xs font-black select-none gap-1">
                <span>🌅 Matin fait ✓</span>
              </div>
            ) : !isMorningActive ? (
              <button
                disabled
                className="flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-750 text-slate-400 dark:text-slate-650 rounded-2xl text-xs font-black cursor-not-allowed opacity-60 gap-1"
                title="Disponible de 00h à 17h"
              >
                <span>Matin indisponible</span>
              </button>
            ) : (
              <Link
                href={`/meditate?period=morning&text=${encodeURIComponent(dailyVerse.text)}&reference=${encodeURIComponent(dailyVerse.reference)}&theme=${encodeURIComponent(dailyVerse.theme)}`}
                className="flex flex-col items-center justify-center p-3.5 bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 rounded-2xl text-xs font-black shadow-md hover:brightness-105 active:scale-[0.98] transition-all gap-1 cursor-pointer"
              >
                <span>Méditation du matin 🌅</span>
              </Link>
            )}

            {/* Bouton Soir */}
            {eveningDone ? (
              <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-750 text-slate-400 dark:text-slate-500 rounded-2xl text-xs font-black select-none gap-1">
                <span>🌙 Soir fait ✓</span>
              </div>
            ) : !isEveningActive ? (
              <button
                disabled
                className="flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-750 text-slate-400 dark:text-slate-650 rounded-2xl text-xs font-black cursor-not-allowed opacity-60 gap-1"
                title="Disponible de 17h à 23h59"
              >
                <span>Soir indisponible</span>
              </button>
            ) : !morningDone ? (
              <button
                className="flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-750 text-slate-400 dark:text-slate-500 rounded-2xl text-xs font-black cursor-help opacity-70 gap-1"
                title="Fais d'abord ta méditation du matin !"
              >
                <span>Méditation du soir 🌙</span>
              </button>
            ) : (
              <Link
                href={`/meditate?period=evening&text=${encodeURIComponent(dailyVerse.text)}&reference=${encodeURIComponent(dailyVerse.reference)}&theme=${encodeURIComponent(dailyVerse.theme)}`}
                className="flex flex-col items-center justify-center p-3.5 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl text-xs font-black shadow-md active:scale-[0.98] transition-all gap-1 cursor-pointer"
              >
                <span>Méditation du soir 🌙</span>
              </Link>
            )}
          </div>
        </div>

        {/* 3. COMPTEUR DE STREAK (SÉRIE DE JOURS DYNAMIQUE) */}
        <StreakCounter
          currentStreak={currentStreak}
          longestStreak={longestStreak}
        />

        {/* 3. BARRE D'XP ET NIVEAU ACTUEL */}
        <XPBar
          currentXP={totalXP}
          levelName={levelName}
          progressPercent={progressPercent}
        />

        {/* 4. COMPTEUR DE LINGOTS ET STREAK FREEZE (BOUTIQUE CÉLESTE) */}
        <LingotsCounter initialLingots={lingots} initialFreezes={freezesAvailable} />

        {/* 5. BADGES SPIRITUELS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Mes badges spirituels</h3>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {badges.length} / {defaultBadges.length}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
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
        </div>

        {/* 6. STATISTIQUES GLOBALES SPIRITUELLES */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between transition-colors">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Statistiques</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Sessions de méditation</span>
              <span className="text-slate-800 dark:text-slate-100 font-black text-sm">{sessionsTotal}</span>
            </div>
            <div className="flex items-center justify-between pb-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium text-xs">Versets mémorisés</span>
              <span className="text-slate-800 dark:text-slate-100 font-black text-sm">{versesLearned}</span>
            </div>
          </div>
        </div>

        {/* 7. COMPOSANT D'OPT-IN PUSH NOTIFICATIONS */}
        <PushOptIn vapidPublicKey={process.env.VAPID_PUBLIC_KEY || ""} />
      </div>
    </div>
  );
}
