"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Manny from "@/components/mascot/Manny";
import { cn } from "@/lib/utils";
import { BookOpen, Sparkles, Send, Award, Flame, CheckCircle, ArrowRight } from "lucide-react";
import { getMannyMessage } from "@/lib/mannyMessages";
import * as sounds from "@/lib/sounds";

import { getDailyVerse, Verse as DailyVerseType } from "@/lib/verses";

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

export default function MeditatePage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [meditation, setMeditation] = useState("");
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({
    situation: "",
    truth: "",
    decision: "",
  });
  const [dailyVerse, setDailyVerse] = useState<DailyVerseType | null>(null);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  // Données utilisateur pour messages personnalisés
  const [userName, setUserName] = useState("Ami");
  const [streakCount, setStreakCount] = useState(0);

  // Modal d'abandon
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [abandonMessage, setAbandonMessage] = useState("");

  // Messages dynamiques de Manny par étape
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");

  useEffect(() => {
    // Initialiser le verset du jour
    setDailyVerse(getDailyVerse());

    // Récupérer le nom et le streak de l'utilisateur
    fetch("/api/user/progress")
      .then((res) => res.json())
      .then((data) => {
        const name = data.userName || "Ami";
        const streak = data.streak?.currentStreak || 0;
        setUserName(name);
        setStreakCount(streak);
        
        // Initialiser les messages avec les vraies données
        setWelcomeMessage(getMannyMessage("welcome", name, streak));
      })
      .catch((err) => {
        console.warn("Failed to fetch user data for messages:", err);
        setWelcomeMessage(getMannyMessage("welcome", "Ami", 0));
      });
  }, []);

  const handleStartMeditation = async () => {
    sounds.playSessionStart();
    setCurrentStep(2);
    setLoading(true);
    setError("");

    // Choisir un message de chargement dynamique
    setLoadingMessage(getMannyMessage("loading", userName, streakCount));

    try {
      const res = await fetch("/api/meditation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verse: dailyVerse?.text || "Je puis tout par celui qui me fortifie.",
          reference: dailyVerse?.reference || "Philippiens 4:13",
          theme: dailyVerse?.theme || "Foi",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible de générer la méditation.");
      }

      setMeditation(data.meditation);
      sounds.playSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de l'appel IA.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSession = async () => {
    setLoading(true);
    setError("");

    try {
      const journalNotes = `1. Situation : ${answers.situation}\n2. Vérité : ${answers.truth}\n3. Décision : ${answers.decision}`;

      const res = await fetch("/api/session/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "classic",
          notes: journalNotes 
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible de finaliser la session.");
      }

      setSessionResult(data);
      setCurrentStep(4);
      
      // Jouer les sons de réussite et de montée de niveau
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
    setCurrentStep(1);
    setMeditation("");
    setAnswers({ situation: "", truth: "", decision: "" });
  };

  return (
    <div className={cn(
      "w-full max-w-4xl mx-auto rounded-3xl p-6 md:p-10 transition-all duration-700 min-h-[80vh] flex flex-col justify-between space-y-8 relative",
      currentStep === 1 && "bg-transparent",
      currentStep === 2 && "bg-slate-950 text-slate-100 shadow-2xl border border-slate-900",
      currentStep === 3 && "bg-transparent",
      currentStep === 4 && "bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-yellow-500/5 border border-amber-500/20 shadow-2xl"
    )}>
      <div className="w-full">
        <div className="flex justify-between items-center mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <span>Session de méditation</span>
          <span>Étape {currentStep} sur 4</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
          {[1, 2, 3, 4].map((step) => (
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

      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-8 flex flex-col items-center"
            >
              <Manny mood="happy" size={120} />
              
              {welcomeMessage && (
                <div className="text-center bg-indigo-50/50 border border-indigo-100/50 text-indigo-800 p-4 px-6 rounded-2xl text-sm font-extrabold max-w-md shadow-sm">
                  {welcomeMessage}
                </div>
              )}

              <div className="w-full bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-lg text-center space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <BookOpen className="w-24 h-24" />
                </div>
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-extrabold text-xs uppercase tracking-wider rounded-full">
                  Thème : {dailyVerse?.theme || "Foi"}
                </span>
                <blockquote className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-snug">
                  « {dailyVerse?.text || "Je puis tout par celui qui me fortifie."} »
                </blockquote>
                <cite className="block text-sm font-bold text-slate-400 uppercase tracking-widest not-italic">
                  — {dailyVerse?.reference || "Philippiens 4:13"}
                </cite>
              </div>

              <button
                onClick={handleStartMeditation}
                className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-extrabold rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-base animate-pulse"
              >
                <Sparkles className="w-5 h-5 fill-white/10" />
                Commencer la méditation
              </button>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center space-y-6 py-12">
                  <Manny mood="thinking" size={130} />
                  <div className="text-center space-y-3">
                    <h3 className="text-xl font-black text-slate-100 tracking-tight">
                      {loadingMessage}
                    </h3>
                    <p className="text-slate-400 font-medium text-sm animate-pulse max-w-xs">
                      Je puise dans les profondeurs de l'Écriture pour éclairer ton chemin.
                    </p>
                  </div>
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : error ? (
                <div className="bg-rose-950/40 border border-rose-900/60 p-8 rounded-2xl text-center space-y-4 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-rose-400">Une erreur est survenue</h3>
                  <p className="text-rose-300 text-sm font-semibold">{error}</p>
                  <button
                    onClick={handleStartMeditation}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-sm shadow-md"
                  >
                    Réessayer la génération
                  </button>
                </div>
              ) : (
                <div className="space-y-6 flex flex-col items-center">
                  <Manny mood="happy" size={80} />
                  <div className="bg-slate-900 text-white p-8 md:p-10 rounded-3xl shadow-xl space-y-6 border border-slate-800 relative">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                      <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-300">Méditation inspirée par l'IA</h3>
                    </div>
                    <p className="leading-relaxed text-slate-100 font-medium text-justify whitespace-pre-line text-base md:text-lg">
                      {meditation}
                    </p>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handleTriggerAbandon}
                      className="px-6 py-3.5 bg-slate-900 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-xl font-bold transition-all text-sm"
                    >
                      Abandonner
                    </button>
                    <button
                      onClick={() => {
                        sounds.playSuccess();
                        setCurrentStep(3);
                      }}
                      className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-extrabold rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Continuer
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 flex flex-col items-center"
            >
              <Manny mood="encouraging" size={100} />
              <h2 className="text-2xl font-black text-slate-800 tracking-tight text-center">
                Prends un moment pour ton Journal Intime
              </h2>
              <p className="text-slate-400 font-semibold text-xs text-center max-w-sm">
                Écris tes réflexions pour ancrer la vérité du verset dans ta vie pratique
              </p>

              <div className="w-full space-y-6 mt-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                  <label className="text-sm font-bold text-slate-700">
                    1. Comment ce verset parle-t-il à ta situation actuelle ?
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Écris ta réflexion ici..."
                    value={answers.situation}
                    onChange={(e) => setAnswers({ ...answers, situation: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                  <label className="text-sm font-bold text-slate-700">
                    2. Quelle vérité Dieu veut-il t'enseigner aujourd'hui ?
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Écris ta réflexion ici..."
                    value={answers.truth}
                    onChange={(e) => setAnswers({ ...answers, truth: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                  <label className="text-sm font-bold text-slate-700">
                    3. Quelle décision concrète vas-tu prendre suite à cette méditation ?
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Écris ta réflexion ici..."
                    value={answers.decision}
                    onChange={(e) => setAnswers({ ...answers, decision: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleTriggerAbandon}
                  className="flex items-center gap-2 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm shadow-sm"
                >
                  Abandonner
                </button>
                <button
                  onClick={handleCompleteSession}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? "Validation..." : "Terminer la session"}
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && sessionResult && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="space-y-8 flex flex-col items-center"
            >
              <Manny mood="celebrating" size={130} />

              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                  Session validée ! 🎉
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
                  <h4 className="font-black text-lg tracking-tight">FÉLICITATIONS ! 🎉 NIVEAU SUPÉRIEUR</h4>
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
              <Manny mood="encouraging" size={120} />
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800">
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
