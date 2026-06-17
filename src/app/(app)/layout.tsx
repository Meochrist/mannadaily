import React from "react";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import { 
  LayoutDashboard, 
  BookOpen, 
  Volume2, 
  Grid, 
  Trophy,
  Award,
  Sparkles,
  Calendar,
  User,
  Brain
} from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Visible uniquement sur Desktop (md:flex) */}
      <aside className="hidden md:flex md:w-64 bg-indigo-900 text-white p-6 flex-col justify-between flex-shrink-0">
        <div className="space-y-8">
          {/* Titre / Logo */}
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 flex items-center justify-center relative overflow-hidden select-none pointer-events-none">
              <img 
                src="/assets/characters/manny/pose_idle.svg" 
                alt="Manny Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
              MannaDaily
            </span>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-indigo-800/60 text-indigo-100 hover:text-white font-semibold transition"
            >
              <LayoutDashboard className="w-5 h-5 text-indigo-300" />
              Tableau de bord
            </Link>
            
            <Link 
              href="/meditate" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-indigo-800/60 text-indigo-100 hover:text-white font-semibold transition"
            >
              <Sparkles className="w-5 h-5 text-indigo-300" />
              Méditation du jour
            </Link>

            <Link 
              href="/bible" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-indigo-800/60 text-indigo-100 hover:text-white font-semibold transition"
            >
              <BookOpen className="w-5 h-5 text-indigo-300" />
              La Sainte Bible
            </Link>

            <Link 
              href="/reading-plans" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-indigo-800/60 text-indigo-100 hover:text-white font-semibold transition"
            >
              <Calendar className="w-5 h-5 text-indigo-300" />
              Plans de lecture
            </Link>

            <Link 
              href="/proclaim" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-indigo-800/60 text-indigo-100 hover:text-white font-semibold transition"
            >
              <Volume2 className="w-5 h-5 text-indigo-300" />
              Proclamations
            </Link>
            
            <Link 
              href="/themes" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-indigo-800/60 text-indigo-100 hover:text-white font-semibold transition"
            >
              <Grid className="w-5 h-5 text-indigo-300" />
              Thèmes
            </Link>

            <Link 
              href="/leaderboard" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-indigo-800/60 text-indigo-100 hover:text-white font-semibold transition"
            >
              <Trophy className="w-5 h-5 text-indigo-300" />
              Ligue hebdomadaire
            </Link>

            <Link 
              href="/progress" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-indigo-800/60 text-indigo-100 hover:text-white font-semibold transition"
            >
              <Award className="w-5 h-5 text-indigo-300" />
              Mon Progrès
            </Link>

            <Link 
              href="/memorize" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-indigo-800/60 text-indigo-100 hover:text-white font-semibold transition"
            >
              <Brain className="w-5 h-5 text-indigo-300" />
              Mémoriser
            </Link>

            <Link 
              href="/profile" 
              className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-indigo-800/60 text-indigo-100 hover:text-white font-semibold transition"
            >
              <User className="w-5 h-5 text-indigo-300" />
              Profil
            </Link>
          </nav>
        </div>

        {/* Pied de sidebar */}
        <div className="pt-6 border-t border-indigo-800 text-xs font-bold text-indigo-300 tracking-wider">
          Statut : Connecté 🟢
        </div>
      </aside>

      {/* Zone de contenu principale (TopBar + Main Content + BottomNav) */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* TopBar en haut de chaque page */}
        <TopBar />

        {/* Contenu principal de la page */}
        <main className="flex-1 p-6 md:p-10 pb-24 md:pb-10 overflow-y-auto">
          {children}
        </main>

        {/* Barre de navigation mobile en bas (visible uniquement sur mobile) */}
        <BottomNav />
        <InstallPrompt />
      </div>
    </div>
  );
}
