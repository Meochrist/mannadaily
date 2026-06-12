"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Manny from "@/components/mascot/Manny";
import { User, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name || !email || !password || !confirmPassword) {
      setError("Veuillez remplir tous les champs.");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Veuillez saisir une adresse e-mail valide.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue lors de l'inscription.");
        setLoading(false);
        return;
      }

      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        setError("Création réussie, mais impossible de se connecter automatiquement. Veuillez vous connecter manuellement.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100/60 flex flex-col items-center">
        <div className="mb-4">
          <Manny mood="happy" size={155} />
        </div>

        <h2 className="text-2xl font-black text-slate-800 tracking-tight text-center mb-1">
          Crée ton compte !
        </h2>
        <p className="text-slate-400 font-semibold text-xs text-center mb-6">
          Rejoins MannaDaily et commence ton voyage de foi
        </p>

        {error && (
          <div className="w-full p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prénom</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ton prénom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

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
                placeholder="Min. 6 caractères"
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmer le mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Ressaisir le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-sm"
          >
            {loading ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href="/login" className="text-xs font-bold text-indigo-650 hover:underline">
            Déjà un compte ? Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
