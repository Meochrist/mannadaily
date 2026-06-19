export type MannySituation =
  | "welcome"
  | "streak_danger"
  | "abandon_attempt"
  | "level_up"
  | "streak_milestone"
  | "session_complete"
  | "first_visit"
  | "loading"
  | "evening";

const messagesMap: Record<MannySituation, string[]> = {
  welcome: [
    "Bonjour [name] ! La Parole t'attend 🌅",
    "Prêt à recevoir ta manne du jour, [name] ?",
    "Dieu a quelque chose de spécial pour toi aujourd'hui !",
    "Chaque matin est une nouvelle grâce. Allons-y [name] !",
    "Ta Bible t'attendait ! Entre dans Sa présence, [name].",
  ],
  streak_danger: [
    "Nooon [name] ! Ta série de [X] jours va disparaître 😢",
    "S'il te plaît... juste 2 minutes avec Dieu ?",
    "Je t'ai attendu toute la journée [name]...",
    "Ta flamme va s'éteindre ! Vite !",
    "Dieu t'attend encore aujourd'hui [name] 🙏",
  ],
  abandon_attempt: [
    "Tu es sûr ? On était si bien ensemble...",
    "Reste encore ! Dieu a encore à te dire...",
    "Juste une minute de plus ? Pour moi ? 🥺",
    "Ta série compte sur toi [name] !",
    "C'est maintenant que la percée arrive, ne pars pas !",
  ],
  level_up: [
    "Incroyable [name] ! Tu as grandi spirituellement et atteint un nouveau niveau ! 🎉",
    "Félicitations [name] ! Tu passes à l'étape supérieure. Gloire à Dieu !",
    "Quel progrès, [name] ! Ton niveau augmente, continue d'arroser cette semence !",
    "Tu grandis en sagesse et en foi. Nouveau niveau débloqué ! ⭐",
    "Magnifique ! Nouveau niveau atteint. Que Dieu continue de te fortifier [name] !",
  ],
  streak_milestone: [
    "Quelle fidélité ! Tu viens d'atteindre une série de [X] jours, [name] ! 🔥",
    "Wow [name] ! [X] jours consécutifs à chercher Dieu. C'est un jalon puissant !",
    "Ton dévouement porte ses fruits : [X] jours de suite ! Sois béni [name] !",
    "Une flamme qui brûle depuis [X] jours ! Ne t'arrête pas en si bon chemin !",
    "Gloire à Dieu pour ces [X] jours de communion constante. Tu es un exemple [name] !",
  ],
  session_complete: [
    "Magnifique session complétée, [name] ! Tu as fait le bon choix aujourd'hui.",
    "Session terminée ! Repars fortifié et rempli de Sa paix, [name].",
    "C'est fait ! La Parole a été semée dans ton cœur aujourd'hui. 🌾",
    "Gloire à Dieu pour ce moment de qualité passé ensemble. Sois béni [name] !",
    "Session validée avec succès ! Continue d'ancrer ces vérités dans ta vie.",
  ],
  first_visit: [
    "Ravi de te revoir aujourd'hui, [name] ! C'est le moment idéal pour méditer.",
    "Bienvenue pour ta première visite du jour, [name] ! Commençons en douceur.",
    "Une nouvelle journée commence, et la présence de Dieu est déjà là. Prêt [name] ?",
    "C'est ta première pause spirituelle du jour. Prends un temps pour Lui.",
    "Bonjour [name] ! Commenser sa journée avec Sa Parole change tout.",
  ],
  loading: [
    "Manny prépare ta méditation... Je puise dans les profondeurs de l'Écriture. 📖",
    "Un instant [name]... Je rassemble les perles de sagesse de ce verset.",
    "Manny est en pleine réflexion... Laisse-moi structurer cette méditation spirituelle.",
    "Je prépare quelque chose d'inspirant pour toi, [name]. Ça arrive...",
    "Analyse du verset en cours... Prépare ton cœur à recevoir cette vérité.",
  ],
  evening: [
    "Le soir est le moment de ruminer Sa Parole...",
    "Termine ta journée dans Sa présence, [name]",
    "Avant de dormir, laisse Dieu parler à ton cœur",
    "La méditation du soir scelle ta journée en Sa présence",
    "Noé te souhaite une bonne nuit dans la Parole 🌙",
  ],
};

/**
 * Retourne un message aléatoire de Manny en fonction de la situation
 * et y injecte le nom d'utilisateur et/ou la valeur du streak.
 */
export function getMannyMessage(
  situation: MannySituation,
  userName?: string,
  streak?: number
): string {
  const list = messagesMap[situation];
  if (!list || list.length === 0) return "";

  const randomIndex = Math.floor(Math.random() * list.length);
  let message = list[randomIndex];

  const nameToUse = userName || "mon ami";
  const streakToUse = streak !== undefined ? String(streak) : "X";

  message = message.replace(/\[name\]/g, nameToUse);
  message = message.replace(/\[X\]/g, streakToUse);

  return message;
}
