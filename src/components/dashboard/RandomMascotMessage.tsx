"use client";

import React, { useState, useEffect } from "react";
import MascotMessage from "../mascot/MascotMessage";
import { useCharacterState } from "@/hooks/useCharacterState";
import { resolveMascotState, moodToVisual } from "@/lib/mascotState";
import { MeditationProgress } from "@/lib/mascots";
import { MannyMood } from "@/types";

interface RandomMascotMessageProps {
  userName: string;
  streakCount: number;
  dayProgress: boolean;
  inactivityDays: number;
  sessionsCompletedToday?: number;
  className?: string;
  mood?: MannyMood;
}

type MascotType =
  | "manny"
  | "samson"
  | "esther"
  | "gedeon"
  | "noe"
  | "paul"
  | "pierre"
  | "moise"
  | "abraham"
  | "david";

const MASCOT_PREFIX: Record<MascotType, string> = {
  manny: "📖 Manny : ",
  samson: "💪 Samson : ",
  esther: "👑 Esther : ",
  gedeon: "🛡️ Gédéon : ",
  noe: "🕊️ Noé : ",
  paul: "✉️ Paul : ",
  pierre: "🔑 Pierre : ",
  moise: "📜 Moïse : ",
  abraham: "✨ Abraham : ",
  david: "🎵 David : ",
};

export default function RandomMascotMessage({
  userName: _userName,
  streakCount,
  dayProgress,
  inactivityDays,
  sessionsCompletedToday = 0,
  className,
  mood: moodProp,
}: RandomMascotMessageProps) {
  // Choix aléatoire du personnage AU MONTAGE UNIQUEMENT — pas de setState dans
  // un useEffect (cascading renders). On ne le recalcule jamais ensuite pour éviter
  // qu'il change à chaque rafraîchissement de la progression.
  const [mascot] = useState<MascotType>(() => {
    const mascots = Object.keys(MASCOT_PREFIX) as MascotType[];
    return mascots[Math.floor(Math.random() * mascots.length)];
  });
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState<MeditationProgress | null>(null);

  // La progression fraîche de l'API prime sur la valeur rendue côté serveur :
  // sans ça, le tableau de bord gardait un état obsolète après une méditation.
  // Le state `mounted` est levé après le premier fetch pour éviter un flash visuel.
  useEffect(() => {
    fetch("/api/meditate/progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.progress) setProgress(data.progress);
      })
      .catch((err) => console.warn("Failed to fetch progress:", err))
      .finally(() => setMounted(true));
  }, []);

  // Tenue seulement (météo/saison) — la pose vient du mood, pas de la météo.
  const { outfit, mascotState: envState } = useCharacterState({
    currentStreak: streakCount,
    sessionsTotal: 0,
    inactivityDays,
    dayProgress,
  });

  // === UNE SEULE SOURCE DE VÉRITÉ ===
  // mood + pose + expression + message sortent du même calcul : ils ne
  // peuvent plus se contredire (message joyeux sur un visage neutre, etc.).
  const apiSessions = progress?.sessionsCompleted;
  const completedToday = Array.isArray(apiSessions) ? apiSessions.length : sessionsCompletedToday;

  const state = resolveMascotState({
    sessionsCompletedToday: completedToday,
    dayCompleted: progress?.dayCompleted ?? dayProgress,
    streakCount,
    inactivityDays,
  });

  // Un mood explicitement fourni (rendu serveur) ne pilote que le visuel,
  // le message reste celui du calcul unifié pour rester cohérent.
  const effectiveMood = moodProp ?? state.mood;
  const visual = moodProp ? moodToVisual(moodProp) : { pose: state.pose, expression: state.expression };

  if (!mounted) {
    return <div className={`h-32 w-full max-w-xl bg-slate-50/20 rounded-2xl animate-pulse ${className}`} />;
  }

  return (
    <MascotMessage
      mascot={mascot}
      mood={effectiveMood}
      pose={visual.pose}
      expression={visual.expression}
      outfit={outfit}
      state={envState}
      message={`${MASCOT_PREFIX[mascot]}${state.message}`}
      size={150}
      className={className}
    />
  );
}
