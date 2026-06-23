"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Méditer",
      href: "/meditate",
      icon: Sparkles,
    },
    {
      label: "La Bible",
      href: "/bible",
      icon: BookOpen,
    },
    {
      label: "Ligue",
      href: "/leaderboard",
      icon: Trophy,
    },
    {
      label: "Profil",
      href: "/profile",
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-lg px-2 py-2 flex justify-around items-center z-50 md:hidden transition-colors">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-300",
              isActive 
                ? "text-indigo-650 dark:text-indigo-400 font-extrabold scale-105" 
                : "text-slate-400 dark:text-slate-500 font-medium hover:text-slate-600 dark:hover:text-slate-300"
            )}
          >
            <Icon className={cn("w-5 h-5 mb-0.5", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
