"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

// Import dynamique du rendu Rive sans SSR (car Rive utilise WASM/Canvas)
const RiveRenderer = dynamic(() => import("./RiveRenderer"), {
  ssr: false,
});

// Liste des personnages pour lesquels l'animation Rive (.riv) est activée.
// Permet d'éviter le flash/chargement d'un fichier inexistant.
// Pour basculer un personnage sur Rive, ajoutez son identifiant en minuscules ici (ex: "manny").
const RIVE_ENABLED_CHARACTERS: string[] = [];

// Liste des personnages utilisant des illustrations vectorielles unifiées complètes (style IA/VTracer)
// Pour ces personnages, seul le fichier de pose (qui contient le personnage complet expressif) est rendu.
const UNIFIED_CHARACTERS = [
  "manny",
  "samson",
  "esther",
  "noe",
  "david",
  "gedeon",
  "paul",
  "pierre",
  "moise",
  "abraham",
];

// Types des états supportés par notre mascotte (style Duolingo)
export type MascotState =
  | "SPORT"
  | "WEATHER_HOT"
  | "WEATHER_COLD"
  | "NIGHT_MODE"
  | "CRITICAL_STREAK"
  | "DEFAULT";

interface CharacterRendererProps {
  characterId: string;
  pose?: "idle" | "jumping" | "sad" | "running";
  expression?: "neutral" | "happy" | "sweating" | "crying";
  outfit?: "default" | "winter" | "beach" | "halloween";
  state?: MascotState;
  size?: number;
  className?: string;
}

