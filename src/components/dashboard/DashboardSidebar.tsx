"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen } from "lucide-react";
import StreakCounter from "@/components/gamification/StreakCounter";
import XPBar from "@/components/gamification/XPBar";
import LingotsCounter from "@/components/gamification/LingotsCounter";
import BadgeCard from "@/components/gamification/BadgeCard";
import PushOptIn from "@/components/notifications/PushOptIn";
import VerseSelector from "@/components/dashboard/VerseSelector";

interface UserStatus {
  userName: string;
  dailyVerse: { text: string; reference: string; theme: string };
  currentStreak: number;
  longestStreak: number;
  dayStatus: "morning" | "evening" | "complete" | "none";
  sessionsCompletedToday: number;
  totalXP: number;
  levelName: string;
  freezesAvailable: number;
}

const DAY_STATUS_LABELS: Record<string, { emoji: string; label: string; color: string }> = {
  morning: { emoji: "🌅", label: "Matin — Continue ta journée !", color: "text-amber-600" },
  evening: { emoji: "🌙", label: "Soir — Termine ta méditation", color: "text-indigo-600" },
  complete: { emoji: "🎉", label: "Journée spirituelle complète !", color: "text-emerald-600" },
  none: { emoji: "☕", label: "Commence ta journée spirituelle", color: "text-slate-400" },
};

const defaultBadges = [
  { name: "Premier Pas", description: "Terminez votre première session quotidienne", icon: "Compass", earnedAt: null },
  { name: "Fidèle Étoile", description: "Atteignez une série de 7 jours consécutifs", icon: "Flame", earnedAt: null },
  { name: "Guerrier de la Parole", description: "Atteignez une série de 30 jours consécutifs", icon: "Crown", earnedAt: null },
];

export default function DashboardSidebar() {
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/user/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setError("");
      } else {
        setError("Impossible de charger vos données");
      }
    } catch (err) {
      console.error("Error fetching user status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => fetchStatus());

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Rafraîchir quand l'utilisateur revient sur l'onglet (focus)
  useEffect(() => {
    const onFocus = () => fetchStatus();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="w-full lg:w-[35%] flex-shrink-0 space-y-6 lg:overflow-y-auto lg:h-full lg:pr-2 pb-10 lg:pb-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-400">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="w-full lg:w-[35%] flex-shrink-0 space-y-6 lg:overflow-y-auto lg:h-full lg:pr-2 pb-10 lg:pb-6 flex items-center justify-center">
        <p className="text-sm text-slate-400">{error || "Données non disponibles"}</p>
      </div>
    );
  }

  const dayInfo = DAY_STATUS_LABELS[status.dayStatus];
  const progressPercent = Math.round((status.sessionsCompletedToday / 3) * 100);

  return (
    <div className="w-full lg:w-[35%] flex-shrink-0 space-y-6 lg:overflow-y-auto lg:h-full lg:pr-2 pb-10 lg:pb-6 scrollbar-thin scrollbar-thumb-slate-200">
      {/* 1. VERSET DU JOUR */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
          <BookOpen className="w-48 h-48" />
        </div>
        <div className="space-y-3 relative z-10">
          <div className="inline-block px-3 py-0.5 bg-indigo-800/80 rounded-full border border-indigo-700/60 text-[10px] font-bold uppercase tracking-wider text-indigo-200">
            Verset du jour (Thème : {status.dailyVerse.theme})
          </div>
          <blockquote className="text-lg font-black leading-snug tracking-tight italic">
            « {status.dailyVerse.text} »
          </blockquote>
          <cite className="block text-xs font-bold text-indigo-300 not-italic uppercase tracking-widest">
            — {status.dailyVerse.reference}
          </cite>
        </div>
      </div>

      {/* 2. STATUT JOURNÉE SPIRITUELLE */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Journée spirituelle
          </h3>
          <span className={`text-[11px] font-black ${dayInfo.color}`}>
            {dayInfo.emoji} {dayInfo.label}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-slate-500">
            <span>Progression</span>
            <span>{status.sessionsCompletedToday}/3 mini-sessions</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progressPercent === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. MÉDITATION PERSONNELLE */}
      <VerseSelector />

      {/* 4. STREAK */}
      <StreakCounter currentStreak={status.currentStreak} longestStreak={status.longestStreak} />

      {/* 5. XP */}
      <XPBar currentXP={status.totalXP} levelName={status.levelName} progressPercent={0} />

      {/* 6. LINGOTS */}
      <LingotsCounter initialLingots={0} initialFreezes={status.freezesAvailable} />

      {/* 7. BADGES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Mes badges spirituels</h3>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            0 / {defaultBadges.length}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {defaultBadges.map((badge, index) => (
            <BadgeCard key={index} name={badge.name} description={badge.description} icon={badge.icon} earnedAt={badge.earnedAt} />
          ))}
        </div>
      </div>

      {/* 8. PUSH NOTIFICATIONS */}
      <PushOptIn vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""} />
    </div>
  );
}
