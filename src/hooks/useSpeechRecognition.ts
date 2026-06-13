"use client";

import { useState, useEffect, useRef } from "react";

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "fr-FR";
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const startListening = (onResult: (text: string) => void) => {
    if (!recognitionRef.current) return;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      const resultIndex = event.resultIndex;
      const transcript = event.results[resultIndex][0].transcript;
      if (transcript) {
        onResult(transcript);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Failed to start speech recognition", err);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error("Failed to stop speech recognition", err);
    }
    setIsListening(false);
  };

  return {
    isListening,
    startListening,
    stopListening,
    isSupported,
  };
}
