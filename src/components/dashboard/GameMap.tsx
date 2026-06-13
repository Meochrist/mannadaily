"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Lock, Check, Star, Trophy, BookOpen, Play, HelpCircle, Sparkles, ChevronDown, Award } from "lucide-react";
import Manny from "../mascot/Manny";
import { PATHS, getVersesForPath, PathConfig, Verse } from "@/lib/verses";
import * as sounds from "@/lib/sounds";
import RandomMascotMessage from "./RandomMascotMessage";

interface GameMapProps {
  currentXP: number;
  userName: string;
  dailyVerse: { text: string; reference: string; theme: string };
  currentStreak: number;
  dayProgress: boolean;
  inactivityDays: number;
}

// --- COMPOSANTS DE DÉCORS VECTORIELS FLAT ---
const FlatTree = ({ className = "", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 100 120" className={`w-14 h-18 pointer-events-none ${className}`} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M46 80 h8 v35 h-8 z" fill="#78350F" />
    <circle cx="50" cy="50" r="28" fill="#10B981" />
    <circle cx="36" cy="44" r="18" fill="#059669" />
    <circle cx="64" cy="46" r="20" fill="#34D399" />
    <circle cx="50" cy="32" r="14" fill="#A7F3D0" opacity="0.3" />
  </svg>
);

const FlatBush = ({ className = "", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 80 50" className={`w-12 h-8 pointer-events-none ${className}`} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 40c-8 0-15-7-15-15s7-15 15-15 15 7 15 15-7 15-15 15z" fill="#047857" />
    <path d="M45 40c-8 0-15-7-15-15s7-15 15-15 15 7 15 15-7 15-15 15z" fill="#065F46" />
    <path d="M30 45c-8 0-15-7-15-15s7-15 15-15 15 7 15 15-7 15-15 15z" fill="#10B981" />
    <circle cx="20" cy="25" r="2.5" fill="#EC4899" />
    <circle cx="45" cy="20" r="3" fill="#F43F5E" />
    <circle cx="32" cy="32" r="2" fill="#EF4444" />
  </svg>
);

const WoodenSign = ({ className = "", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 60 80" className={`w-9 h-12 pointer-events-none ${className}`} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M27 40h6v35h-6z" fill="#78350F" />
    <path d="M5 10h50v20H5z" fill="#92400E" rx="3" />
    <path d="M8 13h44v14H8z" fill="#B45309" rx="1.5" />
    <line x1="12" y1="20" x2="48" y2="20" stroke="#FDBA74" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="15" y1="24" x2="35" y2="24" stroke="#FDBA74" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Positions statiques des décors sur une hauteur de 3200px
const DECORS = [
  { type: "tree", x: 100, y: 3050 },
  { type: "bush", x: 380, y: 2950 },
  { type: "sign", x: 120, y: 2800 },
  { type: "tree", x: 370, y: 2700 },
  { type: "bush", x: 110, y: 2550 },
  { type: "tree", x: 390, y: 2400 },
  { type: "bush", x: 130, y: 2250 },
  { type: "tree", x: 365, y: 2120 },
  { type: "sign", x: 120, y: 1950 },
  { type: "tree", x: 380, y: 1800 },
  { type: "bush", x: 110, y: 1650 },
  { type: "tree", x: 370, y: 1500 },
  { type: "bush", x: 130, y: 1350 },
  { type: "tree", x: 390, y: 1180 },
  { type: "bush", x: 120, y: 1050 },
  { type: "tree", x: 360, y: 920 },
  { type: "sign", x: 380, y: 800 },
  { type: "tree", x: 120, y: 680 },
  { type: "bush", x: 370, y: 550 },
  { type: "tree", x: 130, y: 400 },
  { type: "bush", x: 380, y: 250 },
  { type: "tree", x: 140, y: 120 }
];

export default function GameMap({
  currentXP,
  userName,
  dailyVerse,
  currentStreak,
  dayProgress,
  inactivityDays,
}: GameMapProps) {
  const [mounted, setMounted] = useState(false);
  const [activePathId, setActivePathId] = useState("foi");
  const [pathProgress, setPathProgress] = useState<Record<string, number>>({});
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [showSelector, setShowSelector] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Charger la progression locale au montage client
  useEffect(() => {
    setMounted(true);
    
    const savedPath = localStorage.getItem("mannadaily_active_path_id");
    if (savedPath) {
      setActivePathId(savedPath);
    }
    
    const savedProgress = localStorage.getItem("mannadaily_path_progress");
    if (savedProgress) {
      try {
        setPathProgress(JSON.parse(savedProgress));
      } catch (err) {
        console.error("Error parsing path progress", err);
      }
    }
  }, []);

  const activePath = PATHS.find((p) => p.id === activePathId) || PATHS[0];
  const activeVerses = getVersesForPath(activePathId);
  const activeLevel = pathProgress[activePathId] || 1; // 1 à 30 (ou 31 si tout fini)

  // Auto-scroll au niveau actif
  useEffect(() => {
    if (!mounted) return;
    
    // Attendre un court instant que le layout soit rendu
    const timer = setTimeout(() => {
      const activeNodeElement = document.getElementById("active-node");
      const container = scrollContainerRef.current;
      
      if (container && activeNodeElement) {
        const containerHeight = container.clientHeight;
        const nodeTop = activeNodeElement.offsetTop;
        const nodeHeight = activeNodeElement.clientHeight;
        
        container.scrollTo({
          top: nodeTop - containerHeight / 2 + nodeHeight / 2,
          behavior: "smooth"
        });
      }
    }, 150);
    
    return () => clearTimeout(timer);
  }, [activePathId, activeLevel, mounted]);

  if (!mounted) {
    return (
      <div className="w-full bg-slate-50/60 rounded-3xl border border-slate-200/60 p-8 min-h-[600px] flex flex-col items-center justify-center space-y-4 shadow-sm">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400">Chargement de ton chemin spirituel...</span>
      </div>
    );
  }

  // Générer les coordonnées géométriques en zigzag sinusoïdal pour les 30 niveaux
  const totalHeight = 3200;
  const points = Array.from({ length: 30 }, (_, i) => {
    const y = totalHeight - 80 - i * 104;
    const x = 250 + Math.sin((i * Math.PI) / 3.2) * 85;
    return { x, y };
  });

  // Générer la chaîne de tracé SVG pour la ligne
  const getSvgPathD = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  };

  const fullPathD = getSvgPathD(points);
  // Tracer le chemin complété jusqu'au niveau actif
  const completedPoints = points.slice(0, activeLevel - 1);
  const completedPathD = getSvgPathD(completedPoints);

  const handleSelectPath = (pathId: string) => {
    setActivePathId(pathId);
    localStorage.setItem("mannadaily_active_path_id", pathId);
    setShowSelector(false);
    setSelectedNode(null);
    sounds.playSuccess();
  };

  return (
    <div className="relative w-full flex flex-col bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm lg:h-full">
      
      {/* ─── EN-TÊTE FIXE DU CHEMIN AVEC SÉLECTEUR MULTI-CHEMINS ─── */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-150 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 z-20 shadow-sm relative">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-slate-100" style={{ backgroundColor: `${activePath.color}15` }}>
            {activePath.emoji}
          </div>
          <div className="text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Chemin Actif
            </span>
            <h3 className="text-base font-black text-slate-800 tracking-tight leading-tight">
              {activePath.name}
            </h3>
          </div>
        </div>

        {/* Bouton d'ouverture du sélecteur */}
        <button
          onClick={() => {
            setShowSelector(!showSelector);
            sounds.playSuccess();
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-b from-slate-50 to-slate-100 hover:from-white hover:to-white border border-slate-200 rounded-2xl shadow-sm hover:shadow transition-all text-xs font-black text-slate-700 active:scale-[0.98]"
        >
          Changer de Chemin
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showSelector ? "rotate-180" : ""}`} />
        </button>

        {/* MODAL / DROPDOWN Tiroir de sélection des chemins */}
        <AnimatePresence>
          {showSelector && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-30"
                onClick={() => setShowSelector(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.98 }}
                className="absolute top-[100%] right-4 left-4 sm:left-auto sm:right-5 sm:w-[460px] bg-white rounded-3xl border border-slate-200 p-5 shadow-2xl z-40 max-h-[500px] overflow-y-auto space-y-4"
              >
                <div className="border-b pb-2">
                  <h4 className="font-black text-slate-850 text-sm uppercase tracking-wider">
                    Choisis ton Chemin de Méditation
                  </h4>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    Chaque thématique ou livre contient 30 étapes uniques.
                  </p>
                </div>

                {/* Chemins thématiques */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block pl-1">
                    Chemins Thématiques
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {PATHS.filter(p => p.type === "thematic").map((path) => {
                      const progress = pathProgress[path.id] || 1;
                      const pct = Math.min(((progress - 1) / 30) * 100, 100);
                      const isSelected = activePathId === path.id;

                      return (
                        <button
                          key={path.id}
                          onClick={() => handleSelectPath(path.id)}
                          className={`flex items-center gap-3.5 p-2.5 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? "bg-indigo-50/60 border-indigo-200 ring-2 ring-indigo-500/25"
                              : "bg-white border-slate-150 hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-2xl p-2 bg-slate-100/60 rounded-xl flex-shrink-0">{path.emoji}</span>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-slate-800 text-xs">{path.name}</span>
                              <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                {progress > 30 ? "Terminé !" : `${progress - 1} / 30`}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: path.color }} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Livres de la Bible */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block pl-1">
                    Livres & Sections de la Bible
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {PATHS.filter(p => p.type === "book").map((path) => {
                      const progress = pathProgress[path.id] || 1;
                      const pct = Math.min(((progress - 1) / 30) * 100, 100);
                      const isSelected = activePathId === path.id;

                      return (
                        <button
                          key={path.id}
                          onClick={() => handleSelectPath(path.id)}
                          className={`flex items-center gap-3.5 p-2.5 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? "bg-purple-50/50 border-purple-200 ring-2 ring-purple-500/25"
                              : "bg-white border-slate-150 hover:bg-slate-50"
                          }`}
                        >
                          <span className="text-2xl p-2 bg-slate-100/60 rounded-xl flex-shrink-0">{path.emoji}</span>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-slate-800 text-xs">{path.name}</span>
                              <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                {progress > 30 ? "Terminé !" : `${progress - 1} / 30`}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: path.color }} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ─── MESSAGE DE LA MASCOTTE D'ACCUEIL INTRODUCTIVE ─── */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex-shrink-0 z-10 flex justify-center">
        <RandomMascotMessage
          userName={userName}
          streakCount={currentStreak}
          dayProgress={dayProgress}
          inactivityDays={inactivityDays}
          className="max-w-none w-full border-none shadow-none p-0 bg-transparent"
        />
      </div>

      {/* ─── CONTENEUR SCROLLABLE DE LA CARTE DE NIVEAUX ─── */}
      <div
        id="game-map-scroll-container"
        ref={scrollContainerRef}
        className="relative w-full flex-1 overflow-y-auto scrollbar-thin select-none min-h-[350px]"
      >
        <div
          className="relative w-full bg-gradient-to-b from-[#A5F3FC]/50 via-[#E0F2FE]/80 to-[#D1FAE5]/60 flex flex-col items-center"
          style={{ height: `${totalHeight}px`, width: "100%", minWidth: "500px" }}
        >
          {/* Collines d'arrière-plan en bas */}
          <svg className="absolute bottom-0 left-0 right-0 w-full h-64 pointer-events-none fill-none" style={{ zIndex: 0 }}>
            <path d="M -50 256 Q 150 180, 320 220 T 650 256 L 650 300 L -50 300 Z" fill="#A7F3D0" opacity="0.4" />
            <path d="M -50 256 Q 150 180, 320 220 T 650 256" stroke="#86EFAC" strokeWidth="3" opacity="0.6" />
            <path d="M 0 256 Q 200 150, 400 200 T 800 256 L 800 300 L 0 300 Z" fill="#6EE7B7" opacity="0.3" />
            <path d="M 0 256 Q 200 150, 400 200 T 800 256" stroke="#4ADE80" strokeWidth="2.5" opacity="0.5" />
          </svg>

          {/* Ruisseau d'eau vive qui serpente le long du parcours */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none fill-none" style={{ zIndex: 0 }}>
            <path
              d="M 230 50 Q 350 350, 210 750 T 320 1450 T 180 2250 T 300 2950 L 250 3200"
              stroke="#7DD3FC"
              strokeWidth="20"
              opacity="0.3"
              strokeLinecap="round"
            />
            <path
              d="M 230 50 Q 350 350, 210 750 T 320 1450 T 180 2250 T 300 2950 L 250 3200"
              stroke="#38BDF8"
              strokeWidth="6"
              opacity="0.45"
              strokeLinecap="round"
              strokeDasharray="12,24"
            />
          </svg>

          {/* Nuages célestes d'ambiance */}
          <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
            {[300, 900, 1600, 2300, 2900].map((yVal, i) => (
              <motion.div
                key={i}
                className="absolute text-sky-400/20 select-none"
                style={{ top: `${yVal}px`, left: i % 2 === 0 ? "5%" : "65%" }}
                animate={{ x: i % 2 === 0 ? [-20, 20, -20] : [20, -20, 20] }}
                transition={{ duration: 18 + i * 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="120" height="60" viewBox="0 0 120 60" fill="currentColor">
                  <path d="M20 50 C20 40, 35 30, 50 35 C60 25, 80 25, 90 35 C105 30, 115 40, 115 50 Z" />
                </svg>
              </motion.div>
            ))}
          </div>

          {/* Étoiles célestes scintillantes tout en haut */}
          <div className="absolute top-10 left-0 right-0 h-40 flex justify-around pointer-events-none select-none z-0">
            <motion.div animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 1, 0.3] }} transition={{ duration: 2.2, repeat: Infinity }} className="text-amber-400"><Sparkles className="w-5 h-5" /></motion.div>
            <motion.div animate={{ scale: [1.2, 0.8, 1.2], opacity: [1, 0.2, 1] }} transition={{ duration: 2.8, repeat: Infinity }} className="text-amber-300"><Sparkles className="w-6 h-6" /></motion.div>
            <motion.div animate={{ scale: [0.7, 1.1, 0.7], opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 1.9, repeat: Infinity }} className="text-amber-400"><Sparkles className="w-4 h-4" /></motion.div>
          </div>

          {/* ─── RENDU DES DÉCORS STATIQUES ─── */}
          {DECORS.map((dec, idx) => {
            if (dec.type === "tree") return <FlatTree key={idx} className="absolute z-10" style={{ left: `${dec.x}px`, top: `${dec.y}px` }} />;
            if (dec.type === "bush") return <FlatBush key={idx} className="absolute z-10" style={{ left: `${dec.x}px`, top: `${dec.y}px` }} />;
            return <WoodenSign key={idx} className="absolute z-10" style={{ left: `${dec.x}px`, top: `${dec.y}px` }} />;
          })}

          {/* ─── RENDU DU TRACÉ SVG DE PROGRESSION DU PARCOURS ─── */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
            <path
              d={fullPathD}
              stroke="#94A3B8"
              strokeWidth="6"
              strokeDasharray="8,8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.45"
            />
            {completedPoints.length > 1 && (
              <motion.path
                d={completedPathD}
                stroke={activePath.color}
                strokeWidth="7.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
            )}
          </svg>

          {/* ─── LE DÉFILÉ DES 30 NŒUDS DE NIVEAU ─── */}
          <div className="absolute inset-0 w-full h-full" style={{ zIndex: 10 }}>
            {points.map((pt, index) => {
              const level = index + 1;
              const verse = activeVerses[index];
              const isCompleted = level < activeLevel;
              const isActive = level === activeLevel;
              const isLocked = level > activeLevel;

              // Alterner les styles/emojis du nœud
              const emojiList = ["🌱", "🌿", "💧", "🛡️", "🔥", "👑", "✨"];
              const nodeEmoji = level === 30 ? "🏆" : emojiList[Math.floor(index / 5) % emojiList.length];

              return (
                <div
                  key={level}
                  id={isActive ? "active-node" : undefined}
                  className={`absolute flex flex-col items-center transition-all ${
                    selectedNode === level ? "z-50" : "z-10"
                  }`}
                  style={{
                    left: `${pt.x - 40}px`, // Centrer le bouton de 80px de large
                    top: `${pt.y - 40}px`,
                  }}
                >
                  {/* Mascotte Manny posée fièrement sur le niveau actif */}
                  {isActive && (
                    <motion.div
                      className="absolute -top-[92px] z-30 drop-shadow-[0_8px_16px_rgba(79,70,229,0.25)] flex flex-col items-center pointer-events-none"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ 
                        y: { repeat: Infinity, duration: 2.2, ease: "easeInOut" },
                        opacity: { duration: 0.3 }
                      }}
                    >
                      <span className="bg-indigo-600 text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md mb-1 text-center whitespace-nowrap">
                        Ici !
                      </span>
                      <Manny mood="happy" size={72} />
                    </motion.div>
                  )}

                  {/* Le bouton nœud (Style 3D Flat Duolingo) */}
                  <button
                    onClick={() => {
                      setSelectedNode(selectedNode === level ? null : level);
                      sounds.playSuccess();
                    }}
                    className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center font-black text-xl transition-all outline-none border-b-[6px] ${
                      isLocked
                        ? "bg-slate-350 border-slate-450 text-slate-500 cursor-not-allowed"
                        : isCompleted
                        ? "bg-amber-400 border-amber-500 text-amber-950 shadow-[0_4px_10px_rgba(245,158,11,0.25)] hover:brightness-105 active:border-b-0 active:translate-y-[6px]"
                        : "text-white shadow-[0_4px_12px_rgba(79,70,229,0.25)] hover:scale-105 active:border-b-0 active:translate-y-[6px]"
                    }`}
                    style={{
                      backgroundColor: !isLocked && !isCompleted ? activePath.color : undefined,
                      borderColor: !isLocked && !isCompleted ? activePath.colorDark : undefined,
                    }}
                    disabled={isLocked}
                  >
                    {isLocked ? (
                      <Lock className="w-5.5 h-5.5 stroke-[3px]" />
                    ) : isCompleted ? (
                      <Check className="w-7 h-7 stroke-[4.5px]" />
                    ) : (
                      <span className="text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.15)] animate-bounce-slow">
                        {nodeEmoji}
                      </span>
                    )}

                    {/* Badge du numéro de niveau */}
                    <span className="absolute -bottom-6 bg-slate-900/50 backdrop-blur-[2px] text-white font-bold text-[9px] tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap">
                      Étape {level}
                    </span>
                  </button>

                  {/* Popover d'informations contextuelles de l'étape */}
                  <AnimatePresence>
                    {selectedNode === level && verse && (
                      <motion.div
                        className="absolute bottom-[92px] w-64 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_15px_40px_rgba(15,23,42,0.25)] z-50 flex flex-col items-center text-center space-y-3"
                        initial={{ opacity: 0, scale: 0.9, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 15 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        {/* Flèche du bas */}
                        <div className="absolute -bottom-2.5 left-1/2 w-5 h-5 bg-white border-r border-b border-slate-200/80 transform -translate-x-1/2 rotate-45" />

                        <div className="space-y-1">
                          <span
                            className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: isCompleted ? "#FEF3C7" : "#EEF2FF",
                              color: isCompleted ? "#B45309" : "#4F46E5",
                            }}
                          >
                            {isCompleted ? "Complété !" : "À Méditer"}
                          </span>
                          <h4 className="font-extrabold text-slate-800 text-sm">
                            Niveau {level} : {activePath.name}
                          </h4>
                          <span className="text-[10px] font-bold text-indigo-500">
                            {verse.reference}
                          </span>
                        </div>

                        {/* Verset du niveau */}
                        <blockquote className="text-[11px] text-slate-500 font-medium leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-3">
                          « {verse.text} »
                        </blockquote>

                        {/* Liens vers l'action */}
                        <div className="w-full border-t border-slate-100 pt-2 flex flex-col gap-2">
                          <Link
                            href={`/meditate?text=${encodeURIComponent(verse.text)}&reference=${encodeURIComponent(verse.reference)}&theme=${encodeURIComponent(verse.theme)}&pathId=${activePathId}&level=${level}`}
                            className="flex items-center justify-center gap-1.5 w-full py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-black text-[11px] rounded-xl shadow-sm hover:from-amber-300 hover:to-amber-400 transition-all active:scale-[0.98]"
                          >
                            <Play className="w-3 h-3 fill-slate-900" />
                            Méditer (+15 XP)
                          </Link>
                          <Link
                            href={`/proclaim?text=${encodeURIComponent(verse.text)}&reference=${encodeURIComponent(verse.reference)}&theme=${encodeURIComponent(verse.theme)}&pathId=${activePathId}&level=${level}`}
                            className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-xl transition-all active:scale-[0.98]"
                          >
                            <BookOpen className="w-3 h-3" />
                            Proclamer (+20 XP)
                          </Link>
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
    </div>
  );
}
