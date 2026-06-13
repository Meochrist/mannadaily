"use client";

import React from "react";
import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface SpeechMicButtonProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export default function SpeechMicButton({
  value,
  onChange,
  className = "",
}: SpeechMicButtonProps) {
  const { isListening, startListening, stopListening, isSupported } =
    useSpeechRecognition();

  if (!isSupported) return null;

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((transcript) => {
        const cleanedTranscript = transcript.trim();
        if (cleanedTranscript) {
          const newValue = value ? `${value.trim()} ${cleanedTranscript}` : cleanedTranscript;
          onChange(newValue);
        }
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Parler pour répondre"
      className={`absolute bottom-3 right-3 p-1.5 rounded-lg border transition-all flex items-center justify-center pointer-events-auto ${
        isListening
          ? "bg-rose-50 border-rose-200 text-rose-650 shadow-sm"
          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600"
      } ${className}`}
    >
      {isListening ? (
        <motion.div
          animate={{ scale: [1, 1.25, 1] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="flex items-center justify-center"
        >
          <Mic className="w-4 h-4 fill-rose-650" />
        </motion.div>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
}
