"use client";

import React from "react";
import CharacterRenderer from "./CharacterRenderer";
import { useCharacterState } from "@/hooks/useCharacterState";
import { MannyMood } from "@/types";

interface MannyMessageProps {
  mood: MannyMood;
  message: string;
  size?: number;
}

export default function MannyMessage({ mood, message, size = 100 }: MannyMessageProps) {
  // Récupérer l'état d'environnement (pour l'outfit)
  const { outfit } = useCharacterState({
    currentStreak: 0,
    sessionsTotal: 0,
    inactivityDays: 0,
    dayProgress: false,
  });

  // Associer le mood à la pose et à l'expression correspondantes
  let pose: "idle" | "jumping" | "sad" | "running" = "idle";
  let expression: "neutral" | "happy" | "sweating" | "crying" = "happy";

  switch (mood) {
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
    case "happy":
    default:
      pose = "idle";
      expression = "happy";
      break;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm max-w-xl">
      <div className="flex-shrink-0">
        <CharacterRenderer
          characterId="manny"
          pose={pose}
          expression={expression}
          outfit={outfit}
          size={size}
        />
      </div>
      <div className="relative flex-1 bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-slate-700 text-sm md:text-base font-medium">
        <div className="absolute hidden sm:block top-1/2 -left-2 w-3.5 h-3.5 bg-slate-50 border-l border-b border-slate-200/60 transform -translate-y-1/2 rotate-45" />
        <div className="absolute block sm:hidden -top-2 left-1/2 w-3.5 h-3.5 bg-slate-50 border-t border-l border-slate-200/60 transform -translate-x-1/2 rotate-45" />
        <p className="leading-relaxed whitespace-pre-line">{message}</p>
      </div>
    </div>
  );
}

