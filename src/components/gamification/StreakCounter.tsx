"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
}

export default function StreakCounter({ currentStreak, longestStreak }: StreakCounterProps) {
  const hasStreak = currentStreak > 0;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center transition-colors">
      <div className="relative mb-4">
        <motion.div
          className={cn(
            "p-4 rounded-full flex items-center justify-center transition-colors",
            hasStreak ? "bg-orange-50 dark:bg-orange-950/20 text-orange-500" : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
          )}
          animate={hasStreak ? {
            scale: [1, 1.08, 1],
            rotate: [0, -2, 2, 0],
          } : {}}
          transition={hasStreak ? {
            repeat: Infinity,
            duration: 1.8,
            ease: "easeInOut" as const,
          } : {}}
        >
          <Flame className={cn("w-10 h-10", hasStreak && "fill-orange-500")} />
        </motion.div>
        
        {hasStreak && (
          <motion.div
            className="absolute -inset-1 rounded-full bg-orange-400/20 blur-md -z-10"
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </div>

      <div className="mb-2">
        <span className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
          {currentStreak}
        </span>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 ml-1">
          {currentStreak <= 1 ? "jour" : "jours"}
        </span>
      </div>

      <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mb-4">
        {hasStreak ? "Série de jours consécutifs active ! 💫" : "Commencez votre série aujourd'hui !"}
      </p>

      <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-500 dark:text-slate-400 border border-slate-200/40 dark:border-slate-700/60 text-xs font-semibold">
        <Trophy className="w-3.5 h-3.5 text-yellow-500" />
        <span>Record : {longestStreak} jours</span>
      </div>
    </div>
  );
}
