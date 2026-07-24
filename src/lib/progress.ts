"use client";

import type { MeditationProgress } from "@/lib/mascots";

export interface ProgressState {
  currentMiniSession: 1 | 2 | 3;
  currentStep: 0 | 1;
  sessionsCompleted: number[];
  dayCompleted: boolean;
  claimXPForSession?: 1 | 2 | 3;
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Save meditation progress to sessionStorage (client-side).
 */
export function saveToSessionStorage(state: ProgressState): void {
  if (typeof window === "undefined") return;
  const today = getTodayStr();
  const existing = sessionStorage.getItem("manna_meditate_progress");
  let answers = undefined;
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      answers = parsed.answers;
    } catch { /* ignore */ }
  }
  const progress: MeditationProgress & { answers?: unknown } = {
    currentMiniSession: state.currentMiniSession,
    currentStep: state.currentStep,
    sessionsCompleted: state.sessionsCompleted,
    lastActivityDate: today,
    dayCompleted: state.dayCompleted,
    answers,
  };
  sessionStorage.setItem("manna_meditate_progress", JSON.stringify(progress));
}

/**
 * Save meditation progress to API (server-side).
 */
export async function saveToAPI(state: ProgressState): Promise<void> {
  try {
    await fetch("/api/meditate/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        progress: {
          currentMiniSession: state.currentMiniSession,
          currentStep: state.currentStep,
          sessionsCompleted: state.sessionsCompleted,
          lastActivityDate: getTodayStr(),
          dayCompleted: state.dayCompleted,
        },
        claimXPForSession: state.claimXPForSession,
      }),
    });
  } catch (err) {
    console.warn("Failed to save progress to API:", err);
  }
}

/**
 * Unified save: sessionStorage + API.
 * Returns a promise resolved after API save completes (fire-and-forget error handling).
 */
export async function saveMeditationProgress(state: ProgressState): Promise<void> {
  saveToSessionStorage(state);
  await saveToAPI(state);
}

/**
 * Load meditation progress from sessionStorage (client-side only).
 * Returns null if not found or if the saved progress is from a different day.
 */
export function loadFromSessionStorage(): (MeditationProgress & { answers?: unknown }) | null {
  if (typeof window === "undefined") return null;
  const today = getTodayStr();
  const saved = sessionStorage.getItem("manna_meditate_progress");
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    if (parsed.lastActivityDate !== today) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Load meditation progress from API (server-side).
 * Returns null if not found or from a different day.
 */
export async function loadFromAPI(): Promise<(MeditationProgress & { answers?: unknown }) | null> {
  try {
    const res = await fetch("/api/meditate/progress");
    if (!res.ok) return null;
    const data = await res.json();
    const today = getTodayStr();
    if (data.progress?.lastActivityDate !== today) return null;
    return data.progress;
  } catch {
    return null;
  }
}
