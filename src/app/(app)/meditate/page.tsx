"use client";

import React, { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Manny from "@/components/mascot/Manny";
import MascotMessage from "@/components/mascot/MascotMessage";
import { MannyMood } from "@/types";
import { getMascotState } from "@/lib/mascots";
import { saveMeditationProgress, loadFromSessionStorage, loadFromAPI, type ProgressState } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  Sparkles, 
  Award, 
  Flame, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Heart,
  HelpCircle,
  
  Bookmark,
  Hash,
  Link2 as LinkIcon,
  Loader2,
  
  
  
  Coffee,
  Layers
} from "lucide-react";
import { getMannyMessage } from "@/lib/mannyMessages";
import * as sounds from "@/lib/sounds";
import { getDailyVerse, getVerseContext, Verse as DailyVerseType } from "@/lib/verses";
import SpeechMicButton from "@/components/meditation/SpeechMicButton";

// === Type definitions ===

interface MeditationProgress {
  currentMiniSession: 1 | 2 | 3;
  currentStep: 0 | 1;
  sessionsCompleted: number[];
  lastActivityDate: string;
  dayCompleted: boolean;
}

interface SessionResult {
  xpEarned: number;
  newXP: number;
  leveledUp: boolean;
  newLevel: number;
  levelName: string;
  streak: number;
  newBadges: Array<{
    name: string;
    description: string;
    icon: string;
  }>;
}

interface Answers {
  step2_who: string;
  step2_whom: string;
  step2_before: string;
  step3_epoch: string;
  step3_dest: string;
  step3_problem: string;
  step4_actors: string;
  step4_repeats: string;
  step4_action: string;
  step5_author: string;
  step5_jesus: string;
  step5_summary: string;
  step6_situation: string;
  step6_transform: string;
  step6_decision: string;
}

interface CrossRef {
  id: number;
  refLabel: string;
  toVerse?: { text?: string };
}

interface ChapterVerse {
  verse: number;
  text: string;
}

interface StrongResult {
  number: string;
  pronunciation?: string;
  lemma?: string;
  definition?: string;
}

interface VerseDetails {
  id: number;
  reference: string;
  text: string;
  translation?: string;
  theme?: string;
  highlightColor?: string | null;
  bookNumber?: number;
  chapter?: number;
  verse?: number;
}

// Mini-session configuration
const MINI_SESSIONS = [
  { id: 1, label: "Verset & Contexte", icon: BookOpen, color: "indigo", xp: 10 },
  { id: 2, label: "Observation & Interprétation", icon: Layers, color: "violet", xp: 15 },
  { id: 3, label: "Application & Prière", icon: Heart, color: "emerald", xp: 20 },
] as const;

// Maps: (miniSession, stepInMini) => actual step label
const STEP_LABELS: Record<number, [string, string]> = {
  1: ["🙏 Prière d'ouverture", "📖 Contexte biblique"],
  2: ["🔎 OIA+ — Observation", "🧠 Méditation & Réflexion"],
  3: ["✍️ Application", "🙌 Prière & Proclamation"],
};

// Emojis for mini-session summary cards
const MINI_EMOJIS: Record<number, string> = { 1: "📖", 2: "🔎", 3: "✍️" };
const MINI_COLORS: Record<number, string> = { 1: "indigo", 2: "emerald", 3: "amber" };

// XP rewards per mini-session
const XP_REWARDS: Record<number, number> = { 1: 10, 2: 15, 3: 20 };

const defaultProgress: MeditationProgress = {
  currentMiniSession: 1,
  currentStep: 0,
  sessionsCompleted: [],
  lastActivityDate: new Date().toISOString().split("T")[0],
  dayCompleted: false,
};

import { verses } from "@/lib/verses";

// === Helper to get today's date string ===
function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function MeditatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // === Core state for mini-sessions ===
  const [currentMiniSession, setCurrentMiniSession] = useState<1 | 2 | 3>(1);
  const [currentStepInMini, setCurrentStepInMini] = useState<0 | 1>(0);
  const [sessionsCompleted, setSessionsCompleted] = useState<number[]>([]);
  const [dayCompleted, setDayCompleted] = useState(false);
  const [isDayDone, setIsDayDone] = useState(false); // journée déjà complète → écran spécial
  const [progressLoaded, setProgressLoaded] = useState(false);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Verse of the day
  const [dailyVerse, setDailyVerse] = useState<DailyVerseType | null>(null);
  const [period, setPeriod] = useState<"morning" | "evening">("morning");
  const [bibleContext, setBibleContext] = useState<{ before: DailyVerseType[]; after: DailyVerseType[] }>({ before: [], after: [] });

  // AI-generated content
  const [historicalContext, setHistoricalContext] = useState("");
  const [prayerContent, setPrayerContent] = useState("");
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [prefetchedHistorical, setPrefetchedHistorical] = useState<string | null>(null);
  const [prefetchedMeditation, setPrefetchedMeditation] = useState<string | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);

  // User answers
  const [answers, setAnswers] = useState<Answers>({
    step2_who: "", step2_whom: "", step2_before: "",
    step3_epoch: "", step3_dest: "", step3_problem: "",
    step4_actors: "", step4_repeats: "", step4_action: "",
    step5_author: "", step5_jesus: "", step5_summary: "",
    step6_situation: "", step6_transform: "", step6_decision: "",
  });

  // Study panel (Task #D)
  const [verseDetails, setVerseDetails] = useState<VerseDetails | null>(null);
  const [loadingVerseDetails, setLoadingVerseDetails] = useState(false);
  const [chapterVerses, setChapterVerses] = useState<ChapterVerse[]>([]);
  const [showStudyPanel, setShowStudyPanel] = useState<"strong" | "references" | "highlight" | "context" | null>(null);
  const [strongResult, setStrongResult] = useState<StrongResult | null>(null);
  const [strongLoading, setStrongLoading] = useState(false);
  const [strongSearch, setStrongSearch] = useState("");
  const [crossRefs, setCrossRefs] = useState<CrossRef[]>([]);
  const [loadingCrossRefs, setLoadingCrossRefs] = useState(false);
  const [contextData, setContextData] = useState<{
    author: string; period: string; historicalContext: string; culturalNotes: string; keyEvents: string;
  } | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  // Session results
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [morningDoneAlready, setMorningDoneAlready] = useState(false);

  // User profile
  const [userName, setUserName] = useState("Ami");
  const [streakCount, setStreakCount] = useState(0);

  // Modals
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [abandonMessage, setAbandonMessage] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showMiniComplete, setShowMiniComplete] = useState(false);
  const [lastCompletedMiniSession, setLastCompletedMiniSession] = useState<number | null>(null);

  // Mascot suggestions
  const [showSuggestion, setShowSuggestion] = useState(true);

  // === Compute the logical step number (1-6) from mini-session + step ===
  const computeStepNumber = useCallback((): number => {
    return (currentMiniSession - 1) * 2 + currentStepInMini + 1;
  }, [currentMiniSession, currentStepInMini]);

  // === Save progress to sessionStorage ===
// (removed saveToSessionStorage — using saveMeditationProgress from @/lib/progress)

  // === Save progress to the API ===
