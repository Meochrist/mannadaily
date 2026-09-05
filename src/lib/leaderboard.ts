import { initServerDb } from '@/server/db';
import { startOfWeek, endOfWeek } from 'date-fns';

/**
 * Recalcule et met à jour les rangs (ranks) de tous les membres d'une ligue donnée.
 */
function recalculateRanks(leagueId: string) {
  const db = initServerDb();
  const members = db.prepare('SELECT * FROM league_members WHERE leagueId = ? ORDER BY xpThisWeek DESC').all(leagueId) as { id: string }[];
  
  for (let i = 0; i < members.length; i++) {
    db.prepare('UPDATE league_members SET rank = ? WHERE id = ?').run(i + 1, members[i].id);
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

  const db = initServerDb();

  // 1. Chercher si l'utilisateur est déjà inscrit dans une ligue cette semaine
  const memberRecord = db.prepare(`
    SELECT lm.*, l.id as league_id, l.name, l.tier, l.weekStart, l.weekEnd
    FROM league_members lm
    JOIN leagues l ON lm.leagueId = l.id
    WHERE lm.userId = ? AND l.weekStart = ? AND l.weekEnd = ?
  `).get(userId, weekStart.toISOString(), weekEnd.toISOString());

  let leagueId: string;

  if (!memberRecord) {
    // 2. Si aucune adhésion, on cherche s'il existe une ligue Bronze active cette semaine
    let league = db.prepare('SELECT * FROM leagues WHERE tier = ? AND weekStart = ? AND weekEnd = ?').get('bronze', weekStart.toISOString(), weekEnd.toISOString()) as { id: string } | undefined;

    if (!league) {
      // Création de la ligue de Bronze pour la semaine
      leagueId = crypto.randomUUID();
      db.prepare('INSERT INTO leagues (id, name, tier, weekStart, weekEnd) VALUES (?, ?, ?, ?, ?)').run(
        leagueId,
        'Ligue de Bronze',
        'bronze',
        weekStart.toISOString(),
        weekEnd.toISOString()
      );

      // Création des comptes de bots mascottes pour simuler la compétition
      const bots = [
        { id: 'bot_samson', name: 'Samson', email: 'samson@mascot.local' },
        { id: 'bot_esther', name: 'Esther', email: 'esther@mascot.local' },
        { id: 'bot_noe', name: 'Noé', email: 'noe@mascot.local' },
        { id: 'bot_gedeon', name: 'Gédéon', email: 'gedeon@mascot.local' },
      ];

      for (const bot of bots) {
        db.prepare('INSERT OR IGNORE INTO users (id, name, email) VALUES (?, ?, ?)').run(bot.id, bot.name, bot.email);
      }

      // Ajout des bots avec des scores de base dans cette ligue
      db.prepare('INSERT INTO league_members (id, leagueId, userId, xpThisWeek, rank) VALUES (?, ?, ?, ?, ?)').run(crypto.randomUUID(), leagueId, 'bot_samson', 80, 1);
      db.prepare('INSERT INTO league_members (id, leagueId, userId, xpThisWeek, rank) VALUES (?, ?, ?, ?, ?)').run(crypto.randomUUID(), leagueId, 'bot_esther', 60, 2);
      db.prepare('INSERT INTO league_members (id, leagueId, userId, xpThisWeek, rank) VALUES (?, ?, ?, ?, ?)').run(crypto.randomUUID(), leagueId, 'bot_noe', 40, 3);
      db.prepare('INSERT INTO league_members (id, leagueId, userId, xpThisWeek, rank) VALUES (?, ?, ?, ?, ?)').run(crypto.randomUUID(), leagueId, 'bot_gedeon', 15, 4);
    } else {
      leagueId = league.id;
    }

    // Inscription de notre utilisateur dans la ligue
    db.prepare('INSERT INTO league_members (id, leagueId, userId, xpThisWeek, rank) VALUES (?, ?, ?, ?, ?)').run(crypto.randomUUID(), leagueId, userId, 0, 5);

    // Recalculer les rangs de la ligue
    recalculateRanks(leagueId);
  } else {
    leagueId = (memberRecord as { league_id: string }).league_id;
  }

  // Récupérer la ligue ordonnée
  return db.prepare(`
    SELECT l.*, 
           lm.userId, lm.xpThisWeek, lm.rank,
           u.name, u.image
    FROM leagues l
    JOIN league_members lm ON lm.leagueId = l.id
    JOIN users u ON u.id = lm.userId
    WHERE l.id = ?
    ORDER BY lm.xpThisWeek DESC
  `).all(leagueId);
}

/**
 * Incrémente l'XP accumulée cette semaine par l'utilisateur et met à jour les rangs.
 */
export async function addXPToLeague(userId: string, amount: number) {
  const league = await getOrCreateLeague(userId);
  if (!league) return;

  const db = initServerDb();
  const member = db.prepare('SELECT * FROM league_members WHERE userId = ? AND leagueId = ?').get(userId, (league[0] as { id: string }).id);

  if (member) {
    db.prepare('UPDATE league_members SET xpThisWeek = xpThisWeek + ? WHERE id = ?').run(amount, (member as { id: string }).id);
    recalculateRanks((league[0] as { id: string }).id);
  }
}

/**
 * Renvoie les membres de la ligue ordonnés avec les informations de l'utilisateur.
 */
export async function getLeaderboard(userId: string) {
  const league = await getOrCreateLeague(userId);
  if (!league) return null;

  const db = initServerDb();
  const leagueId = (league[0] as { id: string }).id;

  const members = db.prepare(`
    SELECT lm.userId, lm.xpThisWeek, lm.rank, u.name, u.image
    FROM league_members lm
    JOIN users u ON u.id = lm.userId
    WHERE lm.leagueId = ?
    ORDER BY lm.xpThisWeek DESC
  `).all(leagueId) as { userId: string; xpThisWeek: number; rank: number; name: string; image: string | null }[];

  return {
    leagueId,
    leagueName: (league[0] as { name: string }).name,
    tier: (league[0] as { tier: string }).tier,
    members: members.map((m) => ({
      userId: m.userId,
      name: m.name || 'Ami',
      image: m.image,
      xpThisWeek: m.xpThisWeek,
      rank: m.rank,
      isCurrentUser: m.userId === userId
    }))
  };
}
