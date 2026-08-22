"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Manny from "@/components/mascot/Manny";
import { ArrowLeft, Sun, Moon, Clock, BookOpen, Heart } from "lucide-react";

function ViewSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [session, setSession] = useState<{
    type: string;
    period: string;
    xpEarned: number;
    duration: number;
    createdAt: string;
    notes: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("Aucune session spécifiée");
      setLoading(false);
      return;
    }

    fetch(`/api/meditations?sessionId=${encodeURIComponent(sessionId)}`)
      .then((res) => res.ok ? res.json() : Promise.reject("Session introuvable"))
      .then((data) => {
        setSession(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(typeof err === "string" ? err : "Impossible de charger cette session");
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <Manny mood="sad" size={120} />
        <p className="text-slate-500 font-semibold">{error || "Session introuvable"}</p>
        <button
          onClick={() => router.push("/my-meditations")}
          className="px-6 py-3 bg-indigo-600 text-white font-extrabold rounded-xl"
        >
          Retour à mes méditations
        </button>
      </div>
    );
  }

  const isMorning = session.period === "morning";
  const date = new Date(session.createdAt);
  const formattedDate = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/my-meditations")}
          className="p-2 hover:bg-slate-100 rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Méditation du {formattedDate}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isMorning ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>
              {isMorning ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
              {isMorning ? "Matin" : "Soir"}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formattedTime}
            </span>
          </div>
        </div>
      </div>

      {/* Notes content */}
      {session.notes ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6 md:p-8 space-y-6">
          {/* Header block */}
          <div className="bg-indigo-50/60 border border-indigo-100/50 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-600">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-wider">Verset médité</span>
            </div>
            {(() => {
              // Format : [VERS DU JOUR]\nJean 3:16 : "texte du verset" (Thème : Amour)
              const blockMatch = session.notes.match(/\[VERS DU JOUR\]\s*\n([^\n]+)/);
              const block = blockMatch ? blockMatch[1].trim() : "";
              const refMatch = block.match(/^(.+?)\s*:\s*"/);
              const textMatch = block.match(/"([^"]+)"/);
              const themeMatch = block.match(/Thème\s*:\s*([^)\n]+)/);
              return (
                <>
                  {refMatch && (
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                      — {refMatch[1].trim()}
                    </p>
                  )}
                  {textMatch && (
                    <blockquote className="text-lg font-black text-slate-800 italic">
                      « {textMatch[1]} »
                    </blockquote>
                  )}
                  {themeMatch && (
                    <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-[10px] font-bold">
                      Thème : {themeMatch[1].trim()}
                    </span>
                  )}
                  {!refMatch && !textMatch && block && (
                    <blockquote className="text-lg font-black text-slate-800 italic">
                      {block}
                    </blockquote>
                  )}
                </>
              );
            })()}
          </div>

          {/* Mini-sessions */}
          {["MINI-SESSION 1", "MINI-SESSION 2", "MINI-SESSION 3"].map((section) => {
            const regex = new RegExp(`\\[${section}[^\\]]*\\]([\\s\\S]*?)(?=\\n\\[|$)`, "g");
            const match = regex.exec(session.notes!);
            if (!match) return null;

            // Format des notes :
            //   - Question ?
            //     Réponse (ligne suivante, indentée)
            const rawLines = match[1].split("\n");
            const entries: { question: string; answer: string }[] = [];

            for (let i = 0; i < rawLines.length; i++) {
              const line = rawLines[i];
              if (!line.trimStart().startsWith("- ")) continue;

              const question = line.trimStart().replace(/^-\s*/, "").trim();

              // La réponse est sur les lignes suivantes, jusqu'à la prochaine question
              const answerParts: string[] = [];
              for (let j = i + 1; j < rawLines.length; j++) {
                const next = rawLines[j];
                if (next.trimStart().startsWith("- ")) break;
                if (next.startsWith("[")) break;
                if (next.trim()) answerParts.push(next.trim());
              }

              const answer = answerParts.join(" ").trim();
              // Ne garder que les questions réellement renseignées
              if (answer && answer !== "Non renseigné") {
                entries.push({ question, answer });
              }
            }

            if (entries.length === 0) return null;

            return (
              <div key={section} className="bg-slate-50 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                  {section.replace("MINI-SESSION", "Mini-session")}
                </h3>
                {entries.map((entry, i) => (
                  <div key={i} className="bg-white rounded-lg p-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{entry.question}</span>
                    <p className="text-sm text-slate-700 font-medium mt-0.5 whitespace-pre-line">{entry.answer}</p>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Prayer */}
          {(() => {
            // Format : [PRIÈRE REÇUE]\n"contenu de la prière"
            const prayerMatch = session.notes!.match(/\[PRIÈRE REÇUE\]\s*\n"?([\s\S]+?)"?\s*$/);
            const prayer = prayerMatch ? prayerMatch[1].trim() : "";
            return prayer ? (
              <div className="bg-purple-50/60 border border-purple-100/50 rounded-2xl p-5">
                <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 fill-purple-500 text-purple-500" />
                  Prière reçue
                </h3>
                <p className="text-sm text-slate-700 font-medium italic leading-relaxed whitespace-pre-line">
                  « {prayer} »
                </p>
              </div>
            ) : null;
          })()}

          {/* Fallback : notes brutes si le parsing structuré n'a rien donné */}
          {!/\[MINI-SESSION/.test(session.notes) && (
            <div className="bg-slate-50 rounded-2xl p-5">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Notes de la session
              </h3>
              <p className="text-sm text-slate-700 font-medium whitespace-pre-line leading-relaxed">
                {session.notes}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8 text-center">
          <Manny mood="thinking" size={100} />
          <p className="text-slate-400 font-semibold mt-4">Aucune note pour cette session.</p>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => router.push("/my-meditations")}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-lg transition-all text-sm"
      >
        Retour à mes méditations
      </button>
    </div>
  );
}

export default function ViewSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ViewSessionContent />
    </Suspense>
  );
}
