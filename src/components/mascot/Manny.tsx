"use client";

import React from "react";
import { motion } from "framer-motion";
import { MannyMood } from "@/types";

interface MannyProps {
  mood: MannyMood;
  size?: number;
  className?: string;
}

export default function Manny({ mood, size = 140, className = "" }: MannyProps) {
  // Définition des animations de flottement et de mouvements physiques de la Bible selon l'humeur
  const getAnimation = () => {
    switch (mood) {
      case "excited":
        return {
          y: [0, -4, 0, -3, 0],
          x: [-1.5, 1.5, -1, 1, -1.5, 1.5, 0],
          rotate: [-2, 2, -1, 1, -2, 2, 0],
          transition: {
            repeat: Infinity,
            duration: 0.6,
            ease: "easeInOut" as const,
          },
        };
      case "celebrating":
        return {
          y: [0, -18, 0, -8, 0],
          scaleY: [1, 0.85, 1.15, 0.95, 1],
          scaleX: [1, 1.1, 0.9, 1.05, 1],
          transition: {
            repeat: Infinity,
            duration: 1.4,
            ease: "easeInOut" as const,
          },
        };
      case "sleeping":
        return {
          y: [0, -3, 0],
          rotate: [-3, 3, -3],
          transition: {
            repeat: Infinity,
            duration: 4.5,
            ease: "easeInOut" as const,
          },
        };
      case "praying":
        return {
          y: [0, -2, 0],
          scale: [1, 1.015, 1],
          transition: {
            repeat: Infinity,
            duration: 5,
            ease: "easeInOut" as const,
          },
        };
      case "thinking":
        return {
          y: [0, -3, 0],
          transition: {
            repeat: Infinity,
            duration: 3.5,
            ease: "easeInOut" as const,
          },
        };
      case "encouraging":
        return {
          y: [0, -4, 0],
          scale: [1, 1.03, 1],
          transition: {
            repeat: Infinity,
            duration: 2.8,
            ease: "easeInOut" as const,
          },
        };
      case "happy":
      default:
        return {
          y: [0, -5, 0],
          transition: {
            repeat: Infinity,
            duration: 3,
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
      {/* 1. LUEUR DE FOND POUR LE MODE PRIÈRE (PRAYING) */}
      {mood === "praying" && (
        <motion.div
          className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"
          animate={{ scale: [0.85, 1.25, 0.85], opacity: [0.35, 0.75, 0.35] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" as const }}
        />
      )}

      {/* 2. CONFETTIS ANIMÉS POUR LE MODE CÉLÉBRATION (CELEBRATING) */}
      {mood === "celebrating" && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {/* Confetti Rose Gauche Haut */}
          <motion.div
            className="absolute w-2.5 h-2.5 bg-pink-500 rounded-sm"
            style={{ top: "15%", left: "10%" }}
            animate={{ y: [0, -25, 15], x: [0, -12, -6], rotate: [0, 360], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, delay: 0.1, ease: "easeOut" }}
          />
          {/* Confetti Jaune Droite Haut */}
          <motion.div
            className="absolute w-2.5 h-2.5 bg-yellow-400 rounded-full"
            style={{ top: "10%", right: "12%" }}
            animate={{ y: [0, -30, 10], x: [0, 15, 8], rotate: [0, -360], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, delay: 0.3, ease: "easeOut" }}
          />
          {/* Confetti Bleu Gauche Bas */}
          <motion.div
            className="absolute w-2 h-3 bg-blue-400 rounded-sm"
            style={{ bottom: "25%", left: "5%" }}
            animate={{ y: [0, -20, 20], x: [0, -8, -12], rotate: [0, 180], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, delay: 0.5, ease: "easeOut" }}
          />
          {/* Confetti Vert Droite Bas */}
          <motion.div
            className="absolute w-3 h-2 bg-emerald-400 rounded-sm"
            style={{ bottom: "20%", right: "8%" }}
            animate={{ y: [0, -22, 18], x: [0, 12, 6], rotate: [0, 270], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.2, ease: "easeOut" }}
          />
          {/* Confetti Violet Centre Haut */}
          <motion.div
            className="absolute w-2 h-2 bg-purple-400 rounded-full"
            style={{ top: "5%", left: "45%" }}
            animate={{ y: [0, -35, 5], x: [0, 5, -5], scale: [0.8, 1.2, 0.8], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.7, delay: 0.6, ease: "easeOut" }}
          />
        </div>
      )}

      {/* 3. EFFET ZZZ POUR LE MODE DODO (SLEEPING) */}
      {mood === "sleeping" && (
        <div className="absolute -top-7 right-3 pointer-events-none flex flex-col space-y-1">
          <motion.span
            className="text-xs font-bold text-slate-400/90 select-none"
            animate={{ y: [0, -12], x: [0, 6], opacity: [0, 1, 0], scale: [0.8, 1.2] }}
            transition={{ repeat: Infinity, duration: 2.2, delay: 0 }}
          >
            Z
          </motion.span>
          <motion.span
            className="text-sm font-bold text-slate-400/90 select-none"
            animate={{ y: [0, -15], x: [0, 10], opacity: [0, 1, 0], scale: [0.8, 1.25] }}
            transition={{ repeat: Infinity, duration: 2.2, delay: 0.7 }}
          >
            Z
          </motion.span>
          <motion.span
            className="text-base font-bold text-slate-400/90 select-none"
            animate={{ y: [0, -18], x: [0, 12], opacity: [0, 1, 0], scale: [0.8, 1.3] }}
            transition={{ repeat: Infinity, duration: 2.2, delay: 1.4 }}
          >
            Z
          </motion.span>
        </div>
      )}

      {/* 4. LE CORPS SVG PRINCIPAL DE MANNY */}
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
          {/* Dégradé de la couverture de la Bible (bordeaux riche et profond) */}
          <linearGradient id="coverGrad" x1="34" y1="30" x2="120" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#962033" />
            <stop offset="60%" stopColor="#7C1B2B" />
            <stop offset="100%" stopColor="#4A0D18" />
          </linearGradient>
          {/* Dégradé doré pour les tranches, ornements et fermoir */}
          <linearGradient id="goldGrad" x1="26" y1="30" x2="126" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#A16207" />
          </linearGradient>
          {/* Ombre portée douce sous le livre */}
          <filter id="shadow" x="-5%" y="-5%" width="115%" height="115%">
            <feDropShadow dx="0" dy="6" stdDeviation="4" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Ombre portée au sol sous Manny */}
        <ellipse cx="78" cy="148" rx="42" ry="6" fill="#000" opacity="0.15" />

        {/* Groupe principal avec filtre d'ombre */}
        <g filter="url(#shadow)">
          {/* DOS DU LIVRE (TRANCHE GAUCHE) DORÉ */}
          <rect x="26" y="30" width="10" height="110" rx="5" fill="url(#goldGrad)" />
          {/* Ombrage du pli du livre pour donner du relief 3D */}
          <rect x="33" y="30" width="3" height="110" fill="#000000" opacity="0.35" />

          {/* PAGES DU LIVRE VISIBLES SUR LE CÔTÉ DROIT */}
          <path d="M 120 34 L 126 34 C 129 34, 129 136, 126 136 L 120 136 Z" fill="#F5EFE4" />
          {/* Lignes horizontales pour donner l'illusion de pages empilées */}
          <line x1="124" y1="40" x2="124" y2="130" stroke="#D1C6BA" strokeWidth="1" strokeDasharray="1 3" />
          <line x1="126" y1="45" x2="126" y2="125" stroke="#D1C6BA" strokeWidth="1" strokeDasharray="1 4" />

          {/* COUVERTURE AVANT BORDEAUX */}
          <rect x="34" y="30" width="88" height="110" rx="6" fill="url(#coverGrad)" stroke="#3F0E16" strokeWidth="1.2" />

          {/* CADRE INTÉRIEUR FIN DORÉ (Liseré élégant) */}
          <rect x="39" y="35" width="78" height="100" rx="4" stroke="url(#goldGrad)" strokeWidth="1" fill="none" opacity="0.6" />

          {/* ORNEMENTS D'ANGLES DORÉS */}
          {/* Haut-Gauche */}
          <path d="M 39 45 L 39 35 L 49 35" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="49" cy="35" r="1.2" fill="url(#goldGrad)" />
          <circle cx="39" cy="45" r="1.2" fill="url(#goldGrad)" />

          {/* Haut-Droite */}
          <path d="M 117 45 L 117 35 L 107 35" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="107" cy="35" r="1.2" fill="url(#goldGrad)" />
          <circle cx="117" cy="45" r="1.2" fill="url(#goldGrad)" />

          {/* Bas-Gauche */}
          <path d="M 39 125 L 39 135 L 49 135" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="49" cy="135" r="1.2" fill="url(#goldGrad)" />
          <circle cx="39" cy="125" r="1.2" fill="url(#goldGrad)" />

          {/* Bas-Droite */}
          <path d="M 117 125 L 117 135 L 107 135" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="107" cy="135" r="1.2" fill="url(#goldGrad)" />
          <circle cx="117" cy="125" r="1.2" fill="url(#goldGrad)" />

          {/* FERMOIR DORÉ AU CENTRE DROIT */}
          <g transform="translate(118, 75)">
            <path d="M 0 4 L 10 4 C 13 4, 13 16, 10 16 L 0 16 Z" fill="url(#goldGrad)" stroke="#854D0E" strokeWidth="0.8" />
            <circle cx="5" cy="10" r="2.2" fill="#FEF08A" />
          </g>

          {/* 5. ÉLÉMENTS SPÉCIFIQUES AUX HUMEURS (EXPRESSIONS & ACCESSOIRES DANS LE SVG) */}

          {/* BRAS ET MAINS POUR MODE ENCOURAGING */}
          {mood === "encouraging" && (
            <g>
              {/* Bras gauche tendu */}
              <path d="M 34 85 Q 14 90 18 102" stroke="#7C1B2B" strokeWidth="7" strokeLinecap="round" fill="none" />
              <circle cx="18" cy="102" r="4.5" fill="url(#goldGrad)" stroke="#854D0E" strokeWidth="0.8" />
              {/* Bras droit tendu */}
              <path d="M 122 85 Q 142 90 138 102" stroke="#7C1B2B" strokeWidth="7" strokeLinecap="round" fill="none" />
              <circle cx="138" cy="102" r="4.5" fill="url(#goldGrad)" stroke="#854D0E" strokeWidth="0.8" />
            </g>
          )}

          {/* BULLE DE PENSÉE POUR MODE THINKING */}
          {mood === "thinking" && (
            <g>
              {/* Petits ronds de liaison */}
              <circle cx="114" cy="46" r="2.5" fill="#FFFFFF" opacity="0.9" />
              <circle cx="107" cy="53" r="1.5" fill="#FFFFFF" opacity="0.8" />
              {/* Nuage principal de pensée */}
              <path
                d="M 125 21 C 120 21, 116 26, 119 31 C 116 36, 122 41, 127 39 C 131 42, 138 39, 137 34 C 141 31, 139 24, 133 26 C 130 21, 125 21, 125 21 Z"
                fill="#FFFFFF"
                stroke="#E2E8F0"
                strokeWidth="1.2"
              />
              {/* Points de suspension */}
              <circle cx="124" cy="31" r="1" fill="#64748B" />
              <circle cx="128" cy="31" r="1" fill="#64748B" />
              <circle cx="132" cy="31" r="1" fill="#64748B" />
            </g>
          )}

          {/* AURÉOLE DORÉE FLOTTANTE POUR LE MODE PRIÈRE (PRAYING) */}
          {mood === "praying" && (
            <motion.ellipse
              cx="78"
              cy="16"
              rx="22"
              ry="5"
              stroke="url(#goldGrad)"
              strokeWidth="2.8"
              fill="none"
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            />
          )}

          {/* VISAGE : YEUX, SOURCILS, BOUCHE SELON L'HUMEUR */}
          <g transform="translate(0, 5)">
            {/* HUMEUR "HAPPY" */}
            {mood === "happy" && (
              <g>
                {/* Yeux en arcs rieurs */}
                <path d="M 52 80 Q 62 68 72 80" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <path d="M 84 80 Q 94 68 104 80" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                {/* Sourcils légers relevés */}
                <path d="M 49 66 Q 61 58 71 64" stroke="#FDE047" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                <path d="M 85 64 Q 95 58 107 66" stroke="#FDE047" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                {/* Grand sourire en U */}
                <path d="M 64 100 Q 78 118 92 100" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                {/* Petites joues roses mignonnes */}
                <circle cx="46" cy="88" r="5" fill="#F43F5E" opacity="0.6" />
                <circle cx="110" cy="88" r="5" fill="#F43F5E" opacity="0.6" />
              </g>
            )}

            {/* HUMEUR "EXCITED" */}
            {mood === "excited" && (
              <g>
                {/* Yeux géants ouverts */}
                <circle cx="61" cy="78" r="11" fill="#FFFFFF" />
                <circle cx="95" cy="78" r="11" fill="#FFFFFF" />
                <circle cx="61" cy="78" r="7.5" fill="#1E293B" />
                <circle cx="95" cy="78" r="7.5" fill="#1E293B" />
                {/* Étoiles dorées dans les yeux */}
                <path d="M 61 74 L 62 77 L 65 78 L 62 79 L 61 82 L 60 79 L 57 78 L 60 77 Z" fill="#FDE047" />
                <path d="M 95 74 L 96 77 L 99 78 L 96 79 L 95 82 L 94 79 L 91 78 L 94 77 Z" fill="#FDE047" />
                {/* Sourcils très relevés et arqués */}
                <path d="M 48 56 Q 61 44 72 54" stroke="#FDE047" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                <path d="M 84 54 Q 95 44 108 56" stroke="#FDE047" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                {/* Bouche ovale ouverte de joie */}
                <ellipse cx="78" cy="107" rx="8" ry="11" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1.8" />
                <path d="M 72 111 Q 78 106 84 111 Q 78 117 72 111" fill="#F43F5E" />
              </g>
            )}

            {/* HUMEUR "THINKING" */}
            {mood === "thinking" && (
              <g>
                {/* Oeil gauche grand ouvert */}
                <circle cx="60" cy="78" r="10.5" fill="#FFFFFF" />
                <circle cx="62" cy="78" r="5" fill="#1E293B" />
                {/* Oeil droit mi-clos */}
                <path d="M 84 80 Q 94 71 104 80 Z" fill="#FFFFFF" />
                <circle cx="94" cy="80" r="3.8" fill="#1E293B" />
                {/* Sourcils asymétriques */}
                <path d="M 48 54 Q 60 46 72 56" stroke="#FDE047" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                <path d="M 84 66 Q 94 68 104 62" stroke="#FDE047" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                {/* Petit trait pendeur horizontal */}
                <path d="M 69 104 L 87 104" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              </g>
            )}

            {/* HUMEUR "ENCOURAGING" */}
            {mood === "encouraging" && (
              <g>
                {/* Grands yeux attentionnés */}
                <circle cx="61" cy="78" r="11" fill="#FFFFFF" />
                <circle cx="95" cy="78" r="11" fill="#FFFFFF" />
                <circle cx="61" cy="78" r="7.5" fill="#1E293B" />
                <circle cx="95" cy="78" r="7.5" fill="#1E293B" />
                {/* Doubles reflets de tendresse */}
                <circle cx="58.5" cy="75" r="2.2" fill="#FFFFFF" />
                <circle cx="63.5" cy="81" r="0.9" fill="#FFFFFF" />
                <circle cx="92.5" cy="75" r="2.2" fill="#FFFFFF" />
                <circle cx="97.5" cy="81" r="0.9" fill="#FFFFFF" />
                {/* Sourcils attentionnés inclinés au centre */}
                <path d="M 49 64 Q 61 58 69 67" stroke="#FDE047" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                <path d="M 87 67 Q 95 58 107 64" stroke="#FDE047" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                {/* Sourire doux asymétrique */}
                <path d="M 68 100 Q 77 105 88 98" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                {/* Joues roses discrètes */}
                <circle cx="46" cy="86" r="4.5" fill="#F43F5E" opacity="0.45" />
                <circle cx="110" cy="86" r="4.5" fill="#F43F5E" opacity="0.45" />
              </g>
            )}

            {/* HUMEUR "CELEBRATING" */}
            {mood === "celebrating" && (
              <g>
                {/* Yeux fermés en X de joie */}
                <path d="M 54 73 L 66 83 M 66 73 L 54 83" stroke="#FFFFFF" strokeWidth="4.2" strokeLinecap="round" fill="none" />
                <path d="M 90 73 L 102 83 M 102 73 L 90 83" stroke="#FFFFFF" strokeWidth="4.2" strokeLinecap="round" fill="none" />
                {/* Sourcils très hauts */}
                <path d="M 48 54 Q 60 48 72 54" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M 84 54 Q 96 48 108 54" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" fill="none" />
                {/* Grande bouche ouverte avec dents et langue */}
                <path d="M 64 97 Q 78 118 92 97 Z" fill="#1E293B" />
                {/* Dents du haut */}
                <path d="M 64 97 Q 78 103 92 97 L 90 101 Q 78 105 66 101 Z" fill="#FFFFFF" />
                {/* Langue de joie */}
                <path d="M 72 111 Q 78 107 84 111 Q 78 116 72 111" fill="#F43F5E" />
                {/* Joues roses joyeuses */}
                <circle cx="45" cy="88" r="5" fill="#F43F5E" opacity="0.55" />
                <circle cx="111" cy="88" r="5" fill="#F43F5E" opacity="0.55" />
              </g>
            )}

            {/* HUMEUR "SLEEPING" */}
            {mood === "sleeping" && (
              <g>
                {/* Arcs d'yeux vers le bas */}
                <path d="M 52 80 Q 62 90 72 80" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                <path d="M 84 80 Q 94 90 104 80" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                {/* Petits cils sous les yeux fermés */}
                <path d="M 55 86 L 51 91 M 62 88 L 62 94 M 69 86 L 73 91" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M 87 86 L 83 91 M 94 88 L 94 94 M 101 86 L 105 91" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
                {/* Sourcils détendus horizontaux/bas */}
                <path d="M 49 68 Q 59 72 69 70" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M 87 70 Q 97 72 107 68" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                {/* Petite bouche ronde en O de respiration */}
                <circle cx="78" cy="103" r="4.2" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1.8" />
              </g>
            )}

            {/* HUMEUR "PRAYING" */}
            {mood === "praying" && (
              <g>
                {/* Arcs d'yeux fermés plats */}
                <path d="M 52 82 Q 62 86 72 82" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M 84 82 Q 94 86 104 82" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                {/* Sourcils calmes horizontaux */}
                <path d="M 49 68 L 69 68" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M 87 68 L 107 68" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                {/* Bouche souriant paisiblement */}
                <path d="M 68 100 Q 78 106 88 100" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" fill="none" />
              </g>
            )}
          </g>
        </g>
      </motion.svg>
    </div>
  );
}
