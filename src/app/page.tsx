"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import CharacterRenderer from "@/components/mascot/CharacterRenderer";
import { 
  BookOpen, 
  Flame, 
  Trophy, 
  Sparkles, 
  Heart, 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  Zap, 
  Compass, 
  ShoppingBag, 
  Award, 
  Users, 
  TrendingUp,
  MessageSquare
} from "lucide-react";

export default function LandingPage() {
  const [activeMascotIdx, setActiveMascotIdx] = useState(0);

  // Config des 10 compagnons de route bibliques
  const mascots = [
    {
      id: "manny",
      name: "Manny",
      role: "Le Guide Bienveillant",
      description: "Toujours à tes côtés avec des paroles de paix et d'amour pour apaiser ton cœur au quotidien.",
      quote: "Dieu t'aime exactement tel que tu es aujourd'hui. Avançons ensemble, un pas à la fois ! 🕊️",
      pose: "idle" as const,
      expression: "happy" as const,
      bgColor: "bg-indigo-50 border-indigo-150 text-indigo-700",
      pillColor: "bg-indigo-100 text-indigo-800",
      bgGradient: "from-indigo-500 to-indigo-600"
    },
    {
      id: "samson",
      name: "Samson",
      role: "Le Coach de Fer",
      description: "Prêt à booster ton homme intérieur avec une dose d'énergie spirituelle et une discipline inflexible !",
      quote: "Pas d'excuses aujourd'hui ! Ton esprit a besoin de nourriture. Fortifie ton homme intérieur ! 💪",
      pose: "running" as const,
      expression: "happy" as const,
      bgColor: "bg-red-50 border-red-150 text-red-700",
      pillColor: "bg-red-100 text-red-800",
      bgGradient: "from-red-500 to-red-600"
    },
    {
      id: "esther",
      name: "Esther",
      role: "La Reine Royale",
      description: "Une élégance céleste pour te rappeler avec noblesse et dignité ta véritable identité d'enfant de Roi.",
      quote: "Tu es couronné de grâce et de gloire. Souviens-toi de qui tu es et marche la tête haute ! 👑",
      pose: "idle" as const,
      expression: "happy" as const,
      bgColor: "bg-purple-50 border-purple-150 text-purple-700",
      pillColor: "bg-purple-100 text-purple-800",
      bgGradient: "from-purple-500 to-purple-600"
    },
    {
      id: "noe",
      name: "Noé",
      role: "Le Sage Calme",
      description: "Un flegme légendaire et un soupçon de sagesse pour garder le cap même au milieu des plus grandes tempêtes.",
      quote: "Reste calme. La tempête passera, et l'arc-en-ciel finira toujours par apparaître. Fais confiance. 🌈",
      pose: "idle" as const,
      expression: "neutral" as const,
      bgColor: "bg-emerald-50 border-emerald-150 text-emerald-700",
      pillColor: "bg-emerald-100 text-emerald-800",
      bgGradient: "from-emerald-500 to-emerald-600"
    },
    {
      id: "abraham",
      name: "Abraham",
      role: "Le Père de la Foi",
      description: "Il t'encourage à oser franchir le pas, à marcher par la foi et à faire confiance aux promesses de Dieu.",
      quote: "Même si tu ne vois pas tout le chemin, fais le premier pas. La foi voit l'invisible et croit l'impossible ! ✨",
      pose: "idle" as const,
      expression: "happy" as const,
      bgColor: "bg-amber-50 border-amber-150 text-amber-700",
      pillColor: "bg-amber-100 text-amber-800",
      bgGradient: "from-amber-500 to-amber-600"
    },
    {
      id: "moise",
      name: "Moïse",
      role: "Le Leader Déterminé",
      description: "Il t'aide à surmonter les obstacles géants et à traverser les mers d'épreuves pour entrer dans ta destinée.",
      quote: "Avance ! La mer s'ouvrira devant toi. Dieu combat pour toi, garde le silence et avance avec assurance ! 🌊",
      pose: "idle" as const,
      expression: "happy" as const,
      bgColor: "bg-cyan-50 border-cyan-150 text-cyan-700",
      pillColor: "bg-cyan-100 text-cyan-800",
      bgGradient: "from-cyan-500 to-cyan-600"
    },
    {
      id: "david",
      name: "David",
      role: "Le Berger Joyeux",
      description: "Toujours prêt à célébrer, il insuffle de la louange dans ta routine et te rappelle que rien ne te manquera.",
      quote: "L'Éternel est mon berger, je ne manquerai de rien ! Danse, célèbre et loue Dieu pour toutes Ses bontés ! 🎵",
      pose: "jumping" as const,
      expression: "happy" as const,
      bgColor: "bg-teal-50 border-teal-150 text-teal-700",
      pillColor: "bg-teal-100 text-teal-800",
      bgGradient: "from-teal-500 to-teal-600"
    },
    {
      id: "paul",
      name: "Paul",
      role: "Le Théologien Passionné",
      description: "Toujours prêt à t'expliquer les profondeurs des Écritures pour bâtir une doctrine solide et inébranlable.",
      quote: "Examine toutes choses, retiens ce qui est bon. Ta foi doit être solidement ancrée sur la Parole ! 📚",
      pose: "idle" as const,
      expression: "neutral" as const,
      bgColor: "bg-sky-50 border-sky-150 text-sky-700",
      pillColor: "bg-sky-100 text-sky-800",
      bgGradient: "from-sky-500 to-sky-600"
    },
    {
      id: "pierre",
      name: "Pierre",
      role: "Le Pêcheur Impulsif",
      description: "Il t'invite à sortir de ta barque de confort pour marcher sur les eaux agitées avec courage et audace.",
      quote: "Sors de ta zone de confort ! Si Jésus te dit de venir, pose ton pied sur l'eau et ne doute pas. ⛵",
      pose: "jumping" as const,
      expression: "happy" as const,
      bgColor: "bg-orange-50 border-orange-150 text-orange-700",
      pillColor: "bg-orange-100 text-orange-800",
      bgGradient: "from-orange-500 to-orange-600"
    },
    {
      id: "gedeon",
      name: "Gédéon",
      role: "Le Soldat Inquiet",
      description: "Il tremble un peu face aux défis mais te pousse sans cesse à te lever comme un vaillant héros.",
      quote: "Je m'inquiète pour ton streak... mais l'Éternel est avec toi, vaillant héros ! Tu es capable de grandes choses. 🛡️",
      pose: "sad" as const,
      expression: "happy" as const,
      bgColor: "bg-slate-50 border-slate-200 text-slate-700",
      pillColor: "bg-slate-200 text-slate-800",
      bgGradient: "from-slate-600 to-slate-700"
    }
  ];

  // Config des fonctionnalités clés
  const features = [
    {
      icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
      title: "Méditation Structurée OIA+",
      description: "Fini la lecture rapide sans impact. Suis un parcours guidé en 7 étapes : Contexte, Observation, Interprétation, Application et Prière."
    },
    {
      icon: <Flame className="w-6 h-6 text-amber-500 fill-amber-500/10" />,
      title: "Séries de jours (Streaks)",
      description: "Ancre une habitude spirituelle quotidienne incassable. Gagne de la motivation chaque matin en protégeant ton feu sacré."
    },
    {
      icon: <ShoppingBag className="w-6 h-6 text-purple-600" />,
      title: "Monnaie Céleste & Boutique",
      description: "Récolte des lingots à chaque session d'étude réussie et dépense-les pour obtenir des gelées de streak ou des bonus exclusifs."
    },
    {
      icon: <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500/10" />,
      title: "Ligues de Croissance",
      description: "Progresse dans un classement hebdomadaire du Bronze au Diamant face à d'autres membres de la communauté chrétienne."
    },
    {
      icon: <Compass className="w-6 h-6 text-emerald-600" />,
      title: "Chemins Thématiques",
      description: "Choisis ton focus : Foi, Psaumes, Proverbes, Paix, Sagesse. 30 niveaux progressifs pour devenir un chrétien solide."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-pink-600" />,
      title: "10 Compagnons de Route",
      description: "Une bande de mascottes inspirées de la Bible pour t'accompagner, t'amuser et t'envoyer des encouragements vibrants."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* BARRE DE NAVIGATION STYLE DUOLINGO (En-tête fixe avec effet 3D flat) */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b-2 border-slate-100 z-50 py-3.5 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 select-none pointer-events-none transition-transform hover:scale-105">
              <img 
                src="/assets/characters/manny/pose_idle.svg" 
                alt="MannaDaily Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-800">
              MannaDaily
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-extrabold text-slate-500 hover:text-indigo-600 hover:bg-slate-50 px-4 py-2.5 rounded-2xl border-2 border-transparent transition-all"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="text-sm font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-2xl border-b-4 border-indigo-800 active:border-b-0 active:translate-y-[4px] transition-all"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* SECTION 1 — HERO SECTION (Univers Fun & Boutons 3D) */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 bg-slate-50 border-b-2 border-slate-100 overflow-hidden">
        {/* Grille de fond subtile */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border-2 border-indigo-100 rounded-full text-xs font-black uppercase tracking-wider text-indigo-700 shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
              La discipline spirituelle devenue un jeu
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] text-slate-900">
              Deviens un chrétien <br />
              <span className="text-indigo-600 relative inline-block">
                plus fort.
                <span className="absolute left-0 bottom-1 w-full h-2 bg-indigo-100 -z-10 rounded-full" />
              </span><br />
              Chaque jour.
            </h1>

            <p className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 font-bold leading-relaxed">
              MannaDaily t'aide à construire une discipline spirituelle quotidienne solide. Médite en profondeur, accumule de l'XP, protège ton streak et grandis aux côtés de mascottes bibliques attachantes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg rounded-2xl border-b-4 border-indigo-800 active:border-b-0 active:translate-y-[4px] transition-all shadow-md shadow-indigo-600/10"
              >
                Commencer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto flex items-center justify-center px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-black text-lg rounded-2xl border-2 border-slate-200 border-b-4 active:border-b-2 active:translate-y-[2px] transition-all"
              >
                J'ai déjà un compte
              </Link>
            </div>
            
            <div className="text-xs text-slate-400 font-bold flex items-center gap-2 justify-center lg:justify-start">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Entièrement gratuit — Aucune carte bancaire requise.
            </div>
          </div>

          {/* Présentation dynamique de Manny en Hero */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
              className="relative p-8 bg-white rounded-3xl border-2 border-slate-100 border-b-4 shadow-xl flex flex-col items-center max-w-sm w-full"
            >
              <div className="absolute -top-12 w-28 h-28 pointer-events-none select-none drop-shadow-lg">
                <CharacterRenderer characterId="manny" pose="jumping" expression="happy" size={120} />
              </div>
              
              <div className="w-full pt-16 text-center space-y-4">
                {/* Bulle de dialogue style Duolingo */}
                <div className="relative bg-slate-50 border-2 border-slate-150 rounded-2xl p-4 text-slate-700 font-bold text-sm leading-relaxed">
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-50 border-l-2 border-t-2 border-slate-150 rotate-45" />
                  "Salut ! Je suis Manny. Prêt à faire grandir ta foi de manière quotidienne et passionnante ?"
                </div>
                <div className="flex justify-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — LA PROMESSE DE TRANSFORMATION (Axe fort vs Lecture passive) */}
      <section className="py-24 bg-white border-b-2 border-slate-100">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
              Pourquoi MannaDaily change tout ?
            </h2>
            <p className="text-slate-500 font-bold text-base md:text-lg">
              La plupart des applications chrétiennes proposent une lecture passive : on lit, on ferme, on oublie. MannaDaily est conçu pour ancrer de vraies habitudes spirituelles quotidiennes.
            </p>
          </div>

          {/* Tableau comparatif des approches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Colonne A : L'ancienne approche */}
            <div className="bg-slate-50 p-8 rounded-3xl border-2 border-slate-200 flex flex-col justify-between space-y-6 opacity-75">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border-2 border-red-100 rounded-full text-xs font-black text-red-700 uppercase">
                  ✕ Approche Passive
                </div>
                <h3 className="text-xl font-black text-slate-800">L'application chrétienne typique</h3>
                <ul className="space-y-3 text-slate-500 text-sm font-semibold">
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-black mt-0.5">✕</span>
                    Lecture rapide d'un verset sans observation
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-black mt-0.5">✕</span>
                    Aucune structure pour créer un automatisme quotidien
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-black mt-0.5">✕</span>
                    On lit, on ferme, et on oublie la Parole dès le lendemain
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-black mt-0.5">✕</span>
                    Isolement complet sans sentiment de progression
                  </li>
                </ul>
              </div>
              <div className="text-xs text-red-600 bg-red-50 rounded-xl p-3 border border-red-100 font-black text-center">
                Résultat : L'habitude s'effrite après 3 jours.
              </div>
            </div>

            {/* Colonne B : Notre approche (MannaDaily) */}
            <div className="bg-indigo-50/50 p-8 rounded-3xl border-2 border-indigo-200 border-b-4 flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 border-2 border-indigo-200 rounded-full text-xs font-black text-indigo-700 uppercase">
                  ✓ Notre Approche
                </div>
                <h3 className="text-xl font-black text-slate-800">Le système MannaDaily</h3>
                <ul className="space-y-3 text-indigo-950/80 text-sm font-bold">
                  <li className="flex items-start gap-2.5">
                    <span className="text-indigo-600 font-black mt-0.5">✓</span>
                    Parcours de méditation guidée et structurée en 7 étapes
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-indigo-600 font-black mt-0.5">✓</span>
                    XP, Streaks consécutifs et récompenses de Lingots
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-indigo-600 font-black mt-0.5">✓</span>
                    Suivi clair des niveaux de prière et de mémorisation
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-indigo-600 font-black mt-0.5">✓</span>
                    Mascottes encourageantes et Ligue de croissance active
                  </li>
                </ul>
              </div>
              <div className="text-xs text-indigo-800 bg-indigo-100/80 rounded-xl p-3 border border-indigo-200 font-black text-center">
                Résultat : Une habitude ancrée tous les matins depuis 45 jours.
              </div>
            </div>
          </div>

          {/* Section "Après 30 jours, est-ce que tu peux dire..." */}
          <div className="max-w-3xl mx-auto bg-slate-50 border-2 border-slate-150 border-b-4 rounded-3xl p-8 space-y-6">
            <h3 className="text-2xl font-black text-slate-800 text-center">
              Imagine-toi dans 30 jours...
            </h3>
            <p className="text-slate-500 text-center font-bold text-sm">
              En utilisant l'application régulièrement, que pourras-tu proclamer fièrement ?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-sm font-black flex-shrink-0">✓</span>
                "Je prie plus régulièrement qu'avant."
              </div>
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-sm font-black flex-shrink-0">✓</span>
                "Je médite de manière structurée."
              </div>
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-sm font-black flex-shrink-0">✓</span>
                "Je connais mieux la Parole de Dieu."
              </div>
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-sm font-black flex-shrink-0">✓</span>
                "J'ai vaincu mes faiblesses avec persévérance."
              </div>
            </div>
            <p className="text-center font-black text-indigo-650 text-base pt-2">
              Si la réponse est oui, c'est là que réside la véritable valeur.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3 — LES COMPAGNONS BIBLIQUES (10 compagnons, interactifs style Duo) */}
      <section className="py-24 bg-slate-50 border-b-2 border-slate-100">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
              Rencontre tes 10 compagnons de route
            </h2>
            <p className="text-slate-500 font-bold text-base md:text-lg">
              La bande de mascottes qui te coache et t'accompagne au quotidien. Clique sur l'un d'entre eux pour l'écouter te motiver !
            </p>
          </div>

          {/* Grille de sélection des mascottes */}
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3 max-w-5xl mx-auto">
            {mascots.map((mascot, idx) => (
              <button
                key={mascot.id}
                onClick={() => setActiveMascotIdx(idx)}
                className={`flex flex-col items-center p-3 rounded-2xl border-2 border-b-4 transition-all active:border-b-2 active:translate-y-[2px] ${
                  activeMascotIdx === idx
                    ? "bg-indigo-600 text-white border-indigo-800"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="w-12 h-12 pointer-events-none select-none relative">
                  <CharacterRenderer 
                    characterId={mascot.id} 
                    pose={activeMascotIdx === idx ? "jumping" : "idle"} 
                    expression="happy"
                    size={48} 
                  />
                </div>
                <span className="text-xs font-black mt-2 capitalize">{mascot.name}</span>
              </button>
            ))}
          </div>

          {/* Détail du compagnon actif */}
          <div className="max-w-2xl mx-auto bg-white border-2 border-slate-150 border-b-4 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 flex-shrink-0 select-none pointer-events-none drop-shadow-md">
              <CharacterRenderer
                characterId={mascots[activeMascotIdx].id}
                pose={mascots[activeMascotIdx].pose}
                expression={mascots[activeMascotIdx].expression}
                size={128}
              />
            </div>
            
            <div className="space-y-4 flex-1 text-center md:text-left">
              <div>
                <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${mascots[activeMascotIdx].pillColor}`}>
                  {mascots[activeMascotIdx].role}
                </span>
                <h3 className="text-2xl font-black text-slate-800 mt-1 capitalize">
                  {mascots[activeMascotIdx].name}
                </h3>
              </div>
              
              <p className="text-slate-500 font-bold text-sm leading-relaxed">
                {mascots[activeMascotIdx].description}
              </p>
              
              {/* Bulle de réplique culte */}
              <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 italic font-bold text-slate-700 text-sm relative">
                <div className="hidden md:block absolute top-1/2 -left-2.5 -translate-y-1/2 w-4 h-4 bg-slate-50 border-l-2 border-b-2 border-slate-100 rotate-45" />
                <div className="md:hidden absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-50 border-l-2 border-t-2 border-slate-100 rotate-45" />
                "{mascots[activeMascotIdx].quote}"
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — LES FONCTIONNALITÉS DE LUDIFICATION (XP, Streak, Lingots, Ligues) */}
      <section className="py-24 bg-white border-b-2 border-slate-100">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
              Des fonctionnalités conçues pour durer
            </h2>
            <p className="text-slate-500 font-bold text-base md:text-lg">
              Tout ce dont tu as besoin pour ancrer ton étude de la Parole, progresser pas à pas et ressentir ta croissance tous les jours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-7 rounded-3xl border-2 border-slate-100 border-b-4 hover:border-slate-200 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-black text-slate-800">{feature.title}</h3>
                  <p className="text-slate-500 text-sm font-semibold leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — CHIFFRES CLÉS / PREUVE SOCIALE */}
      <section className="py-20 bg-slate-50 border-b-2 border-slate-100">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2 p-6">
            <div className="text-4xl md:text-5xl font-black text-indigo-600">45 Jours</div>
            <div className="text-sm font-bold text-slate-500">Moyenne de streak de nos utilisateurs actifs</div>
          </div>
          <div className="space-y-2 p-6 border-y-2 md:border-y-0 md:border-x-2 border-slate-200">
            <div className="text-4xl md:text-5xl font-black text-indigo-600">92 %</div>
            <div className="text-sm font-bold text-slate-500">Constatent une amélioration de leur vie de prière</div>
          </div>
          <div className="space-y-2 p-6">
            <div className="text-4xl md:text-5xl font-black text-indigo-600">10 Compagnons</div>
            <div className="text-sm font-bold text-slate-500">Pour t'accompagner sans jamais te lasser</div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — CTA FINAL */}
      <section className="relative py-24 bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 text-white text-center overflow-hidden">
        {/* Cercles de lumière */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto px-6 space-y-8 relative z-10">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Commence ta transformation aujourd'hui
            </h2>
            <p className="text-indigo-150 font-semibold text-lg max-w-xl mx-auto">
              Rejoins des milliers de croyants et bâtis une routine d'étude et de méditation biblique indestructible.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-lg rounded-2xl border-b-4 border-amber-600 active:border-b-0 active:translate-y-[4px] transition-all shadow-xl shadow-amber-500/10"
            >
              Créer mon habitude spirituelle — 100% Gratuit
              <ArrowRight className="w-5 h-5" />
            </Link>
            <span className="text-xs text-indigo-300 font-semibold flex items-center gap-1.5 justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Sans carte de crédit. Gratuit pour toujours.
            </span>
          </div>
        </div>
      </section>

      {/* PIED DE PAGE */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 select-none pointer-events-none">
              <img 
                src="/assets/characters/manny/pose_idle.svg" 
                alt="MannaDaily Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              MannaDaily
            </span>
          </div>
          <p className="text-xs text-slate-500 font-bold flex items-center gap-1 justify-center">
            Fait avec <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> pour le Royaume. © {new Date().getFullYear()} MannaDaily.
          </p>
        </div>
      </footer>
    </div>
  );
}
