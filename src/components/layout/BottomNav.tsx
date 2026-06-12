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
  Award
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
      icon: BookOpen,
    },
    {
      label: "Proclamer",
      href: "/proclaim",
      icon: Volume2,
    },
    {
      label: "Ligue",
      href: "/leaderboard",
      icon: Trophy,
    },
    {
      label: "Progression",
      href: "/progress",
      icon: Award,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-lg px-2 py-2 flex justify-around items-center z-50 md:hidden">
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
                ? "text-indigo-600 font-extrabold scale-105" 
                : "text-slate-400 font-medium hover:text-slate-600"
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
