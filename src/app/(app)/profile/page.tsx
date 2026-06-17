import React from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import BadgeCard from "@/components/gamification/BadgeCard";
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Award, 
  Sparkles, 
  Flame, 
  BookOpen, 
  FileText, 
  History, 
  Highlighter, 
  CheckCircle2, 
  Mic, 
  ChevronRight, 
  Activity,
  Trophy
} from "lucide-react";
import Manny from "@/components/mascot/Manny";
import Samson from "@/components/mascot/Samson";
import Esther from "@/components/mascot/Esther";
import Gedeon from "@/components/mascot/Gedeon";
import Noe from "@/components/mascot/Noe";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Dictionnaire des composants de mascottes
const mascotMap: Record<string, React.ComponentType<{ mood: any; size?: number; className?: string }>> = {
  manny: Manny,
  samson: Samson,
  esther: Esther,
  gedeon: Gedeon,
  noe: Noe,
};

// Styles des badges de niveau
const levelStyles: Record<string, string> = {
  Semence: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pousse: "bg-green-50 text-green-700 border-green-200",
  Arbre: "bg-amber-50 text-amber-700 border-amber-200",
  Berger: "bg-blue-50 text-blue-700 border-blue-200",
  Prophète: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Apôtre: "bg-purple-50 text-purple-700 border-purple-200",
  Lumière: "bg-rose-50 text-rose-700 border-rose-200",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;

  // 1. Récupération des données utilisateur complètes
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      progress: true,
      streak: true,
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 10
      },
      verseNotes: {
        orderBy: { createdAt: "desc" },
        include: {
          verse: true
        }
      },
      highlights: {
        orderBy: { createdAt: "desc" },
        include: {
          verse: true
        }
      },
      badges: {
        include: {
          badge: true
        }
      },
      readingPlans: {
        include: {
          plan: true
        }
      }
    }
  });

  if (!user) {
    redirect("/login");
  }

  // 2. Charger tous les badges existants pour mapper les débloqués / verrouillés
  const allBadges = await db.badge.findMany();

  // 3. Récupérer la progression des plans pour calculer le pourcentage en mémoire
  const readingProgress = await db.readingPlanProgress.findMany({
    where: { userId }
  });

  // Calculs & fallbacks
  const initials = user.name 
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) 
    : "U";
  
  const favoriteMascot = user.favoriteMascot || "manny";
  const MascotComponent = mascotMap[favoriteMascot] || Manny;
  const levelName = user.progress?.level || "Semence";
  const levelClass = levelStyles[levelName] || "bg-indigo-50 text-indigo-700 border-indigo-200";

  const totalXP = user.progress?.totalXP ?? 0;
  const sessionsCount = user.progress?.sessionsTotal ?? 0;
  const currentStreak = user.streak?.currentStreak ?? 0;
  const longestStreak = user.streak?.longestStreak ?? 0;
  const versesLearned = user.progress?.versesLearned ?? 0;
  
  const activePlans = user.readingPlans.filter(p => !p.completed);
  const completedPlans = user.readingPlans.filter(p => p.completed);

  // Couleurs de surlignement des versets
  const highlightColors: Record<string, string> = {
    yellow: "bg-yellow-100/70 border-l-4 border-yellow-400 text-slate-800",
    green: "bg-emerald-50/70 border-l-4 border-emerald-400 text-slate-800",
    blue: "bg-sky-50/70 border-l-4 border-sky-400 text-slate-800",
    pink: "bg-rose-50/70 border-l-4 border-rose-400 text-slate-800",
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 pb-24">
      
      {/* SECTION 1 : EN-TÊTE DU PROFIL */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        {/* Background Decorative Accent */}
        <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-550/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left z-10">
          {/* Avatar */}
          {user.image ? (
            <img 
              src={user.image} 
              alt={user.name || "Profil"} 
              className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100 shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-650 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-md">
              {initials}
            </div>
          )}

          {/* User metadata */}
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-850 tracking-tight flex items-center gap-2 justify-center sm:justify-start">
              {user.name || "Utilisateur"}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Inscrit le {new Date(user.createdAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
            {/* Level Badge */}
            <div className="flex justify-center sm:justify-start pt-1">
              <span className={cn("text-[10px] font-black border px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5", levelClass)}>
                <Award className="w-3.5 h-3.5" />
                Niveau : {levelName}
              </span>
            </div>
          </div>
        </div>

        {/* Mascot favorite display */}
        <div className="flex flex-col items-center gap-1.5 z-10 flex-shrink-0 bg-slate-50/55 border border-slate-100 rounded-2xl p-4 min-w-[140px]">
          <div className="w-20 h-20 relative flex items-center justify-center">
            <MascotComponent mood="happy" size={80} />
          </div>
          <span className="text-[10px] text-indigo-650 font-black uppercase tracking-wider block">
            Compagnon favori
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {favoriteMascot}
          </span>
        </div>
      </div>

      {/* SECTION 2 : STATISTIQUES GLOBALES */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total XP", value: totalXP, icon: Sparkles, color: "text-amber-500 bg-amber-50 border-amber-100" },
          { label: "Sessions", value: sessionsCount, icon: Activity, color: "text-indigo-500 bg-indigo-50 border-indigo-100" },
          { label: "Série Actuelle", value: `${currentStreak} j`, icon: Flame, color: "text-orange-500 bg-orange-50 border-orange-100" },
          { label: "Série Record", value: `${longestStreak} j`, icon: Trophy, color: "text-yellow-500 bg-yellow-50 border-yellow-100" },
          { label: "Versets appris", value: versesLearned, icon: BookOpen, color: "text-emerald-500 bg-emerald-50 border-emerald-100" },
          { label: "Plans Actifs", value: activePlans.length, icon: Calendar, color: "text-sky-500 bg-sky-50 border-sky-100" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-3 min-w-0">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{stat.label}</span>
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center border", stat.color)}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xl font-black text-slate-800 truncate">{stat.value}</span>
            </div>
          );
        })}
      </div>

      {/* Reste des sections : Grille à deux colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLONNE DE GAUCHE : PLANS, JOURNAL ET HIGHLIGHTS */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* SECTION 7 : MES PLANS DE LECTURE */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Mes Plans de Lecture
            </h3>

            {user.readingPlans.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-3 text-center">Vous n'êtes inscrit à aucun plan de lecture actuellement.</p>
            ) : (
              <div className="space-y-4">
                {user.readingPlans.map((enrollment) => {
                  const completedDaysCount = readingProgress.filter(
                    (p) => p.planId === enrollment.planId
                  ).length;
                  const percent = Math.min(100, Math.round((completedDaysCount / enrollment.plan.duration) * 100));
                  
                  return (
                    <div key={enrollment.id} className="border border-slate-100 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className={cn(
                            "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                            enrollment.completed ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"
                          )}>
                            {enrollment.completed ? "Complété" : "En cours"}
                          </span>
                          <h4 className="text-xs font-black text-slate-800 mt-1">{enrollment.plan.name}</h4>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">
                          Jour {enrollment.currentDay} / {enrollment.plan.duration}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                          <span>Progression</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <div 
                            className={cn("h-full rounded-full transition-all", enrollment.completed ? "bg-emerald-500" : "bg-indigo-600")}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 4 : MON JOURNAL SPIRITUEL */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <FileText className="w-4 h-4 text-indigo-600" />
              Mon Journal Spirituel
            </h3>

            {user.verseNotes.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-6 text-center">Vous n'avez rédigé aucune note d'étude biblique pour le moment.</p>
            ) : (
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                {user.verseNotes.map((note) => (
                  <div key={note.id} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-indigo-650 bg-indigo-50/80 px-2.5 py-0.5 rounded-lg">
                        {note.verse.book} {note.verse.chapter}:{note.verse.verse}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                        {note.isVoice && <Mic className="w-3.5 h-3.5 text-indigo-500" />}
                        <span>{new Date(note.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                      {note.content}
                    </p>

                    <div className="flex justify-end pt-1">
                      <Link 
                        href={`/bible?book=${encodeURIComponent(note.verse.book)}&chapter=${note.verse.chapter}&verse=${note.verse.verse}`}
                        className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-0.5 hover:underline"
                      >
                        Consulter dans la Bible
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 5 : MES HIGHLIGHTS */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <Highlighter className="w-4 h-4 text-indigo-600" />
              Mes Versets Surlignés
            </h3>

            {user.highlights.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-6 text-center">Vous n'avez surligné aucun verset dans la Bible.</p>
            ) : (
              <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                {user.highlights.map((h) => (
                  <div 
                    key={h.id} 
                    className={cn("p-4 rounded-2xl flex flex-col justify-between gap-2.5", highlightColors[h.color] || highlightColors.yellow)}
                  >
                    <p className="text-xs leading-relaxed font-semibold italic">
                      « {h.verse.text} »
                    </p>
                    <div className="flex justify-between items-center text-[9px] font-bold">
                      <span className="text-slate-500 font-extrabold uppercase tracking-wide">
                        {h.verse.book} {h.verse.chapter}:{h.verse.verse} ({h.verse.translation})
                      </span>
                      <Link 
                        href={`/bible?book=${encodeURIComponent(h.verse.book)}&chapter=${h.verse.chapter}&verse=${h.verse.verse}`}
                        className="text-indigo-600 hover:text-indigo-850 uppercase tracking-widest flex items-center gap-0.5"
                      >
                        Lire le chapitre <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DE DROITE : HISTORIQUE ET BADGES */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* SECTION 6 : BADGES OBTENUS */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <Trophy className="w-4 h-4 text-indigo-600" />
              Mes Badges
            </h3>

            <div className="grid grid-cols-2 gap-3.5">
              {allBadges.map((badge) => {
                const userBadge = user.badges.find(ub => ub.badgeId === badge.id);
                return (
                  <BadgeCard 
                    key={badge.id}
                    name={badge.name}
                    description={badge.description}
                    icon={badge.icon}
                    earnedAt={userBadge ? userBadge.earnedAt : null}
                  />
                );
              })}
            </div>
          </div>

          {/* SECTION 3 : HISTORIQUE DES SESSIONS */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <History className="w-4 h-4 text-indigo-600" />
              Dernières Sessions
            </h3>

            {user.sessions.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold py-6 text-center">Aucune session enregistrée.</p>
            ) : (
              <div className="space-y-3">
                {user.sessions.map((session) => (
                  <div key={session.id} className="border-b border-slate-50 pb-3 last:border-b-0 last:pb-0 flex justify-between items-center gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-slate-800 capitalize tracking-wide block">
                        {session.type === "classic" ? "Méditation du jour" : session.type === "thematic" ? "Méditation thématique" : "Proclamation"}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold block">
                        {new Date(session.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg flex-shrink-0">
                      +{session.xpEarned} XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
