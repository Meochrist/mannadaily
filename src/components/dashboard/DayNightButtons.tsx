"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface DayNightButtonsProps {
  morningDone: boolean;
  eveningDone: boolean;
  verseText: string;
  verseReference: string;
  verseTheme: string;
}

export default function DayNightButtons({
  morningDone,
  eveningDone,
  verseText,
  verseReference,
  verseTheme,
}: DayNightButtonsProps) {
  const [mounted, setMounted] = useState(false);
  const [currentHour, setCurrentHour] = useState(12); // Par défaut 12h pour le SSR

  useEffect(() => {
    setMounted(true);
    setCurrentHour(new Date().getHours());
  }, []);

  // Détection de l'heure locale
  const isMorningActive = mounted ? currentHour >= 0 && currentHour < 17 : true;
  const isEveningActive = mounted ? currentHour >= 17 && currentHour < 24 : false;

  const progressPercent = morningDone && eveningDone ? 100 : morningDone || eveningDone ? 50 : 0;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4 transition-colors">
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Journée Spirituelle (Josué 1:8)
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Médite la Parole jour et nuit pour réussir dans tes voies.
        </p>
      </div>

      {/* Barre de progression */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
          <span className="text-[10px] tracking-wide">Progression du Jour</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercent === 100
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                : progressPercent === 50
                ? "bg-amber-500"
                : "w-0"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className={`text-[10px] font-bold tracking-tight text-center mt-1 ${
          progressPercent === 100
            ? "text-emerald-600 dark:text-emerald-400"
            : progressPercent === 50
            ? "text-amber-600 dark:text-amber-400"
            : "text-slate-400 dark:text-slate-500"
        }`}>
          {progressPercent === 100
            ? "Ta journée spirituelle est complète ! 🎉"
            : morningDone
            ? "Encore ta méditation du soir pour compléter ta journée 🌙"
            : "Commence ta journée avec la méditation du matin 🌅"}
        </p>
      </div>

      {/* Boutons d'action Jour & Nuit */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Bouton Matin */}
        {morningDone ? (
          <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-750 text-slate-400 dark:text-slate-500 rounded-2xl text-xs font-black select-none gap-1">
            <span>🌅 Matin fait ✓</span>
          </div>
        ) : !isMorningActive ? (
          <button
            disabled
            className="flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-750 text-slate-400 dark:text-slate-650 rounded-2xl text-xs font-black cursor-not-allowed opacity-60 gap-1"
            title="Disponible de 00h à 17h"
          >
            <span>Matin indisponible</span>
          </button>
        ) : (
          <Link
            href={`/meditate?period=morning&text=${encodeURIComponent(verseText)}&reference=${encodeURIComponent(verseReference)}&theme=${encodeURIComponent(verseTheme)}`}
            className="flex flex-col items-center justify-center p-3.5 bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 rounded-2xl text-xs font-black shadow-md hover:brightness-105 active:scale-[0.98] transition-all gap-1 cursor-pointer"
          >
            <span>Méditation du matin 🌅</span>
          </Link>
        )}

        {/* Bouton Soir */}
        {eveningDone ? (
          <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-750 text-slate-400 dark:text-slate-500 rounded-2xl text-xs font-black select-none gap-1">
            <span>🌙 Soir fait ✓</span>
          </div>
        ) : !isEveningActive ? (
          <button
            disabled
            className="flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-750 text-slate-400 dark:text-slate-650 rounded-2xl text-xs font-black cursor-not-allowed opacity-60 gap-1"
            title="Disponible de 17h à 23h59"
          >
            <span>Soir indisponible</span>
          </button>
        ) : !morningDone ? (
          <button
            className="flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-750 text-slate-400 dark:text-slate-500 rounded-2xl text-xs font-black cursor-help opacity-70 gap-1"
            title="Fais d'abord ta méditation du matin !"
          >
            <span>Méditation du soir 🌙</span>
          </button>
        ) : (
          <Link
            href={`/meditate?period=evening&text=${encodeURIComponent(verseText)}&reference=${encodeURIComponent(verseReference)}&theme=${encodeURIComponent(verseTheme)}`}
            className="flex flex-col items-center justify-center p-3.5 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl text-xs font-black shadow-md active:scale-[0.98] transition-all gap-1 cursor-pointer"
          >
            <span>Méditation du soir 🌙</span>
          </Link>
        )}
      </div>
    </div>
  );
}
