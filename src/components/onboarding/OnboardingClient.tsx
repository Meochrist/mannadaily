"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ArrowLeft, Check, BookOpen, Heart, Calendar, Trophy, Award, Settings, Bell, ShieldAlert, BadgeCheck, Loader2 } from "lucide-react";
import { THEMES } from "@/types";
import * as sounds from "@/lib/sounds";
import Manny from "@/components/mascot/Manny";
import Samson from "@/components/mascot/Samson";
import Esther from "@/components/mascot/Esther";
import Gedeon from "@/components/mascot/Gedeon";
import Noe from "@/components/mascot/Noe";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface OnboardingClientProps {
  userId: string;
  userName: string;
}

interface ReadingPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  duration: number;
  category: string;
}

const mascotList = [
  { id: "manny", name: "Manny", desc: "Doux & Apaisant", longDesc: "Manny t'accompagne avec bienveillance et t'encourage à méditer paisiblement chaque jour.", component: Manny },
  { id: "samson", name: "Samson", desc: "Guerrier & Intense", longDesc: "Samson ne tolère aucun skip ! Il te pousse à bout de force de foi pour forger ton esprit.", component: Samson },
  { id: "esther", name: "Esther", desc: "Dignité & Noblesse", longDesc: "Esther t'aide à cultiver une discipline et une prestance dignes de ton héritage royal.", component: Esther },
  { id: "gedeon", name: "Gédéon", desc: "Passionné & Vigilant", longDesc: "Gédéon stresse un peu pour toi, mais il célèbre chaque victoire avec une joie débordante !", component: Gedeon },
  { id: "noe", name: "Noé", desc: "Sagesse & Persévérance", longDesc: "Noé a le sens du cap et de la régularité. Il t'aide à bâtir tes habitudes planche par planche.", component: Noe }
];

