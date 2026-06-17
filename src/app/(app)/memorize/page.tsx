"use client";

import React, { useState, useEffect } from "react";
import { 
  Brain, 
  Plus, 
  CheckCircle, 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  Award, 
  RotateCcw, 
  Check, 
  Volume2, 
  Calendar,
  Loader2,
  X,
  ChevronRight
} from "lucide-react";
import Manny from "@/components/mascot/Manny";
import * as sounds from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface VerseMemorization {
  id: string;
  reference: string;
  verseText: string;
  status: string;
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextReview: string;
}

export default function MemorizePage() {
  // Navigation & Écrans (1: List, 2: Session, 3: Success)
  const [screen, setScreen] = useState<1 | 2 | 3>(1);
  
  // États de données
  const [memorizations, setMemorizations] = useState<VerseMemorization[]>([]);
  const [mastered, setMastered] = useState<VerseMemorization[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulaire d'ajout
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReference, setNewReference] = useState("");
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);

  // Session de flashcards
  const [sessionCards, setSessionCards] = useState<VerseMemorization[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionReviews, setSessionReviews] = useState<number>(0);
  const [sessionNewMastered, setSessionNewMastered] = useState<number>(0);
  const [sessionXpEarned, setSessionXpEarned] = useState<number>(0);

  // Charger les données de mémorisation
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/memorize");
      if (res.ok) {
        const data = await res.json();
        setMemorizations(data.memorizations || []);
        setMastered(data.mastered || []);
      }
    } catch (err) {
      console.error("Error loading memorizations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Commencer la révision
  const startSession = () => {
    if (memorizations.length === 0) return;
    sounds.playSessionStart();
    setSessionCards([...memorizations]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionReviews(0);
    setSessionNewMastered(0);
    setSessionXpEarned(0);
    setScreen(2);
  };

  // Soumettre une notation
  const handleRateCard = async (quality: number) => {
    const activeCard = sessionCards[currentIndex];
    
    // Jouer le son approprié
    if (quality === 1) sounds.playAbandonWarning();
    else if (quality === 3) sounds.playCorrect();
    else if (quality === 4) sounds.playStepComplete();
    else if (quality === 5) sounds.playSuccess();

    try {
      const res = await fetch("/api/memorize/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verseId: activeCard.id, quality }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Mettre à jour les stats locales de la session
        setSessionReviews(prev => prev + 1);
        if (data.xpEarned > 0) {
          setSessionXpEarned(prev => prev + data.xpEarned);
          setSessionNewMastered(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error("Error rating card:", err);
    }

    // Passer à la carte suivante ou terminer
    if (currentIndex + 1 < sessionCards.length) {
      setIsFlipped(false);
      // Laisser un court délai pour l'animation flip de retour
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 300);
    } else {
      // Fin de la session
      setTimeout(() => {
        sounds.playLevelUp();
        setScreen(3);
        fetchData(); // Recharger la liste en arrière-plan
      }, 500);
    }
  };

  // Ajouter un nouveau verset
  const handleAddVerse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReference.trim() || !newText.trim()) return;

    setAdding(true);
    try {
      const res = await fetch("/api/memorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: newReference, verseText: newText }),
      });

      if (res.ok) {
        sounds.playSuccess();
        setNewReference("");
        setNewText("");
        setIsModalOpen(false);
        fetchData(); // Recharger la liste
      }
    } catch (err) {
      console.error("Error adding verse:", err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 space-y-8">
      {/* Balise style pour les effets de rotation 3D CSS */}
      <style>{`
        .flip-card {
          perspective: 1200px;
          height: 320px;
          width: 100%;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .flip-card.flipped .flip-card-inner {
          transform: rotateY(180deg);
        }
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          border-radius: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2.5rem 1.5rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
        }
        .flip-card-front {
          background-color: #ffffff;
          border: 2px dashed rgba(99, 102, 241, 0.15);
        }
        .flip-card-back {
          background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
          color: #ffffff;
          transform: rotateY(180deg);
          border: 2px solid #4338ca;
        }
      `}</style>

      {/* ÉCRAN 1 : LISTE DES VERSETS À RÉVISER */}
      {screen === 1 && (
        <div className="space-y-8">
          
          {/* Header */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="space-y-1.5 text-center sm:text-left">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center sm:justify-start gap-2">
                <Brain className="w-6 h-6 text-indigo-600" />
                Mémorisation Biblique
              </h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Mémorise la parole avec le système de répétition espacée (SM-2)
              </p>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-102"
            >
              <Plus className="w-4 h-4" /> Ajouter un verset
            </button>
          </div>

          {/* Corps principal : Manny et Lancement révision */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white border border-slate-100 rounded-3xl">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Chargement de tes fiches...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Lancement de session */}
              <div className="md:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[260px] relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-550/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="space-y-4">
                  <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Révision du Jour
                  </span>
                  
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-850">
                      {memorizations.length > 0 
                        ? `${memorizations.length} verset(s) à réviser aujourd'hui`
                        : "Aucune révision requise aujourd'hui 🎉"}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium max-w-md">
                      {memorizations.length > 0
                        ? "Prends quelques minutes pour ancrer ces paroles divines dans ton cœur et ton intelligence spirituelle."
                        : "Félicitations ! Tes flashcards sont toutes à jour. Tu peux ajouter de nouveaux versets à mémoriser pour continuer ton apprentissage."}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 mt-4 flex items-center justify-between">
                  <div className="flex gap-4 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-slate-350" />
                      {memorizations.length} à réviser
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-slate-350" />
                      {mastered.length} maîtrisés
                    </span>
                  </div>
                  
                  <button
                    onClick={startSession}
                    disabled={memorizations.length === 0}
                    className="bg-indigo-650 hover:bg-indigo-700 disabled:bg-slate-150 disabled:text-slate-400 text-white font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer hover:scale-102"
                  >
                    Commencer la révision
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Manny Companion */}
              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-24 h-24 relative flex items-center justify-center">
                  <Manny 
                    mood={memorizations.length > 0 ? "encouraging" : "happy"} 
                    size={100} 
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-indigo-600 font-black uppercase tracking-wider">Manny</span>
                  <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-[200px]">
                    {memorizations.length > 0
                      ? `« Une parole mémorisée est une arme dans le combat spirituel ! Révisons tes ${memorizations.length} versets ! »`
                      : "« Excellent travail ! Ta mémoire est affûtée et ton cœur est nourri de Sa vérité. »"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Versets maîtrisés (Mastered) */}
          {!loading && mastered.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-3">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3px]" />
                Versets maîtrisés ({mastered.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                {mastered.map((item) => (
                  <div key={item.id} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md uppercase tracking-wider inline-block">
                        Maîtrisé
                      </span>
                      <h4 className="text-xs font-black text-slate-800 mt-1">{item.reference}</h4>
                      <p className="text-xs font-medium text-slate-500 italic leading-relaxed">
                        « {item.verseText} »
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase pt-2 border-t border-slate-100/50">
                      <span>Répétitions : {item.repetitions}</span>
                      <span>Intervalle : {item.interval} j</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ÉCRAN 2 : SESSION DE FLASHCARDS */}
      {screen === 2 && sessionCards.length > 0 && (
        <div className="max-w-2xl mx-auto space-y-8 flex flex-col items-center">
          
          {/* Header de session (Barre de progression) */}
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <span>RÉVISION EN COURS</span>
              <span>{currentIndex + 1} sur {sessionCards.length}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / sessionCards.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Flashcard Container */}
          <div className={cn("flip-card", isFlipped && "flipped")}>
            <div className="flip-card-inner">
              
              {/* FACE (RECTO) */}
              <div className="flip-card-front">
                <div className="flex flex-col items-center justify-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Référence</span>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                    {sessionCards[currentIndex].reference}
                  </h3>
                </div>
                
                <button
                  onClick={() => setIsFlipped(true)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black py-3 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all self-center cursor-pointer shadow-sm"
                >
                  Voir le verset
                </button>
              </div>

              {/* DOS (VERSO) */}
              <div className="flip-card-back">
                <div className="flex flex-col items-center justify-between h-full">
                  <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">
                    {sessionCards[currentIndex].reference}
                  </span>
                  
                  <p className="text-base sm:text-lg font-bold italic leading-relaxed text-center px-4 overflow-y-auto max-h-[140px] flex-1 flex items-center justify-center my-4 scrollbar-thin scrollbar-thumb-white/20">
                    « {sessionCards[currentIndex].verseText} »
                  </p>
                  
                  <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-wide">
                    Note ton niveau de mémorisation ci-dessous
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Choix de notation (Uniquement visible si la carte est révélée) */}
          <div className="w-full min-h-[80px]">
            <AnimatePresence>
              {isFlipped && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="grid grid-cols-4 gap-2 w-full"
                >
                  {[
                    { label: "Oublié", quality: 1, emoji: "😰", color: "hover:bg-rose-50 border-rose-100 text-rose-700 bg-rose-50/20" },
                    { label: "Difficile", quality: 3, emoji: "😐", color: "hover:bg-amber-50 border-amber-100 text-amber-700 bg-amber-50/20" },
                    { label: "Bien", quality: 4, emoji: "😊", color: "hover:bg-blue-50 border-blue-100 text-blue-700 bg-blue-50/20" },
                    { label: "Parfait", quality: 5, emoji: "🌟", color: "hover:bg-emerald-50 border-emerald-100 text-emerald-700 bg-emerald-50/20" },
                  ].map((btn) => (
                    <button
                      key={btn.quality}
                      onClick={() => handleRateCard(btn.quality)}
                      className={cn(
                        "border rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all duration-300 hover:scale-103 shadow-sm",
                        btn.color
                      )}
                    >
                      <span className="text-xl sm:text-2xl">{btn.emoji}</span>
                      <span className="text-[9px] font-black uppercase tracking-wider">{btn.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}

      {/* ÉCRAN 3 : FIN DE SESSION (CÉLÉBRATION) */}
      {screen === 3 && (
        <div className="max-w-md mx-auto bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6 flex flex-col items-center">
          
          <div className="w-28 h-28 relative flex items-center justify-center">
            <Manny mood="celebrating" size={110} />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Session terminée !
            </span>
            <h2 className="text-xl font-black text-slate-850 tracking-tight mt-3">
              Excellent travail de mémorisation !
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
              Tu as ancré ces vérités divines dans ton esprit. Ta régularité fortifie ta foi.
            </p>
          </div>

          {/* Stats Box */}
          <div className="grid grid-cols-3 gap-3 w-full bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <div className="text-center space-y-1">
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Révisés</span>
              <span className="text-base font-black text-slate-800 block">{sessionReviews}</span>
            </div>
            
            <div className="text-center space-y-1">
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Maîtrisés</span>
              <span className="text-base font-black text-emerald-600 block">+{sessionNewMastered}</span>
            </div>

            <div className="text-center space-y-1">
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">XP gagné</span>
              <span className="text-base font-black text-indigo-650 block">+{sessionXpEarned} XP</span>
            </div>
          </div>

          <button
            onClick={() => setScreen(1)}
            className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            Retour à la mémorisation
          </button>
        </div>
      )}

      {/* MODAL POUR AJOUTER UN VERSET */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-100 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden"
          >
            {/* Bouton de fermeture */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-650"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <Brain className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Nouveau verset à mémoriser
                </h3>
              </div>

              <form onSubmit={handleAddVerse} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="ref" className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">
                    Référence biblique
                  </label>
                  <input
                    id="ref"
                    type="text"
                    required
                    placeholder="Ex: Jean 3:16"
                    value={newReference}
                    onChange={(e) => setNewReference(e.target.value)}
                    className="w-full border border-slate-200/80 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-indigo-600 bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="text" className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">
                    Texte du verset
                  </label>
                  <textarea
                    id="text"
                    required
                    rows={4}
                    placeholder="Saisis le texte exact à mémoriser..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    className="w-full border border-slate-200/80 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-indigo-600 bg-slate-50/50 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-500 font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex-1 bg-indigo-650 hover:bg-indigo-700 disabled:bg-indigo-150 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {adding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Ajout...
                      </>
                    ) : (
                      <>
                        Enregistrer
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
