import { MascotMood } from "@/types/mascot";

/**
 * ============================================================
 *  SOURCE UNIQUE DE VÉRITÉ DE L'ÉTAT DE LA MASCOTTE
 * ============================================================
 *
 * Avant : 4 endroits calculaient l'humeur indépendamment
 *   - lib/mascots.ts        → getMascotState (mood + message)
 *   - hooks/useCharacterState → pose/expression (météo, heure)
 *   - components/mascot/Manny → son propre switch mood→pose
 *   - RandomMascotMessage    → encore un switch mood→pose
 * Résultat : message joyeux + visage neutre, ou larmes après
 * 3 sessions accomplies.
 *
 * Désormais tout passe par `resolveMascotState()` : un seul
 * calcul, une seule table mood→pose/expression.
 */

export type MascotPose = "idle" | "jumping" | "sad" | "running";
export type MascotExpression = "neutral" | "happy" | "sweating" | "crying";
export type TimeOfDay = "morning" | "midday" | "afternoon" | "evening" | "night";

export interface MascotProgressInput {
  /** Mini-sessions terminées aujourd'hui (0 à 3). */
  sessionsCompletedToday: number;
  /** La journée est marquée comme terminée. */
  dayCompleted: boolean;
  /** L'utilisateur est actuellement DANS une méditation (au-delà du 1er écran). */
  isMeditatingNow?: boolean;
  /** Série de jours consécutifs. */
  streakCount?: number;
  /** Jours d'inactivité depuis la dernière méditation. */
  inactivityDays?: number;
}

/**
 * Créneau horaire attendu pour chaque mini-session.
 * L'escalade suit le RYTHME des mini-sessions, pas seulement l'heure :
 * avoir fait la mini 1 le matin est une réussite — la mascotte reste
 * contente et encourage jusqu'à ce que le créneau de la mini 2 passe
 * sans nouvelle méditation. Alors seulement elle s'inquiète.
 */
const MINI_SESSION_DEADLINES: Record<number, TimeOfDay[]> = {
  // La mini 1 est attendue le matin ; passé midi sans rien, on s'inquiète.
  1: ["morning"],
  // La mini 2 est attendue jusqu'à l'après-midi.
  2: ["morning", "midday", "afternoon"],
  // La mini 3 est attendue avant la nuit.
  3: ["morning", "midday", "afternoon", "evening"],
};

const TIME_ORDER: TimeOfDay[] = ["morning", "midday", "afternoon", "evening", "night"];

/**
 * Le créneau de la PROCHAINE mini-session est-il dépassé ?
 * Ex. 1 session faite et il est 16 h (afternoon) → le créneau de la mini 2
 * (jusqu'à afternoon) court encore : la mascotte encourage.
 * Le soir venu, il est dépassé : elle s'inquiète.
 */
function isNextSessionOverdue(sessionsDone: number, timeOfDay: TimeOfDay): boolean {
  const next = sessionsDone + 1;
  const allowed = MINI_SESSION_DEADLINES[next];
  if (!allowed) return false;
  return TIME_ORDER.indexOf(timeOfDay) > TIME_ORDER.indexOf(allowed[allowed.length - 1]);
}

export interface MascotState {
  mood: MascotMood;
  pose: MascotPose;
  expression: MascotExpression;
  message: string;
  /** Situation retenue — utile pour choisir le pool de messages. */
  situation: MascotSituation;
  /** Pour le débogage : pourquoi cet état a été choisi. */
  reason: string;
}

export type MascotSituation =
  | "day_complete"
  | "bonus_session"
  | "meditating"
  | "partial_progress"
  | "partial_overdue"
  | "streak_danger"
  | "streak_saved"
  | "streak_milestone"
  | "not_started";

const STREAK_MILESTONES = [7, 30, 50, 100, 200, 365];

