"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Twitter, Facebook, Copy, Check, Sparkles, Flame, Trophy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareCardProps {
  type: "streak" | "badge";
  streakValue?: number;
  levelName?: string;
  badgeName?: string;
  badgeIcon?: string;
  title?: string;
}

export default function ShareCard({
  type,
  streakValue = 0,
  levelName = "Semence",
  badgeName = "Pionnier",
  badgeIcon = "🏆",
  title
}: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);

  // Générer les URLs
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://mannadaily.vercel.app";
  
  const imageUrl = type === "streak"
    ? `${baseUrl}/api/share/streak?streak=${streakValue}&levelName=${encodeURIComponent(levelName)}`
    : `${baseUrl}/api/share/badge?badgeName=${encodeURIComponent(badgeName)}&badgeIcon=${encodeURIComponent(badgeIcon)}`;

  const shareText = type === "streak"
    ? `J'ai atteint une série de ${streakValue} jours de méditation biblique consécutifs sur MannaDaily ! 🔥`
    : `J'ai débloqué le badge "${badgeName}" ${badgeIcon} sur MannaDaily ! 🏆`;

  const shareUrl = baseUrl; // Lien vers l'application

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.share) {
      setShareSupported(true);
    }
  }, []);

  const handleShareNatively = async () => {
    try {
      await navigator.share({
        title: "MannaDaily - Progression Spirituelle",
        text: shareText,
        url: shareUrl,
      });
    } catch (err) {
      console.log("Error sharing natively:", err);
      // Fallback à la copie de lien
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText} Découvre l'application ici : ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Liens pour réseaux sociaux
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-5 flex flex-col md:flex-row gap-5 items-center md:items-stretch">
      {/* Aperçu miniature de l'image de partage */}
      <div className="w-full md:w-1/2 flex flex-col gap-2 flex-shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Aperçu de ton image de partage
        </span>
        <div className="relative aspect-[120/63] w-full rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center group">
          <img 
            src={imageUrl} 
            alt={type === "streak" ? "Partage de Streak" : "Partage de Badge"} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-101"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <a 
              href={imageUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="bg-white/95 text-slate-800 text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md"
            >
              Agrandir <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Actions de partage */}
      <div className="w-full md:w-1/2 flex flex-col justify-between gap-4 py-1">
        <div className="space-y-1">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            {type === "streak" ? (
              <>
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20" />
                Partager mon streak 🔥
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
                Partager un badge 🏆
              </>
            )}
          </h4>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            {title || (type === "streak" 
              ? "Célèbre ta régularité dans la Parole et motive tes frères et sœurs à te rejoindre !"
              : `Affiche fièrement ton avancement en partageant l'obtention de ton badge "${badgeName}" !`
            )}
          </p>
        </div>

        <div className="space-y-3">
          {/* Bouton de Partage Principal (Natif ou Copie) */}
          {shareSupported ? (
            <button
              onClick={handleShareNatively}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-101"
            >
              <Share2 className="w-4 h-4" />
              Partager maintenant
            </button>
          ) : (
            <button
              onClick={handleCopyLink}
              className={cn(
                "w-full font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border hover:scale-101",
                copied 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" 
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              )}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3px]" />
                  Lien copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  Copier le lien de partage
                </>
              )}
            </button>
          )}

          {/* Boutons Réseaux Sociaux alternatifs */}
          <div className="flex gap-2">
            <a
              href={twitterUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl py-2 flex items-center justify-center gap-1.5 text-slate-700 font-bold text-[10px] uppercase tracking-wider transition hover:scale-102"
            >
              <Twitter className="w-3.5 h-3.5 text-sky-500 fill-sky-500/10" />
              X / Twitter
            </a>
            
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl py-2 flex items-center justify-center gap-1.5 text-slate-700 font-bold text-[10px] uppercase tracking-wider transition hover:scale-102"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              WhatsApp
            </a>

            <a
              href={facebookUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl py-2 flex items-center justify-center gap-1.5 text-slate-700 font-bold text-[10px] uppercase tracking-wider transition hover:scale-102"
            >
              <Facebook className="w-3.5 h-3.5 text-blue-600 fill-blue-600/10" />
              Facebook
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
