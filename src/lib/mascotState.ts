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
export function moodToVisual(mood: MascotMood): {
  pose: MascotPose;
  expression: MascotExpression;
} {
  switch (mood) {
    case "celebrating":
    case "excited":
      return { pose: "jumping", expression: "happy" };
    case "encouraging":
      return { pose: "running", expression: "happy" };
    case "happy":
      return { pose: "idle", expression: "happy" };
    case "thinking":
    case "praying":
      return { pose: "idle", expression: "neutral" };
    case "sleeping":
      return { pose: "idle", expression: "neutral" };
    case "sad":
      return { pose: "sad", expression: "crying" };
    default:
      return { pose: "idle", expression: "happy" };
  }
}

/**
 * Messages par situation × moment de la journée.
 * Le ton suit TOUJOURS l'humeur : jamais de larmes sur un message de félicitations.
 */
const MESSAGES: Record<MascotSituation, Partial<Record<TimeOfDay, string>> & { default: string }> = {
  day_complete: {
    morning: "☀️ Journée complète dès le matin ! Quelle belle discipline.",
    midday: "🎉 Tes 3 méditations sont faites. Le Seigneur est avec toi !",
    afternoon: "✅ Journée spirituelle accomplie. Bravo !",
    evening: "🌙 Tu as tout accompli aujourd'hui. Que la Parole t'accompagne cette nuit.",
    night: "💤 Journée bénie et complète. Repose-toi dans Sa paix.",
    default: "🎉 Tes 3 méditations sont accomplies. Gloire à Dieu !",
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
  partial_progress: {
    morning: "😊 Bon début de journée ! Continue sur cette lancée.",
    midday: "🙂 Tu es sur la bonne voie. Encore un effort !",
    afternoon: "👍 Belle progression ! Tu y es presque.",
    evening: "💪 Tu avances bien. Termine avant la nuit.",
    night: "🌛 Belle avancée aujourd'hui. Demain sera un autre jour.",
    default: "😊 Tu progresses bien, continue !",
  },
  streak_milestone: {
    default: "🏆 Quel palier ! Ta constance est un témoignage.",
  },
  streak_saved: {
    default: "😌 Ouf ! Ta série est sauvée. Bien joué d'être revenu !",
  },
  streak_danger: {
    morning: "⏰ Ta série est en jeu aujourd'hui. Une méditation et elle est sauvée !",
    midday: "🕐 Il est midi et ta série est menacée. Prends 10 minutes pour la Parole !",
    afternoon: "⚠️ L'après-midi avance et ta série est en danger. Ne la laisse pas se briser !",
    evening: "😢 Le soir tombe et ta série va se briser... Il te reste un peu de temps !",
    night: "😥 Il est très tard et ta série est en péril. Une courte méditation suffit !",
    default: "⏰ Ta série est en danger. Une méditation et elle est sauvée !",
  },
  not_started: {
    morning: "🌅 Bonjour ! Commençons cette journée avec la Parole de Dieu.",
    midday: "🕐 Il est midi. Prends 10 minutes pour te nourrir de la Parole !",
    afternoon: "☀️ L'après-midi avance. N'oublie pas ta méditation du jour !",
    evening: "🌇 Le soir tombe. Prends un moment pour te recentrer sur la Parole.",
    night: "🌙 Il est tard, mais il n'est jamais trop tard pour Sa Parole.",
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
 *  5. série en danger — inactivité et 0 session aujourd'hui             → sad
 *  6. méditation en cours                                              → thinking
 *  7. progression partielle — 1 ou 2 sessions                          → happy
 *  8. rien commencé — humeur selon l'heure, JAMAIS triste sans raison   → happy/encouraging
 *
 * Règle d'or : l'humeur et le message viennent du MÊME calcul, donc ils
 * ne peuvent plus se contredire.
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
  //    C'était LE bug : la mascotte pleurait au lieu de féliciter.
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

  // 5. Série en danger : c'est le SEUL cas où la mascotte est triste.
  if (streakCount > 0 && inactivityDays >= 1 && sessionsCompletedToday === 0) {
    return build("sad", "streak_danger", "Série active mais aucune session aujourd'hui");
  }

  // 6. Méditation en cours, aucune session encore validée.
  if (isMeditatingNow && sessionsCompletedToday === 0) {
    return build("thinking", "meditating", "Méditation en cours");
  }

  // 7. Progression partielle.
  if (sessionsCompletedToday >= 1) {
    return build("happy", "partial_progress", `${sessionsCompletedToday} session(s) faite(s) aujourd'hui`);
  }

  // 8. Rien commencé : l'heure module l'INSISTANCE, jamais la tristesse.
  //    Auparavant l'après-midi et le soir renvoyaient "sad" → larmes injustifiées.
  const mood: MascotMood =
    timeOfDay === "night" ? "sleeping" : timeOfDay === "morning" ? "happy" : "encouraging";

  return build(mood, "not_started", `Aucune session, moment de la journée : ${timeOfDay}`);
}
