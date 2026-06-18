"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Copy, Check, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerseShareModalProps {
  verseText: string;
  reference: string;
  translation: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function VerseShareModal({
  verseText,
  reference,
  translation,
  isOpen,
  onClose
}: VerseShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // URLs et Textes de partage
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://mannadaily.vercel.app";
  
  const imageUrl = `${baseUrl}/api/share/verse?verseText=${encodeURIComponent(verseText)}&reference=${encodeURIComponent(reference)}&translation=${encodeURIComponent(translation)}`;
  
  const shareText = `« ${verseText} » — ${reference} (${translation}) 📖 Médité sur MannaDaily ✨`;
  const shareUrl = baseUrl;

  useEffect(() => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      setShareSupported(true);
    }
  }, []);

  // Déclencher le partage natif (Web Share API)
  const handleShareNatively = async () => {
    try {
      await navigator.share({
        title: `MannaDaily - ${reference}`,
        text: shareText,
        url: shareUrl,
      });
    } catch (err) {
      console.log("Error sharing natively:", err);
      handleCopyText();
    }
  };

  // Copier le texte
  const handleCopyText = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Télécharger l'image sous forme de blob
  const handleDownloadImage = async () => {
    setDownloading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MannaDaily_${reference.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download image:", err);
      window.open(imageUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  // Liens pour réseaux sociaux
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;

  // Empêcher le scroll du body quand la modal est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop avec flou */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-xl w-full relative z-10 flex flex-col gap-6"
          >
            {/* Bouton Fermer */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* En-tête */}
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 tracking-tight">
                Partager ce verset 📤
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Partagez cette parole de vie avec vos proches et vos réseaux.
              </p>
            </div>

            {/* Aperçu de la carte du verset */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Aperçu de la carte
              </span>
              <div className="relative aspect-[120/63] w-full rounded-2xl overflow-hidden border border-slate-150 dark:border-slate-800 shadow-inner bg-slate-950 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt={`Verset ${reference}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Options de Partage */}
            <div className="space-y-3">
              {/* Partage natif ou Copier */}
              {shareSupported ? (
                <button
                  onClick={handleShareNatively}
                  className="w-full bg-indigo-650 hover:bg-indigo-700 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-101"
                >
                  <Share2 className="w-4 h-4" />
                  Partager maintenant
                </button>
              ) : (
                <button
                  onClick={handleCopyText}
                  className={cn(
                    "w-full font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border hover:scale-101",
                    copied 
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm" 
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-450 stroke-[3px]" />
                      Texte copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      Copier le texte et le lien
                    </>
                  )}
                </button>
              )}

              {/* Autres options */}
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-350 font-bold text-[10px] uppercase tracking-wider transition hover:scale-101"
                >
                  <span className="text-emerald-500 font-extrabold text-sm">WhatsApp</span>
                </a>
                
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-350 font-bold text-[10px] uppercase tracking-wider transition hover:scale-101"
                >
                  <svg className="w-3.5 h-3.5 text-slate-800 dark:text-slate-100" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  X / Twitter
                </a>

                <button
                  onClick={handleDownloadImage}
                  disabled={downloading}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-350 font-bold text-[10px] uppercase tracking-wider transition hover:scale-101 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-500" />
                  {downloading ? "Téléchargement..." : "Télécharger"}
                </button>
              </div>
            </div>

            {/* Bouton de copie du texte au cas où le partage est actif */}
            {shareSupported && (
              <button
                onClick={handleCopyText}
                className={cn(
                  "w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 border",
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-450"
                    : "bg-transparent border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    Texte copié !
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Ou copier le texte et le lien
                  </>
                )}
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
