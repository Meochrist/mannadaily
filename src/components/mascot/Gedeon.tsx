"use client";

import React from "react";
import CharacterRenderer from "./CharacterRenderer";
import { useCharacterState } from "@/hooks/useCharacterState";
import { MannyMood } from "@/types";

interface GedeonProps {
  mood: MannyMood;
  size?: number;
  className?: string;
}

export default function Gedeon({ mood, size = 170, className = "" }: GedeonProps) {
  const { outfit } = useCharacterState({
    currentStreak: 0,
    sessionsTotal: 0,
    inactivityDays: 0,
    dayProgress: false,
  });

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

  return (
    <CharacterRenderer
      characterId="gedeon"
      pose={pose}
      expression={expression}
      outfit={outfit}
      size={size}
      className={className}
    />
  );
}
