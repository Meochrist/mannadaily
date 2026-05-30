"use client";

import React from "react";
import { motion } from "framer-motion";
import { MannyMood } from "@/types";

interface MannyProps {
  mood: MannyMood;
  size?: number;
  className?: string;
}

export default function Manny({ mood, size = 120, className = "" }: MannyProps) {
  const getAnimation = () => {
    switch (mood) {
      case "excited":
        return {
          y: [0, -8, 0],
          rotate: [0, -3, 3, 0],
          transition: {
            repeat: Infinity,
            duration: 1.5,
            ease: "easeInOut" as const,
          },
        };
      case "sleeping":
        return {
          y: [0, -3, 0],
          rotate: [2, 4, 2],
          transition: {
            repeat: Infinity,
            duration: 4,
            ease: "easeInOut" as const,
          },
        };
      case "thinking":
        return {
          y: [0, -2, 0],
          transition: {
            repeat: Infinity,
            duration: 3.5,
            ease: "easeInOut" as const,
          },
        };
      case "praying":
        return {
          y: [0, -1, 0],
          scale: [1, 1.01, 1],
          transition: {
            repeat: Infinity,
            duration: 4.5,
            ease: "easeInOut" as const,
          },
        };
      case "celebrating":
        return {
          y: [0, -12, 0],
          scale: [1, 1.05, 0.95, 1],
          transition: {
            repeat: Infinity,
            duration: 1.2,
            ease: "easeInOut" as const,
          },
        };
      default:
        return {
          y: [0, -5, 0],
          transition: {
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut" as const,
          },
        };
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {mood === "praying" && (
        <motion.div
          className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" as const }}
        />
      )}

      {mood === "celebrating" && (
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute w-2 h-2 bg-pink-500 rounded-sm"
            style={{ top: "10%", left: "20%" }}
            animate={{ y: [0, -20, 10], x: [0, -10, -5], rotate: [0, 360], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.1 }}
          />
          <motion.div
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            style={{ top: "15%", right: "20%" }}
            animate={{ y: [0, -25, 5], x: [0, 15, 10], rotate: [0, -360], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.3, delay: 0.3 }}
          />
          <motion.div
            className="absolute w-2 h-2 bg-blue-400 rounded-sm"
            style={{ bottom: "25%", left: "15%" }}
            animate={{ y: [0, -15, 10], x: [0, -5, -10], rotate: [0, 180], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, delay: 0.5 }}
          />
          <motion.div
            className="absolute w-2 h-2 bg-emerald-400 rounded-sm"
            style={{ bottom: "20%", right: "15%" }}
            animate={{ y: [0, -20, 8], x: [0, 10, 5], rotate: [0, 270], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }}
          />
        </div>
      )}

      {mood === "thinking" && (
        <motion.div
          className="absolute -top-4 -right-2 pointer-events-none"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        >
          <svg width="40" height="30" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="20" cy="12" rx="18" ry="10" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
            <circle cx="9" cy="24" r="3" fill="white" stroke="#e2e8f0" strokeWidth="1" />
            <circle cx="4" cy="27" r="1.5" fill="white" stroke="#e2e8f0" strokeWidth="1" />
            <path d="M15 12h1M20 12h1M25 12h1" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </motion.div>
      )}

      {mood === "sleeping" && (
        <div className="absolute -top-6 right-2 pointer-events-none flex flex-col space-y-1">
          <motion.span
            className="text-xs font-bold text-slate-400"
            animate={{ y: [0, -10], x: [0, 5], opacity: [0, 1, 0], scale: [0.8, 1.2] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0 }}
          >
            Z
          </motion.span>
          <motion.span
            className="text-sm font-bold text-slate-400"
            animate={{ y: [0, -12], x: [0, 8], opacity: [0, 1, 0], scale: [0.8, 1.2] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
          >
            Z
          </motion.span>
          <motion.span
            className="text-base font-bold text-slate-400"
            animate={{ y: [0, -14], x: [0, 10], opacity: [0, 1, 0], scale: [0.8, 1.2] }}
            transition={{ repeat: Infinity, duration: 2, delay: 1.2 }}
          >
            Z
          </motion.span>
        </div>
      )}

      <motion.svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={getAnimation()}
      >
        <defs>
          <linearGradient id="coverGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={mood === "happy" ? "#b91c1c" : "#991b1b"} />
            <stop offset="100%" stopColor="#4c0519" />
          </linearGradient>
          <linearGradient id="pageGrad" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fefcf3" />
            <stop offset="100%" stopColor="#eaddca" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        <ellipse cx="50" cy="92" rx="35" ry="5" fill="#e2e8f0" />

        <g filter="url(#shadow)">
          <rect x="16" y="12" width="6" height="74" rx="3" fill="#4c0519" />

          <path d="M 22 14 L 80 14 C 82 14, 82 84, 80 84 L 22 84 Z" fill="url(#pageGrad)" />
          <path d="M 80 18 L 82 18 M 80 25 L 82 25 M 80 32 L 82 32 M 80 39 L 82 39 M 80 46 L 82 46 M 80 53 L 82 53 M 80 60 L 82 60 M 80 67 L 82 67 M 80 74 L 82 74 M 80 80 L 82 80" stroke="#d6c3b0" strokeWidth="0.8" />
          <path d="M 24 84 L 80 84 L 80 86 L 24 86 Z" fill="#d6c3b0" />

          <rect
            x="18"
            y="10"
            width="60"
            height="76"
            rx="4"
            fill="url(#coverGrad)"
            stroke={mood === "happy" ? "url(#goldGrad)" : "#4c0519"}
            strokeWidth="1.5"
          />

          <rect x="22" y="14" width="52" height="68" rx="2" stroke="url(#goldGrad)" strokeWidth="1" fill="none" opacity="0.7" />

          <path d="M 46 86 L 46 95 C 46 96, 50 96, 50 95 L 50 86 Z" fill="#b91c1c" />
          <path d="M 50 86 L 50 94 C 50 95, 53 95, 53 94 L 53 86 Z" fill="url(#goldGrad)" />

          <g transform="translate(50, 32) scale(0.9)" opacity="0.95">
            <rect x="-3" y="-12" width="6" height="24" rx="1.5" fill="url(#goldGrad)" />
            <rect x="-9" y="-5" width="18" height="6" rx="1.5" fill="url(#goldGrad)" />
          </g>

          {mood === "encouraging" && (
            <g stroke="#b91c1c" strokeWidth="3" strokeLinecap="round" fill="none">
              <path d="M 18 45 C 10 45, 8 40, 10 35" />
              <path d="M 78 45 C 86 45, 88 40, 86 35" />
            </g>
          )}

          {mood === "celebrating" && (
            <g stroke="#b91c1c" strokeWidth="3" strokeLinecap="round" fill="none">
              <path d="M 18 45 C 12 40, 10 30, 14 22" />
              <path d="M 78 45 C 84 40, 86 30, 82 22" />
            </g>
          )}

          <g transform="translate(0, 14)">
            {mood === "happy" && (
              <g stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none">
                <path d="M 36 44 Q 40 40 44 44" />
                <path d="M 56 44 Q 60 40 64 44" />
              </g>
            )}

            {mood === "excited" && (
              <g fill="#1e293b">
                <circle cx="40" cy="44" r="4.5" />
                <circle cx="60" cy="44" r="4.5" />
                <path d="M 40 41.5 L 40.5 43.5 L 42.5 44 L 40.5 44.5 L 40 46.5 L 39.5 44.5 L 37.5 44 L 39.5 43.5 Z" fill="#fef08a" transform="scale(0.8) translate(10, 11)" />
                <path d="M 60 41.5 L 60.5 43.5 L 62.5 44 L 60.5 44.5 L 60 46.5 L 59.5 44.5 L 57.5 44 L 59.5 43.5 Z" fill="#fef08a" transform="scale(0.8) translate(22.5, 11)" />
              </g>
            )}

            {mood === "thinking" && (
              <g stroke="#1e293b" strokeLinecap="round" fill="none">
                <circle cx="40" cy="44" r="3.5" fill="#1e293b" />
                <path d="M 56 44 L 64 44" strokeWidth="3" />
                <path d="M 36 38 Q 40 36 44 39" strokeWidth="2" />
                <path d="M 56 36 Q 60 34 64 36" strokeWidth="2" />
              </g>
            )}

            {mood === "encouraging" && (
              <g fill="#1e293b">
                <circle cx="39" cy="44" r="4" />
                <circle cx="61" cy="44" r="4" />
                <circle cx="40.5" cy="42.5" r="1.5" fill="white" />
                <circle cx="62.5" cy="42.5" r="1.5" fill="white" />
                <ellipse cx="34" cy="48" rx="3" ry="1.5" fill="#f43f5e" opacity="0.35" />
                <ellipse cx="66" cy="48" rx="3" ry="1.5" fill="#f43f5e" opacity="0.35" />
              </g>
            )}

            {mood === "celebrating" && (
              <g stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none">
                <path d="M 35 46 L 40 41 L 45 46" />
                <path d="M 55 46 L 60 41 L 65 46" />
                <ellipse cx="32" cy="49" rx="3.5" ry="2" fill="#f43f5e" opacity="0.5" />
                <ellipse cx="68" cy="49" rx="3.5" ry="2" fill="#f43f5e" opacity="0.5" />
              </g>
            )}

            {mood === "sleeping" && (
              <g stroke="#475569" strokeWidth="2.5" strokeLinecap="round" fill="none">
                <path d="M 36 43 Q 40 47 44 43" />
                <path d="M 56 43 Q 60 47 64 43" />
              </g>
            )}

            {mood === "praying" && (
              <g stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none">
                <path d="M 36 43 Q 40 46 44 43" />
                <path d="M 56 43 Q 60 46 64 43" />
              </g>
            )}

            {mood === "sleeping" && (
              <circle cx="50" cy="53" r="2.5" fill="#475569" />
            )}

            {mood === "thinking" && (
              <path d="M 47 53 Q 50 54 53 52" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            )}

            {mood === "praying" && (
              <path d="M 47 52 Q 50 54 53 52" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" fill="none" />
            )}

            {mood === "excited" && (
              <path d="M 45 51 Q 50 58 55 51 Z" fill="#b91c1c" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
            )}

            {(mood === "happy" || mood === "celebrating" || mood === "encouraging") && (
              <path d="M 45 50 Q 50 56 55 50" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
            )}
          </g>
        </g>
      </motion.svg>
    </div>
  );
}
