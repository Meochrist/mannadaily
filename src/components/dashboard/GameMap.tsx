"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Lock, Check, Star, Trophy, BookOpen, Play, HelpCircle, Sparkles } from "lucide-react";
import Manny from "../mascot/Manny";
import { LEVELS } from "@/types";

interface GameMapProps {
  currentXP: number;
  userName: string;
  dailyVerse: { text: string; reference: string; theme: string };
}

// Thèmes de couleurs et configurations visuelles par niveau
const LEVEL_MAP_CONFIGS: Record<number, {
  color: string;
  colorDark: string;
  emoji: string;
  decor: string;
  description: string;
}> = {
  1: {
    color: "#10B981", // Emerald
    colorDark: "#047857",
    emoji: "🌱",
    decor: "🌿 Petit jardin de la foi",
    description: "Le début de ton aventure. La graine de la Parole de Dieu est semée dans ton cœur.",
  },
  2: {
    color: "#06B6D4", // Cyan
    colorDark: "#0891B2",
    emoji: "🌿",
    decor: "💧 Source d'eau vive",
    description: "La pousse grandit grâce à l'arrosage quotidien de la méditation.",
  },
  3: {
    color: "#3B82F6", // Blue
    colorDark: "#1D4ED8",
    emoji: "🌳",
    decor: "🍃 Forêt des psaumes",
    description: "Un arbre bien enraciné qui produit du fruit en sa saison et dont le feuillage ne se flétrit pas.",
  },
  4: {
    color: "#8B5CF6", // Purple
    colorDark: "#6D28D9",
    emoji: "🐑",
    decor: "⛰️ Collines du Berger",
    description: "Tu apprens à écouter la voix du Bon Berger et à guider les autres vers les verts pâturages.",
  },
  5: {
    color: "#EC4899", // Pink
    colorDark: "#BE185D",
    emoji: "🔥",
    decor: "⚡ Montagne du Feu",
    description: "Tu proclames la Parole de Dieu avec assurance et vois Sa puissance s'accomplir.",
  },
  6: {
    color: "#F59E0B", // Amber
    colorDark: "#B45309",
    emoji: "👑",
    decor: "🏰 Palais du Roi",
    description: "En tant qu'ambassadeur du Royaume, tu vis pleinement ta mission et ton héritage spirituel.",
  },
  7: {
    color: "#EF4444", // Red
    colorDark: "#B91C1C",
    emoji: "✨",
    decor: "☀️ Ciel de la Lumière",
    description: "Tu es la lumière du monde, brillant d'un éclat éternel pour la gloire de Dieu.",
  },
};

// Positions de décalage en zigzag horizontal pour le chemin
const HORIZONTAL_OFFSETS = [0, -60, 0, 60, 0, -60, 0];

// --- COMPOSANTS DE DÉCORS VECTORIELS FLAT ---
const FlatTree = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 120" className={`w-14 h-18 pointer-events-none ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M46 80 h8 v35 h-8 z" fill="#78350F" />
    <circle cx="50" cy="50" r="28" fill="#10B981" />
    <circle cx="36" cy="44" r="18" fill="#059669" />
    <circle cx="64" cy="46" r="20" fill="#34D399" />
    <circle cx="50" cy="32" r="14" fill="#A7F3D0" opacity="0.3" />
  </svg>
);

const FlatBush = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 80 50" className={`w-12 h-8 pointer-events-none ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 40c-8 0-15-7-15-15s7-15 15-15 15 7 15 15-7 15-15 15z" fill="#047857" />
    <path d="M45 40c-8 0-15-7-15-15s7-15 15-15 15 7 15 15-7 15-15 15z" fill="#065F46" />
    <path d="M30 45c-8 0-15-7-15-15s7-15 15-15 15 7 15 15-7 15-15 15z" fill="#10B981" />
    <circle cx="20" cy="25" r="2.5" fill="#EC4899" />
    <circle cx="45" cy="20" r="3" fill="#F43F5E" />
    <circle cx="32" cy="32" r="2" fill="#EF4444" />
  </svg>
);

