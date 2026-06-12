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
import { BookOpen, Play, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const userName = session?.user?.name || "Ami";

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

  if (userId) {
    try {
      // 1. Récupération directe de la progression de l'utilisateur
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
            lingots: 0,
          },
        });
      }

      totalXP = progress.totalXP;
      versesLearned = progress.versesLearned;
      sessionsTotal = progress.sessionsTotal;
      lingots = progress.lingots;

      // Récupérer le streak freeze
      const streakFreeze = await db.streakFreeze.findUnique({
        where: { userId }
      });
      freezesAvailable = streakFreeze ? streakFreeze.freezesAvailable : 0;

      // Calcul des niveaux et pourcentage de progression en local
      const levelInfo = getLevelFromXP(totalXP);
      levelName = levelInfo.name;
      progressPercent = getXPProgress(totalXP);

      // 2. Récupération directe du streak
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

      currentStreak = streak.currentStreak;
      longestStreak = streak.longestStreak;

      // 3. Récupération directe des badges
      const userBadges = await db.userBadge.findMany({
        where: { userId },
        include: {
          badge: true,
        },
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
    <div className="space-y-8 max-w-5xl mx-auto">
      <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            Bonjour, <span className="text-indigo-600">{userName}</span> !
          </h2>
          <p className="text-slate-500 font-medium">
            Prêt à nourrir ton âme aujourd'hui ? Chaque pas de foi compte.
          </p>
        </div>
      </section>

      {/* COMPTEUR DE LINGOTS ET STREAK FREEZE */}
      <LingotsCounter initialLingots={lingots} initialFreezes={freezesAvailable} />

      {/* COMPOSANT D'OPT-IN PUSH */}
      <PushOptIn vapidPublicKey={process.env.VAPID_PUBLIC_KEY || ""} />

      <section className="flex justify-center md:justify-start">
        <RandomMascotMessage
          userName={userName}
          streakCount={currentStreak}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <XPBar
            currentXP={totalXP}
            levelName={levelName}
            progressPercent={progressPercent}
          />
        </div>
        <div>
          <StreakCounter
            currentStreak={currentStreak}
            longestStreak={longestStreak}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
            <BookOpen className="w-64 h-64" />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="inline-block px-3.5 py-1 bg-indigo-800/80 rounded-full border border-indigo-700/60 text-xs font-bold uppercase tracking-wider text-indigo-200">
              Verset du jour (Thème : {dailyVerse.theme})
            </div>
            <blockquote className="text-2xl font-black leading-snug tracking-tight italic">
              « {dailyVerse.text} »
            </blockquote>
            <cite className="block text-sm font-bold text-indigo-300 not-italic uppercase tracking-widest">
              — {dailyVerse.reference}
            </cite>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 relative z-10">
            <Link
              href="/meditate"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-extrabold rounded-xl shadow-lg hover:from-amber-300 hover:to-amber-400 hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Play className="w-5 h-5 fill-slate-900" />
              Méditer maintenant
            </Link>
            <Link
              href="/proclaim"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-800 text-white font-extrabold rounded-xl border border-indigo-700 hover:bg-indigo-750 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <CheckCircle className="w-5 h-5 text-indigo-300" />
              Faire mes proclamations
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Statistiques</h3>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500 font-medium text-sm">Sessions totales</span>
              <span className="text-slate-800 font-black text-lg">{sessionsTotal}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500 font-medium text-sm">Versets mémorisés</span>
              <span className="text-slate-800 font-black text-lg">{versesLearned}</span>
            </div>
          </div>
          <div className="text-[11px] font-bold text-indigo-600 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/30 text-center mt-4">
            Reste persévérant dans l'étude ! 🌟
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Mes badges spirituels</h3>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            {badges.length} / {defaultBadges.length} obtenus
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
    </div>
  );
}
