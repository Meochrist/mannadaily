import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import MannyMessage from "@/components/mascot/MannyMessage";
import XPBar from "@/components/gamification/XPBar";
import StreakCounter from "@/components/gamification/StreakCounter";
import BadgeCard from "@/components/gamification/BadgeCard";
import { BookOpen, Play, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface ProgressData {
  progress: {
    totalXP: number;
    levelName: string;
    progressPercent: number;
    versesLearned: number;
    sessionsTotal: number;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
  };
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: string;
  }>;
}

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || "Ami";

  let data: ProgressData = {
    progress: {
      totalXP: 0,
      levelName: "Semence",
      progressPercent: 0,
      versesLearned: 0,
      sessionsTotal: 0,
    },
    streak: {
      currentStreak: 0,
      longestStreak: 0,
    },
    badges: [],
  };

  try {
    const reqHeaders = await headers();
    const cookie = reqHeaders.get("cookie");
    const host = reqHeaders.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/user/progress`, {
      cache: "no-store",
      headers: {
        cookie: cookie || "",
      },
    });

    if (res.ok) {
      data = await res.json();
    }
  } catch (error) {
    console.warn("Failed to fetch user progress from API, using default static values:", error);
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
    const earned = data.badges.find((b) => b.name === db.name);
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

      <section className="flex justify-center md:justify-start">
        <MannyMessage
          mood="happy"
          message={`"Chaque parole de Dieu est pure. Il est un bouclier pour ceux qui cherchent en lui un refuge."\n\nQue ta journée soit remplie de Sa présence, ${userName} !`}
          size={110}
        />
      </section>

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

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
            <BookOpen className="w-64 h-64" />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="inline-block px-3.5 py-1 bg-indigo-800/80 rounded-full border border-indigo-700/60 text-xs font-bold uppercase tracking-wider text-indigo-200">
              Verset du jour
            </div>
            <blockquote className="text-2xl font-black leading-snug tracking-tight italic">
              « Je puis tout par celui qui me fortifie. »
            </blockquote>
            <cite className="block text-sm font-bold text-indigo-300 not-italic uppercase tracking-widest">
              — Philippiens 4:13
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
              <span className="text-slate-800 font-black text-lg">{data.progress.sessionsTotal}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500 font-medium text-sm">Versets mémorisés</span>
              <span className="text-slate-800 font-black text-lg">{data.progress.versesLearned}</span>
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
            {data.badges.length} / {defaultBadges.length} obtenus
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