const WoodenSign = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 60 80" className={`w-9 h-12 pointer-events-none ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M27 40h6v35h-6z" fill="#78350F" />
    <path d="M5 10h50v20H5z" fill="#92400E" rx="3" />
    <path d="M8 13h44v14H8z" fill="#B45309" rx="1.5" />
    <line x1="12" y1="20" x2="48" y2="20" stroke="#FDBA74" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="15" y1="24" x2="35" y2="24" stroke="#FDBA74" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function GameMap({ currentXP, userName, dailyVerse }: GameMapProps) {
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  // Trouver le niveau actuel de l'utilisateur
  const sortedLevels = [...LEVELS].sort((a, b) => b.level - a.level);
  const userLevelObj = sortedLevels.find((l) => currentXP >= l.xpRequired) || LEVELS[0];
  const userLevel = userLevelObj.level;

  return (
    <div className="relative w-full bg-gradient-to-b from-[#A5F3FC]/50 via-[#E0F2FE]/80 to-[#D1FAE5]/60 rounded-3xl border border-slate-200/60 p-4 sm:p-8 overflow-hidden min-h-[1050px] flex flex-col items-center shadow-inner">
      {/* ─── DÉCORS NATURELS D'ARRIÈRE-PLAN ─── */}
      {/* Collines d'arrière-plan (effet de relief en bas) */}
      <svg className="absolute bottom-0 left-0 right-0 w-full h-64 pointer-events-none fill-none" style={{ zIndex: 0 }}>
        <path d="M -50 256 Q 150 180, 320 220 T 650 256 L 650 300 L -50 300 Z" fill="#A7F3D0" opacity="0.4" />
        <path d="M -50 256 Q 150 180, 320 220 T 650 256" stroke="#86EFAC" strokeWidth="3" opacity="0.6" />
        
        <path d="M 0 256 Q 200 150, 400 200 T 800 256 L 800 300 L 0 300 Z" fill="#6EE7B7" opacity="0.3" />
        <path d="M 0 256 Q 200 150, 400 200 T 800 256" stroke="#4ADE80" strokeWidth="2.5" opacity="0.5" />
      </svg>

      {/* Ruisseau d'eau vive qui serpente le long du parcours */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none fill-none" style={{ zIndex: 0 }}>
        <path
          d="M 420 50 Q 320 180, 380 340 T 260 620 T 360 880 T 150 1050"
          stroke="#7DD3FC"
          strokeWidth="16"
          opacity="0.35"
          strokeLinecap="round"
        />
        <path
          d="M 420 50 Q 320 180, 380 340 T 260 620 T 360 880 T 150 1050"
          stroke="#38BDF8"
          strokeWidth="5"
          opacity="0.5"
          strokeLinecap="round"
          strokeDasharray="12,24"
        />
      </svg>

      {/* Nuages animés */}
      <motion.div
        className="absolute top-16 left-[8%] text-sky-400/20 pointer-events-none select-none z-0"
        animate={{ x: [-25, 25, -25] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="130" height="65" viewBox="0 0 120 60" fill="currentColor">
          <path d="M20 50 C20 40, 35 30, 50 35 C60 25, 80 25, 90 35 C105 30, 115 40, 115 50 Z" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute top-80 right-[5%] text-sky-400/15 pointer-events-none select-none z-0"
        animate={{ x: [30, -30, 30] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="160" height="80" viewBox="0 0 150 70" fill="currentColor">
          <path d="M25 60 C25 48, 45 35, 65 42 C78 30, 102 30, 115 42 C132 35, 145 48, 145 60 Z" />
        </svg>
      </motion.div>

      {/* Étoiles célestes de gloire en haut de la carte */}
      <div className="absolute top-10 left-0 right-0 h-40 flex justify-around pointer-events-none select-none z-0">
        <motion.div animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 1, 0.3] }} transition={{ duration: 2.2, repeat: Infinity }} className="text-amber-400"><Sparkles className="w-5 h-5" /></motion.div>
        <motion.div animate={{ scale: [1.2, 0.8, 1.2], opacity: [1, 0.2, 1] }} transition={{ duration: 2.8, repeat: Infinity }} className="text-amber-300"><Sparkles className="w-6 h-6" /></motion.div>
        <motion.div animate={{ scale: [0.7, 1.1, 0.7], opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 1.9, repeat: Infinity }} className="text-amber-400"><Sparkles className="w-4 h-4" /></motion.div>
      </div>

      {/* --- STRUCTURES DE ILLUSTRATIONS FIXES SUR LA CARTE --- */}
      {/* Jardins & Buissons placés asymétriquement */}
      <FlatTree className="absolute bottom-16 left-12" />
      <FlatBush className="absolute bottom-28 left-28" />
      
      <WoodenSign className="absolute bottom-60 right-14" />
      <FlatTree className="absolute bottom-96 right-8" />
      
      <FlatBush className="absolute top-[520px] left-8" />
      <FlatTree className="absolute top-[480px] left-16" />
      
      <FlatTree className="absolute top-[280px] right-12" />
      <FlatBush className="absolute top-[320px] right-24" />
      
      <FlatBush className="absolute top-28 left-16" />

      {/* ─── EN-TÊTE DE LA CARTE ─── */}
      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/60 p-4 text-center shadow-lg mb-16 z-10">
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100/30">
          Chemin Spirituel
        </span>
        <h3 className="text-lg font-black text-slate-800 tracking-tight mt-2">
          La Route de la Croissance
        </h3>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Complète tes méditations quotidiennes pour avancer dans l'aventure !
        </p>
      </div>

      {/* ─── LE PARCOURS DE JEU (LIGNE DE PROGRESSION) ─── */}
      <div className="relative flex flex-col items-center w-full max-w-lg select-none py-10">
        {/* Ligne SVG en arrière-plan reliant les nœuds en zigzag */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-350 fill-none"
          style={{ zIndex: 0 }}
        >
          <path
            d="M 250 900 L 190 770 L 250 640 L 310 510 L 250 380 L 190 250 L 250 120"
            strokeDasharray="8,8"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Ligne de progression complétée (colorée en indigo brillant) */}
          <motion.path
            d={
              userLevel >= 7 ? "M 250 900 L 190 770 L 250 640 L 310 510 L 250 380 L 190 250 L 250 120" :
              userLevel === 6 ? "M 250 900 L 190 770 L 250 640 L 310 510 L 250 380 L 190 250" :
              userLevel === 5 ? "M 250 900 L 190 770 L 250 640 L 310 510 L 250 380" :
              userLevel === 4 ? "M 250 900 L 190 770 L 250 640 L 310 510" :
              userLevel === 3 ? "M 250 900 L 190 770 L 250 640" :
              userLevel === 2 ? "M 250 900 L 190 770" :
              "M 250 900 L 250 900"
            }
            stroke="#4F46E5"
            strokeWidth="7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </svg>

        {/* Génération des 7 nœuds de niveau de bas (Semence) en haut (Lumière) */}
        <div className="flex flex-col-reverse items-center gap-24 w-full relative z-10">
          {LEVELS.map((levelObj) => {
            const level = levelObj.level;
            const config = LEVEL_MAP_CONFIGS[level];
            const offset = HORIZONTAL_OFFSETS[level - 1];
            
            const isCompleted = level < userLevel;
            const isActive = level === userLevel;
            const isLocked = level > userLevel;

            return (
              <div
                key={level}
                /* z-index dynamique TRÈS IMPORTANT : z-50 sur le nœud sélectionné pour s'afficher en priorité absolue sur tout le reste ! */
                className={`relative flex flex-col items-center transition-all ${
                  selectedNode === level ? "z-50" : "z-10"
                }`}
                style={{ transform: `translateX(${offset}px)` }}
              >
                {/* ─── MASCOTTE MANNY (Sur le niveau ACTIF) ─── */}
                {isActive && (
                  <motion.div
                    className="absolute -top-[90px] z-30 drop-shadow-[0_8px_16px_rgba(79,70,229,0.25)] flex flex-col items-center"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    {/* Bulle d'indication "Tu es ici !" */}
                    <span className="bg-indigo-600 text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md mb-1.5 animate-bounce">
                      Ton Niveau !
                    </span>
                    <Manny mood="happy" size={75} className="mt-[-8px]" />
                  </motion.div>
                )}

                {/* ─── LE BOUTON NŒUD DE NIVEAU (Style 3D Flat Duolingo) ─── */}
                <button
                  onClick={() => setSelectedNode(selectedNode === level ? null : level)}
                  className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center font-black text-xl transition-all outline-none ${
                    isLocked
                      ? "bg-slate-300 border-b-[6px] border-slate-400 text-slate-500 cursor-not-allowed"
                      : isCompleted
                      ? "bg-amber-400 border-b-[6px] border-amber-500 text-slate-900 shadow-[0_4px_10px_rgba(245,158,11,0.3)] hover:brightness-105 active:border-b-0 active:translate-y-[6px]"
                      : "border-b-[6px] text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:scale-105 active:border-b-0 active:translate-y-[6px] animate-pulse-slow"
                  }`}
                  style={{
                    backgroundColor: !isLocked && !isCompleted ? config.color : undefined,
                    borderColor: !isLocked && !isCompleted ? config.colorDark : undefined,
                  }}
                  disabled={isLocked && level !== userLevel}
                >
                  {/* Icône à l'intérieur du nœud */}
                  {isLocked ? (
                    <Lock className="w-6 h-6 stroke-[3px]" />
                  ) : isCompleted ? (
                    <Check className="w-7 h-7 stroke-[4.5px] text-amber-950" />
                  ) : (
                    <span className="text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.15)]">
                      {config.emoji}
                    </span>
                  )}

                  {/* Nom du niveau sous la pastille */}
                  <span className="absolute -bottom-7 bg-slate-900/60 backdrop-blur-[2px] text-white font-bold text-[10px] tracking-wide px-2.5 py-0.5 rounded-full select-none shadow-sm whitespace-nowrap">
                    {levelObj.name}
                  </span>
                </button>

                {/* ─── FENÊTRE CONTEXTUELLE DE DIALOGUE (Popover z-50 permanent) ─── */}
                <AnimatePresence>
                  {selectedNode === level && (
                    <motion.div
                      className="absolute bottom-[95px] w-64 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_15px_40px_rgba(15,23,42,0.25)] z-50 flex flex-col items-center text-center space-y-4"
                      initial={{ opacity: 0, scale: 0.9, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 15 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      {/* Petite flèche en bas orientée vers le nœud */}
                      <div className="absolute -bottom-2.5 left-1/2 w-5 h-5 bg-white border-r border-b border-slate-200/80 transform -translate-x-1/2 rotate-45" />

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: isLocked ? "#E2E8F0" : isCompleted ? "#FEF3C7" : "#EEF2FF",
                            color: isLocked ? "#475569" : isCompleted ? "#B45309" : "#4F46E5"
                          }}
                        >
                          {isLocked ? "Étape Verrouillée" : isCompleted ? "Étape Validée !" : "Étape En Cours"}
                        </span>
                        <h4 className="font-extrabold text-slate-800 text-base">
                          {level}. {levelObj.name}
                        </h4>
                        <p className="text-[11px] text-indigo-500 font-bold">
                          {levelObj.xpRequired} XP Requis
                        </p>
                      </div>

                      <p className="text-slate-500 font-medium text-xs leading-relaxed">
                        {config.description}
                      </p>

                      <div className="w-full border-t border-slate-100/80 pt-3">
                        {isLocked ? (
                          <div className="text-[10px] font-bold text-slate-400 py-1.5 flex items-center justify-center gap-1.5 bg-slate-50 rounded-xl">
                            <Lock className="w-3.5 h-3.5" />
                            Gagne du XP pour débloquer
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 w-full">
                            <Link
                              href="/meditate"
                              className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-black text-xs rounded-xl shadow-md hover:from-amber-300 hover:to-amber-400 hover:shadow-lg transition-all active:scale-[0.97]"
                            >
                              <Play className="w-3.5 h-3.5 fill-slate-900" />
                              Méditer (+15 XP)
                            </Link>
                            <Link
                              href="/proclaim"
                              className="flex items-center justify-center gap-1.5 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all active:scale-[0.97]"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              Proclamer (+20 XP)
                            </Link>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
