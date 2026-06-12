import { db } from "@/lib/db";
import { startOfWeek, endOfWeek } from "date-fns";

/**
 * Recalcule et met à jour les rangs (ranks) de tous les membres d'une ligue donnée.
 */
async function recalculateRanks(leagueId: string) {
  const members = await db.leagueMember.findMany({
    where: { leagueId },
    orderBy: { xpThisWeek: "desc" }
  });

  for (let i = 0; i < members.length; i++) {
    await db.leagueMember.update({
      where: { id: members[i].id },
      data: { rank: i + 1 }
    });
  }
}

/**
 * Récupère ou crée la ligue active pour l'utilisateur de la semaine en cours.
 * Intègre des bots mascottes fictifs pour simuler un classement vivant (wow factor).
 */
export async function getOrCreateLeague(userId: string) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Lundi
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });     // Dimanche

  // 1. Chercher si l'utilisateur est déjà inscrit dans une ligue cette semaine
  let memberRecord = await db.leagueMember.findFirst({
    where: {
      userId,
      league: {
        weekStart: { equals: weekStart },
        weekEnd: { equals: weekEnd }
      }
    },
    include: {
      league: true
    }
  });

  let leagueId: string;

  if (!memberRecord) {
    // 2. Si aucune adhésion, on cherche s'il existe une ligue Bronze active cette semaine
    let league = await db.league.findFirst({
      where: {
        tier: "bronze",
        weekStart: { equals: weekStart },
        weekEnd: { equals: weekEnd }
      }
    });

    if (!league) {
      // Création de la ligue de Bronze pour la semaine
      league = await db.league.create({
        data: {
          name: "Ligue de Bronze",
          tier: "bronze",
          weekStart,
          weekEnd
        }
      });

      // Création des comptes de bots mascottes pour simuler la compétition
      const bots = [
        { id: "bot_samson", name: "Samson", email: "samson@mascot.local" },
        { id: "bot_esther", name: "Esther", email: "esther@mascot.local" },
        { id: "bot_noe", name: "Noé", email: "noe@mascot.local" },
        { id: "bot_gedeon", name: "Gédéon", email: "gedeon@mascot.local" },
      ];

      for (const bot of bots) {
        await db.user.upsert({
          where: { id: bot.id },
          update: {},
          create: {
            id: bot.id,
            name: bot.name,
            email: bot.email,
          }
        });
      }

      // Ajout des bots avec des scores de base dans cette ligue
      await db.leagueMember.createMany({
        data: [
          { leagueId: league.id, userId: "bot_samson", xpThisWeek: 80, rank: 1 },
          { leagueId: league.id, userId: "bot_esther", xpThisWeek: 60, rank: 2 },
          { leagueId: league.id, userId: "bot_noe", xpThisWeek: 40, rank: 3 },
          { leagueId: league.id, userId: "bot_gedeon", xpThisWeek: 15, rank: 4 },
        ]
      });
    }

    leagueId = league.id;

    // Inscription de notre utilisateur dans la ligue
    await db.leagueMember.create({
      data: {
        leagueId,
        userId,
        xpThisWeek: 0,
        rank: 5
      }
    });

    // Recalculer les rangs de la ligue
    await recalculateRanks(leagueId);
  } else {
    leagueId = memberRecord.leagueId;
  }

  // Récupérer la ligue ordonnée
  return await db.league.findUnique({
    where: { id: leagueId },
    include: {
      members: {
        include: {
          user: true
        },
        orderBy: {
          xpThisWeek: "desc"
        }
      }
    }
  });
}

/**
 * Incrémente l'XP accumulée cette semaine par l'utilisateur et met à jour les rangs.
 */
export async function addXPToLeague(userId: string, amount: number) {
  // On s'assure d'abord d'obtenir ou d'inscrire l'utilisateur à sa ligue
  const league = await getOrCreateLeague(userId);
  if (!league) return;

  const member = await db.leagueMember.findFirst({
    where: {
      userId,
      leagueId: league.id
    }
  });

  if (member) {
    await db.leagueMember.update({
      where: { id: member.id },
      data: {
        xpThisWeek: { increment: amount }
      }
    });

    // Recalculer les rangs
    await recalculateRanks(league.id);
  }
}

/**
 * Renvoie les membres de la ligue ordonnés avec les informations de l'utilisateur.
 */
export async function getLeaderboard(userId: string) {
  const league = await getOrCreateLeague(userId);
  if (!league) return null;

  const members = await db.leagueMember.findMany({
    where: { leagueId: league.id },
    include: {
      user: {
        select: {
          name: true,
          image: true
        }
      }
    },
    orderBy: {
      xpThisWeek: "desc"
    }
  });

  return {
    leagueId: league.id,
    leagueName: league.name,
    tier: league.tier,
    members: members.map((m) => ({
      userId: m.userId,
      name: m.user.name || "Ami",
      image: m.user.image,
      xpThisWeek: m.xpThisWeek,
      rank: m.rank,
      isCurrentUser: m.userId === userId
    }))
  };
}
