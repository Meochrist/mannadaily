"use client";

import React, { useState } from "react";
import { 
  Calendar, 
  BookOpen, 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Check, 
  Loader2, 
  Award,
  Sparkles,
  Bell,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as sounds from "@/lib/sounds";
import Manny from "@/components/mascot/Manny";
import Link from "next/link";

interface Reading {
  id: string;
  book: string;
  bookNumber: number;
  chapter: number;
}

interface Day {
  id: string;
  dayNumber: number;
  title: string | null;
  readings: Reading[];
}

interface Enrollment {
  id: string;
  planId: string;
  currentDay: number;
  completed: boolean;
  completedAt: Date | string | null;
}

interface Progress {
  id: string;
  planId: string;
  dayNumber: number;
}

interface ReadingPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  duration: number;
  category: string;
  days: Day[];
  enrollments?: Enrollment[];
}

interface ReadingPlansClientProps {
  initialPlans: ReadingPlan[];
  initialEnrollments: Enrollment[];
  initialProgress: Progress[];
  initialReadingReminders: boolean;
  initialNotificationTime: string;
}

export default function ReadingPlansClient({
  initialPlans,
  initialEnrollments,
  initialProgress,
  initialReadingReminders,
  initialNotificationTime
}: ReadingPlansClientProps) {
  const [plans, setPlans] = useState<ReadingPlan[]>(initialPlans);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(initialEnrollments);
  const [progress, setProgress] = useState<Progress[]>(initialProgress);
  
  // Preferences states
  const [readingReminders, setReadingReminders] = useState(initialReadingReminders);
  const [notificationTime, setNotificationTime] = useState(initialNotificationTime);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState<string | null>(null);
  
  // UI states
  const [enrollingPlanId, setEnrollingPlanId] = useState<string | null>(null);
  const [updatingProgressDay, setUpdatingProgressDay] = useState<number | null>(null);
  const [celebration, setCelebration] = useState<{ active: boolean; xp: number; newLevel?: string } | null>(null);

  // Trouver le plan actif (le premier inscrit non complété)
  const activeEnrollment = enrollments.find(e => !e.completed);
  const activePlan = activeEnrollment ? plans.find(p => p.id === activeEnrollment.planId) : null;

  // Obtenir les lectures pour le jour actuel du plan actif
  const activePlanDay = activePlan && activeEnrollment
    ? activePlan.days.find(d => d.dayNumber === activeEnrollment.currentDay)
    : null;

  // Vérifier si un jour spécifique d'un plan est déjà complété
  const isDayCompleted = (planId: string, dayNumber: number) => {
    return progress.some(p => p.planId === planId && p.dayNumber === dayNumber);
  };

  // Calculer la progression d'un plan en pourcentage
  const getPlanProgressPercent = (plan: ReadingPlan) => {
    const enrollment = enrollments.find(e => e.planId === plan.id);
    if (!enrollment) return 0;
    if (enrollment.completed) return 100;
    
    // Compter le nombre de jours validés
    const completedDaysCount = progress.filter(p => p.planId === plan.id).length;
    return Math.min(100, Math.round((completedDaysCount / plan.duration) * 100));
  };

  // S'inscrire à un plan
  const handleEnroll = async (planId: string) => {
    setEnrollingPlanId(planId);
    try {
      const res = await fetch("/api/reading-plans/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId })
      });

      if (res.ok) {
        sounds.playSuccess();
        const data = await res.json();
        
        // Mettre à jour l'inscription localement
        setEnrollments(prev => {
          // Désactiver d'autres inscriptions actives
          const cleaned = prev.map(e => ({ ...e, completed: true })); // ou simplement filtrer/remplacer
          const index = cleaned.findIndex(e => e.planId === planId);
          if (index !== -1) {
            cleaned[index] = data.enrollment;
            return cleaned;
          }
          return [...cleaned, data.enrollment];
        });

        // Vider la progression locale de ce plan
        setProgress(prev => prev.filter(p => p.planId !== planId));
      }
    } catch (err) {
      console.error("Error enrolling in plan:", err);
    } finally {
      setEnrollingPlanId(null);
    }
  };

  // Valider le jour actuel
  const handleCompleteDay = async (planId: string, dayNumber: number) => {
    setUpdatingProgressDay(dayNumber);
    try {
      const res = await fetch("/api/reading-plans/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, dayNumber })
      });

      if (res.ok) {
        sounds.playXPGain();
        const data = await res.json();

        // Enregistrer la progression localement
        setProgress(prev => [...prev, { id: Math.random().toString(), planId, dayNumber }]);

        // Mettre à jour l'inscription
        setEnrollments(prev => prev.map(e => {
          if (e.planId === planId) {
            return {
              ...e,
              currentDay: data.currentDay,
              completed: data.completed,
              completedAt: data.completed ? new Date().toISOString() : null
            };
          }
          return e;
        }));

        // Lancer la célébration des XP
        setCelebration({
          active: true,
          xp: data.xpEarned,
          newLevel: data.leveledUp ? data.levelName : undefined
        });

        setTimeout(() => {
          setCelebration(null);
        }, 4000);
      }
    } catch (err) {
      console.error("Error updating progress:", err);
    } finally {
      setUpdatingProgressDay(null);
    }
  };

  // Sauvegarder les préférences de rappel
  const handleSavePreferences = async (reminders: boolean, time: string) => {
    setSavingPreferences(true);
    setPreferencesMessage(null);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readingReminders: reminders, notificationTime: time })
      });
      if (res.ok) {
        setPreferencesMessage("Préférences enregistrées avec succès !");
        setTimeout(() => setPreferencesMessage(null), 3000);
      } else {
        setPreferencesMessage("Erreur lors de l'enregistrement des préférences.");
      }
    } catch (err) {
      console.error("Error saving preferences:", err);
      setPreferencesMessage("Erreur réseau.");
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      
      {/* XP/Level Up Celebration Overlay */}
      {celebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/40 backdrop-blur-sm pointer-events-none">
          <div className="bg-white border-2 border-indigo-200 rounded-3xl p-8 shadow-2xl text-center max-w-sm mx-4 animate-bounce">
            <Award className="w-16 h-16 text-yellow-500 mx-auto mb-3 animate-spin" />
            <h3 className="text-xl font-black text-slate-800">Félicitations !</h3>
            <p className="text-sm text-slate-600 mt-2 font-medium">
              Vous avez validé votre lecture et gagné <span className="text-indigo-600 font-extrabold">+{celebration.xp} XP</span>.
            </p>
            {celebration.newLevel && (
              <div className="mt-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-extrabold px-4 py-2 rounded-2xl text-xs uppercase tracking-wider">
                Nouveau niveau : {celebration.newLevel} 🎉
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. Header & Manny Greeting */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-28 h-28 flex-shrink-0 relative">
          <Manny mood="encouraging" size={110} />
        </div>
        <div className="space-y-2 text-center md:text-left flex-1">
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            Compagnon Manny
          </span>
          <h2 className="text-lg font-black text-slate-850">
            {activePlan 
              ? `« Bravo ! Tu es au jour ${activeEnrollment?.currentDay} de ton plan de lecture. »`
              : "« Choisis un plan pour te nourrir chaque jour de la Parole de Dieu. La régularité fortifie la foi ! »"
            }
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Mettez en place une discipline spirituelle solide. Chaque jour complété vous rapporte **10 XP** et vous rapproche d'une maîtrise complète des Écritures.
          </p>
        </div>
      </div>

      {/* 2. Active Study Day Card */}
      {activePlan && activeEnrollment && activePlanDay && (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-white border border-indigo-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-indigo-100/60 pb-4">
            <div>
              <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest block">Plan Actif</span>
              <h3 className="text-lg font-extrabold text-slate-800">{activePlan.name}</h3>
            </div>
            <div className="bg-indigo-600 text-white font-black px-3.5 py-1.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm">
              <Calendar className="w-3.5 h-3.5" />
              Jour {activeEnrollment.currentDay} sur {activePlan.duration}
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              Lectures d'aujourd'hui :
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activePlanDay.readings.map((reading) => (
                <Link
                  key={reading.id}
                  href={`/bible?book=${encodeURIComponent(reading.book)}&chapter=${reading.chapter}`}
                  className="bg-white border border-slate-150 rounded-2xl p-4 flex items-center justify-between hover:border-indigo-300 hover:shadow-md transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-800 group-hover:text-indigo-650 transition-colors">
                        {reading.book} {reading.chapter}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        Cliquer pour lire le chapitre
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition" />
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-indigo-100/60 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="w-full sm:w-1/2">
              <div className="flex justify-between text-[10px] font-black text-indigo-600 mb-1.5 uppercase">
                <span>Progression du plan</span>
                <span>{getPlanProgressPercent(activePlan)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/55">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500" 
                  style={{ width: `${getPlanProgressPercent(activePlan)}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => handleCompleteDay(activePlan.id, activeEnrollment.currentDay)}
              disabled={updatingProgressDay === activeEnrollment.currentDay}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs transition-all hover:scale-103 shadow-md flex items-center justify-center gap-2 disabled:bg-slate-350 cursor-pointer"
            >
              {updatingProgressDay === activeEnrollment.currentDay ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validation...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-indigo-200" />
                  Marquer comme lu (+10 XP)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. Grid of all Reading Plans */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
          Découvrez nos Plans de Lecture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const enrollment = enrollments.find(e => e.planId === plan.id);
            const isEnrolled = !!enrollment;
            const isCompleted = enrollment?.completed || false;
            const progressPercent = getPlanProgressPercent(plan);

            // Style dynamique par catégorie
            const getCategoryStyle = (cat: string) => {
              switch (cat) {
                case "full_bible":
                  return "bg-indigo-50 text-indigo-700 border-indigo-100";
                case "nt_only":
                  return "bg-emerald-50 text-emerald-700 border-emerald-100";
                case "psaumes":
                case "psalms":
                  return "bg-amber-50 text-amber-700 border-amber-100";
                default:
                  return "bg-blue-50 text-blue-700 border-blue-100";
              }
            };

            return (
              <div 
                key={plan.id}
                className={cn(
                  "bg-white border rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between gap-5 relative overflow-hidden",
                  isEnrolled ? "border-indigo-150 shadow-sm" : "border-slate-100 hover:border-slate-200 hover:shadow-md"
                )}
              >
                {/* Ribbon active / completed */}
                {isEnrolled && (
                  <div className={cn(
                    "absolute top-0 right-0 text-[9px] font-black px-3.5 py-1 rounded-bl-2xl uppercase tracking-wider text-white",
                    isCompleted ? "bg-emerald-500" : "bg-indigo-600 animate-pulse"
                  )}>
                    {isCompleted ? "Complété" : "Actif"}
                  </div>
                )}

                <div className="space-y-3">
                  {/* Category badge & Duration */}
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border", getCategoryStyle(plan.category))}>
                      {plan.category === "full_bible" ? "Bible Entière" : plan.category === "nt_only" ? "Nouveau Testament" : "Thématique"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-extrabold">
                      {plan.duration} jours
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-800">{plan.name}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      {plan.description}
                    </p>
                  </div>
                </div>

                {/* Progress bar or action button */}
                <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                  {isEnrolled && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase">
                        <span>Progression</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            isCompleted ? "bg-emerald-500" : "bg-indigo-600"
                          )}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    {isCompleted ? (
                      <button
                        onClick={() => handleEnroll(plan.id)}
                        disabled={enrollingPlanId === plan.id}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-extrabold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1"
                      >
                        {enrollingPlanId === plan.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Recommencer"}
                      </button>
                    ) : isEnrolled ? (
                      <button
                        disabled
                        className="bg-indigo-50 text-indigo-700 border border-indigo-100 font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" /> Plan en cours
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(plan.id)}
                        disabled={enrollingPlanId === plan.id}
                        className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition shadow-sm hover:scale-102 cursor-pointer flex items-center gap-1.5"
                      >
                        {enrollingPlanId === plan.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Inscription...
                          </>
                        ) : (
                          <>
                            Commencer
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Notification Preferences */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-650">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Mes préférences de rappel</h3>
            <p className="text-xs text-slate-400">Configurez vos notifications pour ne rater aucune lecture.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 block">
              Recevoir des rappels pour mes plans de lecture
            </label>
            <p className="text-xs text-slate-400 max-w-md font-medium">
              Nous vous enverrons un e-mail et une notification push à l'heure choisie si vous n'avez pas validé votre lecture du jour.
            </p>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => {
                const newValue = !readingReminders;
                setReadingReminders(newValue);
                handleSavePreferences(newValue, notificationTime);
              }}
              disabled={savingPreferences}
              className={cn(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                readingReminders ? "bg-indigo-650" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  readingReminders ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        {readingReminders && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-4 border-t border-slate-50">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 block">
                Heure de rappel
              </label>
              <p className="text-xs text-slate-400 max-w-md font-medium">
                Sélectionnez le moment de la journée le plus propice à votre étude quotidienne.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <select
                value={notificationTime}
                onChange={(e) => {
                  const newTime = e.target.value;
                  setNotificationTime(newTime);
                  handleSavePreferences(readingReminders, newTime);
                }}
                disabled={savingPreferences}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="07:00">Matin (7h00)</option>
                <option value="12:00">Midi (12h00)</option>
                <option value="19:00">Soirée (19h00)</option>
                <option value="21:00">Dernier appel (21h00)</option>
              </select>
            </div>
          </div>
        )}

        {preferencesMessage && (
          <div className={cn(
            "text-xs font-bold px-4 py-2.5 rounded-xl border transition-all text-center",
            preferencesMessage.includes("succès") 
              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
              : "bg-rose-50 text-rose-700 border-rose-100"
          )}>
            {preferencesMessage}
          </div>
        )}
      </div>

    </div>
  );
}
