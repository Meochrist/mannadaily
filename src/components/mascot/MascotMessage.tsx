"use client";

import React from "react";
import Manny from "./Manny";
import Samson from "./Samson";
import Esther from "./Esther";
import Gedeon from "./Gedeon";
import Noe from "./Noe";
import { MannyMood } from "@/types";

interface MascotMessageProps {
  mascot: "manny" | "samson" | "esther" | "gedeon" | "noe";
  mood: MannyMood;
  message: string;
  size?: number;
}

export default function MascotMessage({ mascot, mood, message, size = 100 }: MascotMessageProps) {
  // Sélectionner le composant de mascotte correspondant
  const renderMascot = () => {
    switch (mascot) {
      case "samson":
        return <Samson mood={mood} size={size} />;
      case "esther":
        return <Esther mood={mood} size={size} />;
      case "gedeon":
        return <Gedeon mood={mood} size={size} />;
      case "noe":
        return <Noe mood={mood} size={size} />;
      case "manny":
      default:
        return <Manny mood={mood} size={size} />;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm max-w-xl">
      <div className="flex-shrink-0">
        {renderMascot()}
      </div>
      <div className="relative flex-1 bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-slate-700 text-sm md:text-base font-medium">
        {/* Flèches orientables de la bulle de dialogue */}
        <div className="absolute hidden sm:block top-1/2 -left-2 w-3.5 h-3.5 bg-slate-50 border-l border-b border-slate-200/60 transform -translate-y-1/2 rotate-45" />
        <div className="absolute block sm:hidden -top-2 left-1/2 w-3.5 h-3.5 bg-slate-50 border-t border-l border-slate-200/60 transform -translate-x-1/2 rotate-45" />
        <p className="leading-relaxed whitespace-pre-line">{message}</p>
      </div>
    </div>
  );
}
