"use client";

import { useEffect, useState } from "react";
import Manny from "@/components/mascot/Manny";
import Samson from "@/components/mascot/Samson";
import Esther from "@/components/mascot/Esther";
import Gedeon from "@/components/mascot/Gedeon";
import Noe from "@/components/mascot/Noe";

interface WidgetData {
  mascot: string;
  mood: string;
  message: string;
  emoji: string;
  streak: { currentStreak: number; longestStreak: number };
  sessionsCompleted: number;
  dayCompleted: boolean;
  verse?: string;
  hour: number;
  minute: number;
}

const MASCOT_COMPONENTS: Record<string, React.ComponentType<{ mood: string; size?: number; className?: string }>> = {
  manny: Manny,
  samson: Samson,
  esther: Esther,
  gedeon: Gedeon,
  noe: Noe,
};

const BACKGROUND_GRADIENTS: Record<string, string> = {
  happy: "from-amber-400/20 to-orange-500/20",
  encouraging: "from-blue-400/20 to-cyan-500/20",
  thinking: "from-purple-400/20 to-pink-500/20",
  celebrating: "from-green-400/20 to-emerald-500/20",
  sad: "from-slate-400/20 to-gray-500/20",
  crying: "from-indigo-400/20 to-blue-600/20",
  scared: "from-red-400/20 to-rose-500/20",
  panicked: "from-red-500/30 to-orange-600/30",
  angry: "from-red-600/30 to-rose-700/30",
  disappointed: "from-gray-400/20 to-slate-500/20",
  praying: "from-violet-400/20 to-purple-500/20",
  excited: "from-yellow-400/20 to-amber-500/20",
  neutral: "from-gray-300/20 to-slate-400/20",
};

const URGENCY_BORDERS: Record<string, string> = {
  happy: "border-amber-400/30",
  encouraging: "border-blue-400/30",
  thinking: "border-purple-400/30",
  celebrating: "border-green-400/30",
  sad: "border-slate-400/30",
  crying: "border-indigo-400/30",
  scared: "border-red-400/30",
  panicked: "border-red-500/50",
  angry: "border-red-600/50",
  disappointed: "border-gray-400/30",
  praying: "border-violet-400/30",
  excited: "border-yellow-400/30",
  neutral: "border-gray-300/30",
};

export default function LargeWidget() {
  const [data, setData] = useState<WidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mise à jour de l'affichage de l'heure chaque minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Récupération des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/widget-data", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Widget fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto rounded-3xl p-6 min-h-[300px] flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="w-16 h-16 rounded-full bg-gray-300 animate-pulse" />
        <div className="w-32 h-4 rounded bg-gray-300 animate-pulse" />
        <div className="w-48 h-3 rounded bg-gray-300 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full max-w-md mx-auto rounded-3xl p-6 min-h-[300px] flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-100 to-gray-200">
        <p className="text-gray-500 text-sm">Ouvre MannaDaily pour voir ton widget</p>
      </div>
    );
  }

  const MascotComponent = MASCOT_COMPONENTS[data.mascot] || Manny;
  const bgGradient = BACKGROUND_GRADIENTS[data.mood] || BACKGROUND_GRADIENTS.neutral;
  const border = URGENCY_BORDERS[data.mood] || URGENCY_BORDERS.neutral;
  const displayTime = currentTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  // Couleur de fond urgence (rouge si panicked/angry)
  const isUrgent = data.mood === "panicked" || data.mood === "angry" || data.mood === "scared";

  return (
    <div
      className={`w-full max-w-md mx-auto rounded-3xl p-5 min-h-[320px] flex flex-col gap-3 border-2 ${border} bg-gradient-to-br ${bgGradient} shadow-lg transition-all duration-500`}
    >
      {/* En-tête : heure et streak */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${isUrgent ? "bg-red-500 text-white animate-pulse" : "bg-white/60 text-gray-700"}`}>
            {displayTime}
          </span>
          {data.streak.currentStreak > 0 && (
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${data.streak.currentStreak >= 7 ? "bg-orange-100 text-orange-700" : "bg-white/60 text-gray-600"}`}>
              🔥 {data.streak.currentStreak}j
            </span>
          )}
        </div>
        <span className="text-lg">{data.emoji}</span>
      </div>

      {/* Mascotte centrale */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <div className={`transition-transform duration-300 ${isUrgent ? "animate-bounce" : ""}`}>
          <MascotComponent mood={data.mood} size={120} />
        </div>
        <p className={`text-center text-sm font-bold max-w-xs ${isUrgent ? "text-red-700" : "text-gray-800"}`}>
          {data.message}
        </p>
      </div>

      {/* Progression du jour */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i <= data.sessionsCompleted
                  ? data.mood === "celebrating" || data.mood === "excited"
                    ? "bg-green-500 text-white"
                    : "bg-indigo-500 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {i <= data.sessionsCompleted ? "✓" : i}
            </div>
          ))}
        </div>
        {data.dayCompleted ? (
          <span className="text-xs font-bold text-green-600">Journée complète ✓</span>
        ) : (
          <a
            href="/meditate"
            className={`text-xs font-bold px-3 py-1.5 rounded-full text-white transition-colors ${
              isUrgent
                ? "bg-red-600 hover:bg-red-700 animate-pulse"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            Méditer →
          </a>
        )}
      </div>
    </div>
  );
}
