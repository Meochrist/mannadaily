"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gem, Snowflake, ShoppingBag, Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import * as sounds from "@/lib/sounds";
import Manny from "../mascot/Manny";

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
  
  // États pour la vérification du paiement après redirection
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Déclencheurs d'animation
  const [lingotTrigger, setLingotTrigger] = useState(false);
  const [freezeTrigger, setFreezeTrigger] = useState(false);

  useEffect(() => {
    setLingots(initialLingots);
  }, [initialLingots]);

  useEffect(() => {
    setFreezes(initialFreezes);
  }, [initialFreezes]);

  // Détecter la redirection après un paiement FedaPay
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get("status");
      const payment = urlParams.get("payment");
      const transactionId = urlParams.get("id"); // FedaPay retourne l'ID sous le paramètre 'id'

      if (status === "verify" && payment === "freeze" && transactionId) {
        verifyFedaPayPayment(transactionId);
      }
    }
  }, []);

  const verifyFedaPayPayment = async (txId: string) => {
    setVerifyingPayment(true);
    setVerificationError("");
    
    try {
      const res = await fetch(`/api/payment?transactionId=${txId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de vérifier le paiement.");
      }

      if (data.status === "approved") {
        // Mettre à jour le solde des freezes
        setFreezes(data.freezesAvailable);
        setFreezeTrigger(true);
        setTimeout(() => setFreezeTrigger(false), 800);
        
        // Son de victoire/succès
        sounds.playLevelUp();
        
        // Afficher le modal de félicitations
        setShowSuccessModal(true);
      } else {
        throw new Error(`Le paiement n'a pas été approuvé (statut: ${data.status})`);
      }
    } catch (err: any) {
      console.error("Error verifying payment:", err);
      setVerificationError(err.message || "La vérification du paiement a échoué.");
      sounds.playAbandonWarning();
    } finally {
      setVerifyingPayment(false);
      // Nettoyer l'URL
      if (typeof window !== "undefined") {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  };

  const handleBuyWithFedaPay = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    sounds.playSuccess();

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec de l'initiation du paiement.");
      }

      if (data.paymentUrl) {
        // Rediriger l'utilisateur vers FedaPay
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("L'URL de paiement n'a pas pu être générée.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de connexion FedaPay");
      sounds.playAbandonWarning();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* ─── BOUTIQUE DE MANNA CARD (DISPOSITION PREMIUM STYLE JEU) ─── */}
      <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden flex flex-col">
        {/* En-tête de la boutique */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4.5 h-4.5 text-amber-600 fill-amber-500/15" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
              Boutique Céleste
            </h3>
          </div>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200/20">
            Premium Shop
          </span>
        </div>

        {/* Section des soldes en grille */}
        <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
          {/* Solde de Lingots */}
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tes Lingots</span>
            <div className="flex items-center gap-1.5">
              <Gem className="w-5 h-5 text-amber-500 fill-amber-500/10" />
              <motion.span
                animate={lingotTrigger ? { scale: [1, 1.3, 1], color: ["#1e293b", "#eab308", "#1e293b"] } : {}}
                transition={{ duration: 0.6 }}
                className="text-base font-black text-slate-800"
              >
                {lingots}
              </motion.span>
            </div>
          </div>

          {/* Inventaire de Freezes */}
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Streak Freezes</span>
            <div className="flex items-center gap-1.5">
              <Snowflake className="w-5 h-5 text-sky-500 fill-sky-500/10" />
              <motion.span
                animate={freezeTrigger ? { scale: [1, 1.3, 1], color: ["#1e293b", "#0ea5e9", "#1e293b"] } : {}}
                transition={{ duration: 0.6 }}
                className="text-base font-black text-slate-800"
              >
                {freezes}
              </motion.span>
            </div>
          </div>
        </div>

        {/* Section Produit unique : Streak Freeze */}
        <div className="p-5 flex flex-col items-center text-center space-y-4">
          <div className="relative">
            {/* Animation de fond */}
            <div className="absolute inset-0 bg-sky-200/40 rounded-full blur-xl scale-125 animate-pulse" />
            <div className="w-16 h-16 bg-sky-50 text-sky-500 rounded-3xl border border-sky-100 flex items-center justify-center relative z-10 shadow-sm animate-bounce-slow">
              <Snowflake className="w-9 h-9 stroke-[2px]" />
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="font-extrabold text-slate-800 text-sm">
              Streak Freeze
            </h4>
            <p className="text-[11px] text-slate-400 font-semibold max-w-[220px] leading-relaxed">
              Maintient ton streak actif en cas d'oubli de méditation de 24h.
            </p>
          </div>

          {/* Prix et opérateurs mobiles */}
          <div className="space-y-1">
            <div className="text-sm font-black text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-3 py-1 rounded-full inline-block">
              500 FCFA
            </div>
            <div className="text-[9px] text-slate-400 font-medium">
              Paye par <span className="font-bold">Mobile Money</span> (MTN, Moov, Orange)
            </div>
          </div>

          {/* Bouton d'achat */}
          <button
            onClick={handleBuyWithFedaPay}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-black text-xs rounded-xl shadow-md hover:from-amber-300 hover:to-amber-400 hover:shadow-lg transition-all active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirection...
              </>
            ) : (
              <>
                Acheter via FedaPay
              </>
            )}
          </button>

          {error && (
            <p className="text-[10px] font-bold text-rose-500 leading-snug">
              ⚠️ {error}
            </p>
          )}
        </div>
      </div>

      {/* ─── MODAL DE CHARGEMENT DE VÉRIFICATION DU PAIEMENT ─── */}
      <AnimatePresence>
        {verifyingPayment && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-2xl flex flex-col items-center text-center space-y-5"
            >
              <Manny mood="thinking" size={120} className="animate-pulse" />
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-800">
                  Vérification du paiement...
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Manny valide ta transaction avec FedaPay. Ne ferme pas cette fenêtre.
                </p>
              </div>
              <div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL DE SUCCÈS D'ACHAT STREAK FREEZE ─── */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-2xl flex flex-col items-center text-center space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-100/50 rounded-full blur-xl scale-125" />
                <Manny mood="celebrating" size={130} className="relative z-10" />
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-800">
                  Félicitations ! 🎉
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Ton Streak Freeze a été activé ! Ta série de méditations est maintenant à l'abri du gel.
                </p>
              </div>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-indigo-700 transition-all active:scale-[0.98]"
              >
                Super, merci !
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Affichage des erreurs de vérification */}
      {verificationError && (
        <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl flex items-start gap-2.5 text-left text-rose-700 shadow-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="space-y-0.5">
            <span className="font-extrabold text-[11px] block">Erreur de paiement</span>
            <p className="text-[10px] font-semibold leading-snug">{verificationError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
