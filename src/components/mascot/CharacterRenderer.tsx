"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface CharacterRendererProps {
  characterId: string;
  pose: "idle" | "jumping" | "sad" | "running";
  expression: "neutral" | "happy" | "sweating" | "crying";
  outfit: "default" | "winter" | "beach" | "halloween";
  size?: number;
  className?: string;
}

export default function CharacterRenderer({
  characterId,
  pose,
  expression,
  outfit,
  size = 150,
  className = "",
}: CharacterRendererProps) {
  const [loadError, setLoadError] = useState(false);

  // Formater les identifiants pour correspondre à nos dossiers
  const charId = characterId.toLowerCase();
  const basePath = `/assets/characters/${charId}`;

  // Définir des animations selon la pose
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
    // Rempli de secours simple et élégant s'il y a un souci de chargement d'image
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-xs text-center p-3 ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-2xl mb-1">🎭</span>
        <span>{characterId}</span>
        <span className="text-[10px] text-indigo-400 font-medium capitalize">
          {pose} - {expression}
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
      {/* 1. Couche du corps / de la pose */}
      <img
        src={`${basePath}/pose_${pose}.svg`}
        alt={`${characterId} body (${pose})`}
        onError={() => setLoadError(true)}
        className="absolute inset-0 w-full h-full object-contain z-10"
      />

      {/* 2. Couche du visage / de l'expression */}
      <img
        src={`${basePath}/expression_${expression}.svg`}
        alt={`${characterId} face (${expression})`}
        className="absolute inset-0 w-full h-full object-contain z-20"
      />

      {/* 3. Couche du vêtement / de l'outfit (sauf si default) */}
      {outfit !== "default" && (
        <img
          src={`${basePath}/outfit_${outfit}.svg`}
          alt={`${characterId} outfit (${outfit})`}
          className="absolute inset-0 w-full h-full object-contain z-30"
        />
      )}
    </motion.div>
  );
}
