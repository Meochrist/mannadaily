"use client";

import React, { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";
import Manny from "@/components/mascot/Manny";
import { cn } from "@/lib/utils";

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOSPlatform, setIsIOSPlatform] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Enregistrement du Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("SW: Registered successfully", reg.scope))
        .catch((err) => console.warn("SW: Registration failed", err));
    }

    // 2. Vérifier si l'utilisateur a déjà refusé l'installation récemment
    const isDismissed = localStorage.getItem("pwa-install-dismissed");
    if (isDismissed) {
      const dismissedTime = parseInt(isDismissed, 10);
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < oneWeek) {
        return;
      }
    }

    // 3. Détecter si l'application est déjà lancée en mode autonome
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (navigator as any).standalone === true;
    
    if (isStandalone) {
      return;
    }

    // 4. Détecter la plateforme iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOSPlatform(isIOS);

    if (isIOS) {
      // Pour iOS, on affiche le prompt après 5 secondes si pas de refus
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    // 5. Pour Android/Chrome : écouter l'événement standard beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOSPlatform) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install choice: ${outcome}`);

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    setShowPrompt(false);
    setShowIOSInstructions(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-white border border-indigo-100 rounded-3xl p-5 shadow-2xl z-50 animate-in slide-in-from-bottom-5 duration-300 flex items-start gap-4">
      <div className="w-14 h-14 flex-shrink-0 relative">
        <Manny mood="excited" size={56} />
      </div>

      <div className="flex-1 space-y-2">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
          MannaDaily sur ton mobile 📱
        </h4>
        
        {!showIOSInstructions ? (
          <>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Installe l'application sur ton écran d'accueil pour méditer plus facilement chaque jour.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleInstallClick}
                className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Installer
              </button>
              <button
                onClick={handleDismiss}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 font-extrabold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider transition cursor-pointer"
              >
                Plus tard
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-2 bg-indigo-50/50 rounded-2xl p-3 border border-indigo-100/50">
            <p className="text-[10px] text-slate-600 font-semibold leading-relaxed flex items-center gap-1">
              1. Appuie sur le bouton de partage <Share className="w-3.5 h-3.5 text-indigo-600" /> dans Safari.
            </p>
            <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">
              2. Sélectionne <span className="font-extrabold text-indigo-700">Sur l'écran d'accueil</span> ➕.
            </p>
            <button
              onClick={handleDismiss}
              className="w-full bg-indigo-600 text-white font-extrabold py-1.5 rounded-lg text-[9px] uppercase tracking-wider shadow-sm cursor-pointer mt-1"
            >
              J'ai compris
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className="text-slate-400 hover:text-slate-650 p-1 hover:bg-slate-50 rounded-lg transition cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