export default function OnboardingClient({ userId, userName }: OnboardingClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMascot, setSelectedMascot] = useState<string>("manny");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Plans de lecture dynamiques
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Charger les plans de lecture depuis l'API
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/reading-plans");
        if (res.ok) {
          const data = await res.json();
          setPlans(data.plans || []);
        }
      } catch (err) {
        console.error("Error loading plans:", err);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  // Déclencher les sons à l'étape 5
  useEffect(() => {
    if (currentStep === 5) {
      sounds.playLevelUp();
      const timer = setTimeout(() => {
        sounds.playBadgeEarned();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleStepComplete = () => {
    sounds.playStepComplete();
    setCurrentStep(prev => prev + 1);
  };

  const handleStepBack = () => {
    sounds.playCorrect();
    setCurrentStep(prev => prev - 1);
  };

  const toggleTheme = (slug: string) => {
    sounds.playCorrect();
    setSelectedThemes(prev => {
      if (prev.includes(slug)) {
        return prev.filter(t => t !== slug);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), slug]; // Limite à 3 thèmes en faisant tourner le plus ancien
      }
      return [...prev, slug];
    });
  };

  const handleFinishOnboarding = async () => {
    setSaving(true);
    try {
      // 1. Sauvegarder les préférences de l'utilisateur (mascotte, thèmes favoris, onboardingCompleted)
      const prefRes = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          favoriteMascot: selectedMascot,
          favoriteThemes: selectedThemes,
          onboardingCompleted: true
        })
      });

      // 2. Si un plan a été sélectionné, inscrire l'utilisateur
      if (selectedPlan) {
        await fetch("/api/reading-plans/enroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: selectedPlan })
        });
      }

      if (prefRes.ok) {
        sounds.playSuccess();
        router.push("/meditate");
        router.refresh();
      }
    } catch (err) {
      console.error("Error completing onboarding:", err);
    } finally {
      setSaving(false);
    }
  };

  // Obtenir le message de la mascotte à l'étape 5
  const getMascotMessage = () => {
    switch (selectedMascot) {
      case "noe":
        return `« L'arche de ta croissance spirituelle est prête, ${userName}. Entrons-y ensemble et laissons la Parole guider notre traversée quotidienne. Aucun déluge ne pourra nous ébranler. »`;
      case "samson":
        return `« PRÉPARE-TOI AU COMBAT, ${userName.toUpperCase()} ! Pas de skip, pas de faiblesse. On va forger une foi en titane et écraser tous tes records de méditation. C'est l'heure de briser tes limites ! »`;
      case "esther":
        return `« Ta place est prête dans la cour céleste, cher(e) ${userName}. Que la sagesse et la grâce président à chacune de tes méditations quotidiennes. Montrons-nous dignes du trône. »`;
      case "gedeon":
        return `« C'est incroyable, ${userName} ! Tout est configuré et prêt à l'emploi ! Plus aucun risque d'oublier ta méditation ! J'ai tellement hâte de fêter tes victoires avec toi, c'est parti ! »`;
      case "manny":
      default:
        return `« Je suis si heureux de commencer ce voyage à tes côtés, ${userName}... Que la Parole de Dieu soit notre pain et notre paix chaque matin. Viens, marchons ensemble vers Sa lumière. »`;
    }
  };

  const activeMascotInfo = mascotList.find(m => m.id === selectedMascot) || mascotList[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-6 px-4 sm:px-6 relative overflow-hidden select-none">
      
      {/* 1. PROGRESS BAR */}
      <div className="max-w-2xl w-full mx-auto space-y-3 flex-shrink-0">
        <div className="flex justify-between items-center text-[10px] font-black text-indigo-600 uppercase tracking-widest">
          <span>Étape {currentStep} sur 5</span>
          <span>
            {currentStep === 1 && "Bienvenue"}
            {currentStep === 2 && "Compagnon"}
            {currentStep === 3 && "Thèmes"}
            {currentStep === 4 && "Plan d'étude"}
            {currentStep === 5 && "Célébration"}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-650 to-indigo-850 rounded-full"
            initial={{ width: "20%" }}
            animate={{ width: `${currentStep * 20}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* 2. MAIN INTERACTIVE CARD */}
      <div className="flex-1 flex items-center justify-center my-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl max-w-2xl w-full min-h-[460px] flex flex-col justify-between gap-6 relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: WELCOME */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center text-center space-y-6 flex-1 justify-center"
              >
                <div className="w-40 h-40 relative flex items-center justify-center">
                  <Manny mood="excited" size={150} />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    Félicitations
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                    Bienvenue dans MannaDaily !
                  </h1>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium max-w-sm">
                    L'application qui transforme ta méditation et ton étude de la Bible en une aventure spirituelle quotidienne et stimulante.
                  </p>
                </div>
                
                <button
                  onClick={handleStepComplete}
                  className="bg-indigo-650 hover:bg-indigo-700 text-white font-black px-8 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all hover:scale-103 shadow-md flex items-center gap-2 mt-4 cursor-pointer"
                >
                  Commencer mon aventure
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* STEP 2: MASCOT SELECTION */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex flex-col justify-between flex-1 gap-6"
              >
                <div className="space-y-1.5 text-center">
                  <h2 className="text-lg font-black text-slate-800">
                    Choisis ton compagnon de route 🤝
                  </h2>
                  <p className="text-slate-400 text-xs font-medium">
                    Chaque compagnon a sa propre personnalité et saura t'encourager à sa manière.
                  </p>
                </div>

                {/* Grid of mascots */}
                <div className="grid grid-cols-5 gap-1.5 sm:gap-3 items-end justify-center py-4 border-b border-slate-50">
                  {mascotList.map((m) => {
                    const MascotComponent = m.component;
                    const isSelected = selectedMascot === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          sounds.playCorrect();
                          setSelectedMascot(m.id);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 focus:outline-none cursor-pointer transition-all duration-300 rounded-2xl py-2",
                          isSelected ? "bg-indigo-50/70 scale-105" : "hover:bg-slate-50"
                        )}
                      >
                        <motion.div
                          animate={isSelected ? { y: [0, -10, 0] } : {}}
                          transition={{ repeat: isSelected ? Infinity : 0, duration: 1.5, repeatType: "reverse" }}
                          className="w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center"
                        >
                          <MascotComponent mood={isSelected ? "excited" : "happy"} size={64} />
                        </motion.div>
                        <span className={cn("text-[9px] sm:text-xs font-black", isSelected ? "text-indigo-750 font-black" : "text-slate-500")}>
                          {m.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected mascot description */}
                <div className="bg-slate-50 rounded-2xl p-4 flex gap-4 items-center border border-slate-100 flex-1 justify-center min-h-[100px]">
                  <div className="w-14 h-14 relative flex-shrink-0 flex items-center justify-center">
                    {React.createElement(activeMascotInfo.component, { mood: "encouraging", size: 60 })}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] bg-indigo-100 text-indigo-850 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {activeMascotInfo.desc}
                    </span>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed">
                      {activeMascotInfo.longDesc}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-4 mt-2">
                  <button
                    onClick={handleStepBack}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-extrabold px-5 py-3 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </button>
                  <button
                    onClick={handleStepComplete}
                    className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all hover:scale-102 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    Choisir {activeMascotInfo.name} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: THEME SELECTION */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex flex-col justify-between flex-1 gap-6"
              >
                <div className="space-y-1.5 text-center">
                  <h2 className="text-lg font-black text-slate-800">
                    Quels thèmes t'intéressent ? (1 à 3) 🎯
                  </h2>
                  <p className="text-slate-400 text-xs font-medium">
                    Nous adapterons tes versets et méditations de départ selon tes préférences.
                  </p>
                </div>

                {/* Grid of themes */}
                <div className="grid grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {THEMES.map((theme) => {
                    const isSelected = selectedThemes.includes(theme.slug);
                    return (
                      <button
                        key={theme.slug}
                        onClick={() => toggleTheme(theme.slug)}
                        className={cn(
                          "border-2 text-left p-3.5 rounded-2xl flex items-center justify-between transition-all duration-300 cursor-pointer",
                          isSelected 
                            ? `bg-gradient-to-r ${theme.color} text-white border-transparent shadow-md scale-102` 
                            : "bg-white border-slate-100 text-slate-700 hover:border-slate-200 hover:bg-slate-50/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{theme.emoji}</span>
                          <span className="text-xs font-black">{theme.name}</span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center gap-4 mt-2">
                  <button
                    onClick={handleStepBack}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-extrabold px-5 py-3 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </button>
                  <button
                    onClick={handleStepComplete}
                    disabled={selectedThemes.length === 0}
                    className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all hover:scale-102 disabled:bg-slate-200 disabled:text-slate-450 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    Continuer <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: READING PLAN SELECTION */}
            {currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex flex-col justify-between flex-1 gap-6"
              >
                <div className="space-y-1.5 text-center">
                  <h2 className="text-lg font-black text-slate-800">
                    Choisis ton plan de lecture de la Bible 📖
                  </h2>
                  <p className="text-slate-400 text-xs font-medium">
                    Prends l'habitude de parcourir les Saintes Écritures de manière régulière.
                  </p>
                </div>

                {/* Plans lists */}
                <div className="space-y-2.5 max-h-[270px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {loadingPlans ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                      <Loader2 className="w-8 h-8 text-indigo-650 animate-spin" />
                      <span className="text-xs text-slate-400 font-bold">Chargement des plans de lecture...</span>
                    </div>
                  ) : (
                    <>
                      {/* Cartes des plans */}
                      {plans.map((plan) => {
                        const isSelected = selectedPlan === plan.id;
                        return (
                          <button
                            key={plan.id}
                            onClick={() => {
                              sounds.playCorrect();
                              setSelectedPlan(plan.id);
                            }}
                            className={cn(
                              "w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex items-start gap-4 justify-between",
                              isSelected 
                                ? "border-indigo-600 bg-indigo-50/45 shadow-sm" 
                                : "border-slate-100 hover:border-slate-200 bg-white"
                            )}
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                                isSelected ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-500"
                              )}>
                                <Calendar className="w-4 h-4" />
                              </div>
                              <div className="space-y-1 flex-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-black text-slate-800">{plan.name}</span>
                                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{plan.duration} jours</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                  {plan.description}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                              </div>
                            )}
                          </button>
                        );
                      })}

                      {/* Option pas maintenant */}
                      <button
                        onClick={() => {
                          sounds.playCorrect();
                          setSelectedPlan(null);
                        }}
                        className={cn(
                          "w-full text-center p-3 rounded-2xl border-2 text-xs font-black uppercase tracking-wider transition cursor-pointer",
                          selectedPlan === null 
                            ? "border-indigo-600 bg-indigo-50/45 text-indigo-750" 
                            : "border-slate-100 hover:border-slate-200 bg-white text-slate-500"
                        )}
                      >
                        Pas maintenant, je commencerai plus tard
                      </button>
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center gap-4 mt-2">
                  <button
                    onClick={handleStepBack}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-extrabold px-5 py-3 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </button>
                  <button
                    onClick={handleStepComplete}
                    className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all hover:scale-102 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {selectedPlan ? "Choisir ce plan" : "Passer"} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: WRAP-UP */}
            {currentStep === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col justify-between flex-1 gap-6"
              >
                <div className="space-y-1.5 text-center">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Tout est prêt !
                  </span>
                  <h2 className="text-lg font-black text-slate-800">
                    Ton aventure MannaDaily commence ! 🎉
                  </h2>
                  <p className="text-slate-400 text-xs font-medium">
                    Voici le récapitulatif de tes choix de départ :
                  </p>
                </div>

                {/* Recap panel */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 relative flex-shrink-0 flex items-center justify-center">
                        {React.createElement(activeMascotInfo.component, { mood: "happy", size: 44 })}
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Mascotte</span>
                        <span className="text-xs font-black text-slate-850">{activeMascotInfo.name}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-650 flex-shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Plan d'étude</span>
                        <span className="text-xs font-black text-slate-850 truncate block">
                          {selectedPlan ? plans.find(p => p.id === selectedPlan)?.name : "Aucun"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1.5">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Thèmes choisis</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedThemes.map(slug => {
                        const theme = THEMES.find(t => t.slug === slug);
                        return theme ? (
                          <span key={slug} className={`text-[10px] font-black px-2.5 py-1 rounded-lg bg-gradient-to-r ${theme.color} text-white`}>
                            {theme.emoji} {theme.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>

                {/* Mascot message */}
                <div className="bg-indigo-50/50 rounded-3xl p-4 flex gap-4 items-start border border-indigo-100/50 min-h-[90px] relative">
                  <div className="w-12 h-12 relative flex-shrink-0 flex items-center justify-center">
                    {React.createElement(activeMascotInfo.component, { mood: "celebrating", size: 48 })}
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[9px] bg-indigo-150 text-indigo-850 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Message de {activeMascotInfo.name}
                    </span>
                    <p className="text-[10.5px] text-slate-650 font-semibold leading-relaxed italic">
                      {getMascotMessage()}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-4 mt-2">
                  <button
                    onClick={handleStepBack}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-extrabold px-5 py-3 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Retour
                  </button>
                  <button
                    onClick={handleFinishOnboarding}
                    disabled={saving}
                    className="bg-indigo-650 hover:bg-indigo-700 text-white font-black px-8 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all hover:scale-102 cursor-pointer flex items-center gap-1.5 shadow-md disabled:bg-slate-200"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        Commencer ma première méditation <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>

    </div>
  );
}