/** Détermine le moment de la journée à partir de l'heure LOCALE. */
export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 14) return "midday";
  if (hour >= 14 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

/**
 * Table UNIQUE mood → pose/expression.
 * Ne jamais dupliquer ce mapping ailleurs.
 */
/**
 * Traduit une humeur en pose + expression du personnage RENDU.
 *
 * C'est la seule table de correspondance : le visage dessiné doit refléter
 * l'emoji du message. Les 4 expressions disponibles en base (fichiers SVG
 * expression_*.svg de chaque personnage) sont exploitées :
 *   happy    → sourire      (😊 🎉 🔥 🏆 🤩)
 *   neutral  → impassible   (😐 état de repos / réflexion)
 *   sweating → embarras     (😟 😥 😰 inquiétude, gêne, urgence)
 *   crying   → larmes       (😢 😭 💔 tristesse, culpabilité)
 */
export function moodToVisual(mood: MascotMood): {
  pose: MascotPose;
  expression: MascotExpression;
} {
  switch (mood) {
    // Joie explosive : le personnage saute, visage rayonnant.
    case "celebrating":
    case "excited":
      return { pose: "jumping", expression: "happy" };
    // Encouragement dynamique : il court, visage souriant.
    case "encouraging":
      return { pose: "running", expression: "happy" };
    // Content : debout, souriant.
    case "happy":
      return { pose: "idle", expression: "happy" };
    // Inquiétude / gêne : posture affaissée, visage en sueur.
    // C'est l'état « 😟 » — avant il rendait un visage neutre impassible.
    case "worried":
      return { pose: "sad", expression: "sweating" };
    // Réflexion : debout, visage neutre.
    case "thinking":
    case "praying":
      return { pose: "idle", expression: "neutral" };
    case "sleeping":
      return { pose: "idle", expression: "neutral" };
    // Tristesse : posture affaissée, larmes.
    case "sad":
      return { pose: "sad", expression: "crying" };
    default:
      return { pose: "idle", expression: "happy" };
  }
}

/**
 * Messages par situation × moment de la journée.
 *
 * ESCALADE PSYCHOLOGIQUE (modèle Duolingo) — c'est le cœur du mécanisme :
 * le matin la mascotte est amicale, à midi elle insiste, l'après-midi elle
 * s'inquiète, le soir elle est triste, la nuit elle est dramatique.
 * La culpabilité amicale est VOULUE : voir Manny triste doit donner envie
 * de « réparer » la situation en méditant.
 *
 * Règle : le ton du message correspond TOUJOURS à l'expression du visage.
 */
const MESSAGES: Record<MascotSituation, Partial<Record<TimeOfDay, string>> & { default: string }> = {
  // Journée COMPLÈTE : champion de la foi, embrasé pour le Seigneur.
  day_complete: {
    morning: "🔥 Les 3 mini-sessions dès le matin ! Tu es un champion de la foi, embrasé pour le Seigneur !",
    midday: "🏆 Journée spirituelle COMPLÈTE ! Champion de la foi, le Seigneur est avec toi !",
    afternoon: "🔥 3 mini-sessions accomplies ! Tu es embrasé pour le Seigneur !",
    evening: "🏆 Journée complète, champion de la foi ! Que la Parole t'accompagne cette nuit.",
    night: "🔥 Journée bénie et complète. Tu t'endors en champion de la foi.",
    default: "🏆 Tes 3 mini-sessions sont accomplies. Champion de la foi, gloire à Dieu !",
  },
  bonus_session: {
    morning: "🤩 Déjà tout accompli et tu en veux encore ? Quelle soif de la Parole !",
    midday: "✨ Une méditation de plus alors que ta journée est complète — magnifique !",
    afternoon: "🔥 Tu dépasses ton objectif ! Ta soif de Dieu est inspirante.",
    evening: "🌟 Tes 3 sessions étaient faites et tu reviens encore. Le Seigneur voit ton cœur !",
    night: "💛 Même tard, tu cherches Sa présence. C'est précieux.",
    default: "🤩 Session bonus ! Tu dépasses ton objectif du jour, quelle fidélité !",
  },
  meditating: {
    default: "🤔 Continue ta réflexion, la Parole t'éclaire.",
  },
  // DANS le créneau : la mascotte est CONTENTE et encourage.
  partial_progress: {
    morning: "😊 Bravo pour cette mini-session ! Tu as bien commencé ta journée.",
    midday: "🙂 Belle avancée ! Continue, la prochaine mini-session t'attend.",
    afternoon: "👍 Tu progresses bien ! Encore un effort pour compléter ta journée.",
    evening: "💪 Tu avances bien. Termine ta journée spirituelle avant la nuit !",
    night: "🌛 Belle avancée aujourd'hui. Termine si tu peux encore !",
    default: "😊 Bravo pour cette mini-session ! Continue.",
  },
  // Créneau DÉPASSÉ : la mascotte s'inquiète (visage en sueur), puis pleure la nuit.
  partial_overdue: {
    midday: "😟 Ta prochaine mini-session devait être faite... Ne t'arrête pas en chemin !",
    afternoon: "😥 Le créneau de ta prochaine mini-session est passé. Reviens méditer !",
    evening: "😰 Tu as bien commencé mais tu t'es arrêté... Ne laisse pas ta journée inachevée !",
    night: "😭 Minuit approche et ta journée reste incomplète. Il te reste si peu de temps...",
    default: "😟 Tu t'es arrêté en chemin. Reviens compléter ta journée !",
  },
  streak_milestone: {
    default: "🏆 Quel palier ! Ta constance est un témoignage.",
  },
  streak_saved: {
    default: "😌 Ouf ! Ta série est sauvée. Bien joué d'être revenu !",
  },
  // ESCALADE MAXIMALE : une série active en jeu = le levier le plus fort.
  // Emojis alignés sur le visage dessiné : ⏰ (alerte, sourire volontaire)
  // puis 😢/😭/💔 dès que la mascotte pleure réellement.
  streak_danger: {
    morning: "⏰ Ta série est en jeu aujourd'hui. Une méditation et elle est sauvée !",
    midday: "😢 Il est midi et ta série est menacée. Ne gâche pas tous ces jours d'efforts !",
    afternoon: "😢 L'après-midi avance et ta série va se briser. Je m'inquiète pour toi...",
    evening: "😭 Le soir tombe et ta série va DISPARAÎTRE à minuit ! Tous tes efforts perdus...",
    night: "💔 Minuit approche. Ta série va se briser et ça me brise le cœur. Il te reste peu de temps !",
    default: "😢 Ta série est en danger. Une méditation et elle est sauvée !",
  },
  // ESCALADE PROGRESSIVE : amical → insistant → inquiet → triste → dramatique.
  not_started: {
    morning: "🌅 Bonjour ! Commençons cette journée avec la Parole de Dieu.",
    midday: "🕐 Il est déjà midi et tu n'as pas encore médité... Prends 10 minutes pour la Parole !",
    afternoon: "😟 L'après-midi avance et la Parole t'attend toujours. Ne laisse pas passer ce jour...",
    evening: "😢 Le soir tombe et tu n'as pas médité aujourd'hui. Les méditations ne se font pas toutes seules...",
    night: "😭 La journée s'achève et la Parole est restée fermée. Il te reste quelques minutes avant minuit !",
    default: "📖 Prêt à méditer la Parole aujourd'hui ?",
  },
};

function pickMessage(situation: MascotSituation, timeOfDay: TimeOfDay): string {
  const pool = MESSAGES[situation];
  return pool[timeOfDay] || pool.default;
}

/**
 * RÉSOLVEUR CENTRAL — la seule fonction autorisée à décider de l'état de la mascotte.
 *
 * Ordre de priorité (le premier qui correspond gagne) :
 *  1. session bonus  — journée déjà complète ET l'utilisateur remédite  → excited
 *  2. journée complète — 3 sessions ou dayCompleted                     → celebrating
 *  3. palier de série — streak à 7/30/50/100/200/365 sans inactivité    → celebrating
 *  4. série sauvée    — inactivité mais au moins 1 session aujourd'hui  → happy
 *  5. série en danger — inactivité et 0 session : escalade horaire      → sad
 *  6. méditation en cours                                              → thinking
 *  7. progression partielle — 1 ou 2 sessions : escalade le soir        → happy/thinking
 *  8. rien commencé — ESCALADE : amical le matin → triste le soir       → happy→sad
 *
 * Règle d'or : l'humeur et le message viennent du MÊME calcul, donc le
 * visage correspond toujours au texte. La mascotte DOIT être triste quand
 * l'utilisateur néglige sa méditation — c'est le levier de la culpabilité
 * amicale (modèle Duolingo), pas un bug.
 */
export function resolveMascotState(
  input: MascotProgressInput,
  timeOfDay: TimeOfDay = getTimeOfDay()
): MascotState {
  const {
    sessionsCompletedToday,
    dayCompleted,
    isMeditatingNow = false,
    streakCount = 0,
    inactivityDays = 0,
  } = input;

  const build = (mood: MascotMood, situation: MascotSituation, reason: string): MascotState => ({
    mood,
    ...moodToVisual(mood),
    message: pickMessage(situation, timeOfDay),
    situation,
    reason,
  });

  const isComplete = dayCompleted || sessionsCompletedToday >= 3;

  // 1. Session bonus : la journée est bouclée et l'utilisateur en redemande.
  //    Corrige le bug d'origine : la mascotte pleurait au lieu de féliciter.
  if (isComplete && isMeditatingNow) {
    return build("excited", "bonus_session", "Journée complète et une méditation supplémentaire en cours");
  }

  // 2. Journée complète.
  if (isComplete) {
    return build("celebrating", "day_complete", "Les 3 mini-sessions du jour sont faites");
  }

  // 3. Palier de série atteint.
  if (streakCount > 0 && STREAK_MILESTONES.includes(streakCount) && inactivityDays === 0) {
    return build("celebrating", "streak_milestone", `Palier de série atteint : ${streakCount} jours`);
  }

  // 4. Série sauvée : absence constatée mais l'utilisateur a médité aujourd'hui.
  if (streakCount > 0 && inactivityDays >= 1 && sessionsCompletedToday >= 1) {
    return build("happy", "streak_saved", "Série menacée mais au moins une session aujourd'hui");
  }

  // 5. Série en danger — le levier le plus fort : la peur de perdre sa série.
  //    Escalade : inquiet le matin → triste dès midi (les efforts accumulés sont en jeu).
  if (streakCount > 0 && inactivityDays >= 1 && sessionsCompletedToday === 0) {
    const mood: MascotMood = timeOfDay === "morning" ? "encouraging" : "sad";
    return build(mood, "streak_danger", `Série de ${streakCount} jours en danger, aucune session aujourd'hui`);
  }

  // 6. Méditation en cours, aucune session encore validée.
  if (isMeditatingNow && sessionsCompletedToday === 0) {
    return build("thinking", "meditating", "Méditation en cours");
  }

  // 7. Progression partielle (1 ou 2 mini-sessions) — l'escalade suit le RYTHME
  //    des mini-sessions, pas seulement l'heure :
  //    • dans le créneau de la prochaine → CONTENTE, elle encourage
  //    • créneau dépassé sans revenir    → elle s'inquiète, puis devient triste
  if (sessionsCompletedToday >= 1) {
    const overdue = isNextSessionOverdue(sessionsCompletedToday, timeOfDay);

    if (!overdue) {
      return build(
        "happy",
        "partial_progress",
        `${sessionsCompletedToday}/3 mini-session(s), dans le créneau de la suivante (${timeOfDay})`
      );
    }

    // Créneau dépassé : inquiétude visible (visage en sueur, posture affaissée)
    // qui devient des larmes la nuit. Le visage suit l'emoji du message.
    const mood: MascotMood = timeOfDay === "night" ? "sad" : "worried";
    return build(
      mood,
      "partial_overdue",
      `${sessionsCompletedToday}/3 mini-session(s), créneau de la suivante dépassé (${timeOfDay})`
    );
  }

  // 8. Rien commencé — ESCALADE PSYCHOLOGIQUE (cœur du modèle Duolingo).
  //    Le VISAGE DESSINÉ suit l'emoji du message à chaque palier :
  //    matin  🌅 amical      → happy    (sourire)
  //    midi   🕐 insistant   → encouraging (court, sourire)
  //    a-midi 😟 inquiet     → worried  (sueur, posture affaissée)
  //    soir   😢 triste      → sad      (larmes)
  //    nuit   😭 dramatique  → sad      (larmes)
  const notStartedMood: MascotMood =
    timeOfDay === "morning"
      ? "happy"
      : timeOfDay === "midday"
      ? "encouraging"
      : timeOfDay === "afternoon"
      ? "worried"
      : "sad";

  return build(notStartedMood, "not_started", `Aucune session, moment de la journée : ${timeOfDay}`);
}
