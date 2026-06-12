"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Manny from "@/components/mascot/Manny";
import { Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      setLoading(false);
      return;
    }

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Adresse e-mail ou mot de passe incorrect.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err) {
      setError("Impossible de se connecter avec Google.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100/60 flex flex-col items-center">
        <div className="mb-4">
          <Manny mood="encouraging" size={155} />
        </div>

        <h2 className="text-2xl font-black text-slate-800 tracking-tight text-center mb-1">
          Ravi de te revoir !
        </h2>
        <p className="text-slate-400 font-semibold text-xs text-center mb-6">
          Connecte-toi pour nourrir ton âme aujourd'hui
        </p>

        {error && (
          <div className="w-full p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
            <div className="relative">
              <input
                type="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-sm"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="w-full flex items-center my-5">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">ou</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full py-3 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.28c1.92,-1.78 3.02,-4.4 3.02,-7.4C21.64,11.87 21.54,11.45 21.35,11.1z" fill="#4285F4" />
              <path d="M12,20.64c2.43,0 4.47,-0.8 5.96,-2.18l-3.28,-2.6c-0.9,0.6 -2.07,0.98 -3.28,0.98 -2.34,0 -4.33,-1.58 -5.04,-3.72H3.02v2.6C4.5,18.72 8.0,20.64 12,20.64z" fill="#34A853" />
              <path d="M6.96,13.12C6.77,12.58 6.67,12.0 6.67,11.4c0,-0.6 0.1,-1.18 0.29,-1.72V7.08H3.02C2.39,8.38 2.0,9.85 2.0,11.4c0,1.55 0.39,3.02 1.02,4.32l3.94,-3.08c0,-0.26 0,-0.52 0,-0.52z" fill="#FBBC05" />
              <path d="M12,5.16c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,2.44 14.43,1.64 12,1.64 8.0,1.64 4.5,3.56 3.02,6.68l3.94,3.08C7.67,7.62 9.66,5.16 12,5.16z" fill="#EA4335" />
            </g>
          </svg>
          Continuer avec Google
        </button>

        <div className="text-center mt-6">
          <Link href="/register" className="text-xs font-bold text-indigo-650 hover:underline">
            Pas encore de compte ? S'inscrire
          </Link>
        </div>
      </div>
    </div>
  );
}
