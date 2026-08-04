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
  const [currentSituation, setCurrentSituation] = useState<MannySituation>("first_visit");

  // Fetch progress from API if no mood provided
  useEffect(() => {
    if (moodProp) return;
    fetch("/api/meditate/progress")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.progress) {
          setProgress(data.progress);
        }
      })
      .catch(err => console.warn("Failed to fetch progress:", err));
  }, [moodProp]);

  // Calculate mood
  const computedMood: MannyMood | undefined = moodProp || (progress ? getMascotState(progress).mood : undefined);

  // Character state hook
  const { pose: envPose, expression: envExpression, outfit, mascotState } = useCharacterState({
    currentStreak: streakCount,
    sessionsTotal: 0,
    inactivityDays,
    dayProgress,
  });

  // Determine message + situation
  useEffect(() => {
    const mascots: MascotType[] = [
      "manny", "samson", "esther", "gedeon", "noe",
      "paul", "pierre", "moise", "abraham", "david",
    ];
    const randomMascot = mascots[Math.floor(Math.random() * mascots.length)];

    // Priority: API data > server prop
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
      situation = "streak_saved";
    } else if (completed >= 3) {
      situation = "day_complete";
    } else if (completed >= 1) {
      situation = "partial_progress";
    } else {
      situation = "first_visit";
    }

    const rawMessage = getMannyMessage(situation, userName, streakCount);

    let prefix = "";
    switch (randomMascot) {
      case "samson": prefix = "💪 Samson : "; break;
      case "esther": prefix = "👑 Esther : "; break;
      case "gedeon": prefix = "🛡️ Gédéon : "; break;
      case "noe": prefix = "🕊️ Noé : "; break;
      case "paul": prefix = "✉️ Paul : "; break;
      case "pierre": prefix = "🔑 Pierre : "; break;
      case "moise": prefix = "📜 Moïse : "; break;
      case "abraham": prefix = "✨ Abraham : "; break;
      case "david": prefix = "🎵 David : "; break;
      default: prefix = "📖 Manny : "; break;
    }

    queueMicrotask(() => {
      setMascot(randomMascot);
      setMessage(`${prefix}${rawMessage}`);
      setMounted(true);
      setCurrentSituation(situation);
    });
  }, [userName, streakCount, progress, inactivityDays, dayProgress, sessionsCompletedToday]);

  // Pose/expression: mood first, then situation fallback
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
  } else {
    // Fallback: use situation to determine pose/expression
    switch (currentSituation) {
      case "day_complete":
      case "streak_milestone":
        pose = "jumping";
        expression = "happy";
        break;
      case "streak_saved":
      case "partial_progress":
        pose = "idle";
        expression = "happy";
        break;
      case "streak_danger":
        pose = "sad";
        expression = "crying";
        break;
      default:
        pose = "idle";
        expression = "happy";
        break;
    }
  }

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
