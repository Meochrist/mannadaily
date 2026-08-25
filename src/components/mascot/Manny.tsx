"use client";

import React from "react";
import CharacterRenderer from "./CharacterRenderer";
import { useCharacterState } from "@/hooks/useCharacterState";
import { moodToVisual } from "@/lib/mascotState";
import { MannyMood } from "@/types";

interface MannyProps {
  mood: MannyMood;
  size?: number;
  className?: string;
}

export default function Manny({ mood, size = 170, className = "" }: MannyProps) {
  // Récupérer l'état d'environnement uniquement pour la tenue (météo/saison).
  // La pose et l'expression NE dépendent que du mood — sinon la mascotte
  // affichait un visage neutre pendant que le message la disait joyeuse.
  const { outfit } = useCharacterState({
    currentStreak: 0,
    sessionsTotal: 0,
    inactivityDays: 0,
    dayProgress: false,
  });

  // Table unique mood → pose/expression (src/lib/mascotState.ts)
  const { pose, expression } = moodToVisual(mood);

  return (
    <CharacterRenderer
      characterId="manny"
      pose={pose}
      expression={expression}
      outfit={outfit}
      size={size}
      className={className}
    />
  );
}
