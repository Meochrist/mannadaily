"use client";

import React, { useState, useEffect } from "react";
import MascotMessage from "../mascot/MascotMessage";
import { useCharacterState } from "@/hooks/useCharacterState";
import { getMannyMessage, MannySituation } from "@/lib/mannyMessages";

interface RandomMascotMessageProps {
  userName: string;
  streakCount: number;
  dayProgress: boolean;
  inactivityDays: number;
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
}: RandomMascotMessageProps) {
  const [mascot, setMascot] = useState<MascotType>("manny");
  const [message, setMessage] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  // Appeler le hook d'état global du personnage pour calculer les poses/expressions et la tenue météo
  const { pose, expression, outfit, mascotState } = useCharacterState({
    currentStreak: streakCount,
    sessionsTotal: 0,
    inactivityDays,
    dayProgress,
  });

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

    // 2. Choix aléatoire entre "welcome" et "first_visit"
    const situations: MannySituation[] = ["welcome", "first_visit"];
    const randomSituation = situations[Math.floor(Math.random() * situations.length)];

    // 3. Génération du message d'accueil
    const rawMessage = getMannyMessage(randomSituation, userName, streakCount);

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

    setMascot(randomMascot);
    setMessage(`${prefix}${rawMessage}`);
    setMounted(true);
  }, [userName, streakCount]);

  // Rendu de secours pendant le SSR pour éviter les décalages d'hydratation
  if (!mounted) {
    return <div className="h-32 w-full max-w-xl bg-slate-50/20 rounded-2xl animate-pulse" />;
  }

  return (
    <MascotMessage
      mascot={mascot}
      pose={pose}
      expression={expression}
      outfit={outfit}
      state={mascotState}
      message={message}
      size={110}
    />
  );
}

