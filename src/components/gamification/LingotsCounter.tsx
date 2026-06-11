"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gem, Snowflake, ShoppingCart, Loader2 } from "lucide-react";
import * as sounds from "@/lib/sounds";

interface LingotsCounterProps {
  initialLingots: number;
  initialFreezes: number;
}

export default function LingotsCounter({ initialLingots, initialFreezes }: LingotsCounterProps) {
  const [lingots, setLingots] = useState(initialLingots);
  const [freezes, setFreezes] = useState(initialFreezes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Animer le pulse du compteur de lingots lors des variations
  const [lingotTrigger, setLingotTrigger] = useState(false);
  const [freezeTrigger, setFreezeTrigger] = useState(false);

  useEffect(() => {
    setLingots(initialLingots);
  }, [initialLingots]);

  useEffect(() => {
    setFreezes(initialFreezes);
  }, [initialFreezes]);

  const handleBuyFreeze = async () => {
    if (lingots < 10) return;
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/lingots/buy-freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec de l'achat.");
      }

      if (data.success) {
        // Mettre à jour les compteurs
        setLingots(data.lingotsRemaining);
        setFreezes(data.freezesAvailable);
        
        // Déclencher les animations
        setLingotTrigger(true);
        setFreezeTrigger(true);
        setTimeout(() => {
          setLingotTrigger(false);
          setFreezeTrigger(false);
        }, 800);

        // Son cristallin positif de réussite d'achat
        sounds.playCorrect();
        
        setSuccessMessage("Streak Freeze acheté ! 🧊");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error("Solde insuffisant.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      sounds.playAbandonWarning();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* 1. SECTION DE VISUALISATION DES SOLDES */}
      <div className="flex items-center gap-6">
        {/* COMPTEUR DE LINGOTS (💎) */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shadow-inner">
            <Gem className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Lingots</span>
            <motion.span
              animate={lingotTrigger ? { scale: [1, 1.4, 1], color: ["#1e293b", "#eab308", "#1e293b"] } : {}}
              transition={{ duration: 0.6 }}
              className="text-xl font-black text-slate-800"
            >
              {lingots} 💎
            </motion.span>
          </div>
        </div>

        {/* COMPTEUR DE FREEZES (🧊) */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center shadow-inner">
            <Snowflake className="w-5.5 h-5.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Streak Freezes</span>
            <motion.span
              animate={freezeTrigger ? { scale: [1, 1.4, 1], color: ["#1e293b", "#0ea5e9", "#1e293b"] } : {}}
              transition={{ duration: 0.6 }}
              className="text-xl font-black text-slate-800"
            >
              {freezes} 🧊
            </motion.span>
          </div>
        </div>
      </div>

      {/* 2. BOUTON D'ACTION ET ÉTATS */}
      <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
        <button
          onClick={handleBuyFreeze}
          disabled={loading || lingots < 10}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 font-extrabold rounded-xl text-xs md:text-sm shadow-sm transition-all transform active:scale-98 ${
            lingots >= 10
              ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 hover:shadow"
              : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Achat en cours...
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              Acheter un Freeze (10 💎)
            </>
          )}
        </button>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[10px] md:text-xs font-bold text-rose-500"
            >
              {error}
            </motion.p>
          )}
          {successMessage && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[10px] md:text-xs font-bold text-emerald-600"
            >
              {successMessage}
            </motion.p>
          )}
          {lingots < 10 && !loading && !successMessage && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] md:text-xs font-bold text-slate-400 text-center sm:text-right"
            >
              Gagne des lingots en complétant tes sessions d'étude !
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
