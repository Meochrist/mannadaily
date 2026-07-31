"use client";

import React, { useState, useEffect } from "react";
import MascotMessage from "../mascot/MascotMessage";
import { useCharacterState } from "@/hooks/useCharacterState";
import { getMannyMessage, MannySituation } from "@/lib/mannyMessages";
import { getMascotState, MeditationProgress } from "@/lib/mascots";
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

export default function RandomMascotMessage({
  userName,
  streakCount,
  dayProgress,
  inactivityDays,
  sessionsCompletedToday = 0,
  className,
  mood: moodProp,
}: RandomMascotMessageProps) {
  const [mascot, setMascot] = useState<MascotType>("manny");
  const [message, setMessage] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState<MeditationProgress | null>(null);

  // Si aucun mood n'est fourni via les props, on récupère la progression depuis l'API
  useEffect(() => {
    if (moodProp) return; // Un mood explicite a priorité
    fetch("/api/meditate/progress")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.progress) {
          setProgress(data.progress);
        }
      })
      .catch(err => console.warn("Failed to fetch progress:", err));
  }, [moodProp]);

  // Calcul du mood basé sur la progression (uniquement si mood n'est pas fourni par props)
  const computedMood: MannyMood | undefined = moodProp || (progress ? getMascotState(progress).mood : undefined);

  // Appeler le hook d'état global du personnage pour calculer les poses/expressions et la tenue météo
  const { pose: envPose, expression: envExpression, outfit, mascotState } = useCharacterState({
    currentStreak: streakCount,
    sessionsTotal: 0,
    inactivityDays,
    dayProgress,
  });

  // Convertir le mood calculé en pose/expression, avec priorité sur useCharacterState
  let pose: "idle" | "jumping" | "sad" | "running" = envPose;
  let expression: "neutral" | "happy" | "sweating" | "crying" = envExpression;

  if (computedMood) {
    switch (computedMood) {
      case "excited":
      case "celebrating":
      case "encouraging":
        pose = "jumping";
        expression = "happy";
        break;
      case "sleeping":
      case "praying":
      case "thinking":
        pose = "idle";
        expression = "neutral";
        break;
      case "sad":
        pose = "sad";
        expression = "crying";
        break;
      case "happy":
      default:
        pose = "idle";
        expression = "happy";
        break;
    }
  }

  useEffect(() => {
    // 1. Choix aléatoire de la mascotte parmi nos 10 mascottes
    const mascots: MascotType[] = [
      "manny",
      "samson",
      "esther",
      "gedeon",
      "noe",
      "paul",
      "pierre",
      "moise",
      "abraham",
      "david",
    ];
    const randomMascot = mascots[Math.floor(Math.random() * mascots.length)];

    // 2. Déterminer la situation selon la progression réelle
    // Priorité : données API > prop serveur
    const apiSessions = progress?.sessionsCompleted;
    const completed = Array.isArray(apiSessions) ? apiSessions.length : sessionsCompletedToday;

    let situation: MannySituation;
    const isStreakDanger = streakCount > 0 && inactivityDays >= 1;
    const isStreakMilestone = streakCount > 0 && [7, 30, 50, 100, 200, 365].includes(streakCount) && inactivityDays === 0;

    if (isStreakMilestone) {
      situation = "streak_milestone";
    } else if (isStreakDanger && completed === 0) {
      situation = "streak_danger";
    } else if (isStreakDanger && completed >= 1) {
      situation = "streak_saved"; // Était en danger, vient de sauver sa série
    } else if (completed >= 3) {
      situation = "day_complete";
    } else if (completed >= 1) {
      situation = "partial_progress";
    } else {
      situation = "first_visit";
    }

    const rawMessage = getMannyMessage(situation, userName, streakCount);

    // 4. Signature spécifique pour identifier le personnage qui parle
    let prefix = "";
    switch (randomMascot) {
      case "samson":
        prefix = "💪 Samson : ";
        break;
      case "esther":
        prefix = "👑 Esther : ";
        break;
      case "gedeon":
        prefix = "🛡️ Gédéon : ";
        break;
      case "noe":
        prefix = "🕊️ Noé : ";
        break;
      case "paul":
        prefix = "✉️ Paul : ";
        break;
      case "pierre":
        prefix = "🔑 Pierre : ";
        break;
      case "moise":
        prefix = "📜 Moïse : ";
        break;
      case "abraham":
        prefix = "✨ Abraham : ";
        break;
      case "david":
        prefix = "🎵 David : ";
        break;
      case "manny":
      default:
        prefix = "📖 Manny : ";
        break;
    }

    queueMicrotask(() => {
      setMascot(randomMascot);
      setMessage(`${prefix}${rawMessage}`);
      setMounted(true);
    });
  }, [userName, streakCount, progress, inactivityDays, dayProgress, sessionsCompletedToday]);

  // Rendu de secours pendant le SSR pour éviter les décalages d'hydratation
  if (!mounted) {
    return <div className={`h-32 w-full max-w-xl bg-slate-50/20 rounded-2xl animate-pulse ${className}`} />;
  }

  return (
    <MascotMessage
      mascot={mascot}
      pose={pose}
      expression={expression}
      outfit={outfit}
      state={mascotState}
      message={message}
      size={150}
      className={className}
    />
  );
}
