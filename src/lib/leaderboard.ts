import { query, queryOne, execute } from '@/server/db';
import { startOfWeek, endOfWeek } from 'date-fns';

/**
 * Recalcule et met à jour les rangs (ranks) de tous les membres d'une ligue donnée.
 */
async function recalculateRanks(leagueId: string) {
  const members = await query<{ id: string }>(
    'SELECT * FROM league_members WHERE leagueId = $1 ORDER BY xpThisWeek DESC',
    [leagueId]
  );
  
  for (let i = 0; i < members.length; i++) {
    await execute('UPDATE league_members SET rank = $1 WHERE id = $2', [i + 1, members[i].id]);
  }
}

/**
 * Récupère ou crée la ligue active pour l'utilisateur de la semaine en cours.
 */
export async function getOrCreateLeague(userId: string) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  // 1. Chercher si l'utilisateur est déjà inscrit dans une ligue cette semaine
  const memberRecord = await query(`
    SELECT lm.*, l.id as league_id, l.name, l.tier, l.weekStart, l.weekEnd
    FROM league_members lm
    JOIN leagues l ON lm.leagueId = l.id
    WHERE lm.userId = $1 AND l.weekStart = $2 AND l.weekEnd = $3
  `, [userId, weekStart.toISOString(), weekEnd.toISOString()]);

  let leagueId: string;

  if (memberRecord.length === 0) {
    // 2. Si aucune adhésion, on cherche s'il existe une ligue Bronze active cette semaine
    let league = await queryOne(
      'SELECT * FROM leagues WHERE tier = $1 AND weekStart = $2 AND weekEnd = $3',
      ['bronze', weekStart.toISOString(), weekEnd.toISOString()]
    ) as { id: string } | null;

    if (!league) {
      // Création de la ligue de Bronze pour la semaine
      leagueId = crypto.randomUUID();
      await execute(
        'INSERT INTO leagues (id, name, tier, weekStart, weekEnd) VALUES ($1, $2, $3, $4, $5)',
        [leagueId, 'Ligue de Bronze', 'bronze', weekStart.toISOString(), weekEnd.toISOString()]
      );

      // Création des comptes de bots mascottes
      const bots = [
        { id: 'bot_samson', name: 'Samson', email: 'samson@mascot.local' },
        { id: 'bot_esther', name: 'Esther', email: 'esther@mascot.local' },
        { id: 'bot_noe', name: 'Noé', email: 'noe@mascot.local' },
        { id: 'bot_gedeon', name: 'Gédéon', email: 'gedeon@mascot.local' },
      ];

      for (const bot of bots) {
        await execute(
          'INSERT INTO users (id, name, email) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
          [bot.id, bot.name, bot.email]
        );
      }

      // Ajout des bots avec des scores de base
      await execute(
        'INSERT INTO league_members (id, leagueId, userId, xpThisWeek, rank) VALUES ($1, $2, $3, $4, $5)',
        [crypto.randomUUID(), leagueId, 'bot_samson', 80, 1]
      );
      await execute(
        'INSERT INTO league_members (id, leagueId, userId, xpThisWeek, rank) VALUES ($1, $2, $3, $4, $5)',
        [crypto.randomUUID(), leagueId, 'bot_esther', 60, 2]
      );
      await execute(
        'INSERT INTO league_members (id, leagueId, userId, xpThisWeek, rank) VALUES ($1, $2, $3, $4, $5)',
        [crypto.randomUUID(), leagueId, 'bot_noe', 40, 3]
      );
      await execute(
        'INSERT INTO league_members (id, leagueId, userId, xpThisWeek, rank) VALUES ($1, $2, $3, $4, $5)',
        [crypto.randomUUID(), leagueId, 'bot_gedeon', 15, 4]
      );
    } else {
      leagueId = league.id;
    }

    // Inscription de notre utilisateur dans la ligue
    await execute(
      'INSERT INTO league_members (id, leagueId, userId, xpThisWeek, rank) VALUES ($1, $2, $3, $4, $5)',
      [crypto.randomUUID(), leagueId, userId, 0, 5]
    );

    // Recalculer les rangs de la ligue
    await recalculateRanks(leagueId);
  } else {
    leagueId = (memberRecord[0] as any).league_id;
  }

  // Récupérer la ligue ordonnée
  return await query(`
    SELECT l.*, 
           lm.userId, lm.xpThisWeek, lm.rank,
           u.name, u.image
    FROM leagues l
    JOIN league_members lm ON lm.leagueId = l.id
    JOIN users u ON u.id = lm.userId
    WHERE l.id = $1
    ORDER BY lm.xpThisWeek DESC
  `, [leagueId]);
}

/**
 * Incrémente l'XP accumulée cette semaine par l'utilisateur et met à jour les rangs.
 */
export async function addXPToLeague(userId: string, amount: number) {
  const league = await getOrCreateLeague(userId);
  if (!league || league.length === 0) return;

  const member = await queryOne(
    'SELECT * FROM league_members WHERE userId = $1 AND leagueId = $2',
    [userId, (league[0] as any).id]
  );

  if (member) {
    await execute(
      'UPDATE league_members SET xpThisWeek = xpThisWeek + $1 WHERE id = $2',
      [amount, (member as any).id]
    );
    await recalculateRanks((league[0] as any).id);
  }
}

/**
 * Renvoie les membres de la ligue ordonnés avec les informations de l'utilisateur.
 */
export async function getLeaderboard(userId: string) {
  const league = await getOrCreateLeague(userId);
  if (!league || league.length === 0) return null;

  const leagueId = (league[0] as any).id;

  const members = await query<{
    userId: string; xpThisWeek: number; rank: number; name: string; image: string | null;
  }>(`
    SELECT lm.userId, lm.xpThisWeek, lm.rank, u.name, u.image
    FROM league_members lm
    JOIN users u ON u.id = lm.userId
    WHERE lm.leagueId = $1
    ORDER BY lm.xpThisWeek DESC
  `, [leagueId]);

  return {
    leagueId,
    leagueName: (league[0] as any).name,
    tier: (league[0] as any).tier,
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
