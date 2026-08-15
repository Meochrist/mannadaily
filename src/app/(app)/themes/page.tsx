"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { THEMES } from "@/types";
import MannyMessage from "@/components/mascot/MannyMessage";
import { getThemeProgress, getThemeVerses, resetThemeProgress } from "@/lib/themeVerses";
import { Sparkles, ArrowRight, BookOpen, CheckCircle } from "lucide-react";

export default function ThemesPage() {
  const [progress, setProgress] = useState<Record<string, { currentIndex: number; completed: boolean }>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const all: Record<string, { currentIndex: number; completed: boolean }> = {};
    for (const theme of THEMES) {
      all[theme.slug] = getThemeProgress(theme.slug);
    }
    setProgress(all);
  }, []);

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-12">
      {/* En-tête */}
      <section className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-2">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Parcours Thématiques</h1>
        <p className="text-slate-500 font-medium max-w-xl">
          Sélectionne un domaine de ta vie spirituelle ou émotionnelle pour guider tes méditations guidées par l&apos;IA et trouver de la force. Chaque thème est un parcours : avance verset par verset et reviens où tu veux.
        </p>
      </section>

      {/* Mascotte Manny encourageante */}
      <section className="flex justify-center md:justify-start">
        <MannyMessage
          mood="encouraging"
          message={`"Trouve la force et la sagesse dans Sa Parole."\n\nChoisis un thème ci-dessous. Je t'accompagnerai et adapterai les méditations pour t'aider à grandir.`}
          size={110}
        />
      </section>

      {/* Grille des thèmes */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {THEMES.map((theme) => {
          const themeProgress = progress[theme.slug];
          const total = getThemeVerses(theme.slug).length;
          const current = themeProgress ? Math.min(themeProgress.currentIndex, total) : 0;
          const completed = themeProgress?.completed || false;

          return (
            <div
              key={theme.slug}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              {/* Header de la carte avec gradient personnalisé du thème */}
              <div className={`bg-gradient-to-r ${theme.color} p-6 text-white space-y-2 relative overflow-hidden flex-shrink-0`}>
                {/* Grand emoji en filigrane */}
                <div className="absolute -right-4 -bottom-6 text-7xl opacity-20 pointer-events-none transform rotate-12">
                  {theme.emoji}
                </div>

                <div className="flex justify-between items-center relative z-10">
                  <span className="text-3xl">{theme.emoji}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                    {completed ? "Terminé ✓" : "Thème"}
                  </span>
                </div>
                <h3 className="text-xl font-black tracking-tight relative z-10">{theme.name}</h3>
              </div>

              {/* Description du thème */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                  {theme.description}
                </p>

                {/* Progression du parcours */}
                {mounted && themeProgress && (current > 0 || completed) && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                      <span>Progression du parcours</span>
                      <span>{completed ? `${total}/${total}` : `${current}/${total}`}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${total > 0 ? Math.round((current / total) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Lien d'exploration vers meditate avec le thème sélectionné */}
                <Link
                  href={`/meditate?theme=${theme.slug}`}
                  onClick={() => {
                    if (completed) resetThemeProgress(theme.slug);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 font-extrabold rounded-xl transition text-sm shadow-sm"
                >
                  {completed ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <BookOpen className="w-4 h-4" />}
                  {completed ? "Refaire le parcours" : current > 0 ? "Continuer le parcours" : "Commencer le parcours"}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          );
        })}
      </section>

      {/* Message de fin */}
      <section className="text-center py-6 bg-slate-100/60 rounded-2xl border border-slate-200/40 max-w-md mx-auto">
        <Sparkles className="w-5 h-5 text-amber-500 mx-auto mb-2 fill-amber-500/15" />
        <p className="text-sm font-bold text-slate-500">
          Plus de thèmes bientôt disponibles !
        </p>
      </section>
    </div>
  );
}
