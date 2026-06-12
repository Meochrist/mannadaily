"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Manny from "@/components/mascot/Manny";
import { cn } from "@/lib/utils";
import { 
  Volume2, 
  Mic, 
  MicOff, 
  Award, 
  Flame, 
  CheckCircle, 
  ArrowRight, 
  Play, 
  Pause,
  Sparkles
} from "lucide-react";
import { getMannyMessage } from "@/lib/mannyMessages";
import * as sounds from "@/lib/sounds";

const DEFAULT_PROCLAMATION_VERSES = [
  {
    text: "Par ses meurtrissures, nous sommes guéris.",
    reference: "Ésaïe 53:5",
  },
  {
    text: "Je puis tout par celui qui me fortifie.",
    reference: "Philippiens 4:13",
  },
  {
    text: "L'Éternel est mon berger, je ne manquerai de rien.",
    reference: "Psaumes 23:1",
  },
  {
    text: "Car je connais les projets que j'ai formés sur vous, projets de paix.",
    reference: "Jérémie 29:11",
  },
  {
    text: "Que la paix de Dieu, qui surpasse toute intelligence, garde vos cœurs.",
    reference: "Philippiens 4:7",
  },
];

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

export default function ProclaimPage() {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [verses, setVerses] = useState(DEFAULT_PROCLAMATION_VERSES);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRunning, setIsRunning] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  // Données utilisateur pour messages personnalisés
  const [userName, setUserName] = useState("Ami");
  const [streakCount, setStreakCount] = useState(0);

  // Modal d'abandon
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [abandonMessage, setAbandonMessage] = useState("");

  // Messages dynamiques Manny
  const [welcomeMessage, setWelcomeMessage] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const textParam = urlParams.get("text");
    const refParam = urlParams.get("reference");

    if (textParam && refParam) {
      setVerses([
        {
          text: decodeURIComponent(textParam),
          reference: decodeURIComponent(refParam),
        },
      ]);
    }

    // Récupérer le nom et le streak de l'utilisateur
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
        console.warn("Failed to fetch user data for messages:", err);
        setWelcomeMessage(getMannyMessage("welcome", "Ami", 0));
      });
  }, []);

  // Timer countdown hook
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === 2 && isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 1) {
            sounds.playSuccess(); // Son de réussite du verset quand le timer s'arrête
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, isRunning, timeLeft]);

  const handleStartProclamations = () => {
    sounds.playSessionStart();
    setPhase(2);
    setCurrentVerseIndex(0);
    setTimeLeft(30);
    setIsRunning(true);
    setIsListening(false);
    setError("");
  };

  const handleNextVerse = () => {
    sounds.playSuccess();
    if (currentVerseIndex < verses.length - 1) {
      setCurrentVerseIndex((prev) => prev + 1);
      setTimeLeft(30);
      setIsRunning(true);
    } else {
      handleCompleteProclamation();
    }
  };

  const handleCompleteProclamation = async () => {
    setIsRunning(false);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/session/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "proclamation" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible de valider la session.");
      }

      setSessionResult(data);
      setPhase(3);

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
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de la validation.");
    } finally {
      setLoading(false);
    }
  };

  const toggleListening = () => {
    if (!isListening) {
      sounds.playSuccess();
    }
    setIsListening((prev) => !prev);
  };

  const currentVerse = verses[currentVerseIndex];
  const progressPercent = (timeLeft / 30) * 100;
  const canGoNext = timeLeft <= 20; // 10 secondes écoulées (30 - 20)

  // Gestion de l'humeur de Manny
  const getMannyMood = () => {
    if (timeLeft === 0) return "celebrating";
    return "praying";
  };

  // Déclencher le modal d'abandon
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
    setPhase(1);
    setCurrentVerseIndex(0);
    setTimeLeft(30);
    setIsRunning(false);
  };

  return (
    <div className={cn(
      "w-full max-w-4xl mx-auto rounded-3xl p-6 md:p-10 transition-all duration-700 min-h-[80vh] flex flex-col justify-between space-y-8 relative",
      phase === 1 && "bg-transparent",
      phase === 2 && "bg-indigo-950 text-indigo-100 shadow-2xl border border-indigo-900 relative overflow-hidden",
      phase === 3 && "bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/5 border border-amber-500/20 shadow-2xl"
    )}>
      {/* Halo lumineux d'arrière-plan immersif en phase 2 */}
      {phase === 2 && (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        </div>
      )}

      {/* Barre d'étape / progression globale */}
      <div className="w-full">
        <div className="flex justify-between items-center mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <span>Proclamations Quotidiennes</span>
          {phase === 2 && <span>Verset {currentVerseIndex + 1} sur {verses.length}</span>}
          {phase !== 2 && <span>Étape {phase === 1 ? "1" : "3"} sur 3</span>}
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={cn(
                "h-full flex-1 transition-all duration-500 border-r last:border-0 border-white",
                phase >= step ? (phase === 2 ? "bg-purple-500" : "bg-indigo-600") : "bg-slate-200"
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {phase === 1 && (
            <motion.div
              key="phase1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-8 flex flex-col items-center"
            >
              <Manny mood="praying" size={170} />

              {welcomeMessage && (
                <div className="text-center bg-indigo-50/50 border border-indigo-100/50 text-indigo-800 p-4 px-6 rounded-2xl text-sm font-extrabold max-w-md shadow-sm">
                  {welcomeMessage}
                </div>
              )}

              <div className="text-center space-y-3">
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
                  Proclamations du Jour
                </h1>
                <p className="text-slate-500 font-medium max-w-md mx-auto text-sm leading-relaxed">
                  Confesse à voix haute ces paroles puissantes avec foi et conviction. Déclarer la Parole fortifie ton esprit et renouvelle tes pensées.
                </p>
              </div>

              <div className="w-full bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-lg space-y-4">
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider border-b pb-2 mb-3">
                  Tes {verses.length} {verses.length <= 1 ? "déclaration" : "déclarations"} de foi :
                </h3>
                <div className="space-y-3">
                  {verses.map((verse, idx) => (
                    <div key={idx} className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-xl transition">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-650 flex items-center justify-center font-extrabold text-xs flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-700 text-sm">« {verse.text} »</p>
                        <span className="text-xs text-slate-400 font-medium">{verse.reference}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStartProclamations}
                className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-extrabold rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-base"
              >
                <Volume2 className="w-5 h-5" />
                Commencer les proclamations
              </button>
            </motion.div>
          )}

          {phase === 2 && (
            <motion.div
              key="phase2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="space-y-8 flex flex-col items-center"
            >
              <div className="flex justify-between w-full items-center">
                {/* Minuteur & Boutons de Contrôle */}
                <div className="flex items-center gap-3 bg-indigo-900/60 p-2 px-4 rounded-full border border-indigo-800">
                  <button 
                    onClick={() => setIsRunning(!isRunning)}
                    className="p-1 hover:text-white transition"
                    title={isRunning ? "Pause" : "Démarrer"}
                  >
                    {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <div className="h-4 w-px bg-indigo-800" />
                  <span className="text-sm font-black tracking-wider text-purple-300 w-12 text-center">
                    {timeLeft}s
                  </span>
                </div>

                <div className="text-xs font-extrabold uppercase text-purple-300 tracking-widest bg-purple-950/80 px-4 py-1.5 rounded-full border border-purple-900">
                  Verset {currentVerseIndex + 1} / {verses.length}
                </div>
              </div>

              {/* Barre de progression du minuteur */}
              <div className="w-full h-1.5 bg-indigo-900/50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                />
              </div>

              <div className="py-2">
                <Manny mood={getMannyMood()} size={170} />
              </div>

              {/* Conteneur principal de proclamation */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentVerseIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                  className="w-full bg-indigo-900/40 p-8 md:p-12 rounded-3xl border border-indigo-800/80 text-center space-y-6 shadow-xl backdrop-blur-sm"
                >
                  <blockquote className="text-2xl md:text-4xl font-black text-white tracking-tight leading-snug">
                    « {currentVerse.text} »
                  </blockquote>
                  <cite className="block text-sm font-bold text-indigo-300 uppercase tracking-widest not-italic">
                    — {currentVerse.reference}
                  </cite>
                </motion.div>
              </AnimatePresence>

              {/* Simulateur Audio Interactif */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={toggleListening}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3.5 rounded-2xl font-bold transition shadow-md",
                    isListening 
                      ? "bg-purple-600 hover:bg-purple-700 text-white animate-pulse" 
                      : "bg-indigo-900/80 hover:bg-indigo-850 text-indigo-200 border border-indigo-800"
                  )}
                >
                  {isListening ? (
                    <>
                      <Mic className="w-5 h-5 text-white animate-bounce" />
                      <span>Écoute active en cours...</span>
                    </>
                  ) : (
                    <>
                      <MicOff className="w-5 h-5 text-indigo-300" />
                      <span>Proclamer à voix haute</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-indigo-400 font-semibold max-w-xs text-center">
                  Confesse la vérité biblique de tout ton cœur et laisse-la s'enraciner.
                </p>
              </div>

              {/* Pied de carte interactif */}
              <div className="flex gap-4 w-full justify-center pt-4 border-t border-indigo-900/60">
                <button
                  onClick={handleTriggerAbandon}
                  className="px-6 py-3 bg-indigo-950 text-indigo-300 border border-indigo-900/60 rounded-xl hover:bg-indigo-900/50 font-bold transition-all text-sm"
                >
                  Abandonner
                </button>

                <button
                  onClick={handleNextVerse}
                  disabled={!canGoNext}
                  className={cn(
                    "flex items-center gap-2 px-8 py-3.5 font-extrabold rounded-xl transition-all shadow-lg text-sm",
                    canGoNext 
                      ? "bg-purple-500 text-white hover:bg-purple-650 cursor-pointer" 
                      : "bg-indigo-900/50 text-indigo-400 cursor-not-allowed border border-indigo-800/20"
                  )}
                >
                  {currentVerseIndex < verses.length - 1 ? (
                    <>
                      Verset suivant ({timeLeft > 20 ? `${timeLeft - 20}s` : "Prêt"})
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Finaliser et Célébrer ({timeLeft > 20 ? `${timeLeft - 20}s` : "Prêt"})
                      <Sparkles className="w-4 h-4 fill-white/10" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {phase === 3 && sessionResult && (
            <motion.div
              key="phase3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="space-y-8 flex flex-col items-center"
            >
              <Manny mood="celebrating" size={185} />

              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                  Proclamations terminées ! 🎉
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
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 mb-2">
                    <Flame className="w-6 h-6 fill-orange-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Série actuelle</span>
                  <span className="text-3xl font-black text-orange-500">{sessionResult.streak} {sessionResult.streak <= 1 ? "jour" : "jours"}</span>
                  <p className="text-xs font-semibold text-slate-400 mt-1">Série active et brûlante 🔥</p>
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
                  <h4 className="font-black text-lg tracking-tight">NOUVEAU NIVEAU ATTEINT ! 🎉</h4>
                  <p className="text-sm font-extrabold">
                    {getMannyMessage("level_up", userName, sessionResult.streak)}
                  </p>
                </motion.div>
              )}

              {sessionResult.newBadges.length > 0 && (
                <div className="w-full space-y-3 text-center">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Nouveaux Badges obtenus !</h4>
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
        </AnimatePresence>
      </div>

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
              
              <div className="space-y-2 text-slate-800">
                <h3 className="text-xl font-black text-slate-850">
                  Ne pars pas déjà ! 🙏
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
