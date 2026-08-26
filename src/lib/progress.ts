"use client";

import type { MeditationProgress } from "@/lib/mascots";
import { localDateStr, tzHeaders } from "@/lib/localDate";

export interface ProgressState {
  currentMiniSession: 1 | 2 | 3;
  currentStep: 0 | 1;
  sessionsCompleted: number[];
  dayCompleted: boolean;
  claimXPForSession?: 1 | 2 | 3;
}

// Date LOCALE de l'utilisateur (pas UTC) : voir src/lib/localDate.ts.
function getTodayStr(): string {
  return localDateStr();
}

/**
 * Clé de stockage de la progression du jour.
 *
 * IMPORTANT : on utilise localStorage et NON sessionStorage.
 * sessionStorage est effacé dès que l'onglet est fermé — l'utilisateur qui
 * commençait une mini-session le matin et revenait l'après-midi repartait
 * de zéro. localStorage survit à la fermeture ; la date du jour stockée
 * dans lastActivityDate assure quand même la remise à zéro quotidienne.
 */
const STORAGE_KEY = "manna_meditate_progress";

/** Lecture brute, en tolérant l'ancien emplacement (sessionStorage). */
function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  const fromLocal = localStorage.getItem(STORAGE_KEY);
  if (fromLocal) return fromLocal;
  // Migration douce : on récupère une progression laissée par l'ancienne version.
  const legacy = sessionStorage.getItem(STORAGE_KEY);
  if (legacy) {
    localStorage.setItem(STORAGE_KEY, legacy);
    return legacy;
  }
  return null;
}

/**
 * Save meditation progress to localStorage (client-side).
 */
export function saveToSessionStorage(state: ProgressState): void {
  if (typeof window === "undefined") return;
  const today = getTodayStr();
  const existing = readRaw();
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/**
 * Save meditation progress to API (server-side).
 */
export async function saveToAPI(state: ProgressState): Promise<void> {
  try {
    await fetch("/api/meditate/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...tzHeaders() },
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
 * Load meditation progress from localStorage (client-side only).
 * Returns null if not found or if the saved progress is from a different day.
 */
export function loadFromSessionStorage(): (MeditationProgress & { answers?: unknown }) | null {
  if (typeof window === "undefined") return null;
  const today = getTodayStr();
  const saved = readRaw();
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    if (parsed.lastActivityDate !== today) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Efface la progression locale du jour (nouveau verset / journée terminée). */
export function clearLocalProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Met à jour uniquement les réponses, en conservant la progression. */
export function saveAnswers(answers: unknown): void {
  if (typeof window === "undefined") return;
  const saved = readRaw();
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    data.answers = answers;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

/**
 * Load meditation progress from API (server-side).
 * Returns null if not found or from a different day.
 */
export async function loadFromAPI(): Promise<(MeditationProgress & { answers?: unknown }) | null> {
  try {
    const res = await fetch("/api/meditate/progress", { headers: tzHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    const today = getTodayStr();
    if (data.progress?.lastActivityDate !== today) return null;
    return data.progress;
  } catch {
    return null;
  }
}
