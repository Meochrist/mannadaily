"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import Manny from "@/components/mascot/Manny";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white border border-slate-100 rounded-3xl p-8 sm:p-12 shadow-xl max-w-md w-full space-y-6 flex flex-col items-center"
      >
        {/* Manny Sleeping Avatar */}
        <div className="w-36 h-36 relative flex items-center justify-center bg-slate-50 border border-slate-100 rounded-full shadow-inner p-4">
          <Manny mood="sleeping" size={120} />
          
          {/* Animated Zzz */}
          <motion.span 
            animate={{ y: [-5, -25], x: [0, 15], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, delay: 0 }}
            className="absolute right-8 top-8 text-indigo-500 font-extrabold text-lg select-none"
          >
            z
          </motion.span>
          <motion.span 
            animate={{ y: [-5, -25], x: [0, 10], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, delay: 0.7 }}
            className="absolute right-12 top-12 text-indigo-400 font-black text-sm select-none"
          >
            z
          </motion.span>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            404 - Page introuvable
          </h1>
          <p className="text-xs text-indigo-650 font-black uppercase tracking-wider block">
            Manny est fatigué
          </p>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed italic max-w-xs mx-auto">
            « Zzz... Je rêve de manne fraîche et de versets dorés... Oh, pardon ! Cette page n'existe pas ou a été déplacée dans le désert... »
          </p>
        </div>

        {/* Action Button */}
        <div className="w-full pt-2">
          <Link
            href="/dashboard"
            className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-102"
          >
            <Home className="w-4 h-4" />
            Retour au Tableau de Bord
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