// (removed saveProgressToAPI — using saveMeditationProgress from @/lib/progress)

  // === Load progress from storage ===
  useEffect(() => {
    async function loadProgress() {
      const fresh = searchParams.get("fresh") === "true";
      if (fresh) { setProgressLoaded(true); return; }

      const today = getTodayStr();

      // Helpers
      const restore = (p: MeditationProgress & { answers?: Answers }) => {
        if (p.dayCompleted) { setIsDayDone(true); setProgressLoaded(true); if (p.answers) setAnswers(p.answers); return true; }
        setCurrentMiniSession(p.currentMiniSession);
        setCurrentStepInMini(p.currentStep);
        setSessionsCompleted(p.sessionsCompleted);
        setDayCompleted(p.dayCompleted);
        if (p.answers) setAnswers(p.answers);
        setProgressLoaded(true);
        return true;
      };

      // 1. sessionStorage
      const local = loadFromSessionStorage();
      if (local && local.lastActivityDate === today && restore(local as MeditationProgress & { answers?: Answers })) return;

      // 2. API
      const remote = await loadFromAPI();
      if (remote && restore(remote as MeditationProgress & { answers?: Answers })) return;

      setProgressLoaded(true);
    }
    loadProgress();
  }, []);

  // === Auto-save progress on state change ===
  useEffect(() => {
    if (!progressLoaded) return;
    saveMeditationProgress({ currentMiniSession, currentStep: currentStepInMini, sessionsCompleted, dayCompleted });
  }, [currentMiniSession, currentStepInMini, sessionsCompleted, dayCompleted, progressLoaded]);

  // === Auto-save answers to sessionStorage ===
  useEffect(() => {
    if (!progressLoaded || typeof window === "undefined") return;
    const saved = sessionStorage.getItem("manna_meditate_progress");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        data.answers = answers;
        sessionStorage.setItem("manna_meditate_progress", JSON.stringify(data));
      } catch { /* ignore */ }
    }
  }, [answers, progressLoaded]);

  // === Auto-load historical context at step 3 (Observation) ===
  useEffect(() => {
    if (currentMiniSession === 2 && currentStepInMini === 0 && dailyVerse && !contextData) {
      loadContext();
      queueMicrotask(() => setShowStudyPanel("context"));
    }
  }, [currentMiniSession, currentStepInMini, dailyVerse]);

  // === Load verse and user data ===
  useEffect(() => {
    const textParam = searchParams.get("text");
    const refParam = searchParams.get("reference");
    const themeParam = searchParams.get("theme");
    const periodParam = searchParams.get("period");
    const bookParam = searchParams.get("book");
    const chapterParam = searchParams.get("chapter");
    const verseParam = searchParams.get("verse");

    let p: "morning" | "evening" = "morning";
    if (periodParam === "morning" || periodParam === "evening") {
      p = periodParam;
    } else {
      const utcHour = new Date().getUTCHours();
      p = utcHour < 14 ? "morning" : "evening";
    }
    queueMicrotask(() => setPeriod(p));

    let verse: DailyVerseType;

    // Méditation personnelle : verset choisi par l'utilisateur
    if (bookParam && chapterParam && verseParam) {
      const book = decodeURIComponent(bookParam);
      const chapter = parseInt(chapterParam, 10);
      const verseNum = parseInt(verseParam, 10);
      
      fetch(`/api/bible/${encodeURIComponent(book)}/${chapter}?translation=LSG`)
        .then((res) => res.json())
        .then((data) => {
          const versesList = data.verses || [];
          const found = versesList.find((v: { verse: number; text: string }) => v.verse === verseNum);
          if (found) {
            const customVerse = {
              text: found.text,
              reference: `${book} ${chapter}:${verseNum}`,
              theme: "Méditation personnelle",
            };
            queueMicrotask(() => {
              setDailyVerse(customVerse);
              setBibleContext(getVerseContext(customVerse.reference));
            });
          } else {
            // Verset non trouvé, fallback au verset du jour
            const dv = getDailyVerse();
            queueMicrotask(() => {
              setDailyVerse(dv);
              setBibleContext(getVerseContext(dv.reference));
            });
          }
        })
        .catch(() => {
          const dv = getDailyVerse();
          queueMicrotask(() => {
            setDailyVerse(dv);
            setBibleContext(getVerseContext(dv.reference));
          });
        });
      
      // Continue with user progress fetch
      fetch("/api/user/progress")
        .then((res) => res.json())
        .then((data) => {
          const name = data.userName || "Ami";
          const streak = data.streak?.currentStreak || 0;
          setUserName(name);
          setStreakCount(streak);
        })
        .catch((err) => console.error("Error loading user progress:", err));
      
      return;
    }

    if (textParam && refParam && themeParam) {
      try {
        verse = {
          text: decodeURIComponent(textParam),
          reference: decodeURIComponent(refParam),
          theme: decodeURIComponent(themeParam),
        };
      } catch {
        // Fallback to daily verse if URL params are malformed
        verse = getDailyVerse();
      }
    } else {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - start.getTime() + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      const baseIndex = dayOfYear % verses.length;

      let index = baseIndex;
      if (p === "morning") {
        index = baseIndex % 2 === 0 ? baseIndex : (baseIndex + 1) % verses.length;
      } else {
        index = baseIndex % 2 !== 0 ? baseIndex : (baseIndex + 1) % verses.length;
      }
      verse = verses[index];
    }

    queueMicrotask(() => {
      setDailyVerse(verse);
      setBibleContext(getVerseContext(verse.reference));
    });

    fetch("/api/user/progress")
      .then((res) => res.json())
      .then((data) => {
        const name = data.userName || "Ami";
        const streak = data.streak?.currentStreak || 0;
        setUserName(name);
        setStreakCount(streak);

        const todayStr = getTodayStr();
        const isToday = data.progress?.lastSessionDate === todayStr;
        const morningDoneVal = isToday ? !!data.progress?.morningSessionToday : false;
        setMorningDoneAlready(morningDoneVal);

        const situation = p === "morning" ? "first_visit" : "evening";
        setWelcomeMessage(getMannyMessage(situation, name, streak));
      })
      .catch((err) => {
        console.warn("Failed to fetch user progress:", err);
        const situation = p === "morning" ? "first_visit" : "evening";
        setWelcomeMessage(getMannyMessage(situation, "Ami", 0));
        setMorningDoneAlready(false);
      });
  }, [searchParams]);

  // Reset mascot suggestion on step change
  useEffect(() => {
    queueMicrotask(() => setShowSuggestion(true));
  }, [currentMiniSession, currentStepInMini]);

  // Pre-fetch AI content
  useEffect(() => {
    if (currentMiniSession === 1 && currentStepInMini === 0 && dailyVerse && !isPrefetching) {
      const histKey = `manna_historical_${dailyVerse.reference}`;
      const medKey = `manna_meditation_${dailyVerse.reference}`;

      const cachedHistorical = sessionStorage.getItem(histKey);
      const cachedMeditation = sessionStorage.getItem(medKey);

      if (cachedHistorical) {
        queueMicrotask(() => {
          setHistoricalContext(cachedHistorical);
          setPrefetchedHistorical(cachedHistorical);
        });
      }
      if (cachedMeditation) {
        queueMicrotask(() => setPrefetchedMeditation(cachedMeditation));
      }
      if (cachedHistorical && cachedMeditation) return;

      queueMicrotask(() => setIsPrefetching(true));
      const fetchTasks = [];

      if (!cachedHistorical) {
        fetchTasks.push(
          fetch("/api/meditation/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ verse: dailyVerse.text, reference: dailyVerse.reference, theme: dailyVerse.theme, type: "contexte_historique" }),
          })
          .then(async (res) => {
            if (!res.ok) throw new Error("Failed to fetch historical context");
            const data = await res.json();
            sessionStorage.setItem(histKey, data.meditation);
            setHistoricalContext(data.meditation);
            setPrefetchedHistorical(data.meditation);
          })
        );
      }
      if (!cachedMeditation) {
        fetchTasks.push(
          fetch("/api/meditation/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ verse: dailyVerse.text, reference: dailyVerse.reference, theme: dailyVerse.theme, type: "meditation" }),
          })
          .then(async (res) => {
            if (!res.ok) throw new Error("Failed to fetch main meditation");
            const data = await res.json();
            sessionStorage.setItem(medKey, data.meditation);
            setPrefetchedMeditation(data.meditation);
          })
        );
      }

      Promise.allSettled(fetchTasks).finally(() => setIsPrefetching(false));
    }
  }, [currentMiniSession, currentStepInMini, dailyVerse, isPrefetching]);

  // === Validation per current step ===
  const isStepValid = useCallback(() => {
    const stepNum = computeStepNumber();
    switch (stepNum) {
      case 1: // Reading (mini 1, step 0) — always valid
        return true;
      case 2: // Bible context (mini 1, step 1)
        return (
          answers.step2_who.trim().length >= 10 ||
          answers.step2_whom.trim().length >= 10 ||
          answers.step2_before.trim().length >= 10
        );
      case 3: // Observation (mini 2, step 0)
        return (
          answers.step3_epoch.trim().length >= 10 ||
          answers.step3_dest.trim().length >= 10 ||
          answers.step3_problem.trim().length >= 10
        );
      case 4: // Interpretation (mini 2, step 1)
        return (
          answers.step4_actors.trim().length >= 10 ||
          answers.step4_repeats.trim().length >= 10 ||
          answers.step4_action.trim().length >= 10
        );
      case 5: // Application (mini 3, step 0)
        return (
          answers.step5_author.trim().length >= 10 ||
          answers.step5_jesus.trim().length >= 10 ||
          answers.step5_summary.trim().length >= 10
        );
      case 6: // Prayer & Proclamation (mini 3, step 1)
        return (
          answers.step6_situation.trim().length >= 10 ||
          answers.step6_transform.trim().length >= 10 ||
          answers.step6_decision.trim().length >= 10
        );
      default:
        return true;
    }
  }, [computeStepNumber, answers]);

  // === Fetch historical context (step 3) ===
  const fetchHistoricalContext = async (verseObj: DailyVerseType) => {
    const histKey = `manna_historical_${verseObj.reference}`;
    const cached = sessionStorage.getItem(histKey) || prefetchedHistorical || historicalContext;
    if (cached) {
      setHistoricalContext(cached);
      return;
    }

    setLoading(true);
    setError("");
    setLoadingMessage(getMannyMessage("loading", userName, streakCount));

    try {
      const res = await fetch("/api/meditation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verse: verseObj.text, reference: verseObj.reference, theme: verseObj.theme, type: "contexte_historique" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la génération du contexte historique.");
      setHistoricalContext(data.meditation);
      sessionStorage.setItem(histKey, data.meditation);
      sounds.playSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // === Fetch prayer content (mini 3, step 1) ===
  const fetchPersonalizedContent = async (verseObj: DailyVerseType) => {
    setLoading(true);
    setError("");
    setLoadingMessage(getMannyMessage("loading", userName, streakCount));

    try {
      const prayerPromise = fetch("/api/meditation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verse: verseObj.text, reference: verseObj.reference, theme: verseObj.theme, type: "prayer_personal", answers }),
      });
      const summaryPromise = fetch("/api/meditation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verse: verseObj.text, reference: verseObj.reference, theme: verseObj.theme, type: "summary", answers }),
      });

      const [prayerRes, summaryRes] = await Promise.all([prayerPromise, summaryPromise]);
      const prayerData = await prayerRes.json();
      if (!prayerRes.ok) throw new Error(prayerData.error || "Échec de la génération de la prière.");
      setPrayerContent(prayerData.meditation);

      try {
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setSummaryContent(summaryData.summary);
        } else {
          setSummaryContent(null);
        }
      } catch (sumErr) {
        console.warn("Silent failure for summary generation:", sumErr);
        setSummaryContent(null);
      }
      sounds.playSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // === Handle next step within mini-session ===
  const handleNextStep = async () => {
    if (!dailyVerse) return;

    sounds.playStepComplete();

    // Determine if we're completing the mini-session
    const isLastStepInMini = currentStepInMini === 1;

    if (isLastStepInMini) {
      // Mini-session is complete!
      const newCompleted = [...sessionsCompleted, currentMiniSession];
      setSessionsCompleted(newCompleted);

      // Mark mini-session as done
      const xpReward = XP_REWARDS[currentMiniSession];
      
      // Save to API with XP
      await saveMeditationProgress({ currentMiniSession, currentStep: currentStepInMini, sessionsCompleted: newCompleted, dayCompleted, claimXPForSession: currentMiniSession });
      // (sessionStorage saved via saveMeditationProgress above)

      // Show completion modal
      setLastCompletedMiniSession(currentMiniSession);
      setShowMiniComplete(true);

      // If this was the 3rd mini-session, mark day as completed
      if (currentMiniSession === 3) {
        setDayCompleted(true);
      }
    } else {
      // Move to next step in same mini-session
      const newStep = 1 as 0 | 1;
      setCurrentStepInMini(newStep);
      // (sessionStorage saved via saveMeditationProgress below)
      await saveMeditationProgress({ currentMiniSession, currentStep: newStep, sessionsCompleted, dayCompleted });

      // If moving to step 3 (historical context), trigger fetch
      if (currentMiniSession === 1 && currentStepInMini === 0) {
        const histKey = `manna_historical_${dailyVerse.reference}`;
        const cached = sessionStorage.getItem(histKey) || prefetchedHistorical || historicalContext;
        if (!cached) {
          await fetchHistoricalContext(dailyVerse);
        } else {
          setHistoricalContext(cached);
        }
      }
      // If moving to prayer step (mini 3, step 1)
      if (currentMiniSession === 3 && currentStepInMini === 0 && !prayerContent) {
        await fetchPersonalizedContent(dailyVerse);
      }
    }
  };

  // === Handle "Continue Now" after mini-session complete ===
  const handleContinueNow = () => {
    if (!lastCompletedMiniSession) return;
    const nextSession = (lastCompletedMiniSession + 1) as 1 | 2 | 3;
    if (nextSession <= 3) {
      setCurrentMiniSession(nextSession);
      setCurrentStepInMini(0);
      setShowMiniComplete(false);
      setLastCompletedMiniSession(null);
      // (sessionStorage saved via saveMeditationProgress below)
      saveMeditationProgress({ currentMiniSession: nextSession, currentStep: 0, sessionsCompleted, dayCompleted });
    } else {
      // All done! Go to dashboard
      router.push("/dashboard");
    }
  };

  // === Handle "Come Back Later" ===
  const handleComeBackLater = async () => {
    const nextMini = lastCompletedMiniSession ? Math.min(lastCompletedMiniSession + 1, 3) as 1 | 2 | 3 : currentMiniSession;
    const nextStep = lastCompletedMiniSession ? 0 as 0 | 1 : currentStepInMini;

    setShowMiniComplete(false);
    setLastCompletedMiniSession(null);
    // Save next state (advance to next mini-session)
    await saveMeditationProgress({ currentMiniSession: nextMini, currentStep: nextStep, sessionsCompleted, dayCompleted });
    // Redirect to dashboard
    router.push("/dashboard");
  };

  // === Navigate back within mini-session ===
  const handlePrevStep = () => {
    if (currentStepInMini === 1) {
      const newStep = 0 as 0 | 1;
      setCurrentStepInMini(newStep);
      sounds.playSuccess();
    } else if (currentStepInMini === 0 && currentMiniSession > 1) {
      // Go back to previous mini-session, last step
      const prevMini = (currentMiniSession - 1) as 1 | 2;
      setCurrentMiniSession(prevMini);
      setCurrentStepInMini(1);
      sounds.playSuccess();
    }
  };

  // === Handle prayer/celebration completion ===
  const handleCompleteSession = async () => {
    setLoadingMessage("Finalisation de ta session...");
    setLoading(true);
    setError("");

    try {
      const formattedNotes = `=== JOURNAL DE MÉDITATION OIA+ ===

[VERS DU JOUR]
${dailyVerse?.reference} : "${dailyVerse?.text}" (Thème : ${dailyVerse?.theme})

[MINI-SESSION 1 — VERSET & CONTEXTE]
- Qui parle dans ce passage ?
  ${answers.step2_who || "Non renseigné"}
- À qui s'adresse ce message ?
  ${answers.step2_whom || "Non renseigné"}
- Que se passait-il juste avant ce verset ?
  ${answers.step2_before || "Non renseigné"}

[MINI-SESSION 2 — OBSERVATION & INTERPRÉTATION]
- Quels sont les personnages ou acteurs mentionnés ?
  ${answers.step4_actors || "Non renseigné"}
- Quels mots ou expressions se répètent dans ce verset ?
  ${answers.step4_repeats || "Non renseigné"}
- Quel est le fait ou l'action principale décrite ?
  ${answers.step4_action || "Non renseigné"}
- Que voulait communiquer l'auteur à ses lecteurs de l'époque ?
  ${answers.step5_author || "Non renseigné"}
- Qu'est-ce que ce verset signifie à la lumière de Jésus-Christ ?
  ${answers.step5_jesus || "Non renseigné"}
- Résumé en une phrase simple :
  ${answers.step5_summary || "Non renseigné"}

[MINI-SESSION 3 — APPLICATION & PRIÈRE]
- Comment ce verset parle-t-il directement à ta situation aujourd'hui ?
  ${answers.step6_situation || "Non renseigné"}
- Qu'est-ce que Dieu veut transformer dans ta vie à travers ce texte ?
  ${answers.step6_transform || "Non renseigné"}
- Quelle décision concrète vas-tu prendre ?
  ${answers.step6_decision || "Non renseigné"}

[PRIÈRE REÇUE]
"${prayerContent}"`;

      const res = await fetch("/api/session/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "classic", period, notes: formattedNotes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de finaliser la session.");

      setSessionResult(data);
      sounds.playSuccess();

      // Save path progress
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const pathIdParam = urlParams.get("pathId");
        const levelParam = urlParams.get("level");
        if (pathIdParam && levelParam) {
          const currentPathId = pathIdParam;
          const currentLevel = parseInt(levelParam, 10);
          const saved = localStorage.getItem("mannadaily_path_progress");
          const progress = saved ? JSON.parse(saved) : {};
          const currentMax = progress[currentPathId] || 1;
          if (currentLevel === currentMax && currentMax < 30) {
            progress[currentPathId] = currentMax + 1;
            localStorage.setItem("mannadaily_path_progress", JSON.stringify(progress));
          }
        }
      } catch (err) {
        console.error("Failed to update local path progress:", err);
      }

      if (data.leveledUp) {
        sounds.playLevelUp();
      } else {
        sounds.playXPGain();
      }
    } catch (err: unknown) {
      console.error("Session completion failed:", err);
      setError(err instanceof Error ? err.message : "Erreur de validation");
      // Fallback : rediriger vers le tableau de bord même en cas d'erreur
      setTimeout(() => router.push("/dashboard"), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Generate mini-session summary text for display
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getMiniSummaryText = useCallback(() => {
    const parts: string[] = [];
    if (currentMiniSession >= 2 && answers.step2_who) {
      parts.push(`Mini 1 : ${answers.step2_who} — ${answers.step2_before?.slice(0, 60) || answers.step2_whom || ""}`);
    }
    if (currentMiniSession >= 3 && answers.step4_actors) {
      parts.push(`Mini 2 : Acteurs principaux : ${answers.step4_actors}. ${answers.step4_action?.slice(0, 60) || ""}`);
    }
    return parts.length > 0 ? parts.join(" | ") : null;
  }, [currentMiniSession, answers]);
  const handleTriggerAbandon = () => {
    sounds.playAbandonWarning();
    setAbandonMessage(getMannyMessage("abandon_attempt", userName, streakCount));
    setShowAbandonModal(true);
  };

  const handleConfirmStay = () => setShowAbandonModal(false);

  const handleConfirmAbandon = () => {
    setShowAbandonModal(false);
    setCurrentMiniSession(1);
    setCurrentStepInMini(0);
    setSessionsCompleted([]);
    setDayCompleted(false);
    setHistoricalContext("");
    setPrayerContent("");
    setSummaryContent(null);
    setSessionResult(null);
    setAnswers({
      step2_who: "", step2_whom: "", step2_before: "",
      step3_epoch: "", step3_dest: "", step3_problem: "",
      step4_actors: "", step4_repeats: "", step4_action: "",
      step5_author: "", step5_jesus: "", step5_summary: "",
      step6_situation: "", step6_transform: "", step6_decision: "",
    });
    sessionStorage.removeItem("manna_meditate_progress");
  };

  // === Helpers for Bible study (Task #D) ===
  const parseReference = (ref: string) => {
    const regex = /^(.+?)\s+(\d+):(\d+)(-\d+)?$/;
    const match = ref.match(regex);
    if (match) {
      return { book: match[1], chapter: parseInt(match[2], 10), verse: parseInt(match[3], 10) };
    }
    return null;
  };

  useEffect(() => {
    if (!dailyVerse) return;
    const parsed = parseReference(dailyVerse.reference);
    if (!parsed || !parsed.book || !parsed.chapter) return;

    const book = parsed.book;
    const chapter = parsed.chapter;
    const verse = parsed.verse;

    async function loadDetails() {
      setLoadingVerseDetails(true);
      try {
        const res = await fetch(`/api/bible/${encodeURIComponent(book)}/${chapter}?translation=LSG`);
        if (res.ok) {
          const data = await res.json();
          const list = data.verses || [];
          setChapterVerses(list);
          const v = list.find((vItem: ChapterVerse) => vItem.verse === verse);
          if (v) setVerseDetails(v);
        }
      } catch (err) {
        console.error("Error loading verse details:", err);
      } finally {
        setLoadingVerseDetails(false);
      }
    }
    loadDetails();
  }, [dailyVerse]);

  const handleHighlight = async (color: string) => {
    if (!verseDetails) return;
    try {
      sounds.playXPGain();
      const res = await fetch("/api/bible/highlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verseId: verseDetails.id, color }),
      });
      if (res.ok) {
        setVerseDetails({ ...verseDetails, highlightColor: color });
        setShowStudyPanel(null);
      }
    } catch (err) {
      console.error("Error highlighting verse:", err);
    }
  };

  const handleDeleteHighlight = async () => {
    if (!verseDetails) return;
    try {
      const res = await fetch(`/api/bible/highlight?verseId=${verseDetails.id}`, { method: "DELETE" });
      if (res.ok) {
        setVerseDetails({ ...verseDetails, highlightColor: null });
        setShowStudyPanel(null);
      }
    } catch (err) {
      console.error("Error deleting highlight:", err);
    }
  };

  const loadCrossRefs = async () => {
    if (!verseDetails) return;
    setLoadingCrossRefs(true);
    try {
      const res = await fetch(`/api/bible/crossrefs?book=${verseDetails.bookNumber || 1}&chapter=${verseDetails.chapter}&verse=${verseDetails.verse}`);
      if (res.ok) {
        const data = await res.json();
        setCrossRefs(data.crossRefs || []);
      }
    } catch (err) {
      console.error("Error loading cross references:", err);
    } finally {
      setLoadingCrossRefs(false);
    }
  };

  useEffect(() => {
    if (showStudyPanel === "references") queueMicrotask(() => loadCrossRefs());
  }, [showStudyPanel, verseDetails, loadCrossRefs]);

  const handleStrongLookup = async (strongNum: string) => {
    queueMicrotask(() => {
      setStrongSearch(strongNum);
      setStrongLoading(true);
    });
    try {
      const res = await fetch(`/api/bible/strong/${encodeURIComponent(strongNum)}`);
      if (res.ok) {
        const data = await res.json();
        setStrongResult(data);
      } else {
        setStrongResult(null);
      }
    } catch (err) {
      console.error("Error looking up Strong number:", err);
    } finally {
      queueMicrotask(() => setStrongLoading(false));
    }
  };

  const getStrongNumber = (bookNumber: number, wordIndex: number): string => {
    return bookNumber <= 39 ? `H${wordIndex + 1}` : `G${wordIndex + 1}`;
  };

  // Load historical/cultural context for the current verse
  const loadContext = async () => {
    if (!dailyVerse) return;
    const refParts = dailyVerse.reference.match(/^(.+?)\s+(\d+):/);
    if (!refParts) return;
    const book = refParts[1];
    const chapter = refParts[2];
    
    setLoadingContext(true);
    try {
      const res = await fetch(`/api/bible/context?book=${encodeURIComponent(book)}&chapter=${chapter}`);
      if (res.ok) {
        const data = await res.json();
        setContextData(data);
      }
    } catch (err) {
      console.error("Error loading context:", err);
    } finally {
      setLoadingContext(false);
    }
  };

  // === Mascot suggestion ===
  const renderMascotSuggestion = () => {
    if (!showSuggestion) return null;

    let mascot: "samson" | "esther" | "gedeon" | "noe" | "manny" = "manny";
    let mood: MannyMood = "happy";
    let message = "";

    const stepNum = computeStepNumber();
    switch (stepNum) {
      case 2:
        mascot = "gedeon"; mood = "encouraging";
        message = "Lis 2-3 versets avant et après dans ta Bible.";
        break;
      case 3:
        mascot = "gedeon"; mood = "thinking";
        message = "Cherche le mot clé dans un dictionnaire Strong pour aller plus loin.";
        break;
      case 4:
        mascot = "noe"; mood = "encouraging";
        message = "Lis ce verset dans une autre traduction (Darby, TOB, NBS).";
        break;
      case 5:
        mascot = "esther"; mood = "thinking";
        message = "Cherche ce passage dans un commentaire biblique en ligne.";
        break;
      case 6:
        mascot = "samson"; mood = "encouraging";
        message = "Maintenant applique cette vérité. La foi sans les œuvres est morte.";
        break;
      default:
        return null;
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative w-full max-w-xl mx-auto"
      >
        <MascotMessage mascot={mascot} mood={mood} message={message} size={150} />
        <button
          onClick={() => setShowSuggestion(false)}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors font-black text-base z-10"
        >
          ×
        </button>
      </motion.div>
    );
  };

  // === Compute mascot mood based on current progress + time of day ===
  const mascotState = useMemo(
    () => getMascotState({
      currentMiniSession,
      currentStep: currentStepInMini,
      sessionsCompleted,
      lastActivityDate: getTodayStr(),
      dayCompleted,
    }),
    [currentMiniSession, currentStepInMini, sessionsCompleted, dayCompleted]
  );

  // === Messages ===
  const periodEmoji = period === "morning" ? "🌅" : "🌙";
  const periodTitle = period === "morning" ? "Méditation du matin" : "Méditation du soir";

  const completionMessage = period === "morning"
    ? "🌅 Ta méditation du matin est complète !\nReviens ce soir pour compléter ta journée spirituelle."
    : morningDoneAlready
      ? "🌙 Journée spirituelle COMPLÈTE !\nTu as médité jour et nuit comme Josué 1:8 !"
      : "🌙 Méditation du soir complète !\nN'oublie pas ta méditation du matin demain !";

  // === Determine if we should show the study bar ===
  const stepNum = computeStepNumber();
  const showStudyBar = !sessionResult && stepNum >= 2 && stepNum <= 6 && dailyVerse;

  // === Current step display ===
  const renderCurrentStep = () => {
    const stepNum = computeStepNumber();

    // Steps for mini-session 1:
    if (currentMiniSession === 1 && currentStepInMini === 0) {
      // Step 1: Verse of the day
      return dailyVerse && (
        <motion.div
          key="step1"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="space-y-6 flex flex-col items-center"
        >
          <h1 className="text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight">
            {periodTitle} {periodEmoji}
          </h1>
          <Manny mood={mascotState.mood} size={170} />
          
          {welcomeMessage && (
            <div className="text-center bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100/30 dark:border-indigo-900/40 text-indigo-850 dark:text-indigo-300 p-4 px-6 rounded-2xl text-xs md:text-sm font-extrabold max-w-md shadow-sm">
              {welcomeMessage}
            </div>
          )}

          {mascotState.message && (
            <div className="text-center bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100/30 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 p-3 px-5 rounded-xl text-xs font-bold max-w-md">
              {mascotState.message}
            </div>
          )}

          <div className="w-full bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-xl text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <BookOpen className="w-24 h-24" />
            </div>
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-extrabold text-xs uppercase tracking-wider rounded-full">
              Thème : {dailyVerse.theme}
            </span>
            <blockquote className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-snug">
              « {dailyVerse.text} »
            </blockquote>
            <cite className="block text-sm font-bold text-slate-400 uppercase tracking-widest not-italic">
              — {dailyVerse.reference}
            </cite>
          </div>

          <button
            onClick={handleNextStep}
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-extrabold rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-base animate-pulse"
          >
            J&apos;ai lu le verset
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      );
    }

    if (currentMiniSession === 1 && currentStepInMini === 1) {
      // Step 2: Bible context
      return dailyVerse && (() => {
        const parsedRef = parseReference(dailyVerse.reference);
        const currentIdx = parsedRef
          ? chapterVerses.findIndex((v: ChapterVerse) => v.verse === parsedRef.verse)
          : -1;
        const beforeVerses = currentIdx !== -1
          ? chapterVerses.slice(Math.max(0, currentIdx - 3), currentIdx)
          : [];
        const afterVerses = currentIdx !== -1
          ? chapterVerses.slice(currentIdx + 1, Math.min(chapterVerses.length, currentIdx + 4))
          : [];
        const isFirstVerse = currentIdx === 0 || (parsedRef && parsedRef.verse === 1);
        const isLastVerse = currentIdx !== -1 && currentIdx === chapterVerses.length - 1;

        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            <div className="space-y-4 bg-indigo-50/35 p-6 rounded-2xl border border-indigo-100/50">
              <div className="flex items-center gap-2 text-indigo-800 border-b border-indigo-100 pb-2 mb-3">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h4 className="font-black text-sm uppercase tracking-wider">
                  Contexte Biblique — {parsedRef ? `${parsedRef.book} ${parsedRef.chapter}` : dailyVerse.reference}
                </h4>
              </div>
              
              <div className="space-y-4">
                {/* Previous verses */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Avant...</span>
                  {isFirstVerse ? (
                    <p className="text-xs text-slate-400 font-semibold italic">Début du chapitre</p>
                  ) : (
                    beforeVerses.map((v: ChapterVerse, i: number) => (
                      <p key={i} className="text-xs md:text-sm font-semibold text-slate-500 leading-relaxed italic">
                        <span className="font-bold text-slate-400 not-italic mr-1">{v.verse}.</span>
                        « {v.text} »
                      </p>
                    ))
                  )}
                </div>
                
                {/* Main verse highlighted */}
                <div className="p-4 bg-yellow-100/60 border border-yellow-250/70 rounded-xl space-y-1 shadow-sm">
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">Verset à l&apos;étude :</span>
                  <p className="text-sm md:text-base font-extrabold text-slate-800 leading-relaxed">
                    <span className="font-black text-indigo-600 mr-1">{parsedRef?.verse}.</span>
                    « {dailyVerse.text} »
                  </p>
                </div>

                {/* Next verses */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Après...</span>
                  {isLastVerse ? (
                    <p className="text-xs text-slate-400 font-semibold italic">Fin du chapitre</p>
                  ) : (
                    afterVerses.map((v: ChapterVerse, i: number) => (
                      <p key={i} className="text-xs md:text-sm font-semibold text-slate-500 leading-relaxed italic">
                        <span className="font-bold text-slate-400 not-italic mr-1">{v.verse}.</span>
                        « {v.text} »
                      </p>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-lg text-slate-800 tracking-tight">Analyse du passage</h3>
              
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Qui parle dans ce passage ?</label>
                <div className="relative">
                  <textarea rows={2} value={answers.step2_who}
                    onChange={(e) => setAnswers({ ...answers, step2_who: e.target.value })}
                    placeholder="Ex: L'apôtre Paul, Jésus, un psalmiste..."
                    className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                  <SpeechMicButton value={answers.step2_who}
                    onChange={(val) => setAnswers({ ...answers, step2_who: val })} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">À qui s&apos;adresse ce message ?</label>
                <div className="relative">
                  <textarea rows={2} value={answers.step2_whom}
                    onChange={(e) => setAnswers({ ...answers, step2_whom: e.target.value })}
                    placeholder="Ex: Aux chrétiens de Philippe, aux disciples, à Dieu..."
                    className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                  <SpeechMicButton value={answers.step2_whom}
                    onChange={(val) => setAnswers({ ...answers, step2_whom: val })} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Que se passait-il juste avant ce verset ?</label>
                <div className="relative">
                  <textarea rows={2} value={answers.step2_before}
                    onChange={(e) => setAnswers({ ...answers, step2_before: e.target.value })}
                    placeholder="Quels événements précèdent directement cette parole ?"
                    className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                  <SpeechMicButton value={answers.step2_before}
                    onChange={(val) => setAnswers({ ...answers, step2_before: val })} />
                </div>
              </div>
            </div>

            {renderMascotSuggestion()}
          </motion.div>
        );
      })();
    }

    if (currentMiniSession === 2 && currentStepInMini === 0) {
      // Step 3: Observation (O)
      return dailyVerse && (
        <motion.div
          key="step4"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2 mb-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Méthode Inductive</span>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">O : Observation</h2>
            <p className="text-slate-400 font-semibold text-xs max-w-sm mx-auto">Observe attentivement la structure et les mots du verset</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">À quelle époque ce passage a-t-il été écrit ?</label>
              <div className="relative">
                <textarea rows={2} value={answers.step3_epoch}
                  onChange={(e) => setAnswers({ ...answers, step3_epoch: e.target.value })}
                  placeholder="Quel siècle, sous quel roi ou empire ?"
                  className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                <SpeechMicButton value={answers.step3_epoch}
                  onChange={(val) => setAnswers({ ...answers, step3_epoch: val })} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Qui sont les destinataires de ce passage ?</label>
              <div className="relative">
                <textarea rows={2} value={answers.step3_dest}
                  onChange={(e) => setAnswers({ ...answers, step3_dest: e.target.value })}
                  placeholder="Peuple d'Israël, une église, un individu ?"
                  className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                <SpeechMicButton value={answers.step3_dest}
                  onChange={(val) => setAnswers({ ...answers, step3_dest: val })} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Quel problème ce passage cherche-t-il à résoudre ?</label>
              <div className="relative">
                <textarea rows={2} value={answers.step3_problem}
                  onChange={(e) => setAnswers({ ...answers, step3_problem: e.target.value })}
                  placeholder="Quelle question ou défi adresse-t-il ?"
                  className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                <SpeechMicButton value={answers.step3_problem}
                  onChange={(val) => setAnswers({ ...answers, step3_problem: val })} />
              </div>
            </div>
          </div>

          {renderMascotSuggestion()}
        </motion.div>
      );
    }

    if (currentMiniSession === 2 && currentStepInMini === 1) {
      // Step 4: Interpretation (I)
      return dailyVerse && (
        <motion.div
          key="step5"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2 mb-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-violet-600 bg-violet-50 px-3 py-1 rounded-full">Méthode Inductive</span>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">I : Interprétation</h2>
            <p className="text-slate-400 font-semibold text-xs max-w-sm mx-auto">Cherche à comprendre le sens spirituel profond du message</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Quels sont les personnages ou acteurs mentionnés ?</label>
              <div className="relative">
                <textarea rows={2} value={answers.step4_actors}
                  onChange={(e) => setAnswers({ ...answers, step4_actors: e.target.value })}
                  placeholder="Note toutes les personnes, groupes ou entités (y compris Dieu)."
                  className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                <SpeechMicButton value={answers.step4_actors}
                  onChange={(val) => setAnswers({ ...answers, step4_actors: val })} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Quels mots ou expressions se répètent dans ce verset ?</label>
              <div className="relative">
                <textarea rows={2} value={answers.step4_repeats}
                  onChange={(e) => setAnswers({ ...answers, step4_repeats: e.target.value })}
                  placeholder="Y a-t-il des termes insistants (ex: force, loi, cœur, aimer) ?"
                  className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                <SpeechMicButton value={answers.step4_repeats}
                  onChange={(val) => setAnswers({ ...answers, step4_repeats: val })} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Quel est le fait ou l&apos;action principale décrite ?</label>
              <div className="relative">
                <textarea rows={2} value={answers.step4_action}
                  onChange={(e) => setAnswers({ ...answers, step4_action: e.target.value })}
                  placeholder="Quel est le verbe d'action clé ou l'affirmation centrale ?"
                  className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                <SpeechMicButton value={answers.step4_action}
                  onChange={(val) => setAnswers({ ...answers, step4_action: val })} />
              </div>
            </div>
          </div>

          {renderMascotSuggestion()}
        </motion.div>
      );
    }

    if (currentMiniSession === 3 && currentStepInMini === 0) {
      // Step 5: Application (A)
      return dailyVerse && (
        <motion.div
          key="step6"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2 mb-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-orange-600 bg-orange-50 px-3 py-1 rounded-full">Méthode Inductive</span>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">A : Application</h2>
            <p className="text-slate-400 font-semibold text-xs max-w-sm mx-auto">Ancre la vérité du verset dans ta vie concrète aujourd'hui</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Que voulait communiquer l&apos;auteur à ses lecteurs de l&apos;époque ?</label>
              <div className="relative">
                <textarea rows={2} value={answers.step5_author}
                  onChange={(e) => setAnswers({ ...answers, step5_author: e.target.value })}
                  placeholder="Quel était l'enseignement moral ou la vérité théologique visée ?"
                  className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                <SpeechMicButton value={answers.step5_author}
                  onChange={(val) => setAnswers({ ...answers, step5_author: val })} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Qu&apos;est-ce que ce verset signifie à la lumière de Jésus-Christ ?</label>
              <div className="relative">
                <textarea rows={2} value={answers.step5_jesus}
                  onChange={(e) => setAnswers({ ...answers, step5_jesus: e.target.value })}
                  placeholder="Comment cette Parole pointe-t-elle vers la grâce, la croix ou l'Évangile ?"
                  className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                <SpeechMicButton value={answers.step5_jesus}
                  onChange={(val) => setAnswers({ ...answers, step5_jesus: val })} />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Résume ce verset en une seule phrase simple.</label>
              <div className="relative">
                <textarea rows={2} value={answers.step5_summary}
                  onChange={(e) => setAnswers({ ...answers, step5_summary: e.target.value })}
                  placeholder="Réécris la vérité essentielle du verset avec tes propres mots."
                  className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition" />
                <SpeechMicButton value={answers.step5_summary}
                  onChange={(val) => setAnswers({ ...answers, step5_summary: val })} />
              </div>
            </div>
          </div>

          {renderMascotSuggestion()}
        </motion.div>
      );
    }

    if (currentMiniSession === 3 && currentStepInMini === 1) {
      // Step 6: Prayer & Celebration
      return dailyVerse && (
        <motion.div
          key="step7"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="space-y-8 flex flex-col items-center"
        >
          {!sessionResult ? (
            <>
              <div className="w-full flex justify-center mb-4">
                <MascotMessage mascot="manny" mood="praying" message={completionMessage} size={150} />
              </div>

              {summaryContent && (
                <div className="w-full bg-indigo-950 text-indigo-50 p-8 rounded-3xl border border-indigo-900 shadow-lg relative overflow-hidden flex flex-col space-y-4">
                  <div className="flex items-center gap-2 border-b border-indigo-900/60 pb-3 text-amber-400">
                    <Sparkles className="w-4.5 h-4.5 text-amber-400 fill-amber-400/10" />
                    <span className="font-black text-xs uppercase tracking-wider text-amber-400">Ce que Dieu t&apos;a dit aujourd&apos;hui</span>
                  </div>
                  <p className="text-indigo-100 font-bold leading-relaxed text-base text-justify whitespace-pre-line">{summaryContent}</p>
                </div>
              )}

              <div className="w-full bg-white p-8 rounded-3xl border border-indigo-100 shadow-lg relative overflow-hidden flex flex-col space-y-4">
                <div className="flex items-center gap-2 border-b pb-3 text-indigo-700">
                  <Heart className="w-4.5 h-4.5 text-indigo-500 fill-indigo-500" />
                  <span className="font-bold text-xs uppercase tracking-wider">Parole de prière</span>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed italic text-base whitespace-pre-line text-justify">
                  « {prayerContent} »
                </p>
              </div>
            </>
          ) : (
            /* Session validated — Full summary */
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6 w-full flex flex-col items-center">
              <Manny mood={mascotState.mood} size={150} />

              <div className="text-center space-y-1">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">📖 Résumé de votre méditation</h2>
                <p className="text-slate-400 font-semibold text-xs">{completionMessage}</p>
              </div>

              {/* Verse reminder */}
              {dailyVerse && (
                <div className="w-full bg-indigo-50/60 border border-indigo-100/50 p-4 rounded-2xl text-center">
                  <blockquote className="text-sm font-black text-indigo-800 italic leading-relaxed">
                    « {dailyVerse.text} »
                  </blockquote>
                  <cite className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1 not-italic">
                    — {dailyVerse.reference} (Thème : {dailyVerse.theme})
                  </cite>
                </div>
              )}

              {/* Mini-session 1 */}
              <div className="w-full bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-[10px]">1</span>
                  Mini‑session 1 — Verset & Contexte
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <span className="font-bold text-slate-400 text-[10px] uppercase">Qui parle ?</span>
                    <p className="text-slate-700 font-medium mt-0.5">{answers.step2_who || "Non renseigné"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <span className="font-bold text-slate-400 text-[10px] uppercase">À qui ?</span>
                    <p className="text-slate-700 font-medium mt-0.5">{answers.step2_whom || "Non renseigné"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <span className="font-bold text-slate-400 text-[10px] uppercase">Contexte avant</span>
                    <p className="text-slate-700 font-medium mt-0.5">{answers.step2_before || "Non renseigné"}</p>
                  </div>
                </div>
              </div>

              {/* Mini-session 2 */}
              <div className="w-full bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-[10px]">2</span>
                  Mini‑session 2 — Observation & Interprétation
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <span className="font-bold text-slate-400 text-[10px] uppercase">Époque / Destinataires</span>
                    <p className="text-slate-700 font-medium mt-0.5">{answers.step3_epoch || answers.step3_dest || "Non renseigné"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <span className="font-bold text-slate-400 text-[10px] uppercase">Problème</span>
                    <p className="text-slate-700 font-medium mt-0.5">{answers.step3_problem || "Non renseigné"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <span className="font-bold text-slate-400 text-[10px] uppercase">Acteurs</span>
                    <p className="text-slate-700 font-medium mt-0.5">{answers.step4_actors || "Non renseigné"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <span className="font-bold text-slate-400 text-[10px] uppercase">Répétitions / Action</span>
                    <p className="text-slate-700 font-medium mt-0.5">{answers.step4_repeats || answers.step4_action || "Non renseigné"}</p>
                  </div>
                </div>
              </div>

              {/* Mini-session 3 */}
              <div className="w-full bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-[10px]">3</span>
                  Mini‑session 3 — Application & Prière
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <span className="font-bold text-slate-400 text-[10px] uppercase">Situation personnelle</span>
                    <p className="text-slate-700 font-medium mt-0.5">{answers.step6_situation || "Non renseigné"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <span className="font-bold text-slate-400 text-[10px] uppercase">Transformation</span>
                    <p className="text-slate-700 font-medium mt-0.5">{answers.step6_transform || "Non renseigné"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <span className="font-bold text-slate-400 text-[10px] uppercase">Décision</span>
                    <p className="text-slate-700 font-medium mt-0.5">{answers.step6_decision || "Non renseigné"}</p>
                  </div>
                </div>
              </div>

              {/* Prayer */}
              {prayerContent && (
                <div className="w-full bg-purple-50/60 border border-purple-100/50 p-5 rounded-2xl">
                  <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5 fill-purple-500 text-purple-500" />
                    Prière générée
                  </h3>
                  <p className="text-sm text-slate-700 font-medium italic leading-relaxed">« {prayerContent} »</p>
                </div>
              )}

              {/* XP + Streak stats */}
              <div className="w-full grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mb-1.5">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">XP gagnés</span>
                  <span className="text-2xl font-black text-amber-500">+{sessionResult.xpEarned}</span>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Total : {sessionResult.newXP} XP</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 mb-1.5">
                    <Flame className="w-5 h-5 fill-orange-500" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Série</span>
                  <span className="text-2xl font-black text-orange-500">{sessionResult.streak} j</span>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Ininterrompue 🔥</p>
                </div>
              </div>

              {/* Level up */}
              {sessionResult.leveledUp && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                  className="w-full p-4 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-2xl text-center shadow-lg border border-amber-300">
                  <h4 className="font-black text-base tracking-tight">FÉLICITATIONS 🎉 NIVEAU SUPÉRIEUR</h4>
                  <p className="text-xs font-extrabold mt-1">{getMannyMessage("level_up", userName, sessionResult.streak)}</p>
                </motion.div>
              )}

              {/* Badges */}
              {sessionResult.newBadges.length > 0 && (
                <div className="w-full space-y-2 text-center">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nouveaux Badges</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sessionResult.newBadges.map((badge, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-amber-100 flex items-center gap-3 text-left shadow-sm">
                        <div className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-slate-800">{badge.name}</h5>
                          <p className="text-[10px] text-slate-400 font-semibold">{badge.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Single CTA button */}
              <button onClick={() => router.push("/dashboard")} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-lg transition-all text-sm">
                Terminer et retourner au tableau de bord
              </button>
            </motion.div>
          )}
        </motion.div>
      );
    }

    return null;
  };

  // === Show mini-session completion screen ===
  if (showMiniComplete && lastCompletedMiniSession) {
    const mini = MINI_SESSIONS.find(m => m.id === lastCompletedMiniSession)!;
    const xpEarned = XP_REWARDS[lastCompletedMiniSession];
    const isLastMini = lastCompletedMiniSession === 3;
    const isFullyDone = isLastMini && sessionsCompleted.includes(3);

    return (
      <div className="w-full max-w-4xl mx-auto rounded-3xl p-6 md:p-10 min-h-[85vh] flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-2xl max-w-lg w-full text-center space-y-8"
        >
          <Manny mood={mascotState.mood} size={185} />

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Mini‑session {lastCompletedMiniSession} terminée ! 🎉
            </h2>
            <p className="text-slate-400 font-bold text-sm">
              {mini.label}
            </p>
          </div>

          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 space-y-1">
            <span className="block text-xs font-bold text-amber-600 uppercase tracking-wider">XP gagnés</span>
            <span className="block text-4xl font-black text-amber-500">+{xpEarned} XP</span>
            <span className="block text-xs font-semibold text-amber-400">
              Mini‑sessions complétées : {sessionsCompleted.length}/3
            </span>
          </div>

          {isFullyDone && (
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
              <p className="text-emerald-700 font-bold text-sm">
                🌟 Journée spirituelle complète ! Tu as médité jour et nuit selon Josué 1:8.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {!isFullyDone && (
              <button
                onClick={handleContinueNow}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-lg transition-all active:scale-[0.98] text-sm"
              >
                Continuer maintenant →
              </button>
            )}
            <button
              onClick={isFullyDone ? handleCompleteSession : handleComeBackLater}
              className={cn(
                "py-4 px-6 font-extrabold rounded-xl transition-all text-sm",
                isFullyDone
                  ? "flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                  : "flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600"
              )}
            >
              {isFullyDone ? "Voir le résumé de ma session" : "Revenir plus tard"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // === Special screen : Day already completed ===
  if (isDayDone && !sessionResult) {
    const freshUrl = "/meditate?fresh=true";
    return (
      <div className="w-full max-w-4xl mx-auto rounded-3xl p-6 md:p-10 min-h-[85vh] flex flex-col items-center justify-center space-y-6">
        <Manny mood="celebrating" size={170} />
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            🎉 Tu as déjà médité aujourd'hui !
          </h2>
          <p className="text-slate-500 font-medium text-sm max-w-md">
            Ta journée spirituelle est complète. Tu peux faire une méditation personnelle ou retourner au tableau de bord.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <a href={freshUrl} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-lg transition-all text-sm">
            <BookOpen className="w-4 h-4" />
            Faire une méditation personnelle
          </a>
          <a href="/dashboard" className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-sm">
            Voir mon tableau de bord
          </a>
        </div>
      </div>
    );
  }

  // === Main render ===
  return (
    <div className={cn(
      "w-full max-w-4xl mx-auto rounded-3xl p-6 md:p-10 pb-24 md:pb-12 transition-all duration-700 min-h-[85vh] flex flex-col justify-between space-y-8 relative",
      currentMiniSession === 1 && currentStepInMini === 0 && "bg-transparent",
      currentMiniSession === 3 && currentStepInMini === 1 && sessionResult && "bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/5 border border-amber-500/20 shadow-2xl",
      !(currentMiniSession === 1 && currentStepInMini === 0) && !(currentMiniSession === 3 && currentStepInMini === 1 && sessionResult) && "bg-white border border-slate-100 shadow-xl"
    )}>
      {/* 1. PROGRESS BAR */}
      {!sessionResult && (
        <div className="w-full mb-8 pb-2">
          <div className="flex justify-between items-center mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5" />
              Mini‑session {currentMiniSession}/3 · Étape {currentStepInMini + 1}/2
            </span>
            <span>
              {STEP_LABELS[currentMiniSession][currentStepInMini]}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
            {[1, 2, 3].map((ms) => {
              const isCompleted = sessionsCompleted.includes(ms);
              const isCurrent = ms === currentMiniSession;
              return (
                <div key={ms} className="flex-1 flex flex-col items-center relative">
                  <div
                    className={cn(
                      "h-full w-full transition-all duration-500 border-r last:border-0 border-white rounded-full",
                      isCompleted
                        ? "bg-emerald-500"
                        : isCurrent
                          ? "bg-indigo-600"
                          : "bg-slate-200"
                    )}
                    style={{ width: isCurrent ? `${((currentStepInMini + 1) / 2) * 100}%` : isCompleted ? "100%" : "0%" }}
                  />
                  <span className={cn(
                    "text-[9px] font-black mt-1 uppercase tracking-wider",
                    isCompleted ? "text-emerald-600" : isCurrent ? "text-indigo-600" : "text-slate-300"
                  )}>
                    {MINI_SESSIONS[ms - 1].label.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Mini labels */}
          <div className="flex justify-between mt-1">
            {MINI_SESSIONS.map((ms) => {
              const isCompleted = sessionsCompleted.includes(ms.id);
              const isCurrent = ms.id === currentMiniSession;
              return (
                <span key={ms.id} className={cn(
                  "text-[9px] font-black uppercase tracking-wider",
                  isCompleted ? "text-emerald-500" : isCurrent ? "text-indigo-500" : "text-slate-300"
                )}>
                  {ms.id === 1 ? "📖 Verset" : ms.id === 2 ? "🔎 OIA+" : "🙏 Prière"}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* MINI-SESSION SUMMARY — Récapitulatif des sessions précédentes */}
      {currentMiniSession > 1 && !sessionResult && (
        <div className="w-full bg-amber-50/80 border border-amber-200/60 rounded-2xl p-4 space-y-3 mt-6 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider">
              Récapitulatif des mini‑sessions précédentes
            </h4>
          </div>

          {/* Résumé textuel généré */}
          {getMiniSummaryText() && (
            <p className="text-xs font-bold text-indigo-800 leading-relaxed px-3 py-2 bg-indigo-50/70 rounded-xl border border-indigo-100/50">
              {getMiniSummaryText()}
            </p>
          )}
          
          {/* Mini-session 1 — always shown when currentMiniSession >= 2 */}
          <div className="bg-indigo-50/60 border border-indigo-100/60 rounded-xl p-3 space-y-2">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
              <span>{MINI_EMOJIS[1]}</span> Mini‑session 1 — Verset & Contexte
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {answers.step2_who && (
                <div className="bg-slate-50 rounded-lg p-2">
                  <span className="font-bold text-slate-500 text-[9px] uppercase">Qui parle ?</span>
                  <p className="text-slate-700 font-medium mt-0.5 line-clamp-2">{answers.step2_who}</p>
                </div>
              )}
              {answers.step2_whom && (
                <div className="bg-slate-50 rounded-lg p-2">
                  <span className="font-bold text-slate-500 text-[9px] uppercase">À qui ?</span>
                  <p className="text-slate-700 font-medium mt-0.5 line-clamp-2">{answers.step2_whom}</p>
                </div>
              )}
              {answers.step2_before && (
                <div className="bg-slate-50 rounded-lg p-2 sm:col-span-2">
                  <span className="font-bold text-slate-500 text-[9px] uppercase">Contexte avant</span>
                  <p className="text-slate-700 font-medium mt-0.5 line-clamp-2">{answers.step2_before}</p>
                </div>
              )}
              {!answers.step2_who && !answers.step2_whom && !answers.step2_before && (
                <p className="text-[11px] text-slate-400 italic col-span-full text-center py-1">
                  Aucune réponse enregistrée pour cette mini-session
                </p>
              )}
            </div>
          </div>

          {/* Mini-session 2 — shown when currentMiniSession >= 3 */}
          {currentMiniSession >= 3 && (
            <div className="bg-emerald-50/60 border border-emerald-100/60 rounded-xl p-3 space-y-2">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                <span>{MINI_EMOJIS[2]}</span> Mini‑session 2 — Observation & Interprétation
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {answers.step3_epoch && (
                  <div className="bg-slate-50 rounded-lg p-2">
                    <span className="font-bold text-slate-500 text-[9px] uppercase">Époque</span>
                    <p className="text-slate-700 font-medium mt-0.5 line-clamp-2">{answers.step3_epoch}</p>
                  </div>
                )}
                {answers.step3_dest && (
                  <div className="bg-slate-50 rounded-lg p-2">
                    <span className="font-bold text-slate-500 text-[9px] uppercase">Destinataires</span>
                    <p className="text-slate-700 font-medium mt-0.5 line-clamp-2">{answers.step3_dest}</p>
                  </div>
                )}
                {answers.step3_problem && (
                  <div className="bg-slate-50 rounded-lg p-2 sm:col-span-2">
                    <span className="font-bold text-slate-500 text-[9px] uppercase">Problème</span>
                    <p className="text-slate-700 font-medium mt-0.5 line-clamp-2">{answers.step3_problem}</p>
                  </div>
                )}
                {answers.step4_actors && (
                  <div className="bg-slate-50 rounded-lg p-2">
                    <span className="font-bold text-slate-500 text-[9px] uppercase">Acteurs</span>
                    <p className="text-slate-700 font-medium mt-0.5 line-clamp-2">{answers.step4_actors}</p>
                  </div>
                )}
                {answers.step4_action && (
                  <div className="bg-slate-50 rounded-lg p-2">
                    <span className="font-bold text-slate-500 text-[9px] uppercase">Action</span>
                    <p className="text-slate-700 font-medium mt-0.5 line-clamp-2">{answers.step4_action}</p>
                  </div>
                )}
                {answers.step4_repeats && (
                  <div className="bg-slate-50 rounded-lg p-2 sm:col-span-2">
                    <span className="font-bold text-slate-500 text-[9px] uppercase">Répétitions</span>
                    <p className="text-slate-700 font-medium mt-0.5 line-clamp-2">{answers.step4_repeats}</p>
                  </div>
                )}
                {!answers.step3_epoch && !answers.step4_actors && (
                  <p className="text-[11px] text-slate-400 italic col-span-full text-center py-1">
                    Aucune réponse enregistrée pour cette mini-session
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STUDY BAR */}
      {showStudyBar && dailyVerse && (
        <div className="sticky top-0 z-30 w-full bg-indigo-950 text-white rounded-3xl p-4 md:p-5 shadow-lg border border-indigo-900/60 flex flex-col gap-3 mb-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <blockquote className="text-xs md:text-sm font-semibold leading-relaxed line-clamp-3 italic text-indigo-100">
                « {dailyVerse.text} »
              </blockquote>
              <span className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                — {dailyVerse.reference}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => { setShowStudyPanel(showStudyPanel === "highlight" ? null : "highlight"); sounds.playSuccess(); }}
                className={cn("p-2 rounded-xl border transition-all cursor-pointer",
                  verseDetails?.highlightColor ? "bg-indigo-800 border-indigo-700 text-amber-300" : "bg-indigo-900/50 border-indigo-800 text-indigo-200 hover:text-white")}
                title="Surligner ce verset">
                <Bookmark className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setShowStudyPanel(showStudyPanel === "strong" ? null : "strong"); sounds.playSuccess(); }}
                className={cn("p-2 rounded-xl border transition-all cursor-pointer",
                  showStudyPanel === "strong" ? "bg-indigo-800 border-indigo-700 text-white" : "bg-indigo-900/50 border-indigo-800 text-indigo-200 hover:text-white")}
                title="Concordance Strong">
                <Hash className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setShowStudyPanel(showStudyPanel === "references" ? null : "references"); sounds.playSuccess(); }}
                className={cn("p-2 rounded-xl border transition-all cursor-pointer",
                  showStudyPanel === "references" ? "bg-indigo-800 border-indigo-700 text-white" : "bg-indigo-900/50 border-indigo-800 text-indigo-200 hover:text-white")}
                title="Références croisées">
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setShowStudyPanel(showStudyPanel === "context" ? null : "context"); loadContext(); sounds.playSuccess(); }}
                className={cn("p-2 rounded-xl border transition-all cursor-pointer",
                  showStudyPanel === "context" ? "bg-indigo-800 border-indigo-700 text-white" : "bg-indigo-900/50 border-indigo-800 text-indigo-200 hover:text-white")}
                title="Contexte historique & culturel">
                <BookOpen className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showStudyPanel && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-t border-indigo-900/50 pt-3 mt-1">
                {showStudyPanel === "highlight" && (
                  <div className="flex items-center justify-between gap-3 bg-indigo-900/40 p-2 rounded-2xl">
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">Couleur :</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleHighlight("yellow")} className="w-6 h-6 rounded-full bg-yellow-350 border border-yellow-400 hover:scale-110 transition cursor-pointer" />
                      <button onClick={() => handleHighlight("green")} className="w-6 h-6 rounded-full bg-emerald-400 border border-emerald-500 hover:scale-110 transition cursor-pointer" />
                      <button onClick={() => handleHighlight("blue")} className="w-6 h-6 rounded-full bg-sky-400 border border-sky-500 hover:scale-110 transition cursor-pointer" />
                      <button onClick={() => handleHighlight("pink")} className="w-6 h-6 rounded-full bg-rose-450 border border-rose-500 hover:scale-110 transition cursor-pointer" />
                      {verseDetails?.highlightColor && (
                        <button onClick={handleDeleteHighlight} className="px-2.5 py-1 rounded-xl bg-rose-600/30 text-rose-300 hover:bg-rose-600 hover:text-white text-[10px] font-black transition cursor-pointer">
                          Retirer
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {showStudyPanel === "strong" && (
                  <div className="space-y-3 bg-indigo-900/30 p-3 rounded-2xl border border-indigo-900/50">
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {dailyVerse.text.split(/\s+/).map((word, idx) => {
                        const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
                        if (!cleanWord.trim()) return null;
                        const strongNum = getStrongNumber(verseDetails?.bookNumber || 1, idx);
                        return (
                          <button key={idx} onClick={() => handleStrongLookup(strongNum)}
                            className="text-[10px] font-bold bg-indigo-950/80 border border-indigo-900 text-indigo-200 hover:text-white hover:bg-indigo-900 px-2 py-1 rounded-lg transition cursor-pointer">
                            {cleanWord} ({strongNum})
                          </button>
                        );
                      })}
                    </div>
                    {strongLoading && (
                      <div className="flex items-center gap-2 text-indigo-300 text-xs">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Chargement...</span>
                      </div>
                    )}
                    {strongResult && (
                      <div className="bg-indigo-950/90 rounded-xl p-3 border border-indigo-900/50 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-[10px] font-black text-indigo-400">
                          <span>STRONG {strongResult.number}</span>
                          {strongResult.pronunciation && <span>/{strongResult.pronunciation}/</span>}
                        </div>
                        <div className="text-sm font-bold text-white">« {strongResult.lemma} »</div>
                        <p className="text-indigo-200 leading-relaxed text-[11px]">{strongResult.definition}</p>
                      </div>
                    )}
                  </div>
                )}

                {showStudyPanel === "references" && (
                  <div className="bg-indigo-900/30 p-3 rounded-2xl border border-indigo-900/50 space-y-3 max-h-48 overflow-y-auto">
                    {loadingCrossRefs ? (
                      <div className="flex items-center gap-2 text-indigo-300 text-xs py-4 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Chargement des références...</span>
                      </div>
                    ) : crossRefs.length === 0 ? (
                      <p className="text-center text-xs text-indigo-300 py-3">Aucune référence croisée disponible.</p>
                    ) : (
                      <div className="space-y-2">
                        {crossRefs.map((ref: CrossRef) => (
                          <div key={ref.id} className="bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-900/40 space-y-1">
                            <span className="text-[10px] font-black text-indigo-400 block">{ref.refLabel}</span>
                            <p className="text-xs text-indigo-100 italic">&quot;{ref.toVerse?.text || ""}&quot;</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {showStudyPanel === "context" && (
                  <div className="bg-indigo-900/30 p-4 rounded-2xl border border-indigo-900/50 space-y-3 max-h-72 overflow-y-auto">
                    {loadingContext ? (
                      <div className="flex items-center gap-2 text-indigo-300 text-xs py-4 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Chargement du contexte...</span>
                      </div>
                    ) : contextData ? (
                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">📜 Contexte historique</span>
                          <p className="text-indigo-100 leading-relaxed mt-1">{contextData.historicalContext}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-indigo-900/50">
                          <div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">Auteur</span>
                            <p className="text-indigo-200 font-semibold mt-0.5">{contextData.author}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">Période</span>
                            <p className="text-indigo-200 font-semibold mt-0.5">{contextData.period}</p>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">🎭 Coutumes & culture</span>
                          <p className="text-indigo-100 leading-relaxed mt-1">{contextData.culturalNotes}</p>
                        </div>
                        {contextData.keyEvents && contextData.keyEvents !== "—" && (
                          <div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">⚡ Événements clés</span>
                            <p className="text-indigo-100 leading-relaxed mt-1">{contextData.keyEvents}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-center text-xs text-indigo-300 py-3">
                        Contexte non disponible pour ce passage.
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 flex flex-col justify-center pt-[130px] pb-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center space-y-4 py-16 w-full max-w-sm mx-auto">
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-2">
                <motion.div className="h-full bg-indigo-600" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3, ease: "easeInOut" }} />
              </div>
              <Manny mood={currentMiniSession === 3 && currentStepInMini === 1 ? "praying" : "thinking"} size={80} />
              <span className="text-sm font-black text-slate-500 animate-pulse tracking-wide">
                {loadingMessage || "Chargement..."}
              </span>
            </motion.div>
          ) : error ? (
            <motion.div key="error" className="bg-rose-50 border border-rose-100 p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto shadow-sm">
              <HelpCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <h3 className="text-lg font-black text-rose-800">Une erreur est survenue</h3>
              <p className="text-rose-600 text-sm font-semibold leading-relaxed">{error}</p>
              <button onClick={() => {
                if (currentMiniSession === 1 && currentStepInMini === 1 && dailyVerse) fetchHistoricalContext(dailyVerse);
                if (currentMiniSession === 3 && currentStepInMini === 1 && dailyVerse) fetchPersonalizedContent(dailyVerse);
              }} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-sm shadow-md transition-all">
                Réessayer la génération
              </button>
            </motion.div>
          ) : (
            renderCurrentStep()
          )}
        </AnimatePresence>
      </div>

      {/* 3. NAVIGATION BAR */}
      {!loading && !sessionResult && !showMiniComplete && !(currentMiniSession === 1 && currentStepInMini === 0) && (
        <div className="flex flex-col pt-6 border-t border-slate-100/60 mt-4 space-y-3">
          <div className="flex justify-between items-center w-full">
            <button onClick={handlePrevStep}
              className="flex items-center gap-2 px-5 py-3 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl font-bold transition text-sm">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            
            <div className="flex gap-3 items-center">
              <button onClick={handleTriggerAbandon} className="px-5 py-3 text-slate-400 hover:text-rose-600 rounded-xl font-bold transition text-sm">
                Abandonner
              </button>
              {(currentMiniSession === 3 && currentStepInMini === 1) ? (
                <button onClick={handleCompleteSession} disabled={!isStepValid()}
                  className={cn("flex items-center gap-2 px-6 py-3 font-extrabold rounded-xl shadow-md transition transform text-sm",
                    isStepValid() ? "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg active:scale-98" : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none")}>
                  Terminer
                  <CheckCircle className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleNextStep} disabled={!isStepValid()}
                  className={cn("flex items-center gap-2 px-6 py-3 font-extrabold rounded-xl shadow-md transition transform text-sm",
                    isStepValid() ? "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg active:scale-98" : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none")}>
                  Suivant
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {!isStepValid() && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-xs font-bold text-rose-500 text-right animate-pulse pr-2">
              Réponds à au moins une question pour continuer (min. 10 caractères)
            </motion.p>
          )}
        </div>
      )}

      {/* Abandon Modal */}
      <AnimatePresence>
        {showAbandonModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-150 flex flex-col items-center text-center space-y-6">
              <Manny mood="sad" size={175} />
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">Ne pars pas déjà 🙏</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">{abandonMessage}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
                <button onClick={handleConfirmStay}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-all active:scale-[0.98] text-sm">
                  Rester avec Dieu
                </button>
                <button onClick={handleConfirmAbandon}
                  className="py-3.5 px-4 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-all text-sm">
                  Quitter quand même
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MeditatePage() {
  return (
    <Suspense fallback={
      <div className="w-full bg-slate-50/60 dark:bg-slate-900/60 rounded-3xl border border-slate-200/60 dark:border-slate-800 p-8 min-h-[600px] flex flex-col items-center justify-center space-y-4 shadow-sm">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Chargement de ta méditation...</span>
      </div>
    }>
      <MeditatePageContent />
    </Suspense>
  );
}