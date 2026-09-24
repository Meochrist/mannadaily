"use client";

import React from "react";
import CharacterRenderer, { MascotState } from "./CharacterRenderer";
import { useCharacterState } from "@/hooks/useCharacterState";
import { MannyMood } from "@/types";
import { cn } from "@/lib/utils";

interface MascotMessageProps {
  mascot:
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
  mood?: MannyMood;
  pose?: "idle" | "jumping" | "sad" | "running";
  expression?: "neutral" | "happy" | "sweating" | "crying";
  outfit?: "default" | "winter" | "beach" | "halloween";
  state?: MascotState;
  message: string;
  size?: number;
  className?: string;
}

export default function MascotMessage({
  mascot,
  mood,
  pose: customPose,
  expression: customExpression,
  outfit: customOutfit,
  state,
  message,
  size = 140,
  className = "",
}: MascotMessageProps) {
  // Récupérer l'état d'environnement (pour l'outfit par défaut si non spécifié)
  const { outfit: envOutfit } = useCharacterState({
    currentStreak: 0,
    sessionsTotal: 0,
    inactivityDays: 0,
    dayProgress: false,
  });

  // Associer le mood à la pose et à l'expression correspondantes par défaut
  let pose: "idle" | "jumping" | "sad" | "running" = "idle";
  let expression: "neutral" | "happy" | "sweating" | "crying" = "happy";

  if (mood) {
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

  // La pose, l'expression et l'outfit passés explicitement ont priorité absolue
  const finalPose = customPose || pose;
  const finalExpression = customExpression || expression;
  const finalOutfit = customOutfit || envOutfit;

  return (
    <div className={cn("flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm max-w-xl", className)}>
      <div className="flex-shrink-0">
        <CharacterRenderer
          characterId={mascot}
          pose={finalPose}
          expression={finalExpression}
          outfit={finalOutfit}
          state={state}
          size={size}
        />
      </div>
      <div className="relative flex-1 bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-slate-700 text-sm md:text-base font-medium">
        {/* Flèches orientables de la bulle de dialogue */}
        <div className="absolute hidden sm:block top-1/2 -left-2 w-3.5 h-3.5 bg-slate-50 border-l border-b border-slate-200/60 transform -translate-y-1/2 rotate-45" />
        <div className="absolute block sm:hidden -top-2 left-1/2 w-3.5 h-3.5 bg-slate-50 border-t border-l border-slate-200/60 transform -translate-x-1/2 rotate-45" />
        <p className="leading-relaxed whitespace-pre-line">{message}</p>
      </div>
    </div>
  );
}


