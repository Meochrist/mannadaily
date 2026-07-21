"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, VolumeX } from "lucide-react";
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
  // Store the latest value in a ref so the hook's onResult always has fresh data
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  });

  const handleSpeechResult = useCallback(
    (fullTranscript: string) => {
      // fullTranscript is the complete accumulated text from the hook,
      // but we want to append only the NEW part compared to what's already in the textarea.
      // Since the hook accumulates everything, we diff against the current field value.
      const currentVal = valueRef.current;
      if (fullTranscript.length > currentVal.length) {
        onChange(fullTranscript);
      } else if (fullTranscript !== currentVal && fullTranscript.length > 0) {
        // If it's completely different (e.g., reset happened), set it directly
        onChange(fullTranscript);
      }
    },
    [onChange]
  );

  const {
    isListening,
    isSupported,
    hasPermission,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  } = useSpeechRecognition(handleSpeechResult);

  const handleClick = async () => {
    if (isListening) {
      stopListening();
      // After stopping, sync the final transcript back to the textarea
      if (transcript && transcript.length > value.length) {
        onChange(transcript);
      }
    } else {
      // Reset the transcript accumulator so we start fresh for this field
      resetTranscript();
      await startListening();
    }
  };

  // When interimTranscript changes while listening, update the textarea in real time
  useEffect(() => {
    if (isListening && interimTranscript) {
      // Build live preview: existing value (from final) + interim (provisional)
      const finalSoFar = transcript || "";
      const liveText = finalSoFar
        ? interimTranscript
          ? `${finalSoFar} ${interimTranscript}`
          : finalSoFar
        : interimTranscript;
      if (liveText !== value) {
        onChange(liveText);
      }
    }
  }, [isListening, interimTranscript, transcript, onChange, value]);

  if (!isSupported) return null;

  return (
    <div className="relative inline-flex items-center">
      <AnimatePresence>
        {isListening && interimTranscript && (
          <motion.span
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            className="absolute right-full mr-2 text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg whitespace-nowrap max-w-[120px] truncate pointer-events-none"
          >
            {interimTranscript}
          </motion.span>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleClick}
        title={isListening ? "Arrêter l'enregistrement" : "Parler pour répondre"}
        className={`p-1.5 rounded-lg border transition-all flex items-center justify-center pointer-events-auto ${
          isListening
            ? "bg-rose-50 border-rose-200 text-rose-650 shadow-sm animate-pulse"
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
            <Square className="w-3.5 h-3.5 fill-rose-650" />
          </motion.div>
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {/* Error tooltip */}
      <AnimatePresence>
        {error && !isListening && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap pointer-events-none z-50"
          >
            <div className="flex items-center gap-1.5">
              <VolumeX className="w-3 h-3" />
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}