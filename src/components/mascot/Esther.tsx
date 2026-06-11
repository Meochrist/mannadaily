"use client";

import React from "react";
import { motion } from "framer-motion";
import { MannyMood } from "@/types";

interface EstherProps {
  mood: MannyMood;
  size?: number;
  className?: string;
}

export default function Esther({ mood, size = 140, className = "" }: EstherProps) {
  // Animation idle personnalisée pour Esther (légère oscillation + brillance de la couronne)
  const getAnimation = () => {
    switch (mood) {
      case "excited":
        return {
          y: [0, -5, 0, -3, 0],
          rotate: [-3, 3, -2, 2, -3, 3, 0],
          transition: {
            repeat: Infinity,
            duration: 0.9,
            ease: "easeInOut" as const,
          },
        };
      case "celebrating":
        return {
          y: [0, -12, 0, -5, 0],
          scale: [1, 1.05, 0.96, 1.02, 1],
          rotate: [-1, 1, -1, 1, 0],
          transition: {
            repeat: Infinity,
            duration: 1.4,
            ease: "easeInOut" as const,
          },
        };
      case "thinking":
        return {
          y: [0, -2, 0],
          rotate: [-2, 2, -2],
          transition: {
            repeat: Infinity,
            duration: 3.6,
            ease: "easeInOut" as const,
          },
        };
      case "encouraging":
        return {
          y: [0, -3, 0],
          scale: [1, 1.02, 1],
          transition: {
            repeat: Infinity,
            duration: 2.8,
            ease: "easeInOut" as const,
          },
        };
      case "happy":
      default:
        // Animation idle : légère oscillation (rotation) + flottement
        return {
          y: [0, -4, 0],
          rotate: [-1.5, 1.5, -1.5],
          transition: {
            repeat: Infinity,
            duration: 3.0,
            ease: "easeInOut" as const,
          },
        };
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Lueur de fond royale (brillance/halo rose/violet) */}
      <motion.div
        className="absolute inset-4 bg-fuchsia-400/15 rounded-full blur-xl pointer-events-none"
        animate={{
          scale: mood === "excited" ? [1, 1.25, 1] : [0.9, 1.1, 0.9],
          opacity: mood === "celebrating" ? [0.4, 0.8, 0.4] : [0.3, 0.6, 0.3]
        }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
      />

      {/* Petits éclats/étincelles dorées au-dessus de la couronne */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        <motion.span
          className="absolute text-yellow-400 font-bold text-xs"
          style={{ top: "10%", left: "30%" }}
          animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0], rotate: [0, 90] }}
          transition={{ repeat: Infinity, duration: 2.0, delay: 0.2 }}
        >
          ✦
        </motion.span>
        <motion.span
          className="absolute text-fuchsia-300 font-bold text-sm"
          style={{ top: "6%", right: "32%" }}
          animate={{ scale: [0, 1.4, 0], opacity: [0, 1, 0], rotate: [0, -90] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: 0.8 }}
        >
          ✧
        </motion.span>
      </div>

      {/* SVG principal d'Esther */}
      <motion.svg
        width="100%"
        height="100%"
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={getAnimation()}
        className="overflow-visible"
      >
        <defs>
          {/* Dégradé de la robe de la princesse (violet royal) */}
          <linearGradient id="estherDress" x1="40" y1="90" x2="120" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="60%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>
          {/* Dégradé des cheveux d'Esther (rose à fuchsia) */}
          <linearGradient id="estherHair" x1="20" y1="40" x2="140" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#BE185D" />
          </linearGradient>
          {/* Dégradé doré de la couronne */}
          <linearGradient id="estherGold" x1="50" y1="15" x2="110" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          {/* Teinte de peau gracieuse */}
          <linearGradient id="estherSkin" x1="50" y1="50" x2="110" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF1F2" />
            <stop offset="100%" stopColor="#FFE4E6" />
          </linearGradient>
          {/* Filtre d'ombre douce */}
          <filter id="estherShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#4C1D95" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Ombre au sol */}
        <ellipse cx="80" cy="148" rx="38" ry="5.5" fill="#000" opacity="0.12" />

        {/* Corps entier gracieusement orné d'Esther */}
        <g filter="url(#estherShadow)">
          {/* CHEVEUX ARRIÈRE */}
          <path
            d="M 35 75 C 20 90, 25 130, 40 135 C 55 140, 60 120, 60 100 C 60 80, 45 72, 35 75 Z"
            fill="url(#estherHair)"
            opacity="0.9"
          />
          <path
            d="M 125 75 C 140 90, 135 130, 120 135 C 105 140, 100 120, 100 100 C 100 80, 115 72, 125 75 Z"
            fill="url(#estherHair)"
            opacity="0.9"
          />

          {/* ROBE ROYALE / BUSTE */}
          <path
            d="M 46 120 C 46 110, 56 95, 80 95 C 104 95, 114 110, 114 120 L 118 140 C 118 144, 110 146, 80 146 C 50 146, 42 144, 42 140 Z"
            fill="url(#estherDress)"
            stroke="#6d28d9"
            strokeWidth="1.2"
          />
          {/* Col en V doré élégant */}
          <path d="M 64 96 L 80 112 L 96 96" stroke="url(#estherGold)" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Médaille / Collier rose au centre */}
          <circle cx="80" cy="116" r="3.5" fill="#EC4899" stroke="#FEF08A" strokeWidth="0.8" />

          {/* VISAGE OVALE ÉLÉGANT */}
          <path
            d="M 48 78 C 48 56, 52 50, 80 50 C 108 50, 112 56, 112 78 C 112 100, 104 106, 80 106 C 56 106, 48 100, 48 78 Z"
            fill="url(#estherSkin)"
            stroke="#fda4af"
            strokeWidth="1"
          />

          {/* CHEVEUX AVANT (Frange gracieuse encadrant le visage) */}
          <path
            d="M 45 74 C 40 54, 52 40, 80 40 C 108 40, 120 54, 115 74 C 110 65, 102 54, 88 56 C 75 58, 62 58, 45 74 Z"
            fill="url(#estherHair)"
          />
          {/* Mèches de cheveux ondulées qui descendent devant les épaules */}
          <path d="M 48 72 Q 40 92, 45 110" stroke="url(#estherHair)" strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <path d="M 112 72 Q 120 92, 115 110" stroke="url(#estherHair)" strokeWidth="6.5" strokeLinecap="round" fill="none" />

          {/* LA COURONNE ROYALE DORÉE */}
          <g transform="translate(0, -2)">
            {/* Base de la couronne */}
            <path d="M 52 42 Q 80 37, 108 42 L 105 48 Q 80 44, 55 48 Z" fill="url(#estherGold)" stroke="#d97706" strokeWidth="0.8" />
            {/* Pointes de la couronne (5 branches) */}
            <path
              d="M 54 44 L 52 28 L 65 39 L 80 16 L 95 39 L 108 28 L 106 44 Z"
              fill="url(#estherGold)"
              stroke="#d97706"
              strokeWidth="1"
            />
            {/* Joyaux de la couronne (Gemmes roses/violettes) */}
            <circle cx="52" cy="28" r="2.8" fill="#EC4899" stroke="#FFFFFF" strokeWidth="0.5" />
            <circle cx="80" cy="16" r="3.8" fill="#EC4899" stroke="#FFFFFF" strokeWidth="0.8" />
            <circle cx="108" cy="28" r="2.8" fill="#EC4899" stroke="#FFFFFF" strokeWidth="0.5" />
            <circle cx="68" cy="44" r="1.8" fill="#8B5CF6" />
            <circle cx="80" cy="42" r="2.2" fill="#EC4899" />
            <circle cx="92" cy="44" r="1.8" fill="#8B5CF6" />
          </g>

          {/* VISAGE : EXPRESSIONS GRACIEUSES SELON L'HUMEUR */}
          <g transform="translate(0, 5)">
            {/* CILS & YEUX */}
            {mood === "happy" && (
              <g>
                {/* Yeux mi-clos rieurs et cils fins */}
                <path d="M 58 76 Q 66 69 74 76" stroke="#4C1D95" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M 86 76 Q 94 69 102 76" stroke="#4C1D95" strokeWidth="3" strokeLinecap="round" fill="none" />
                {/* Petits cils extérieurs */}
                <path d="M 56 73 L 53 76" stroke="#4C1D95" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 104 73 L 107 76" stroke="#4C1D95" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            )}
            {mood === "excited" && (
              <g>
                {/* Yeux brillants ouverts */}
                <circle cx="65" cy="74" r="7.5" fill="#FFFFFF" />
                <circle cx="95" cy="74" r="7.5" fill="#FFFFFF" />
                <circle cx="65" cy="74" r="4.5" fill="#4C1D95" />
                <circle cx="95" cy="74" r="4.5" fill="#4C1D95" />
                {/* Reflets brillants */}
                <circle cx="63.5" cy="71.5" r="1.8" fill="#FFFFFF" />
                <circle cx="93.5" cy="71.5" r="1.8" fill="#FFFFFF" />
              </g>
            )}
            {mood === "encouraging" && (
              <g>
                {/* Yeux fermés bienveillants */}
                <path d="M 58 75 Q 66 79 74 75" stroke="#4C1D95" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M 86 75 Q 94 79 102 75" stroke="#4C1D95" strokeWidth="3" strokeLinecap="round" fill="none" />
              </g>
            )}
            {mood === "celebrating" && (
              <g>
                {/* Arcs d'yeux joyeux */}
                <path d="M 57 73 Q 65 65 73 73" stroke="#4C1D95" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                <path d="M 87 73 Q 95 65 103 73" stroke="#4C1D95" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                <path d="M 55 72 L 52 75" stroke="#4C1D95" strokeWidth="1.5" />
                <path d="M 105 72 L 108 75" stroke="#4C1D95" strokeWidth="1.5" />
              </g>
            )}
            {mood === "thinking" && (
              <g>
                {/* Un oeil ouvert pensif, l'autre mi-clos */}
                <circle cx="65" cy="74" r="7" fill="#FFFFFF" />
                <circle cx="66" cy="73" r="4.2" fill="#4C1D95" />
                <path d="M 86 76 Q 94 70 102 76" stroke="#4C1D95" strokeWidth="3" strokeLinecap="round" fill="none" />
              </g>
            )}

            {/* SOURCILS FINS */}
            <path d="M 55 64 Q 65 59 73 63" stroke="#EC4899" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M 87 63 Q 95 59 105 64" stroke="#EC4899" strokeWidth="1.8" strokeLinecap="round" fill="none" />

            {/* BOUCHE DÉLICATE */}
            {mood === "celebrating" ? (
              <path d="M 72 90 Q 80 102 88 90 Z" fill="#4C1D95" />
            ) : mood === "excited" ? (
              <ellipse cx="80" cy="92" rx="4.5" ry="6" fill="#4C1D95" />
            ) : mood === "thinking" ? (
              <path d="M 76 93 Q 80 91 84 92" stroke="#4C1D95" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            ) : (
              // Un joli sourire délicat
              <path d="M 70 90 Q 80 98 90 90" stroke="#4C1D95" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            )}

            {/* JOUES ROSES DE PRINCESSE */}
            <circle cx="54" cy="83" r="4" fill="#FDA4AF" opacity="0.6" />
            <circle cx="106" cy="83" r="4" fill="#FDA4AF" opacity="0.6" />
          </g>
        </g>
      </motion.svg>
    </div>
  );
}
