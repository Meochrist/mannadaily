"use client";

import React from "react";
import { motion } from "framer-motion";
import { MannyMood } from "@/types";

interface NoeProps {
  mood: MannyMood;
  size?: number;
  className?: string;
}

export default function Noe({ mood, size = 140, className = "" }: NoeProps) {
  // Animation idle personnalisée pour Noé (bercement lent et paisible)
  const getAnimation = () => {
    switch (mood) {
      case "excited":
        return {
          y: [0, -3, 0, -2, 0],
          rotate: [-1, 1, -1, 1, 0],
          transition: {
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut" as const,
          },
        };
      case "celebrating":
        return {
          y: [0, -8, 0, -4, 0],
          scaleY: [1, 0.94, 1.06, 0.98, 1],
          rotate: [-1.5, 1.5, -1.5, 1.5, 0],
          transition: {
            repeat: Infinity,
            duration: 1.8,
            ease: "easeInOut" as const,
          },
        };
      case "thinking":
        return {
          rotate: [-1.5, 1.5, -1.5],
          y: [0, -1, 0],
          transition: {
            repeat: Infinity,
            duration: 4.5,
            ease: "easeInOut" as const,
          },
        };
      case "encouraging":
        return {
          y: [0, -2, 0],
          scale: [1, 1.02, 1],
          transition: {
            repeat: Infinity,
            duration: 3.5,
            ease: "easeInOut" as const,
          },
        };
      case "happy":
      default:
        // Bercement très lent et apaisant
        return {
          rotate: [-2, 2, -2],
          y: [0, -1.5, 0],
          transition: {
            repeat: Infinity,
            duration: 4.0,
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
      {/* Colombe de la paix planant au-dessus de Noé dans certains modes */}
      {["happy", "encouraging", "celebrating"].includes(mood) && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          <motion.svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="absolute"
            style={{ top: "8%", right: "12%" }}
            animate={{
              y: [0, -5, 0],
              x: [0, 4, 0],
              scale: mood === "celebrating" ? [1, 1.2, 1] : [1, 1.05, 1]
            }}
            transition={{ repeat: Infinity, duration: 3.0, ease: "easeInOut" }}
          >
            {/* Silhouette simple de colombe blanche */}
            <path
              d="M 12 6 C 10 6, 6 8, 4 11 C 6 11, 8 10, 10 9 C 9 11, 8 13, 9 15 C 11 13, 13 10, 14 8 C 16 9, 18 11, 20 10 C 18 8, 14 6, 12 6 Z"
              fill="#FFFFFF"
              stroke="#0891B2"
              strokeWidth="0.8"
            />
            <circle cx="11" cy="7.5" r="0.5" fill="#0891B2" />
          </motion.svg>
        </div>
      )}

      {/* SVG principal Noé */}
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
          {/* Tunique bleu de Noé */}
          <linearGradient id="noeDress" x1="45" y1="80" x2="115" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="60%" stopColor="#0369A1" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>
          {/* Barbe nuageuse blanc/bleu très clair */}
          <linearGradient id="noeBeard" x1="50" y1="65" x2="110" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F0F9FF" />
            <stop offset="100%" stopColor="#E0F2FE" />
          </linearGradient>
          {/* Capuche / Manteau extérieur */}
          <linearGradient id="noeCoat" x1="30" y1="50" x2="130" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0891B2" />
            <stop offset="100%" stopColor="#155E75" />
          </linearGradient>
          {/* Teinte de peau sage */}
          <linearGradient id="noeSkin" x1="60" y1="45" x2="100" y2="75" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFEDD5" />
            <stop offset="100%" stopColor="#FED7AA" />
          </linearGradient>
          {/* Ombre portée */}
          <filter id="noeShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#0F172A" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Ombre au sol lente */}
        <ellipse cx="80" cy="148" rx="42" ry="5.5" fill="#000" opacity="0.13" />

        {/* Noé complet */}
        <g filter="url(#noeShadow)">
          {/* BÂTON DE BERGER EN BOIS (CÔTÉ DROIT OU GAUCHE) */}
          <g transform="translate(122, 50)">
            {/* Le bâton incurvé en haut */}
            <path
              d="M 5 95 L 5 15 C 5 5, -5 -2, -8 5"
              stroke="#78350F"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Lignes de texture bois */}
            <path d="M 5 80 L 5 40" stroke="#451a03" strokeWidth="1" opacity="0.3" />
          </g>

          {/* MANTEAU EXTÉRIEUR / CAPUCHE */}
          <path
            d="M 40 145 L 44 85 C 44 50, 50 42, 80 42 C 110 42, 116 50, 116 85 L 120 145 Z"
            fill="url(#noeCoat)"
            stroke="#0e7490"
            strokeWidth="1"
          />

          {/* TUNIQUE INTÉRIEURE */}
          <path d="M 58 80 L 80 55 L 102 80 L 98 145 L 62 145 Z" fill="url(#noeDress)" />

          {/* VISAGE SAGE */}
          <path
            d="M 58 68 C 58 50, 62 48, 80 48 C 98 48, 102 50, 102 68 C 102 75, 96 82, 80 82 C 64 82, 58 75, 58 68 Z"
            fill="url(#noeSkin)"
            stroke="#ffedd5"
            strokeWidth="0.8"
          />

          {/* CHEVEUX BLANCS SUR LES CÔTÉS */}
          <circle cx="56" cy="62" r="7" fill="#FFFFFF" />
          <circle cx="104" cy="62" r="7" fill="#FFFFFF" />
          <circle cx="53" cy="70" r="6.5" fill="#E0F2FE" />
          <circle cx="107" cy="70" r="6.5" fill="#E0F2FE" />

          {/* SOURCILS ÉPAIS DE GRAND-PÈRE BLANCS */}
          <path d="M 58 55 Q 68 50 74 56" stroke="#FFFFFF" strokeWidth="3.8" strokeLinecap="round" fill="none" />
          <path d="M 86 56 Q 92 50 102 55" stroke="#FFFFFF" strokeWidth="3.8" strokeLinecap="round" fill="none" />

          {/* YEUX PAISIBLES */}
          {mood === "excited" ? (
            <g>
              {/* Petits cercles bienveillants ouverts */}
              <circle cx="65" cy="66" r="4.5" fill="#1e293b" />
              <circle cx="95" cy="66" r="4.5" fill="#1e293b" />
              <circle cx="66" cy="64.5" r="1.2" fill="#FFFFFF" />
              <circle cx="96" cy="64.5" r="1.2" fill="#FFFFFF" />
            </g>
          ) : mood === "celebrating" ? (
            <g>
              {/* Yeux en arcs rieurs très fermés */}
              <path d="M 60 63 L 70 71 M 70 63 L 60 71" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
              <path d="M 90 63 L 100 71 M 100 63 L 90 71" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
            </g>
          ) : (
            // Happy / Encouraging / Thinking (yeux fermés souriants)
            <g>
              <path d="M 60 67 Q 67 73 74 67" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 86 67 Q 93 73 100 67" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* L'IMMENSE BARBE DE PATRIARCHE (Sertie sur le visage et descendant bas) */}
          <path
            d="M 52 74 C 52 74, 45 95, 48 115 C 52 135, 62 144, 80 144 C 98 144, 108 135, 112 115 C 115 95, 108 74, 108 74 Q 80 88, 52 74 Z"
            fill="url(#noeBeard)"
            stroke="#bae6fd"
            strokeWidth="1.2"
          />

          {/* Détails de vagues de la barbe */}
          <path d="M 60 90 Q 70 115, 76 130" stroke="#bae6fd" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.8" />
          <path d="M 100 90 Q 90 115, 84 130" stroke="#bae6fd" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.8" />
          <path d="M 80 84 L 80 135" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />

          {/* MOUSTACHE ET PETITE BOUCHE */}
          <path
            d="M 68 81 C 72 78, 88 78, 92 81 C 88 84, 72 84, 68 81 Z"
            fill="#FFFFFF"
            stroke="#bae6fd"
            strokeWidth="0.8"
          />
          {mood === "celebrating" || mood === "excited" ? (
            <ellipse cx="80" cy="85" rx="3.5" ry="4.5" fill="#1e293b" />
          ) : (
            <path d="M 77 84 Q 80 87 83 84" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" fill="none" />
          )}

          {/* PETITES JOUES ROSES SOUFFLÉES DE SAGE */}
          <circle cx="56" cy="74" r="4.2" fill="#FCA5A5" opacity="0.5" />
          <circle cx="104" cy="74" r="4.2" fill="#FCA5A5" opacity="0.5" />

          {/* PETITE MAIN SUR LE BÂTON */}
          <circle cx="120" cy="82" r="5" fill="#FED7AA" stroke="#78350F" strokeWidth="0.8" />
        </g>
      </motion.svg>
    </div>
  );
}
