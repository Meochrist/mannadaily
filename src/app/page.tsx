"use client";

import React from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import Manny from "@/components/mascot/Manny";
import Samson from "@/components/mascot/Samson";
import Esther from "@/components/mascot/Esther";
import Gedeon from "@/components/mascot/Gedeon";
import Noe from "@/components/mascot/Noe";
import { BookOpen, Flame, Trophy, HelpCircle, ArrowRight, ShieldCheck, Sparkles, Heart } from "lucide-react";

export default function LandingPage() {
  // Config des mascottes pour la section 4
  const mascots = [
    {
      Component: Manny,
      name: "Manny",
      mood: "excited" as const,
      role: "Le Guide Bienveillant",
      description: "Toujours à tes côtés avec des paroles de paix et d'amour pour apaiser ton cœur.",
      bgColor: "bg-indigo-50 border-indigo-100",
      textColor: "text-indigo-600",
    },
    {
      Component: Samson,
      name: "Samson",
      mood: "celebrating" as const,
      role: "Le Coach Intransigeant",
      description: "Prêt à booster ton homme intérieur avec une dose d'énergie et de discipline de fer !",
      bgColor: "bg-red-50 border-red-100",
      textColor: "text-red-600",
    },
    {
      Component: Esther,
      name: "Esther",
      mood: "happy" as const,
      role: "La Reine Royale",
      description: "Une élégance céleste pour te rappeler avec noblesse ta véritable identité de souverain.",
      bgColor: "bg-purple-50 border-purple-100",
      textColor: "text-purple-600",
    },
    {
      Component: Gedeon,
      name: "Gédéon",
      mood: "encouraging" as const,
      role: "Le Soldat Anxieux",
      description: "Il s'inquiète pour toi (et ton streak) mais te pousse à faire les bons choix au quotidien.",
      bgColor: "bg-amber-50 border-amber-100",
      textColor: "text-amber-600",
    },
    {
      Component: Noe,
      name: "Noé",
      mood: "thinking" as const,
      role: "Le Sage Philosophe",
      description: "Un flegme légendaire et un soupçon de sarcasme pour te guider au milieu du déluge.",
      bgColor: "bg-emerald-50 border-emerald-100",
      textColor: "text-emerald-600",
    },
  ];

  // Config des fonctionnalités clés
  const features = [
    {
      emoji: "📖",
      title: "Méthode OIA+",
      description: "Une méditation guidée structurée en 7 étapes : Contexte, Observation, Interprétation, Application et Prière.",
    },
    {
      emoji: "🔥",
      title: "Séries de jours (Streaks)",
      description: "Crée une habitude spirituelle quotidienne incassable. Protège ton streak avec le Streak Freeze en cas de besoin.",
    },
    {
      emoji: "💎",
      title: "Monnaie Lingots",
      description: "Gagne des lingots à chaque session réussie et utilise-les dans la boutique pour obtenir des bonus exclusifs.",
    },
    {
      emoji: "🏆",
      title: "Ligues Spirituelles",
      description: "Monte au fil des semaines du Bronze au Diamant en cumulant de l'XP face à d'autres membres de la communauté.",
    },
    {
      emoji: "🤖",
      title: "IA Assistante",
      description: "Des suggestions contextuelles et des explications claires générées par IA pour éclairer ton étude biblique.",
    },
    {
      emoji: "🎭",
      title: "Bande de Mascottes",
      description: "5 compagnons de route attachants avec leurs répliques cultes pour rire et persévérer chaque jour.",
    },
  ];

  // Variantes d'animation Framer Motion
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* BARRE DE NAVIGATION MINIMALISTE */}
      <header className="fixed top-0 left-0 right-0 bg-indigo-950/80 backdrop-blur-md z-50 border-b border-white/5 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-black text-base border border-white/10">
              M
            </div>
            <span className="text-lg font-black tracking-wider text-white">
              MannaDaily
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs md:text-sm font-bold text-indigo-200 hover:text-white transition-all"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="text-xs md:text-sm font-black bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/10 active:scale-95"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* SECTION 1 — HERO */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-white overflow-hidden">
        {/* Cercles de lumière décoratifs */}
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 text-xs font-bold uppercase tracking-wider text-indigo-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              L'application chrétienne la plus motivante
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05]"
            >
              La Bible. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400">
                Chaque jour.
              </span> <br />
              Comme un jeu.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-indigo-100 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed"
            >
              MannaDaily transforme ton étude biblique en une habitude quotidienne passionnante. Médite en profondeur, gagne des récompenses et progresse avec des mascottes attachantes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
            >
              <Link
                href="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Commencer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold text-base rounded-2xl border border-white/10 transition-all active:scale-98"
              >
                Se connecter
              </Link>
            </motion.div>
          </div>

          <div className="lg:col-span-5 flex justify-center items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
              className="relative p-6 bg-white/5 rounded-[40px] border border-white/5 shadow-2xl backdrop-blur-sm"
            >
              <Manny mood="excited" size={240} className="drop-shadow-[0_20px_50px_rgba(79,70,229,0.3)] animate-pulse-slow" />
              <div className="absolute -bottom-4 -right-4 bg-indigo-600/90 text-white font-black text-xs px-4 py-2.5 rounded-2xl border border-indigo-500 shadow-lg">
                Manny est excité de t'accueillir ! 🎉
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — PROBLÈME/SOLUTION */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800">
              Tu lis la Bible... mais tu l'oublies le lendemain ?
            </h2>
            <p className="text-slate-500 font-medium">
              Nous connaissons tous cette frustration. C'est pourquoi nous avons repensé l'expérience d'étude biblique pour qu'elle devienne une joie quotidienne ancrée dans ta mémoire.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* CARTE 1 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div className="space-y-4">
                <span className="text-2xl font-black text-rose-500 bg-rose-50 border border-rose-100 w-10 h-10 flex items-center justify-center rounded-xl">✕</span>
                <h3 className="text-lg font-black text-slate-800">Lecture passive</h3>
                <p className="text-slate-500 text-sm font-medium">
                  Parcourir un chapitre à la va-vite sans l'analyser mène souvent à l'oubli instantané.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-200/60 flex items-center gap-2.5 text-indigo-600 font-extrabold text-sm">
                <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">✓</span>
                Méditation guidée OIA+
              </div>
            </div>

            {/* CARTE 2 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div className="space-y-4">
                <span className="text-2xl font-black text-rose-500 bg-rose-50 border border-rose-100 w-10 h-10 flex items-center justify-center rounded-xl">✕</span>
                <h3 className="text-lg font-black text-slate-800">Motivation qui disparaît</h3>
                <p className="text-slate-500 text-sm font-medium">
                  Le manque de structure rend difficile la persévérance au-delà de 3 ou 4 jours.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-200/60 flex items-center gap-2.5 text-indigo-600 font-extrabold text-sm">
                <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">✓</span>
                Séries de jours & Gamification
              </div>
            </div>

            {/* CARTE 3 */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div className="space-y-4">
                <span className="text-2xl font-black text-rose-500 bg-rose-50 border border-rose-100 w-10 h-10 flex items-center justify-center rounded-xl">✕</span>
                <h3 className="text-lg font-black text-slate-800">Seul dans ta foi</h3>
                <p className="text-slate-500 text-sm font-medium">
                  Sans partage, on perd la stimulation et l'encouragement de la communion fraternelle.
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-200/60 flex items-center gap-2.5 text-indigo-600 font-extrabold text-sm">
                <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">✓</span>
                Ligue spirituelle hebdomadaire
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — FONCTIONNALITÉS CLÉS */}
      <section className="py-20 bg-slate-100/50">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800">
              Tout ce dont tu as besoin pour grandir
            </h2>
            <p className="text-slate-500 font-medium">
              Une application conçue avec amour, alliant rigueur théologique et dynamisme ludique pour nourrir ton âme.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:translate-y-[-4px] transition-all duration-300"
              >
                <div className="text-3xl mb-4">{feature.emoji}</div>
                <h3 className="font-extrabold text-slate-800 text-base mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — MASCOTTES */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800">
              La bande de mascottes qui te coache
            </h2>
            <p className="text-slate-500 font-medium">
              Découvre tes 5 compagnons spirituels. Chacun d'entre eux a sa propre personnalité et t'envoie des rappels hilarants ou encourageants pour maintenir ta discipline.
            </p>
          </div>

          {/* RENDU EN CASCADE DES MASCOTTES */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
          >
            {mascots.map((mascot, idx) => {
              const MascotSVG = mascot.Component;
              return (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center text-center space-y-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`p-4 rounded-full border ${mascot.bgColor}`}>
                    <MascotSVG mood={mascot.mood} size={100} className="drop-shadow-md" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-800 text-base">{mascot.name}</h3>
                    <p className={`text-[10px] font-black uppercase tracking-wider ${mascot.textColor}`}>
                      {mascot.role}
                    </p>
                  </div>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed flex-1">
                    {mascot.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* SECTION 5 — CTA FINAL */}
      <section className="relative py-24 bg-gradient-to-br from-indigo-950 to-purple-950 text-white text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto px-6 space-y-8 relative z-10">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Prêt à transformer ta vie spirituelle ?
            </h2>
            <p className="text-indigo-200 font-medium text-lg max-w-xl mx-auto">
              Rejoins des milliers de chrétiens et commence à ancrer la Parole de Dieu de manière durable et passionnante.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-lg rounded-2xl shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Commencer gratuitement — C'est 100% gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>
            <span className="text-xs text-indigo-300 font-semibold flex items-center gap-1.5 justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Sans carte bancaire. Pour toujours gratuit.
            </span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white font-black text-sm border border-white/5">
              M
            </div>
            <span className="text-base font-black tracking-wider text-white">
              MannaDaily
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1 justify-center">
            Fait avec <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> pour le Royaume de Dieu. © {new Date().getFullYear()} MannaDaily.
          </p>
        </div>
      </footer>
    </div>
  );
}
