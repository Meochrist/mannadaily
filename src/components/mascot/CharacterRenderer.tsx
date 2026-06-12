"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

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

/**
 * Fonction générique pour générer l'URL SVG DiceBear (style adventurer)
 * en fonction d'un personnage (seed) et d'un état enrichi (sport, météo, nuit, urgence).
 */
export function getMascotUrl(characterSeed: string, state: string): string {
  const seed = encodeURIComponent(characterSeed.toLowerCase());
  const baseUrl = `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}`;

  let params = "";

  switch (state.toUpperCase()) {
    case "SPORT":
      // eyes: 'determinated' (variant18) ou 'squint' (variant14)
      // mouth: 'smile' (variant01)
      // headband/glasses: glasses=variant02, glassesProbability=100 (lunettes sportives)
      params = "&eyes=variant18&mouth=variant01&glasses=variant02&glassesProbability=100&features=blush";
      break;

    case "WEATHER_HOT":
      // features: 'sunglasses' (glasses=variant05, glassesProbability=100)
      // mouth: 'openSmile' (variant02)
      // backgroundColor: orange sable estival (fdba74)
      params = "&eyes=variant08&mouth=variant02&glasses=variant05&glassesProbability=100&backgroundColor=fdba74&features=blush";
      break;

    case "WEATHER_COLD":
      // features: 'shades' (glasses=variant03, glassesProbability=100)
      // eyes: 'glance' (variant16)
      // backgroundColor: bleu neige hivernal (93c5fd)
      params = "&eyes=variant16&mouth=variant11&glasses=variant03&glassesProbability=100&backgroundColor=93c5fd&features=blush";
      break;

    case "NIGHT_MODE":
      // eyes: 'sleepy' (variant11) ou 'wink' (variant23)
      // mouth: 'subtleSmile' (variant08)
      // backgroundColor: bleu nuit indigo-950 (1e1b4b)
      params = "&eyes=variant11&mouth=variant08&backgroundColor=1e1b4b&features=blush";
      break;

    case "CRITICAL_STREAK":
      // eyes: 'cry' (variant12) ou 'shattered' (variant24)
      // mouth: 'sad' (variant04) ou 'vampire' (variant28)
      // backgroundColor: rouge détresse/panique (fecaca)
      params = "&eyes=variant12&mouth=variant04&backgroundColor=fecaca&features=blush";
      break;

    case "DEFAULT":
    default:
      // eyes: normal (variant08)
      // mouth: smile (variant05)
      // backgroundColor: bleu doux (b6e3f4)
      params = "&eyes=variant08&mouth=variant05&backgroundColor=b6e3f4&features=blush";
      break;
  }

  return `${baseUrl}${params}`;
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

  // 1. Déduire l'état sémantique par défaut à partir des anciens paramètres (rétrocompatibilité)
  let computedState: MascotState = "DEFAULT";
  if (pose === "running") {
    computedState = "SPORT";
  } else if (expression === "crying" || pose === "sad") {
    computedState = "CRITICAL_STREAK";
  } else if (expression === "sweating" || outfit === "beach") {
    computedState = "WEATHER_HOT";
  } else if (outfit === "winter") {
    computedState = "WEATHER_COLD";
  }

  const finalState = state || computedState;
  const avatarUrl = getMascotUrl(characterId, finalState);

  // 2. Définir des animations physiques selon la pose
  const getAnimationProps = () => {
    switch (pose) {
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

  if (loadError) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-xs text-center p-3 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-2xl mb-1">🎭</span>
        <span className="capitalize">{characterId}</span>
        <span className="text-[10px] text-indigo-400 font-medium uppercase mt-1">
          {finalState}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      className={`relative select-none pointer-events-none flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      {...getAnimationProps()}
    >
      <img
        src={avatarUrl}
        alt={`${characterId} mascot (${finalState})`}
        onError={() => setLoadError(true)}
        className="w-full h-full object-contain rounded-2xl transition-all duration-300 ease-in-out"
      />
    </motion.div>
  );
}
