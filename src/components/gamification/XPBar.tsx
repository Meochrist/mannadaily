"use client";

import React from "react";
import { motion } from "framer-motion";
import { Award } from "lucide-react";

interface XPBarProps {
  currentXP: number;
  levelName: string;
  progressPercent: number;
}

export default function XPBar({ currentXP, levelName, progressPercent }: XPBarProps) {
  return (
    <div className="w-full bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 rounded-lg text-amber-500">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Niveau actuel</p>
            <h3 className="text-lg font-bold text-slate-800">{levelName}</h3>
          </div>
        </div>
        <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
          {currentXP} XP
        </span>
      </div>

      <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      <div className="flex justify-between items-center mt-2 text-xs text-slate-400 font-medium">
        <span>Progression</span>
        <span>{progressPercent}%</span>
      </div>
    </div>
  );
}
