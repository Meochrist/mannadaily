import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLeaderboard } from "@/lib/leaderboard";
import MascotMessage from "@/components/mascot/MascotMessage";
import { Trophy, Shield, Award, Crown, User as UserIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;
  const data = await getLeaderboard(userId);

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500 font-semibold">
        Chargement de la ligue hebdomadaire...
      </div>
    );
  }

  const { leagueName, tier, members } = data;

  // Déterminer la configuration visuelle du tier de la ligue
  const getTierConfig = (leagueTier: string) => {
    switch (leagueTier.toLowerCase()) {
      case "diamant":
        return {
          name: "Ligue de Diamant",
          badgeColor: "bg-cyan-50 border-cyan-200 text-cyan-700",
          iconColor: "text-cyan-500",
          podiumBg: "bg-gradient-to-t from-cyan-500 to-cyan-400",
          icon: Crown
        };
      case "or":
        return {
          name: "Ligue d'Or",
          badgeColor: "bg-amber-50 border-amber-200 text-amber-700",
          iconColor: "text-amber-500",
          podiumBg: "bg-gradient-to-t from-amber-500 to-amber-400",
          icon: Trophy
        };
      case "argent":
        return {
          name: "Ligue d'Argent",
          badgeColor: "bg-slate-100 border-slate-200 text-slate-755",
          iconColor: "text-slate-500",
          podiumBg: "bg-gradient-to-t from-slate-400 to-slate-300",
          icon: Award
        };
      case "bronze":
      default:
        return {
          name: "Ligue de Bronze",
          badgeColor: "bg-orange-50 border-orange-200/60 text-orange-800",
          iconColor: "text-orange-600",
          podiumBg: "bg-gradient-to-t from-orange-400 to-orange-300",
          icon: Shield
        };
    }
  };

  const tierConfig = getTierConfig(tier);
  const TierIcon = tierConfig.icon;

  // Séparer les membres pour le podium et le reste du tableau
  const firstPlace = members.find((m) => m.rank === 1);
  const secondPlace = members.find((m) => m.rank === 2);
  const thirdPlace = members.find((m) => m.rank === 3);
  const otherMembers = members.filter((m) => m.rank > 3);

  // Trouver le rang de l'utilisateur courant
  const currentUserMember = members.find((m) => m.isCurrentUser);
  const userRank = currentUserMember ? currentUserMember.rank : 0;

  // Message de motivation dynamique de Manny
  let motivationMessage = "";
  if (userRank === 1) {
    motivationMessage = "Exceptionnel ! Tu es à la première place de la Ligue cette semaine ! Continue de méditer quotidiennement pour conserver ta couronne ! 👑✨";
  } else if (userRank <= 3) {
    motivationMessage = "Excellent travail ! Tu es sur le podium ! Pousse encore un peu pour atteindre le sommet de la Ligue ! 🏆🚀";
  } else {
    motivationMessage = "Wow ! La compétition est stimulante cette semaine ! Médite et proclame la Parole chaque jour pour grimper dans la Ligue et nourrir ton âme ! 🔥📖";
  }

  // Rendu de l'initiale du nom
  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* 1. EN-TÊTE DE LA LIGUE */}
      <section className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              Classement Hebdomadaire
            </h2>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${tierConfig.badgeColor}`}>
              <TierIcon className="w-4 h-4" />
              {tierConfig.name}
            </div>
          </div>
          <p className="text-slate-500 font-medium text-sm md:text-base max-w-xl">
            Cumule un maximum d'XP en méditant et en proclamant la Parole de Dieu pour monter dans les Ligues ! Remise à zéro chaque dimanche soir.
          </p>
        </div>
      </section>

      {/* 2. MESSAGE DE MOTIVATION DE MANNY */}
      <section className="flex justify-center md:justify-start">
        <MascotMessage
          mascot="manny"
          mood="excited"
          message={motivationMessage}
          size={150}
        />
      </section>

      {/* 3. PODIUM DU TOP 3 */}
      <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6 text-center">Le Podium Spirituel</h3>
        
        <div className="flex items-end justify-center gap-3 md:gap-8 pt-10 pb-4 max-w-lg mx-auto overflow-x-auto">
          {/* 2ÈME PLACE */}
          <div className="flex flex-col items-center flex-1 min-w-[90px]">
            {secondPlace ? (
              <>
                <div className={`w-14 h-14 rounded-full border-4 border-slate-300 flex items-center justify-center font-black text-lg text-slate-600 shadow-md bg-slate-50 relative ${
                  secondPlace.isCurrentUser ? "ring-4 ring-indigo-500/35" : ""
                }`}>
                  {secondPlace.image ? (
                    <img src={secondPlace.image} alt={secondPlace.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(secondPlace.name)
                  )}
                  <div className="absolute -top-3 bg-slate-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow border border-white">2</div>
                </div>
                <span className="text-xs font-black text-slate-700 mt-2 text-center truncate w-full">{secondPlace.name}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{secondPlace.xpThisWeek} XP</span>
                <div className="w-full h-20 bg-slate-200/80 rounded-t-xl mt-3 flex items-center justify-center font-black text-2xl text-slate-400 shadow-inner">
                  2
                </div>
              </>
            ) : (
              <div className="w-full h-20 bg-slate-50/50 border border-dashed border-slate-200 rounded-t-xl" />
            )}
          </div>

          {/* 1ÈRE PLACE (CENTRE, PLUS HAUT) */}
          <div className="flex flex-col items-center flex-1 min-w-[100px]">
            {firstPlace ? (
              <>
                <div className={`w-18 h-18 rounded-full border-4 border-amber-400 flex items-center justify-center font-black text-xl text-amber-700 shadow-lg bg-amber-50 relative ${
                  firstPlace.isCurrentUser ? "ring-4 ring-indigo-500/35" : ""
                }`}>
                  {firstPlace.image ? (
                    <img src={firstPlace.image} alt={firstPlace.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(firstPlace.name)
                  )}
                  <div className="absolute -top-3 bg-amber-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow border border-white animate-bounce">1</div>
                </div>
                <span className="text-sm font-black text-slate-800 mt-2 text-center truncate w-full">{firstPlace.name}</span>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">{firstPlace.xpThisWeek} XP</span>
                <div className="w-full h-28 bg-amber-100 rounded-t-2xl mt-3 flex items-center justify-center font-black text-3xl text-amber-500 shadow-inner">
                  1
                </div>
              </>
            ) : (
              <div className="w-full h-28 bg-slate-50/50 border border-dashed border-slate-200 rounded-t-xl" />
            )}
          </div>

          {/* 3ÈME PLACE */}
          <div className="flex flex-col items-center flex-1 min-w-[90px]">
            {thirdPlace ? (
              <>
                <div className={`w-12 h-12 rounded-full border-4 border-amber-600/70 flex items-center justify-center font-black text-base text-amber-900 shadow-md bg-amber-50/50 relative ${
                  thirdPlace.isCurrentUser ? "ring-4 ring-indigo-500/35" : ""
                }`}>
                  {thirdPlace.image ? (
                    <img src={thirdPlace.image} alt={thirdPlace.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(thirdPlace.name)
                  )}
                  <div className="absolute -top-3 bg-amber-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow border border-white">3</div>
                </div>
                <span className="text-xs font-black text-slate-700 mt-2 text-center truncate w-full">{thirdPlace.name}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{thirdPlace.xpThisWeek} XP</span>
                <div className="w-full h-14 bg-orange-100/50 rounded-t-xl mt-3 flex items-center justify-center font-black text-xl text-amber-800/50 shadow-inner">
                  3
                </div>
              </>
            ) : (
              <div className="w-full h-14 bg-slate-50/50 border border-dashed border-slate-200 rounded-t-xl" />
            )}
          </div>
        </div>
      </section>

      {/* 4. TABLEAU DE TOUS LES MEMBRES */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h3 className="text-lg font-black text-slate-800">Membres de la ligue</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((member) => (
            <div
              key={member.userId}
              className={`flex items-center justify-between p-4 px-6 transition-all duration-350 ${
                member.isCurrentUser 
                  ? "bg-indigo-50/40 border-l-4 border-indigo-600 pl-5" 
                  : "hover:bg-slate-50/30"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Rang */}
                <span className={`w-6 text-center font-black text-sm ${
                  member.rank === 1 ? "text-amber-500 text-base" :
                  member.rank === 2 ? "text-slate-400" :
                  member.rank === 3 ? "text-amber-700" : "text-slate-400"
                }`}>
                  {member.rank}
                </span>

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border shadow-sm ${
                  member.isCurrentUser 
                    ? "bg-indigo-100 text-indigo-700 border-indigo-200" 
                    : "bg-slate-50 text-slate-600 border-slate-100"
                }`}>
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(member.name)
                  )}
                </div>

                {/* Nom */}
                <div className="flex flex-col">
                  <span className={`font-extrabold text-sm ${
                    member.isCurrentUser ? "text-indigo-900" : "text-slate-800"
                  }`}>
                    {member.name} {member.isCurrentUser && <span className="text-[10px] font-black uppercase bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full ml-1.5 select-none">Moi</span>}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">Bronze Tier</span>
                </div>
              </div>

              {/* XP */}
              <div className="flex items-center gap-1.5">
                <span className={`font-black text-base ${
                  member.isCurrentUser ? "text-indigo-600" : "text-slate-800"
                }`}>
                  {member.xpThisWeek}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">XP</span>
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="p-8 text-center text-slate-400 font-semibold">
              Aucun membre inscrit dans cette ligue.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
