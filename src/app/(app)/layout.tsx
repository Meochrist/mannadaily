import React from "react";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/features";
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
  Brain,
  ShoppingBag,
  BookMarked
} from "lucide-react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isAdmin = isAdminEmail(session?.user?.email);

  // Navigation publique (visible par tous)
  const publicNav = [
    { href: "/dashboard", label: "Tableau de bord", Icon: LayoutDashboard },
    { href: "/meditate", label: "Méditation du jour", Icon: Sparkles },
    { href: "/my-meditations", label: "Mes Méditations", Icon: BookMarked },
    { href: "/bible", label: "La Sainte Bible", Icon: BookOpen },
  ];

  // Navigation admin uniquement (cachée en production)
  const adminNav = [
    { href: "/reading-plans", label: "Plans de lecture", Icon: Calendar },
    { href: "/proclaim", label: "Proclamations", Icon: Volume2 },
    { href: "/themes", label: "Thèmes", Icon: Grid },
    { href: "/leaderboard", label: "Ligue hebdomadaire", Icon: Trophy },
    { href: "/progress", label: "Mon Progrès", Icon: Award },
    { href: "/memorize", label: "Mémoriser", Icon: Brain },
    { href: "/shop", label: "Boutique Céleste", Icon: ShoppingBag },
  ];

  const linkClass =
    "flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-indigo-800/60 text-indigo-100 hover:text-white font-semibold transition";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row">
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
            {publicNav.map(({ href, label, Icon }) => (
              <Link key={href} href={href} className={linkClass}>
                <Icon className="w-5 h-5 text-indigo-300" />
                {label}
              </Link>
            ))}

            <Link href="/profile" className={linkClass}>
              <User className="w-5 h-5 text-indigo-300" />
              Profil
            </Link>

            {/* Section admin — invisible pour les utilisateurs */}
            {isAdmin && (
              <>
                <div className="pt-4 mt-2 border-t border-indigo-800">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest px-4 block mb-2">
                    🔒 Admin (bientôt public)
                  </span>
                </div>
                {adminNav.map(({ href, label, Icon }) => (
                  <Link key={href} href={href} className={linkClass}>
                    <Icon className="w-5 h-5 text-amber-300/70" />
                    {label}
                  </Link>
                ))}
              </>
            )}
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