export default function CharacterRenderer({
  characterId,
  pose = "idle",
  expression = "neutral",
  outfit = "default",
  state,
  size = 150,
  className = "",
}: CharacterRendererProps) {
  const [loadError, setLoadError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Formater les identifiants pour correspondre à nos dossiers
  const charId = characterId.toLowerCase();
  const basePath = `/assets/characters/${charId}`;

  // Détecter si Rive est activé pour ce personnage et qu'on ne souhaite pas de fallback immédiat
  const isRiveEnabled = RIVE_ENABLED_CHARACTERS.includes(charId) && !useFallback;

  // 1. Si un état sémantique Duolingo est fourni, il surcharge les poses/expressions/tenues
  let finalPose = pose;
  let finalExpression = expression;
  let finalOutfit = outfit;
  const finalState = state || "DEFAULT";

  if (state) {
    switch (state) {
      case "SPORT":
        finalPose = "running";
        finalExpression = "happy";
        finalOutfit = "default";
        break;
      case "WEATHER_HOT":
        finalPose = "idle";
        finalExpression = "sweating";
        finalOutfit = "beach";
        break;
      case "WEATHER_COLD":
        finalPose = "idle";
        finalExpression = "neutral";
        finalOutfit = "winter";
        break;
      case "NIGHT_MODE":
        finalPose = "idle";
        finalExpression = "neutral";
        finalOutfit = "winter"; // Pyjama/tenue chaude pour la nuit
        break;
      case "CRITICAL_STREAK":
        finalPose = "sad";
        finalExpression = "crying";
        finalOutfit = "default";
        break;
      case "DEFAULT":
      default:
        finalPose = "idle";
        finalExpression = "neutral";
        finalOutfit = "default";
        break;
    }
  }

  // 2. Définir des animations physiques style Duolingo (Framer Motion avec déformation élastique/Warping)
  const getAnimationProps = () => {
    switch (finalPose) {
      case "jumping":
        return {
          animate: {
            y: [0, 5, -30, -3, 0],
            scaleY: [1, 0.82, 1.12, 0.90, 1],
            scaleX: [1, 1.14, 0.90, 1.08, 1],
            skewX: [0, -3, 3, -1, 0],
            rotate: [0, -4, 4, -1, 0],
          },
          style: { originY: 1 },
          transition: {
            duration: 1.0,
            repeat: Infinity,
            ease: "easeInOut" as const,
            times: [0, 0.15, 0.48, 0.78, 1],
          },
        };
      case "running":
        return {
          animate: {
            y: [0, -8, 0, -8, 0],
            scaleY: [1, 1.04, 0.95, 1.04, 1],
            scaleX: [1, 0.95, 1.04, 0.95, 1],
            skewX: [-4, 4, -4, 4, -4],
            rotate: [-5, 5, -5, 5, -5],
          },
          style: { originY: 1 },
          transition: {
            duration: 0.55,
            repeat: Infinity,
            ease: "linear" as const,
          },
        };
      case "sad":
        return {
          animate: {
            y: [0, 4, 0],
            scaleY: [1, 0.95, 1.01, 1],
            scaleX: [1, 1.02, 0.99, 1],
            skewX: [0.8, -0.8, 0.8],
            rotate: [-1.5, 0.5, -1.5],
          },
          style: { originY: 1 },
          transition: {
            duration: 3.0,
            repeat: Infinity,
            ease: "easeInOut" as const,
          },
        };
      case "idle":
      default:
        return {
          animate: {
            y: [0, -5, 0],
            scaleY: [1, 1.04, 0.98, 1],
            scaleX: [1, 0.97, 1.02, 1],
            skewX: [-1.2, 1.2, -1.2],
            rotate: [-0.8, 0.8, -0.8],
          },
          style: { originY: 1 },
          transition: {
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut" as const,
          },
        };
    }
  };

  // Rendu si erreur de chargement
  if (loadError) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-xs text-center p-3 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-2xl mb-1">📖</span>
        <span className="capitalize">{characterId}</span>
        <span className="text-[10px] text-indigo-400 font-medium uppercase mt-1">
          {finalPose} - {finalExpression}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={`relative select-none pointer-events-none flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ombre de contact au sol style Duolingo (Flat Design 2.0) */}
      <motion.div 
        className="absolute bottom-[2%] left-1/2 bg-slate-900/10 rounded-full blur-[0.5px] pointer-events-none z-0"
        style={{ 
          width: size * 0.65, 
          height: size * 0.08,
          x: "-50%"
        }}
        animate={finalPose === "jumping" ? {
          scaleX: [1, 0.7, 1],
          scaleY: [1, 0.6, 1],
          opacity: [0.12, 0.05, 0.12]
        } : finalPose === "running" ? {
          scaleX: [1, 0.95, 1],
          x: ["-50%", "-48%", "-50%"]
        } : {}}
        transition={finalPose === "jumping" ? {
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut"
        } : finalPose === "running" ? {
          duration: 0.4,
          repeat: Infinity,
          ease: "linear"
        } : {}}
      />

      {/* Le personnage (Rive ou SVG) enveloppé dans ses mouvements physiques */}
      <motion.div
        className="absolute inset-0 w-full h-full flex items-center justify-center z-10"
        {...getAnimationProps()}
      >
        {isRiveEnabled ? (
          <RiveRenderer
            characterId={charId}
            pose={finalPose}
            expression={finalExpression}
            outfit={finalOutfit}
            state={finalState}
            size={size}
            className="w-full h-full"
            onFallback={() => setUseFallback(true)}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full">
            {/* 1. Couche de la pose (Full Body ou Personnage Unifié Complet avec transition fluide) */}
            <AnimatePresence mode="popLayout">
              <motion.img
                key={finalPose}
                src={`${basePath}/pose_${finalPose}.svg`}
                alt={`${characterId} (${finalPose})`}
                onError={() => setLoadError(true)}
                initial={{ opacity: 0, scale: 0.94, y: finalPose === "jumping" ? 15 : 0 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.04, y: finalPose === "jumping" ? -15 : 0 }}
                transition={{ 
                  opacity: { duration: 0.2 },
                  scale: { type: "spring", stiffness: 350, damping: 22, mass: 0.7 },
                  y: { type: "spring", stiffness: 280, damping: 20 }
                }}
                className="absolute inset-0 w-full h-full object-contain z-10"
              />
            </AnimatePresence>

            {/* 2. Couche du visage / de l'expression (uniquement si non unifié) */}
            {!UNIFIED_CHARACTERS.includes(charId) && (
              <img
                src={`${basePath}/expression_${finalExpression}.svg`}
                alt={`${characterId} face (${finalExpression})`}
                className="absolute inset-0 w-full h-full object-contain z-20 transition-all duration-300 ease-in-out"
              />
            )}

            {/* 3. Couche de la tenue / de l'outfit (si non default et si non unifié) */}
            {finalOutfit !== "default" && !UNIFIED_CHARACTERS.includes(charId) && (
              <img
                src={`${basePath}/outfit_${finalOutfit}.svg`}
                alt={`${characterId} outfit (${finalOutfit})`}
                className="absolute inset-0 w-full h-full object-contain z-30 transition-all duration-300 ease-in-out"
              />
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

