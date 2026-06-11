"use client";

import React, { useState, useEffect } from "react";
import MascotMessage from "../mascot/MascotMessage";
import { MannyMood } from "@/types";
import { getMannyMessage, MannySituation } from "@/lib/mannyMessages";

interface RandomMascotMessageProps {
  userName: string;
  streakCount: number;
}

type MascotType = "manny" | "samson" | "esther" | "gedeon" | "noe";

export default function RandomMascotMessage({ userName, streakCount }: RandomMascotMessageProps) {
  const [mascot, setMascot] = useState<MascotType>("manny");
  const [mood, setMood] = useState<MannyMood>("happy");
  const [message, setMessage] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Choix aléatoire de la mascotte parmi les 5
    const mascots: MascotType[] = ["manny", "samson", "esther", "gedeon", "noe"];
    const randomMascot = mascots[Math.floor(Math.random() * mascots.length)];

    // 2. Choix d'une humeur positive et engageante
    const moods: MannyMood[] = ["happy", "encouraging", "excited"];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];

    // 3. Choix aléatoire entre "welcome" et "first_visit"
    const situations: MannySituation[] = ["welcome", "first_visit"];
    const randomSituation = situations[Math.floor(Math.random() * situations.length)];

    // 4. Génération du message d'accueil
    const rawMessage = getMannyMessage(randomSituation, userName, streakCount);

    // 5. Signature spécifique pour identifier le personnage qui parle
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
      case "manny":
      default:
        prefix = "📖 Manny : ";
        break;
    }

    setMascot(randomMascot);
    setMood(randomMood);
    setMessage(`${prefix}${rawMessage}`);
    setMounted(true);
  }, [userName, streakCount]);

  // Rendu vide pendant l'hydratation SSR pour éviter les décalages de layout et d'hydratation
  if (!mounted) {
    return <div className="h-32 w-full max-w-xl bg-slate-50/20 rounded-2xl animate-pulse" />;
  }

  return (
    <MascotMessage
      mascot={mascot}
      mood={mood}
      message={message}
      size={110}
    />
  );
}
