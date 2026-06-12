"use client";

import React, { useEffect, useState } from "react";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";

export type RiveMascotState =
  | "SPORT"
  | "WEATHER_HOT"
  | "WEATHER_COLD"
  | "NIGHT_MODE"
  | "CRITICAL_STREAK"
  | "DEFAULT";

interface RiveRendererProps {
  characterId: string;
  pose?: "idle" | "jumping" | "sad" | "running";
  expression?: "neutral" | "happy" | "sweating" | "crying";
  outfit?: "default" | "winter" | "beach" | "halloween";
  state?: RiveMascotState;
  size?: number;
  className?: string;
  onFallback: () => void;
}

export default function RiveRenderer({
  characterId,
  pose = "idle",
  expression = "neutral",
  outfit = "default",
  state = "DEFAULT",
  size = 150,
  className = "",
  onFallback,
}: RiveRendererProps) {
  const charId = characterId.toLowerCase();
  const [isReady, setIsReady] = useState(false);

  // Initialisation de Rive avec le fichier du personnage
  // Chaque personnage a son propre fichier d'animation .riv (ex: manny.riv)
  const { rive, RiveComponent } = useRive({
    src: `/assets/characters/${charId}/character.riv`,
    stateMachines: "State Machine 1", // Nom standardisé de la machine d'état Rive
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    onLoad: () => {
      setIsReady(true);
    },
    onLoadError: () => {
      console.warn(`[Rive] Fichier d'animation non trouvé pour ${charId}. Repli sur les SVG locaux.`);
      onFallback();
    },
  });

  // Mettre à jour les inputs de la machine d'états Rive
  useEffect(() => {
    if (!rive || !isReady) return;

    // Récupérer tous les inputs de la machine d'états
    const inputs = rive.stateMachineInputs("State Machine 1");
    if (!inputs) return;

    // 1. Mise à jour de l'état global sémantique (String ou Number)
    const stateInput = inputs.find((i) => i.name === "state");
    if (stateInput) {
      stateInput.value = state;
    }

    // 2. Mise à jour de la pose (si la machine d'état prend en charge les contrôles fins)
    const poseInput = inputs.find((i) => i.name === "pose");
    if (poseInput) {
      poseInput.value = pose;
    }

    // 3. Mise à jour de l'expression
    const expressionInput = inputs.find((i) => i.name === "expression");
    if (expressionInput) {
      expressionInput.value = expression;
    }

    // 4. Mise à jour de la tenue
    const outfitInput = inputs.find((i) => i.name === "outfit");
    if (outfitInput) {
      outfitInput.value = outfit;
    }
  }, [rive, isReady, state, pose, expression, outfit]);

  return (
    <div
      className={`relative select-none pointer-events-none flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <RiveComponent className="w-full h-full object-contain" />
    </div>
  );
}
