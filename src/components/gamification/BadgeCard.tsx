"use client";

import React from "react";
import { motion } from "framer-motion";
import { Compass, Flame, Crown, BookOpen, Shield, Lock, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeCardProps {
  name: string;
  description: string;
  icon: string;
  earnedAt: Date | string | null;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Compass,
  Flame,
  Crown,
  BookOpen,
  Shield,
};

export default function BadgeCard({ name, description, icon, earnedAt }: BadgeCardProps) {
  const isUnlocked = earnedAt !== null;
  const SelectedIcon = iconMap[icon] || Award;

  const formattedDate = earnedAt
    ? new Date(earnedAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <motion.div
      className={cn(
        "relative p-5 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center shadow-sm overflow-hidden",
        isUnlocked
          ? "bg-white border-amber-200 hover:border-amber-300 hover:shadow-md"
          : "bg-slate-50/60 border-slate-100 opacity-60"
      )}
      whileHover={isUnlocked ? { y: -4, scale: 1.01 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {isUnlocked && (
        <motion.div
          className="absolute -inset-2 bg-gradient-to-r from-amber-400/10 via-yellow-400/20 to-amber-500/10 blur-xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" as const }}
        />
      )}

      <div className="relative mb-3 flex items-center justify-center">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
            isUnlocked
              ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white"
              : "bg-slate-200 text-slate-400"
          )}
        >
          <SelectedIcon className="w-6 h-6" />
        </div>

        {!isUnlocked && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 text-white flex items-center justify-center border-2 border-white shadow-sm">
            <Lock className="w-3 h-3" />
          </div>
        )}
      </div>

      <h4 className={cn("font-bold text-sm mb-1", isUnlocked ? "text-slate-800" : "text-slate-500")}>
        {name}
      </h4>
      <p className="text-xs text-slate-400 font-medium leading-relaxed mb-3 max-w-[160px]">
        {description}
      </p>

      {isUnlocked && formattedDate ? (
        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
          Obtenu le {formattedDate}
        </span>
      ) : (
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
          Verrouillé
        </span>
      )}
    </motion.div>
  );
}
