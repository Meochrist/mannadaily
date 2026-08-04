"use client";

import { useEffect } from "react";

export default function MeditateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Meditate page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-4xl">😔</div>
      <h2 className="text-xl font-black text-slate-800">Quelque chose s&apos;est mal passé</h2>
      <p className="text-sm text-slate-500 max-w-md">
        Une erreur est survenue pendant ta méditation. Ne t&apos;inquiète pas, ta progression est sauvegardée.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 bg-indigo-600 text-white font-extrabold rounded-xl hover:bg-indigo-700 transition"
        >
          Réessayer
        </button>
        <a
          href="/dashboard"
          className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
        >
          Retour au tableau de bord
        </a>
      </div>
    </div>
  );
}
