"use client";

import { useState, useEffect } from "react";
import LargeWidget from "@/components/widget/LargeWidget";

export default function WidgetPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4 gap-6">
      <h1 className="text-2xl font-black text-slate-800">Widget MannaDaily</h1>
      <p className="text-sm text-slate-500 text-center max-w-md">
        Ce widget affiche l&apos;humeur de ta mascotte en temps réel. Plus la journée avance sans méditation, plus la mascotte devient désespérée !
      </p>
      <LargeWidget />
      <p className="text-xs text-slate-400 text-center max-w-md">
        Le widget se met à jour automatiquement toutes les 5 minutes.
      </p>
    </div>
  );
}
