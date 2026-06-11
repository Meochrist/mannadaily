"use client";

import React from "react";
import { motion } from "framer-motion";
import { MannyMood } from "@/types";

interface GedeonProps {
  mood: MannyMood;
  size?: number;
  className?: string;
}

export default function Gedeon({ mood, size = 140, className = "" }: GedeonProps) {
  // Animation idle personnalisée pour Gédéon (léger tremblement / frisson nerveux constant)
  const getAnimation = () => {
    switch (mood) {
      case "excited":
        return {
          x: [-1.5, 1.5, -1, 1, -1.5, 1.5, 0],
          y: [0, -6, 0, -4, 0],
          transition: {
            repeat: Infinity,
            duration: 0.6,
            ease: "easeInOut" as const,
          },
        };
      case "celebrating":
        return {
          y: [0, -11, 0, -5, 0],
          scaleY: [1, 0.86, 1.14, 0.96, 1],
          scaleX: [1, 1.08, 0.92, 1.04, 1],
          x: [-1, 1, -1, 1, 0],
          transition: {
            repeat: Infinity,
            duration: 1.2,
            ease: "easeInOut" as const,
          },
        };
      case "thinking":
        return {
          // Tremblement de pensée très discret
          x: [-0.5, 0.5, -0.5, 0.5, 0],
          y: [0, -1.5, 0],
          transition: {
            repeat: Infinity,
            duration: 1.8,
            ease: "easeInOut" as const,
          },
        };
      case "encouraging":
        return {
          x: [-0.8, 0.8, -0.8, 0.8, 0],
          y: [0, -3, 0],
          scale: [1, 1.025, 1],
          transition: {
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut" as const,
          },
        };
      case "happy":
      default:
        // Tremblement nerveux constant en idle
        return {
          x: [-1.2, 1.2, -0.8, 0.8, -1.2, 1.2, 0],
          y: [-0.6, 0.6, -0.4, 0.4, 0],
          transition: {
            repeat: Infinity,
            duration: 0.7,
            ease: "linear" as const,
          },
        };
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Petits éclats de stress / gouttes de sueur pour Gédéon anxieux */}
      {["happy", "thinking", "excited"].includes(mood) && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          <motion.div
            className="absolute w-1.5 h-3 bg-sky-300 rounded-full"
            style={{ top: "30%", left: "18%" }}
            animate={{ y: [0, 8], opacity: [0, 0.7, 0], scale: [0.6, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, delay: 0.2, ease: "easeIn" }}
          />
          <motion.div
            className="absolute w-1.5 h-3 bg-sky-300 rounded-full"
            style={{ top: "35%", right: "20%" }}
            animate={{ y: [0, 8], opacity: [0, 0.7, 0], scale: [0.6, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, delay: 1.1, ease: "easeIn" }}
          />
        </div>
      )}

      {/* SVG principal de Gédéon */}
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
          {/* Dégradé du casque (doré ambre) */}
          <linearGradient id="gedeonArmor" x1="45" y1="20" x2="115" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="60%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
          {/* Dégradé du grand bouclier protecteur */}
          <linearGradient id="gedeonShield" x1="30" y1="75" x2="130" y2="145" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="60%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          {/* Plumet du casque (orange vif) */}
          <linearGradient id="gedeonPlume" x1="60" y1="5" x2="100" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
          {/* Filtre d'ombre portée */}
          <filter id="gedeonShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#78350F" floodOpacity="0.16" />
          </filter>
        </defs>

        {/* Ombre au sol (qui vibre un peu moins) */}
        <ellipse cx="80" cy="148" rx="36" ry="5" fill="#000" opacity="0.14" />

        {/* Gédéon complet */}
        <g filter="url(#gedeonShadow)">
          {/* PLUMET DE CASQUE ROUGE/ORANGE (AU-DESSUS) */}
          <path
            d="M 68 30 C 58 10, 85 2, 98 12 C 104 18, 92 30, 92 30 Z"
            fill="url(#gedeonPlume)"
            stroke="#b91c1c"
            strokeWidth="0.8"
          />

          {/* PETIT CORPS DE SOLDAT (Tunique jaune foncé) */}
          <rect x="65" y="78" width="30" height="50" rx="6" fill="#B45309" />
          {/* Petites jambes */}
          <rect x="70" y="125" width="6" height="18" rx="3" fill="#78350F" />
          <rect x="84" y="125" width="6" height="18" rx="3" fill="#78350F" />
          <path d="M 66 141 L 76 141 C 78 141, 78 144, 76 144 L 66 144 Z" fill="#D97706" />
          <path d="M 84 141 L 94 141 C 96 141, 96 144, 94 144 L 84 144 Z" fill="#D97706" />

          {/* LE CASQUE GÉANT (Trop grand pour lui, cachant le haut de la tête) */}
          <path
            d="M 45 68 C 45 42, 55 32, 80 32 C 105 32, 115 42, 115 68 C 115 72, 110 74, 80 74 C 50 74, 45 72, 45 68 Z"
            fill="url(#gedeonArmor)"
            stroke="#78350F"
            strokeWidth="1.2"
          />
          {/* Crête métallique du casque */}
          <path d="M 77 32 L 80 20 L 83 32 Z" fill="url(#gedeonArmor)" stroke="#78350F" strokeWidth="0.8" />
          {/* Visière nasale du casque (caractéristique) */}
          <rect x="77" y="65" width="6" height="18" rx="1.5" fill="#B45309" opacity="0.9" />

          {/* LES YEUX ANXIEUX ÉCARQUILLÉS (Juste en dessous du casque) */}
          <g transform="translate(0, 4)">
            {/* Oeil gauche */}
            <circle cx="62" cy="74" r="11" fill="#FFFFFF" stroke="#78350F" strokeWidth="1" />
            {/* Oeil droit */}
            <circle cx="98" cy="74" r="11" fill="#FFFFFF" stroke="#78350F" strokeWidth="1" />

            {/* Pupilles (petits points noirs de panique) */}
            {mood === "excited" ? (
              <g>
                <circle cx="62" cy="74" r="3" fill="#1e293b" />
                <circle cx="98" cy="74" r="3" fill="#1e293b" />
              </g>
            ) : mood === "thinking" ? (
              <g>
                <circle cx="60" cy="73" r="4.5" fill="#1e293b" />
                <circle cx="96" cy="73" r="4.5" fill="#1e293b" />
              </g>
            ) : (
              // Happy / Default / Encouraging
              <g>
                <circle cx="62" cy="74" r="4.5" fill="#1e293b" />
                <circle cx="98" cy="74" r="4.5" fill="#1e293b" />
                <circle cx="63.5" cy="72.5" r="1.5" fill="#FFFFFF" />
                <circle cx="99.5" cy="72.5" r="1.5" fill="#FFFFFF" />
              </g>
            )}

            {/* SOURCILS CRISPÉS */}
            {mood === "happy" ? (
              <g>
                <path d="M 54 59 Q 62 56 70 60" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M 90 60 Q 98 56 106 59" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
              </g>
            ) : (
              // Inclinés d'anxiété (V inversé)
              <g>
                <path d="M 52 58 Q 63 62 70 56" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M 90 56 Q 97 62 108 58" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </g>
            )}
          </g>

          {/* LE GRAND BOUCLIER DE PROTECTION (Cachant sa bouche et son corps) */}
          <path
            d="M 32 80 C 32 80, 80 75, 128 80 C 128 115, 110 138, 80 145 C 50 138, 32 115, 32 80 Z"
            fill="url(#gedeonShield)"
            stroke="#92400E"
            strokeWidth="1.8"
          />

          {/* Décoration en croix du bouclier */}
          <path d="M 80 77 L 80 143" stroke="#FBBF24" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
          <path d="M 35 102 C 35 102, 80 98, 125 102" stroke="#FBBF24" strokeWidth="2" opacity="0.6" strokeLinecap="round" />

          {/* PETITES MAINS JAUNES AGRIFFÉES AU BOUCLIER */}
          <circle cx="34" cy="88" r="4.5" fill="#FDBA74" stroke="#78350F" strokeWidth="0.8" />
          <circle cx="126" cy="88" r="4.5" fill="#FDBA74" stroke="#78350F" strokeWidth="0.8" />

          {/* PETITE BOUCHE TIMIDE (visible si célébration ou excité juste au-dessus du bouclier) */}
          {(mood === "celebrating" || mood === "excited") && (
            <path d="M 74 81 Q 80 88 86 81" stroke="#78350F" strokeWidth="2" strokeLinecap="round" fill="none" />
          )}
        </g>
      </motion.svg>
    </div>
  );
}
