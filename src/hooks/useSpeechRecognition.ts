"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognitionResultItem {
  transcript: string;
  isFinal?: boolean;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  0: SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    readonly length: number;
    [index: number]: SpeechRecognitionResult;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface SpeechRecognitionHook {
  isListening: boolean;
  isSupported: boolean;
  hasPermission: boolean;
  transcript: string;        // all finalized text accumulated
  interimTranscript: string; // current provisional text being spoken
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string;
}

export function useSpeechRecognition(
  onResult?: (text: string) => void
): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState("");

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const finalTranscriptRef = useRef(""); // non-reactive accumulator
  const isListeningRef = useRef(false);   // mirror for callbacks

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      queueMicrotask(() => setIsSupported(false));
      return;
    }

    queueMicrotask(() => setIsSupported(true));

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "fr-FR";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptChunk = result[0].transcript;

        if (result.isFinal) {
          finalText += (finalText ? " " : "") + transcriptChunk;
        } else {
          interimText += (interimText ? " " : "") + transcriptChunk;
        }
      }

      // Accumulate final text
      if (finalText) {
        finalTranscriptRef.current = finalTranscriptRef.current
          ? `${finalTranscriptRef.current} ${finalText}`
          : finalText;
        setTranscript(finalTranscriptRef.current);

        // Forward finalized text to parent callback
        if (onResult) {
          onResult(finalTranscriptRef.current);
        }
      }

      // Update interim
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMsg = event.error || "Erreur inconnue";
      console.error("Speech recognition error:", errorMsg);

      // Handle not-allowed specifically
      if (errorMsg === "not-allowed" || errorMsg === "permission-denied") {
        setError("Permission microphone refusée. Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur.");
        setHasPermission(false);
      } else if (errorMsg === "no-speech" || errorMsg === "aborted") {
        // Silent: user stopped speaking or aborted
      } else {
        setError(`Erreur de reconnaissance vocale : ${errorMsg}`);
      }

      setIsListening(false);
      isListeningRef.current = false;
    };

    recognition.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (_unused) {}
      recognitionRef.current = null;
    };
  }, [onResult]);

  // Request microphone permission explicitly (needed on mobile)
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      // First try the Permissions API
      if (navigator.permissions) {
        const permResult = await navigator.permissions.query({ name: "microphone" as PermissionName });
        if (permResult.state === "denied") {
          setError("L'accès au microphone a été refusé. Veuillez l'autoriser dans les paramètres de votre navigateur.");
          return false;
        }
        if (permResult.state === "granted") {
          setHasPermission(true);
          return true;
        }
      }

      // Fallback: explicitly request via getUserMedia (triggers permission prompt on mobile)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately; we only needed the permission grant
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      return true;
    } catch (err: unknown) {
      const msg =
        (err instanceof Error && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError"))
          ? "Permission microphone refusée. Veuillez autoriser le microphone."
          : `Impossible d'accéder au microphone : ${err instanceof Error ? err.message : String(err)}`;
      setError(msg);
      setHasPermission(false);
      return false;
    }
  }, []);

  // Start listening
  const startListening = useCallback(async () => {
    if (!recognitionRef.current) return;

    setError("");

    // Request permission first (especially important on mobile)
    const granted = await requestMicrophonePermission();
    if (!granted) return;

    // Reset interim display
    setInterimTranscript("");

    try {
      recognitionRef.current.start();
    } catch (err: unknown) {
      // If already started, stop and restart
      if (err instanceof Error && err.name === "InvalidStateError") {
        try {
          recognitionRef.current.stop();
        } catch (_unused) {}
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.error("Failed to restart speech recognition", e);
          }
        }, 200);
      } else {
        console.error("Failed to start speech recognition", err);
        setError("Impossible de démarrer la reconnaissance vocale.");
      }
    }
  }, [requestMicrophonePermission]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error("Failed to stop speech recognition", err);
    }
    // Ensure any remaining interim is captured as final in the transcript
    // by flushing what we have
    setIsListening(false);
    isListeningRef.current = false;
  }, []);

  // Reset accumulated transcript
  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setError("");
  }, []);

  return {
    isListening,
    isSupported,
    hasPermission,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
  };
}