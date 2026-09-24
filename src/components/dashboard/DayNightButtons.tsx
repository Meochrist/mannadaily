"use client";

import Link from "next/link";

type Session = {
  key: "morning" | "midday" | "evening";
  label: string;
  emoji: string;
  className: string;
};

interface DayNightButtonsProps {
  morningDone: boolean;
  middayDone?: boolean;
  eveningDone: boolean;
  verseText: string;
  verseReference: string;
  verseTheme: string;
}

export default function DayNightButtons({
  morningDone,
  middayDone,
  eveningDone,
  verseText,
  verseReference,
  verseTheme,
}: DayNightButtonsProps) {
  const sessions: Session[] = [
    { key: "morning", label: "Session 1 · Matin", emoji: "🌅", className: "from-amber-400 to-amber-500 text-slate-950" },
    { key: "midday", label: "Session 2 · Midi", emoji: "☀️", className: "from-orange-400 to-orange-500 text-slate-950" },
    { key: "evening", label: "Session 3 · Soir", emoji: "🌙", className: "from-indigo-600 to-indigo-700 text-white" },
  ];
  const done = { morning: morningDone, midday: middayDone, evening: eveningDone };
  const completedCount = [morningDone, middayDone, eveningDone].filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 3) * 100);
  const query = `text=${encodeURIComponent(verseText)}&reference=${encodeURIComponent(verseReference)}&theme=${encodeURIComponent(verseTheme)}`;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4 transition-colors">
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Journée spirituelle · Josué 1:8
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Trois mini-sessions pour méditer la Parole matin, midi et soir.
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
          <span className="text-[10px] tracking-wide">Progression du jour</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressPercent === 100 ? "bg-emerald-500" : "bg-amber-500"}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className={`text-[10px] font-bold text-center mt-1 ${progressPercent === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
          {progressPercent === 100 ? "Ta journée spirituelle est complète ! 🎉" : `${completedCount}/3 mini-sessions complétées`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {sessions.map((session, index) => {
          const isDone = done[session.key];
          const prerequisiteDone = index === 0 || done[sessions[index - 1].key];
          const href = `/meditate?period=${session.key}&${query}`;
          if (isDone) {
            return (
              <div key={session.key} className="flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 rounded-2xl text-xs font-black gap-1">
                <span>{session.emoji} {session.label}</span>
                <span>Fait ✓</span>
              </div>
            );
          }
          if (!prerequisiteDone) {
            return (
              <div key={session.key} title="Termine d'abord la session précédente" className="flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 rounded-2xl text-xs font-black cursor-not-allowed opacity-70 gap-1">
                <span>{session.emoji} {session.label}</span>
                <span>À débloquer</span>
              </div>
            );
          }
          return (
            <Link key={session.key} href={href} className={`flex flex-col items-center justify-center p-3.5 bg-gradient-to-b ${session.className} rounded-2xl text-xs font-black shadow-md hover:brightness-105 active:scale-[0.98] transition-all gap-1`}>
              <span>{session.emoji} {session.label}</span>
              <span>Commencer</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
