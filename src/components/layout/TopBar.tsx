"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { LogOut, Sparkles, Award } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function TopBar() {
  return (
    <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 z-40 sticky top-0 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
        {/* Logo à gauche */}
        <div className="flex items-center gap-2">
          <div className="w-11 h-11 flex items-center justify-center relative overflow-hidden select-none pointer-events-none">
            <img 
              src="/assets/characters/manny/pose_idle.svg" 
              alt="Manny Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <span className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
            MannaDaily
          </span>
        </div>

        {/* Stats et Action à droite */}
        <div className="flex items-center gap-4">
          {/* Niveau et XP statiques pour l'instant */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-full text-xs font-extrabold text-amber-700 dark:text-amber-400">
            <Award className="w-4 h-4 text-amber-500 fill-amber-500/10" />
            <span>Semence</span>
            <span className="text-amber-300 dark:text-amber-800">•</span>
            <span>15 XP</span>
          </div>

          {/* Sélecteur de thème */}
          <ThemeToggle />

          {/* Bouton de déconnexion */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}

