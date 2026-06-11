"use client";

import React from "react";
import { motion } from "framer-motion";
import { MannyMood } from "@/types";

interface SamsonProps {
  mood: MannyMood;
  size?: number;
  className?: string;
}

export default function Samson({ mood, size = 140, className = "" }: SamsonProps) {
  // Animation idle personnalisée pour Samson (léger gonflement des épaules / scale)
  const getAnimation = () => {
    switch (mood) {
      case "excited":
        return {
          y: [0, -4, 0, -3, 0],
          scale: [1, 1.04, 0.98, 1.02, 1],
          transition: {
            repeat: Infinity,
            duration: 0.8,
            ease: "easeInOut" as const,
          },
        };
      case "celebrating":
        return {
          y: [0, -14, 0, -6, 0],
          scaleY: [1, 0.88, 1.12, 0.96, 1],
          scaleX: [1, 1.08, 0.92, 1.04, 1],
          transition: {
            repeat: Infinity,
            duration: 1.3,
            ease: "easeInOut" as const,
          },
        };
      case "thinking":
        return {
          y: [0, -2, 0],
          rotate: [-1, 1, -1],
          transition: {
            repeat: Infinity,
            duration: 3.2,
            ease: "easeInOut" as const,
          },
        };
      case "encouraging":
        return {
          y: [0, -3, 0],
          scale: [1, 1.03, 1],
          transition: {
            repeat: Infinity,
            duration: 2.5,
            ease: "easeInOut" as const,
          },
        };
      case "happy":
      default:
        // Gonflement léger des épaules (scale léger)
        return {
          scale: [1, 1.02, 1],
          y: [0, -1.5, 0],
          transition: {
            repeat: Infinity,
            duration: 2.2,
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
      {/* Confettis pour célébration */}
      {mood === "celebrating" && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          <motion.div
            className="absolute w-2 h-2 bg-orange-500 rounded-sm"
            style={{ top: "10%", left: "15%" }}
            animate={{ y: [0, -20, 10], x: [0, -10], rotate: [0, 360], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeOut" }}
          />
          <motion.div
            className="absolute w-2 h-2 bg-red-500 rounded-full"
            style={{ top: "8%", right: "15%" }}
            animate={{ y: [0, -25, 8], x: [0, 12], rotate: [0, -360], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.3, delay: 0.2, ease: "easeOut" }}
          />
          <motion.div
            className="absolute w-2 h-2 bg-yellow-500 rounded-sm"
            style={{ bottom: "25%", right: "10%" }}
            animate={{ y: [0, -15, 15], x: [0, 8], rotate: [0, 180], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.4, ease: "easeOut" }}
          />
        </div>
      )}

      {/* SVG principal Samson */}
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
          {/* Dégradé du bouclier (orange à rouge) */}
          <linearGradient id="samsonShield" x1="40" y1="35" x2="120" y2="135" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="60%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>
          {/* Dégradé de l'acier pour les détails */}
          <linearGradient id="samsonSteel" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          {/* Dégradé des bras (teinte de peau dorée/héroïque) */}
          <linearGradient id="samsonSkin" x1="20" y1="50" x2="140" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FED7AA" />
            <stop offset="100%" stopColor="#FDBA74" />
          </linearGradient>
          {/* Ombre sous la mascotte */}
          <filter id="samsonShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* Ombre au sol */}
        <ellipse cx="80" cy="148" rx="46" ry="6" fill="#000" opacity="0.15" />

        {/* Corps et bras de Samson */}
        <g filter="url(#samsonShadow)">
          {/* BRAS GAUCHE (Musclé - Biceps) */}
          {mood === "celebrating" ? (
            // Bras levés en l'air
            <path d="M 45 80 C 30 70, 20 40, 35 30 C 45 23, 55 45, 52 70" fill="url(#samsonSkin)" stroke="#9a3412" strokeWidth="1.5" />
          ) : mood === "excited" ? (
            // Bras plié en force
            <path d="M 45 85 C 20 85, 10 60, 25 50 C 35 43, 40 68, 48 78" fill="url(#samsonSkin)" stroke="#9a3412" strokeWidth="1.5" />
          ) : (
            // Bras sur la hanche / normal
            <path d="M 45 85 C 25 90, 20 110, 32 120 C 40 125, 42 105, 48 90" fill="url(#samsonSkin)" stroke="#9a3412" strokeWidth="1.5" />
          )}

          {/* BRAS DROIT (Musclé - Biceps) */}
          {mood === "celebrating" ? (
            // Bras levés en l'air
            <path d="M 115 80 C 130 70, 140 40, 125 30 C 115 23, 105 45, 108 70" fill="url(#samsonSkin)" stroke="#9a3412" strokeWidth="1.5" />
          ) : mood === "excited" ? (
            // Bras plié en force
            <path d="M 115 85 C 140 85, 150 60, 135 50 C 125 43, 120 68, 112 78" fill="url(#samsonSkin)" stroke="#9a3412" strokeWidth="1.5" />
          ) : (
            // Bras sur la hanche / normal
            <path d="M 115 85 C 135 90, 140 110, 128 120 C 120 125, 118 105, 112 90" fill="url(#samsonSkin)" stroke="#9a3412" strokeWidth="1.5" />
          )}

          {/* Dessin des poings fermés */}
          {mood === "celebrating" && (
            <g>
              <circle cx="34" cy="28" r="6" fill="url(#samsonSkin)" stroke="#9a3412" strokeWidth="1" />
              <circle cx="126" cy="28" r="6" fill="url(#samsonSkin)" stroke="#9a3412" strokeWidth="1" />
            </g>
          )}
          {mood === "excited" && (
            <g>
              <circle cx="23" cy="48" r="6.5" fill="url(#samsonSkin)" stroke="#9a3412" strokeWidth="1" />
              <circle cx="137" cy="48" r="6.5" fill="url(#samsonSkin)" stroke="#9a3412" strokeWidth="1" />
            </g>
          )}
          {!["celebrating", "excited"].includes(mood) && (
            <g>
              <circle cx="32" cy="120" r="5.5" fill="url(#samsonSkin)" stroke="#9a3412" strokeWidth="1" />
              <circle cx="128" cy="120" r="5.5" fill="url(#samsonSkin)" stroke="#9a3412" strokeWidth="1" />
            </g>
          )}

          {/* CORPS : LE BOUCLIER CENTRAL */}
          <path
            d="M 45 40 Q 80 30 115 40 C 125 80, 115 120, 80 142 C 45 120, 35 80, 45 40 Z"
            fill="url(#samsonShield)"
            stroke="#7f1d1d"
            strokeWidth="2"
          />

          {/* BORDURE DE RENFORT DU BOUCLIER (Acier) */}
          <path
            d="M 45 40 Q 80 30 115 40 C 125 80, 115 120, 80 142 C 45 120, 35 80, 45 40 Z"
            stroke="url(#samsonSteel)"
            strokeWidth="6"
            fill="none"
            opacity="0.3"
          />

          {/* MOTIF DE CROIX / DÉTAIL D'ACIER AU CENTRE DU BOUCLIER */}
          <path d="M 80 35 L 80 135" stroke="url(#samsonSteel)" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
          <path d="M 42 85 L 118 85" stroke="url(#samsonSteel)" strokeWidth="3" opacity="0.4" strokeLinecap="round" />

          {/* VISAGE DE SAMSON (Yeux et bouche) */}
          <g transform="translate(0, 10)">
            {/* SOURCILS ÉPAIS (CARACTÈRE DE FORCE) */}
            {mood === "thinking" ? (
              <g>
                <path d="M 52 64 Q 65 55 74 65" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <path d="M 86 68 Q 95 72 108 65" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              </g>
            ) : mood === "excited" ? (
              <g>
                <path d="M 50 54 Q 65 44 75 56" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <path d="M 85 56 Q 95 44 110 54" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              </g>
            ) : (
              <g>
                <path d="M 52 60 Q 65 52 74 60" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <path d="M 86 60 Q 95 52 108 60" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              </g>
            )}

            {/* YEUX */}
            {mood === "happy" && (
              <g>
                {/* Yeux souriants et confiants */}
                <path d="M 56 74 Q 65 64 74 74" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M 86 74 Q 95 64 104 74" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="none" />
              </g>
            )}
            {mood === "excited" && (
              <g>
                {/* Grands yeux courageux */}
                <circle cx="63" cy="74" r="8" fill="#ffffff" />
                <circle cx="97" cy="74" r="8" fill="#ffffff" />
                <circle cx="63" cy="74" r="4.5" fill="#1e293b" />
                <circle cx="97" cy="74" r="4.5" fill="#1e293b" />
                <circle cx="61.5" cy="71.5" r="1.8" fill="#ffffff" />
                <circle cx="95.5" cy="71.5" r="1.8" fill="#ffffff" />
              </g>
            )}
            {mood === "encouraging" && (
              <g>
                {/* Yeux chaleureux */}
                <circle cx="63" cy="74" r="8.5" fill="#ffffff" />
                <circle cx="97" cy="74" r="8.5" fill="#ffffff" />
                <circle cx="63" cy="74" r="5" fill="#1e293b" />
                <circle cx="97" cy="74" r="5" fill="#1e293b" />
                <circle cx="61" cy="72" r="1.8" fill="#ffffff" />
                <circle cx="95" cy="72" r="1.8" fill="#ffffff" />
              </g>
            )}
            {mood === "celebrating" && (
              <g>
                {/* Yeux fermés satisfaits */}
                <path d="M 54 70 L 66 80 M 66 70 L 54 80" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M 94 70 L 106 80 M 106 70 L 94 80" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="none" />
              </g>
            )}
            {mood === "thinking" && (
              <g>
                {/* Yeux sceptiques */}
                <circle cx="62" cy="76" r="7.5" fill="#ffffff" />
                <path d="M 86 78 Q 96 70 106 78" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <circle cx="64" cy="76" r="4" fill="#1e293b" />
                <circle cx="95" cy="77" r="3" fill="#1e293b" />
              </g>
            )}

            {/* BOUCHE CONFIANTE */}
            {mood === "celebrating" ? (
              <path d="M 66 94 Q 80 114 94 94 Z" fill="#1e293b" stroke="#ffffff" strokeWidth="1.5" />
            ) : mood === "excited" ? (
              <path d="M 68 94 Q 80 112 92 94 Z" fill="#1e293b" stroke="#ffffff" strokeWidth="1.5" />
            ) : mood === "thinking" ? (
              <path d="M 72 98 L 88 95" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            ) : (
              // Un grand sourire franc de guerrier
              <path d="M 66 94 Q 80 108 94 94" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            )}
          </g>
        </g>
      </motion.svg>
    </div>
  );
}
