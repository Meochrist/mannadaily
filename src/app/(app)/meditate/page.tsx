"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Manny from "@/components/mascot/Manny";
import MascotMessage from "@/components/mascot/MascotMessage";
import { MannyMood } from "@/types";
import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  Sparkles, 
  Send, 
  Award, 
  Flame, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Heart,
  HelpCircle,
  Clock
} from "lucide-react";
import { getMannyMessage } from "@/lib/mannyMessages";
import * as sounds from "@/lib/sounds";
import { getDailyVerse, getVerseContext, Verse as DailyVerseType } from "@/lib/verses";
import SpeechMicButton from "@/components/meditation/SpeechMicButton";

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
  // Étape 2 : Contexte biblique
  step2_who: string;
  step2_whom: string;
  step2_before: string;
  // Étape 3 : Contexte historique
  step3_epoch: string;
  step3_dest: string;
  step3_problem: string;
  // Étape 4 : Observation
  step4_actors: string;
  step4_repeats: string;
  step4_action: string;
  // Étape 5 : Interprétation
  step5_author: string;
  step5_jesus: string;
  step5_summary: string;
  // Étape 6 : Application
  step6_situation: string;
  step6_transform: string;
  step6_decision: string;
}

export default function MeditatePage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Verset du jour
  const [dailyVerse, setDailyVerse] = useState<DailyVerseType | null>(null);

  // Contexte biblique (lecture seule en local)
  const [bibleContext, setBibleContext] = useState<{ before: DailyVerseType[]; after: DailyVerseType[] }>({ before: [], after: [] });

  // Contenus générés par l'IA (historique, prière et résumé)
  const [historicalContext, setHistoricalContext] = useState("");
  const [prayerContent, setPrayerContent] = useState("");
  const [summaryContent, setSummaryContent] = useState<string | null>(null);

  // États de pre-fetch et cache (Tâche #49)
  const [prefetchedHistorical, setPrefetchedHistorical] = useState<string | null>(null);
  const [prefetchedMeditation, setPrefetchedMeditation] = useState<string | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);

  // Réponses utilisateur pour le journal
  const [answers, setAnswers] = useState<Answers>({
    step2_who: "",
    step2_whom: "",
    step2_before: "",
    step3_epoch: "",
    step3_dest: "",
    step3_problem: "",
    step4_actors: "",
    step4_repeats: "",
    step4_action: "",
    step5_author: "",
    step5_jesus: "",
    step5_summary: "",
    step6_situation: "",
    step6_transform: "",
    step6_decision: "",
  });

  // Résultats de fin de session
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);

  // Infos de profil
  const [userName, setUserName] = useState("Ami");
  const [streakCount, setStreakCount] = useState(0);

  // Modals et notifications
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [abandonMessage, setAbandonMessage] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");

  // Suggestions des mascottes : visibilité individuelle
  const [showSuggestion, setShowSuggestion] = useState(true);

  // Charger le profil utilisateur, initialiser le verset et son contexte
  useEffect(() => {
    // Lire d'abord les query parameters de l'URL pour voir si un verset spécifique a été passé
    const urlParams = new URLSearchParams(window.location.search);
    const textParam = urlParams.get("text");
    const refParam = urlParams.get("reference");
    const themeParam = urlParams.get("theme");

    let verse: DailyVerseType;

    if (textParam && refParam && themeParam) {
      verse = {
        text: decodeURIComponent(textParam),
        reference: decodeURIComponent(refParam),
        theme: decodeURIComponent(themeParam)
      };
    } else {
      verse = getDailyVerse();
    }

    setDailyVerse(verse);
    setBibleContext(getVerseContext(verse.reference));

    fetch("/api/user/progress")
      .then((res) => res.json())
      .then((data) => {
        const name = data.userName || "Ami";
        const streak = data.streak?.currentStreak || 0;
        setUserName(name);
        setStreakCount(streak);
        setWelcomeMessage(getMannyMessage("welcome", name, streak));
      })
      .catch((err) => {
        console.warn("Failed to fetch user progress:", err);
        setWelcomeMessage(getMannyMessage("welcome", "Ami", 0));
      });
  }, []);

  // Reset de la visibilité des suggestions au changement d'étape
  useEffect(() => {
    setShowSuggestion(true);
  }, [currentStep]);

  // Pre-fetch et Cache local session (Tâche #49)
  useEffect(() => {
    if (currentStep === 1 && dailyVerse && !isPrefetching) {
      const histKey = `manna_historical_${dailyVerse.reference}`;
      const medKey = `manna_meditation_${dailyVerse.reference}`;

      // 1. Vérification du cache de session
      const cachedHistorical = sessionStorage.getItem(histKey);
      const cachedMeditation = sessionStorage.getItem(medKey);

      if (cachedHistorical) {
        setHistoricalContext(cachedHistorical);
        setPrefetchedHistorical(cachedHistorical);
      }
      if (cachedMeditation) {
        setPrefetchedMeditation(cachedMeditation);
      }

      // Si les deux sont déjà en cache, aucun appel API nécessaire
      if (cachedHistorical && cachedMeditation) {
        return;
      }

      // Lancement du pre-fetch des éléments manquants
      setIsPrefetching(true);
      const fetchTasks = [];

      if (!cachedHistorical) {
        fetchTasks.push(
          fetch("/api/meditation/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              verse: dailyVerse.text,
              reference: dailyVerse.reference,
              theme: dailyVerse.theme,
              type: "contexte_historique"
            }),
          })
          .then(async (res) => {
            if (!res.ok) throw new Error("Failed to fetch historical context");
            const data = await res.json();
            sessionStorage.setItem(histKey, data.meditation);
            setHistoricalContext(data.meditation);
            setPrefetchedHistorical(data.meditation);
            return data.meditation;
          })
        );
      }

      if (!cachedMeditation) {
        fetchTasks.push(
          fetch("/api/meditation/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              verse: dailyVerse.text,
              reference: dailyVerse.reference,
              theme: dailyVerse.theme,
              type: "meditation"
            }),
          })
          .then(async (res) => {
            if (!res.ok) throw new Error("Failed to fetch main meditation");
            const data = await res.json();
            sessionStorage.setItem(medKey, data.meditation);
            setPrefetchedMeditation(data.meditation);
            return data.meditation;
          })
        );
      }

      Promise.allSettled(fetchTasks).finally(() => {
        setIsPrefetching(false);
      });
    }
  }, [currentStep, dailyVerse, isPrefetching]);

  // CORRECTION 2 : Validation des étapes (min. 10 caractères dans au moins 1 textarea)
  const isStepValid = () => {
    switch (currentStep) {
      case 2:
        return (
          answers.step2_who.trim().length >= 10 ||
          answers.step2_whom.trim().length >= 10 ||
          answers.step2_before.trim().length >= 10
        );
      case 3:
        return (
          answers.step3_epoch.trim().length >= 10 ||
          answers.step3_dest.trim().length >= 10 ||
          answers.step3_problem.trim().length >= 10
        );
      case 4:
        return (
          answers.step4_actors.trim().length >= 10 ||
          answers.step4_repeats.trim().length >= 10 ||
          answers.step4_action.trim().length >= 10
        );
      case 5:
        return (
          answers.step5_author.trim().length >= 10 ||
          answers.step5_jesus.trim().length >= 10 ||
          answers.step5_summary.trim().length >= 10
        );
      case 6:
        return (
          answers.step6_situation.trim().length >= 10 ||
          answers.step6_transform.trim().length >= 10 ||
          answers.step6_decision.trim().length >= 10
        );
      default:
        return true; // Étape 1 et 7 sont toujours libres/valides d'office
     }
  };

  // Appel IA pour l'étape 3 (Contexte historique)
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
        body: JSON.stringify({
          verse: verseObj.text,
          reference: verseObj.reference,
          theme: verseObj.theme,
          type: "contexte_historique"
        }),
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

  // Appel IA pour l'étape 7 (Prière personnalisée & Résumé personnalisé)
  const fetchPersonalizedContent = async (verseObj: DailyVerseType) => {
    setLoading(true);
    setError("");
    setLoadingMessage(getMannyMessage("loading", userName, streakCount));

    try {
      // 1. Lancer la requête pour la prière personnalisée
      const prayerPromise = fetch("/api/meditation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verse: verseObj.text,
          reference: verseObj.reference,
          theme: verseObj.theme,
          type: "prayer_personal",
          answers: answers
        }),
      });

      // 2. Lancer la requête pour le résumé personnalisé
      const summaryPromise = fetch("/api/meditation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verse: verseObj.text,
          reference: verseObj.reference,
          theme: verseObj.theme,
          type: "summary",
          answers: answers
        }),
      });

      // Attendre les deux réponses
      const [prayerRes, summaryRes] = await Promise.all([prayerPromise, summaryPromise]);

      const prayerData = await prayerRes.json();
      if (!prayerRes.ok) throw new Error(prayerData.error || "Échec de la génération de la prière.");
      setPrayerContent(prayerData.meditation);

      // Le résumé est facultatif/silencieux s'il échoue ou s'il retourne null
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

  // Navigation vers l'avant
  const handleNextStep = async () => {
    if (!dailyVerse) return;

    const nextStep = (currentStep + 1) as 2 | 3 | 4 | 5 | 6 | 7;

    // Jouer le son engageant de passage d'étape
    sounds.playStepComplete();

    // Gestion de la navigation avec Pre-fetch & Loader minimal (Tâche #49)
    if (nextStep === 3) {
      setCurrentStep(nextStep);
      const histKey = `manna_historical_${dailyVerse.reference}`;
      const cached = sessionStorage.getItem(histKey) || prefetchedHistorical || historicalContext;
      
      if (!cached) {
        // Pas en cache : on lance le chargement
        await fetchHistoricalContext(dailyVerse);
      } else {
        // Déjà en cache/prefetch : affichage immédiat
        setHistoricalContext(cached);
      }
    } else if (nextStep === 4) {
      setCurrentStep(nextStep);
      const medKey = `manna_meditation_${dailyVerse.reference}`;
      const cached = sessionStorage.getItem(medKey) || prefetchedMeditation;
      
      if (!cached && isPrefetching) {
        // En cours de prefetching : loader minimal (1-2s max)
        setLoading(true);
        const checkInterval = setInterval(() => {
          const val = sessionStorage.getItem(medKey) || prefetchedMeditation;
          if (val) {
            clearInterval(checkInterval);
            setLoading(false);
          }
        }, 200);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          setLoading(false);
        }, 1500); // 1.5s max
      }
    } else if (nextStep === 7 && !prayerContent) {
      setCurrentStep(nextStep);
      await fetchPersonalizedContent(dailyVerse);
    } else {
      setCurrentStep(nextStep);
    }
  };

  // Navigation vers l'arrière
  const handlePrevStep = () => {
    if (currentStep > 1) {
      sounds.playSuccess();
      setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4 | 5 | 6);
    }
  };

  // Clôturer la session (Étape 7)
  const handleCompleteSession = async () => {
    setLoading(true);
    setError("");

    try {
      // Construction du journal OIA+ complet
      const formattedNotes = `=== JOURNAL DE MÉDITATION OIA+ ===

[VERS DU JOUR]
${dailyVerse?.reference} : "${dailyVerse?.text}" (Thème : ${dailyVerse?.theme})

[ÉTAPE 2 — CONTEXTE BIBLIQUE]
- Qui parle dans ce passage ?
  ${answers.step2_who || "Non renseigné"}
- À qui s'adresse ce message ?
  ${answers.step2_whom || "Non renseigné"}
- Que se passait-il juste avant ce verset ?
  ${answers.step2_before || "Non renseigné"}

[ÉTAPE 3 — CONTEXTE HISTORIQUE]
- Dans quelle époque ce livre a-t-il été écrit ?
  ${answers.step3_epoch || "Non renseigné"}
- À quel peuple ou personne ce message était-il destiné ?
  ${answers.step3_dest || "Non renseigné"}
- Quel problème ou situation ce texte adressait-il ?
  ${answers.step3_problem || "Non renseigné"}

[ÉTAPE 4 — OBSERVATION (O)]
- Quels sont les personnages ou acteurs mentionnés ?
  ${answers.step4_actors || "Non renseigné"}
- Quels mots ou expressions se répètent dans ce verset ?
  ${answers.step4_repeats || "Non renseigné"}
- Quel est le fait ou l'action principale décrite ?
  ${answers.step4_action || "Non renseigné"}

[ÉTAPE 5 — INTERPRÉTATION (I)]
- Que voulait communiquer l'auteur à ses lecteurs de l'époque ?
  ${answers.step5_author || "Non renseigné"}
- Qu'est-ce que ce verset signifie à la lumière de Jésus-Christ ?
  ${answers.step5_jesus || "Non renseigné"}
- Résumé en une phrase simple :
  ${answers.step5_summary || "Non renseigné"}

[ÉTAPE 6 — APPLICATION (A)]
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
        body: JSON.stringify({ 
          type: "classic",
          notes: formattedNotes 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible de finaliser la session.");

      setSessionResult(data);
      sounds.playSuccess();

      // Sauvegarder la progression locale par chemin
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
      setError(err instanceof Error ? err.message : "Erreur de validation");
    } finally {
      setLoading(false);
    }
  };

  // Modal d'abandon
  const handleTriggerAbandon = () => {
    sounds.playAbandonWarning();
    setAbandonMessage(getMannyMessage("abandon_attempt", userName, streakCount));
    setShowAbandonModal(true);
  };

  const handleConfirmStay = () => {
    setShowAbandonModal(false);
  };

  const handleConfirmAbandon = () => {
    setShowAbandonModal(false);
    setCurrentStep(1);
    setHistoricalContext("");
    setPrayerContent("");
    setAnswers({
      step2_who: "",
      step2_whom: "",
      step2_before: "",
      step3_epoch: "",
      step3_dest: "",
      step3_problem: "",
      step4_actors: "",
      step4_repeats: "",
      step4_action: "",
      step5_author: "",
      step5_jesus: "",
      step5_summary: "",
      step6_situation: "",
      step6_transform: "",
      step6_decision: "",
    });
    setSessionResult(null);
  };

  // Rendu de la suggestion de la bonne mascotte avec MascotMessage (Tâche #39)
  const renderMascotSuggestion = () => {
    if (!showSuggestion) return null;

    let mascot: "samson" | "esther" | "gedeon" | "noe" | "manny" = "manny";
    let mood: MannyMood = "happy";
    let message = "";

    switch (currentStep) {
      case 2:
        mascot = "gedeon";
        mood = "encouraging";
        message = "Lis 2-3 versets avant et après dans ta Bible.";
        break;
      case 3:
        mascot = "gedeon";
        mood = "thinking";
        message = "Cherche le mot clé dans un dictionnaire Strong pour aller plus loin.";
        break;
      case 4:
        mascot = "noe";
        mood = "encouraging";
        message = "Lis ce verset dans une autre traduction (Darby, TOB, NBS).";
        break;
      case 5:
        mascot = "esther";
        mood = "thinking";
        message = "Cherche ce passage dans un commentaire biblique en ligne.";
        break;
      case 6:
        mascot = "samson";
        mood = "encouraging";
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

  return (
    <div className={cn(
      "w-full max-w-4xl mx-auto rounded-3xl p-6 md:p-10 transition-all duration-700 min-h-[85vh] flex flex-col justify-between space-y-8 relative",
      currentStep === 1 && "bg-transparent",
      currentStep === 7 && sessionResult && "bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/5 border border-amber-500/20 shadow-2xl",
      currentStep > 1 && !(currentStep === 7 && sessionResult) && "bg-white border border-slate-100 shadow-xl"
    )}>
      {/* 1. BARRE DE PROGRESSION EN HAUT */}
      {(!sessionResult) && (
        <div className="w-full">
          <div className="flex justify-between items-center mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>Étude Inductive OIA+</span>
            <span>Étape {currentStep} sur 7</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
              <div
                key={step}
                className={cn(
                  "h-full flex-1 transition-all duration-500 border-r last:border-0 border-white",
                  currentStep >= step ? "bg-indigo-600" : "bg-slate-200"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* 2. ZONE CENTRALE D'ACTION / RENDER ÉTAPES */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* ÉTAPE DE CHARGEMENT PRINCIPAL IA */}
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center space-y-4 py-16 w-full max-w-sm mx-auto"
            >
              {/* Barre de progression animée fine en haut (3s) */}
              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-2">
                <motion.div 
                  className="h-full bg-indigo-600"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
              </div>

              <Manny mood={currentStep === 7 ? "praying" : "thinking"} size={80} />
              <span className="text-sm font-black text-slate-500 animate-pulse tracking-wide">
                Chargement...
              </span>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              className="bg-rose-50 border border-rose-100 p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto shadow-sm"
            >
              <HelpCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <h3 className="text-lg font-black text-rose-800">Une erreur est survenue</h3>
              <p className="text-rose-600 text-sm font-semibold leading-relaxed">{error}</p>
              <button
                onClick={() => {
                  if (currentStep === 3 && dailyVerse) fetchHistoricalContext(dailyVerse);
                  if (currentStep === 7 && dailyVerse) fetchPersonalizedContent(dailyVerse);
                }}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-sm shadow-md transition-all"
              >
                Réessayer la génération
              </button>
            </motion.div>
          ) : (
            <>
              {/* ÉTAPE 1 : VERSET DU JOUR */}
              {currentStep === 1 && dailyVerse && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8 flex flex-col items-center"
                >
                  <Manny mood="happy" size={170} />
                  
                  {welcomeMessage && (
                    <div className="text-center bg-indigo-50/50 border border-indigo-100/30 text-indigo-800 p-4 px-6 rounded-2xl text-xs md:text-sm font-extrabold max-w-md shadow-sm">
                      {welcomeMessage}
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
                    J'ai lu le verset
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

              {/* ÉTAPE 2 : CONTEXTE BIBLIQUE (CORRECTION 1 : Versets voisins réels en lecture seule) */}
              {currentStep === 2 && dailyVerse && (
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
                      <h4 className="font-black text-sm uppercase tracking-wider">Contexte Biblique Immédiat</h4>
                    </div>
                    
                    <div className="space-y-4">
                      {bibleContext.before.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Avant...</span>
                          {bibleContext.before.map((v, i) => (
                            <p key={i} className="text-xs md:text-sm font-bold text-slate-500 leading-relaxed italic">
                              « {v.text} » <span className="text-[9px] font-black text-slate-400 not-italic uppercase">({v.reference})</span>
                            </p>
                          ))}
                        </div>
                      )}
                      
                      <div className="p-3.5 bg-white border border-indigo-100/70 rounded-xl space-y-1">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Verset à l'étude :</span>
                        <p className="text-sm md:text-base font-extrabold text-slate-800 leading-relaxed">
                          « {dailyVerse.text} » <span className="text-xs font-black text-indigo-600 uppercase">({dailyVerse.reference})</span>
                        </p>
                      </div>

                      {bibleContext.after.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Après...</span>
                          {bibleContext.after.map((v, i) => (
                            <p key={i} className="text-xs md:text-sm font-bold text-slate-500 leading-relaxed italic">
                              « {v.text} » <span className="text-[9px] font-black text-slate-400 not-italic uppercase">({v.reference})</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-black text-lg text-slate-800 tracking-tight">Analyse du passage</h3>
                    
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Qui parle dans ce passage ?</label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={answers.step2_who}
                          onChange={(e) => setAnswers({ ...answers, step2_who: e.target.value })}
                          placeholder="Ex: L'apôtre Paul, Jésus, un psalmiste..."
                          className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <SpeechMicButton
                          value={answers.step2_who}
                          onChange={(val) => setAnswers({ ...answers, step2_who: val })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">À qui s'adresse ce message ?</label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={answers.step2_whom}
                          onChange={(e) => setAnswers({ ...answers, step2_whom: e.target.value })}
                          placeholder="Ex: Aux chrétiens de Philippe, aux disciples, à Dieu..."
                          className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <SpeechMicButton
                          value={answers.step2_whom}
                          onChange={(val) => setAnswers({ ...answers, step2_whom: val })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Que se passait-il juste avant ce verset ?</label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={answers.step2_before}
                          onChange={(e) => setAnswers({ ...answers, step2_before: e.target.value })}
                          placeholder="Quels événements précèdent directement cette parole ?"
                          className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <SpeechMicButton
                          value={answers.step2_before}
                          onChange={(val) => setAnswers({ ...answers, step2_before: val })}
                        />
                      </div>
                    </div>
                  </div>

                  {renderMascotSuggestion()}
                </motion.div>
              )}

              {/* ÉTAPE 3 : CONTEXTE HISTORIQUE */}
              {currentStep === 3 && dailyVerse && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-6"
                >
                  <div className="bg-amber-50/30 p-6 rounded-2xl border border-amber-100/50 space-y-3">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Clock className="w-5 h-5 text-amber-600" />
                      <h4 className="font-black text-sm uppercase tracking-wider">Contexte Historique & Culturel (IA)</h4>
                    </div>
                    <p className="text-slate-700 font-medium text-sm md:text-base leading-relaxed whitespace-pre-line text-justify">
                      {historicalContext}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-black text-lg text-slate-800 tracking-tight">Arrière-plan historique</h3>
                    
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Dans quelle époque ce livre a-t-il été écrit ?</label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={answers.step3_epoch}
                          onChange={(e) => setAnswers({ ...answers, step3_epoch: e.target.value })}
                          placeholder="Ex: Sous l'exil à Babylone, sous l'occupation romaine..."
                          className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <SpeechMicButton
                          value={answers.step3_epoch}
                          onChange={(val) => setAnswers({ ...answers, step3_epoch: val })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">À quel peuple ou personne ce message était-il destiné ?</label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={answers.step3_dest}
                          onChange={(e) => setAnswers({ ...answers, step3_dest: e.target.value })}
                          placeholder="Ex: Aux exilés, à l'Église primitive persécutée..."
                          className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <SpeechMicButton
                          value={answers.step3_dest}
                          onChange={(val) => setAnswers({ ...answers, step3_dest: val })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Quel problem ou situation ce texte adressait-il ?</label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={answers.step3_problem}
                          onChange={(e) => setAnswers({ ...answers, step3_problem: e.target.value })}
                          placeholder="Quel défi pastoral, théologique ou communautaire était traité ?"
                          className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <SpeechMicButton
                          value={answers.step3_problem}
                          onChange={(val) => setAnswers({ ...answers, step3_problem: val })}
                        />
                      </div>
                    </div>
                  </div>

                  {renderMascotSuggestion()}
                </motion.div>
              )}

              {/* ÉTAPE 4 : OBSERVATION (O) */}
              {currentStep === 4 && dailyVerse && (
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
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Quels sont les personnages ou acteurs mentionnés ?</label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={answers.step4_actors}
                          onChange={(e) => setAnswers({ ...answers, step4_actors: e.target.value })}
                          placeholder="Note toutes les personnes, groupes ou entités (y compris Dieu)."
                          className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <SpeechMicButton
                          value={answers.step4_actors}
                          onChange={(val) => setAnswers({ ...answers, step4_actors: val })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Quels mots ou expressions se répètent dans ce verset ?</label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={answers.step4_repeats}
                          onChange={(e) => setAnswers({ ...answers, step4_repeats: e.target.value })}
                          placeholder="Y a-t-il des termes insistants (ex: force, loi, cœur, aimer) ?"
                          className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <SpeechMicButton
                          value={answers.step4_repeats}
                          onChange={(val) => setAnswers({ ...answers, step4_repeats: val })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Quel est le fait ou l'action principale décrite ?</label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={answers.step4_action}
                          onChange={(e) => setAnswers({ ...answers, step4_action: e.target.value })}
                          placeholder="Quel est le verbe d'action clé ou l'affirmation centrale ?"
                          className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <SpeechMicButton
                          value={answers.step4_action}
                          onChange={(val) => setAnswers({ ...answers, step4_action: val })}
                        />
                      </div>
                    </div>
                  </div>

                  {renderMascotSuggestion()}
                </motion.div>
              )}

              {/* ÉTAPE 5 : INTERPRÉTATION (I) */}
              {currentStep === 5 && dailyVerse && (
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
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Que voulait communiquer l'auteur à ses lecteurs de l'époque ?</label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={answers.step5_author}
                          onChange={(e) => setAnswers({ ...answers, step5_author: e.target.value })}
                          placeholder="Quel était l'enseignement moral ou la vérité théologique visée ?"
                          className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <SpeechMicButton
                          value={answers.step5_author}
                          onChange={(val) => setAnswers({ ...answers, step5_author: val })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Qu'est-ce que ce verset signifie à la lumière de Jésus-Christ ?</label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={answers.step5_jesus}
                          onChange={(e) => setAnswers({ ...answers, step5_jesus: e.target.value })}
                          placeholder="Comment cette Parole pointe-t-elle vers la grâce, la croix ou l'Évangile ?"
                          className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <SpeechMicButton
                          value={answers.step5_jesus}
                          onChange={(val) => setAnswers({ ...answers, step5_jesus: val })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Résume ce verset en une seule phrase simple.</label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={answers.step5_summary}
                          onChange={(e) => setAnswers({ ...answers, step5_summary: e.target.value })}
                          placeholder="Réécris la vérité essentielle du verset avec tes propres mots."
                          className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <SpeechMicButton
                          value={answers.step5_summary}
                          onChange={(val) => setAnswers({ ...answers, step5_summary: val })}
                        />
                      </div>
                    </div>
                  </div>

                  {renderMascotSuggestion()}
                </motion.div>
              )}

              {/* ÉTAPE 6 : APPLICATION (A) */}
              {currentStep === 6 && dailyVerse && (
                <motion.div
                  key="step6"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2 mb-6">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Méthode Inductive</span>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">A : Application</h2>
                    <p className="text-slate-400 font-semibold text-xs max-w-sm mx-auto">Fais descendre la Parole dans ton cœur et dans tes actions</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Comment ce verset parle-t-il directement à ta situation aujourd'hui ?</label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={answers.step6_situation}
                          onChange={(e) => setAnswers({ ...answers, step6_situation: e.target.value })}
                          placeholder="Fais un lien avec ton travail, ta famille, tes soucis actuels..."
                          className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <SpeechMicButton
                          value={answers.step6_situation}
                          onChange={(val) => setAnswers({ ...answers, step6_situation: val })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Qu'est-ce que Dieu veut transformer dans ta vie à travers ce texte ?</label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={answers.step6_transform}
                          onChange={(e) => setAnswers({ ...answers, step6_transform: e.target.value })}
                          placeholder="Une attitude, une habitude, une crainte à abandonner ?"
                          className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <SpeechMicButton
                          value={answers.step6_transform}
                          onChange={(val) => setAnswers({ ...answers, step6_transform: val })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Quelle décision concrète tu prends suite à cette méditation ?</label>
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={answers.step6_decision}
                          onChange={(e) => setAnswers({ ...answers, step6_decision: e.target.value })}
                          placeholder="Quelle action précise ou engagement vas-tu mettre en œuvre aujourd'hui ?"
                          className="w-full p-3 pr-10 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                        />
                        <SpeechMicButton
                          value={answers.step6_decision}
                          onChange={(val) => setAnswers({ ...answers, step6_decision: val })}
                        />
                      </div>
                    </div>
                  </div>

                  {renderMascotSuggestion()}
                </motion.div>
              )}

              {/* ÉTAPE 7 : PRIÈRE & CÉLÉBRATION */}
              {currentStep === 7 && dailyVerse && (
                <motion.div
                  key="step7"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8 flex flex-col items-center"
                >
                  {/* CAS 7A : ATTENTE DE VALIDATION DE SESSION */}
                  {!sessionResult ? (
                    <>
                      <div className="w-full flex justify-center mb-4">
                        <MascotMessage
                          mascot="manny"
                          mood="praying"
                          message="Reçois cette prière écrite pour sceller ton temps d'étude."
                          size={150}
                        />
                      </div>

                      {summaryContent && (
                        <div className="w-full bg-indigo-950 text-indigo-50 p-8 rounded-3xl border border-indigo-900 shadow-lg relative overflow-hidden flex flex-col space-y-4">
                          <div className="flex items-center gap-2 border-b border-indigo-900/60 pb-3 text-amber-400">
                            <Sparkles className="w-4.5 h-4.5 text-amber-400 fill-amber-400/10" />
                            <span className="font-black text-xs uppercase tracking-wider text-amber-400">Ce que Dieu t'a dit aujourd'hui</span>
                          </div>
                          <p className="text-indigo-100 font-bold leading-relaxed text-base text-justify whitespace-pre-line">
                            {summaryContent}
                          </p>
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

                      <div className="flex gap-4 pt-4">
                        <button
                          onClick={handlePrevStep}
                          className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
                        >
                          Retour
                        </button>
                        <button
                          onClick={handleCompleteSession}
                          className="flex items-center gap-2 px-8 py-4 bg-indigo-650 text-white font-extrabold rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-base"
                        >
                          Terminer la session
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    /* CAS 7B : SESSION VALIDÉE ET COMPLÉTÉE */
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-8 w-full flex flex-col items-center"
                    >
                      <Manny mood="celebrating" size={185} />

                      <div className="text-center space-y-2">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                          Session validée 🎉
                        </h2>
                        <p className="text-slate-500 font-medium text-sm">
                          {getMannyMessage("session_complete", userName, sessionResult.streak)}
                        </p>
                      </div>

                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mb-2">
                            <Award className="w-6 h-6" />
                          </div>
                          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Points gagnés</span>
                          <span className="text-3xl font-black text-amber-500">+{sessionResult.xpEarned} XP</span>
                          <p className="text-xs font-semibold text-slate-400 mt-1">Total : {sessionResult.newXP} XP</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 mb-2 animate-bounce">
                            <Flame className="w-6 h-6 fill-orange-500" />
                          </div>
                          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Série actuelle</span>
                          <span className="text-3xl font-black text-orange-500">{sessionResult.streak} {sessionResult.streak <= 1 ? "jour" : "jours"}</span>
                          <p className="text-xs font-semibold text-slate-400 mt-1">Série ininterrompue active 🔥</p>
                        </div>
                      </div>

                      {sessionResult.leveledUp && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 }}
                          className="w-full p-5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-2xl text-center space-y-2 shadow-lg border border-amber-300 relative overflow-hidden"
                        >
                          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
                            <Award className="w-24 h-24" />
                          </div>
                          <h4 className="font-black text-lg tracking-tight">FÉLICITATIONS 🎉 NIVEAU SUPÉRIEUR</h4>
                          <p className="text-sm font-extrabold">
                            {getMannyMessage("level_up", userName, sessionResult.streak)}
                          </p>
                        </motion.div>
                      )}

                      {sessionResult.newBadges.length > 0 && (
                        <div className="w-full space-y-3 text-center">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Nouveaux Badges obtenus</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {sessionResult.newBadges.map((badge, idx) => (
                              <div key={idx} className="bg-white p-4 rounded-xl border border-amber-100 flex items-center gap-3 text-left shadow-sm">
                                <div className="w-10 h-10 bg-amber-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                                  <CheckCircle className="w-5 h-5" />
                                </div>
                                <div>
                                  <h5 className="font-bold text-sm text-slate-800">{badge.name}</h5>
                                  <p className="text-xs text-slate-400 font-semibold">{badge.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => router.push("/dashboard")}
                        className="px-8 py-4 bg-indigo-650 text-white font-extrabold rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                      >
                        Retour au tableau de bord
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* 3. BARRE DE COMMANDE DE NAVIGATION EN BAS */}
      {!loading && !sessionResult && currentStep > 1 && currentStep < 7 && (
        <div className="flex flex-col pt-6 border-t border-slate-100/60 mt-4 space-y-3">
          <div className="flex justify-between items-center w-full">
            <button
              onClick={handlePrevStep}
              className="flex items-center gap-2 px-5 py-3 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl font-bold transition text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            
            <div className="flex gap-3 items-center">
              <button
                onClick={handleTriggerAbandon}
                className="px-5 py-3 text-slate-400 hover:text-rose-600 rounded-xl font-bold transition text-sm"
              >
                Abandonner
              </button>
              <button
                onClick={handleNextStep}
                disabled={!isStepValid()}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 font-extrabold rounded-xl shadow-md transition transform text-sm",
                  isStepValid()
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg active:scale-98"
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                )}
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CORRECTION 2 : Message discret sous le bouton */}
          {!isStepValid() && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-bold text-rose-500 text-right animate-pulse pr-2"
            >
              Réponds à au moins une question pour continuer (min. 10 caractères)
            </motion.p>
          )}
        </div>
      )}

      {/* Modal d'abandon Manny */}
      <AnimatePresence>
        {showAbandonModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-150 flex flex-col items-center text-center space-y-6"
            >
              <Manny mood="sad" size={175} />
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">
                  Ne pars pas déjà 🙏
                </h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                  {abandonMessage}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
                <button
                  onClick={handleConfirmStay}
                  className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-all active:scale-[0.98] text-sm"
                >
                  Rester avec Dieu
                </button>
                <button
                  onClick={handleConfirmAbandon}
                  className="py-3.5 px-4 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-all text-sm"
                >
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
