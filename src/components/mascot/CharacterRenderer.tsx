"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

// Import dynamique du rendu Rive sans SSR (car Rive utilise WASM/Canvas)
const RiveRenderer = dynamic(() => import("./RiveRenderer"), {
  ssr: false,
});

// Liste des personnages pour lesquels l'animation Rive (.riv) est activée.
// Permet d'éviter le flash/chargement d'un fichier inexistant.
// Pour basculer un personnage sur Rive, ajoutez son identifiant en minuscules ici (ex: "manny").
const RIVE_ENABLED_CHARACTERS: string[] = [];

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

  // 2. Définir des animations physiques selon la pose (uniquement pour le rendu SVG)
  const getAnimationProps = () => {
    switch (finalPose) {
      case "jumping":
        return {
          animate: {
            y: [0, -15, 0],
            scaleY: [1, 0.95, 1.05, 1],
          },
          transition: {
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut" as const,
          },
        };
      case "running":
        return {
          animate: {
            x: [-3, 3, -3],
            y: [-2, 2, -2],
            rotate: [-2, 2, -2],
          },
          transition: {
            duration: 0.4,
            repeat: Infinity,
            ease: "linear" as const,
          },
        };
      case "sad":
        return {
          animate: {
            y: [0, 4, 0],
            scale: [1, 0.98, 1],
          },
          transition: {
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut" as const,
          },
        };
      case "idle":
      default:
        return {
          animate: {
            y: [0, -3, 0],
            scaleY: [1, 1.02, 1],
          },
          transition: {
            duration: 3,
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
          <>
            {/* 1. Couche du corps / de la pose (Full Body) */}
            <img
              src={`${basePath}/pose_${finalPose}.svg`}
              alt={`${characterId} body (${finalPose})`}
              onError={() => setLoadError(true)}
              className="absolute inset-0 w-full h-full object-contain z-10 transition-all duration-300 ease-in-out"
            />

            {/* 2. Couche du visage / de l'expression */}
            <img
              src={`${basePath}/expression_${finalExpression}.svg`}
              alt={`${characterId} face (${finalExpression})`}
              className="absolute inset-0 w-full h-full object-contain z-20 transition-all duration-300 ease-in-out"
            />

            {/* 3. Couche de la tenue / de l'outfit (si non default) */}
            {finalOutfit !== "default" && (
              <img
                src={`${basePath}/outfit_${finalOutfit}.svg`}
                alt={`${characterId} outfit (${finalOutfit})`}
                className="absolute inset-0 w-full h-full object-contain z-30 transition-all duration-300 ease-in-out"
              />
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

