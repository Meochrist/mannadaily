export interface NotificationMessage {
  mascot: "manny" | "samson" | "esther" | "gedeon" | "noe";
  title: string;
  body: string;
  emoji: string;
}

export const NOTIFICATION_MESSAGES: Record<string, NotificationMessage[]> = {
  morning: [
    {
      mascot: "manny",
      title: "Un petit moment pour nous ? ☕",
      body: "Bonjour [name]. Je t'ai préparé quelque chose de spécial aujourd'hui... La Parole n'attend que toi.",
      emoji: "📖",
    },
    {
      mascot: "samson",
      title: "DEBOUT LÀ-DEDANS ! ⚡",
      body: "TON HOMME INTÉRIEUR DÉPÉRIT. 0 reps spirituelles aujourd'hui. C'est l'heure de pousser de la Parole !",
      emoji: "🏋️‍♂️",
    },
    {
      mascot: "esther",
      title: "Une matinée royale, chéri(e) 👑",
      body: "Bonjour [name]. Un héritier du Royaume ne commence pas sa journée sans saluer le Roi. Ne fais pas attendre ta couronne.",
      emoji: "✨",
    },
    {
      mascot: "gedeon",
      title: "ALERTE ROUGE MATINALE ! 🚨",
      body: "Sans sagesse divine, tu vas prendre de MAUVAISES DÉCISIONS aujourd'hui. S'il te plaît, connecte-toi vite !",
      emoji: "😱",
    },
    {
      mascot: "noe",
      title: "L'arche part à l'heure 🚢",
      body: "J'ai construit une arche en 100 ans sous les moqueries. Tu peux bien prendre 5 minutes ce matin. Ou pas, c'est ton déluge.",
      emoji: "🌧️",
    },
    {
      mascot: "manny",
      title: "Ta dose de paix matinale... 🌱",
      body: "Le monde fait déjà beaucoup de bruit ce matin. Viens écouter le murmure doux de Dieu avec moi, [name].",
      emoji: "🕊️",
    },
    {
      mascot: "samson",
      title: "Discipline de fer ! 💪",
      body: "[name], les faibles trouvent des excuses, les forts méditent dès le réveil. Montre-moi ce que tu as dans le ventre !",
      emoji: "🔥",
    },
    {
      mascot: "esther",
      title: "L'élégance spirituelle 💅",
      body: "Se réveiller et courir sur son téléphone sans prier ? Quelle roture. Élevons un peu le niveau ce matin.",
      emoji: "👸",
    },
  ],
  midday: [
    {
      mascot: "manny",
      title: "Tu penses encore à moi ? 🥪",
      body: "Le déjeuner est plus doux quand on le partage avec la Parole. Tu me manques un peu, [name]...",
      emoji: "🥺",
    },
    {
      mascot: "samson",
      title: "PAUSE DE MIDI = PAUSE XP 💥",
      body: "Tu as le temps de scroller sur des vidéos de chats mais pas de fortifier ton âme ? Allez, 10 flexions de foi, maintenant !",
      emoji: "📣",
    },
    {
      mascot: "esther",
      title: "Un déjeuner de cour 🍷",
      body: "La nourriture physique est excellente, mais as-tu nourri ton esprit royal aujourd'hui, [name] ? C'est une question d'étiquette.",
      emoji: "✨",
    },
    {
      mascot: "gedeon",
      title: "Déjà midi et RIEN ?! 😰",
      body: "La moitié de la journée est passée et tu n'es pas protégé spirituellement ! Si l'ennemi attaque maintenant, on fait quoi ?!",
      emoji: "🛡️",
    },
    {
      mascot: "noe",
      title: "Le niveau de l'eau monte... 🌊",
      body: "Le soleil est au zénith. Ma patience aussi. Prends ton envol spirituel avant que la pluie ne commence à tomber.",
      emoji: "🦅",
    },
    {
      mascot: "samson",
      title: "Pas de protéines sans Parole 🍗",
      body: "Nourrir les biceps sans nourrir la foi ? Une grave erreur stratégique. Viens faire tes séries de versets !",
      emoji: "💪",
    },
    {
      mascot: "esther",
      title: "Une pause digne de toi ✨",
      body: "Laisse de côté les affaires vulgaires de ce monde quelques instants, [name]. Ta dévotion t'attend.",
      emoji: "👑",
    },
    {
      mascot: "gedeon",
      title: "Mais que fais-tu ?! 😭",
      body: "Le stress de la journée s'accumule et tu n'as pas encore ouvert MannaDaily ! Respire et viens méditer !",
      emoji: "🆘",
    },
  ],
  evening: [
    {
      mascot: "manny",
      title: "La journée se termine... 🌅",
      body: "Avant de t'endormir, [name], j'aimerais qu'on lise un verset ensemble. C'est le meilleur moment pour trouver le repos.",
      emoji: "🌙",
    },
    {
      mascot: "samson",
      title: "DERNIER ROUND 🥊",
      body: "La journée s'achève et ta jauge d'XP fait peine à voir. Ne va pas te coucher comme un lâche sans ton combat du jour !",
      emoji: "👊",
    },
    {
      mascot: "esther",
      title: "Le bilan du soir, chéri(e) 🌌",
      body: "Une journée sans méditation est une journée perdue pour le Royaume. Rattrpe-toi avec grâce avant la nuit.",
      emoji: "💫",
    },
    {
      mascot: "gedeon",
      title: "VITE VITE VITE ! ⏳",
      body: "Le soleil se couche ! Si tu ne médites pas maintenant, tu vas oublier et briser ta série ! Je stresse pour toi !",
      emoji: "😱",
    },
    {
      mascot: "noe",
      title: "Avant que le soleil ne décline 🪵",
      body: "La journée a été longue ? C'est l'heure de rentrer à l'arche et de trouver un peu de calme dans la Parole.",
      emoji: "🏡",
    },
    {
      mascot: "manny",
      title: "Je t'attends toujours... 🌱",
      body: "Je suis resté là toute la journée à espérer ton retour. Offre-toi un instant de paix avec Dieu ce soir.",
      emoji: "🕯️",
    },
    {
      mascot: "samson",
      title: "Dernière chance pour ton honneur 🏋️‍♂️",
      body: "Ne laisse pas les soucis de la journée te mettre K.O. Viens écraser tes objectifs d'XP avant minuit !",
      emoji: "🔥",
    },
    {
      mascot: "noe",
      title: "Une simple planche de salut 🪵",
      body: "La journée a été une tempête ? Laisse la Parole de Dieu calmer le vent avant que tu ne fermes les yeux.",
      emoji: "⚓",
    },
  ],
  urgent: [
    {
      mascot: "manny",
      title: "Ne m'abandonne pas ce soir... 😭",
      body: "Ton streak va expirer dans quelques heures. S'il te plaît, [name], ne laisse pas tous nos efforts s'effacer...",
      emoji: "💔",
    },
    {
      mascot: "samson",
      title: "STREAK EN DANGER DE MORT ! 🚨",
      body: "IL RESTE MOINS DE 3 HEURES ! Tu vas laisser tomber ta série comme ça ? Secoue-toi et viens méditer !",
      emoji: "💥",
    },
    {
      mascot: "esther",
      title: "Un abandon indigne 💅",
      body: "Laisser expirer sa dévotion par pure paresse ? Quel manque de standing. Reconnecte-toi immédiatement.",
      emoji: "😒",
    },
    {
      mascot: "gedeon",
      title: "C'EST LA CATASTROPHE !!! 😱",
      body: "MINUIT APPROCHE ! Ton streak va être BRISÉ ! Je ne vais pas pouvoir dormir si tu ne fais rien !",
      emoji: "🔥",
    },
    {
      mascot: "noe",
      title: "Dernier appel à l'embarquement 📢",
      body: "La rampe de l'arche se ferme à minuit. Ta persévérance prend l'eau. Sauve ton streak pendant qu'il en est encore temps.",
      emoji: "🌧️",
    },
    {
      mascot: "manny",
      title: "Juste 2 minutes, s'il te plaît 🙏",
      body: "Je ne veux pas te voir perdre ton habitude si précieuse. Faisons juste une courte proclamation ensemble, [name].",
      emoji: "🥺",
    },
    {
      mascot: "samson",
      title: "T'AS LE TEMPS DE LIRE ÇA ? ALORS MÉDITE ! ⚔️",
      body: "Pas d'excuse ! Ton streak de [X] jours est sur le point d'être détruit par ta propre procrastination. Agis !",
      emoji: "🥊",
    },
    {
      mascot: "esther",
      title: "Sauvegardons les apparences ✨",
      body: "Perdre une si belle série de [X] jours sous les yeux du Royaume ? Quelle honte. Rétablis ton honneur en 3 clics.",
      emoji: "👑",
    },
  ],
  streak_broken: [
    {
      mascot: "manny",
      title: "Mon cœur est brisé... 😢",
      body: "Oh non [name]... Ta belle série de jours consécutifs s'est éteinte. Ce n'est pas grave, on recommence ensemble dès aujourd'hui ?",
      emoji: "💔",
    },
    {
      mascot: "samson",
      title: "STREAK REVENU À ZÉRO. FAIBLE. ❌",
      body: "Tant d'efforts réduits à néant. Tu as abandonné le combat. Relève-toi tout de suite et relance la machine !",
      emoji: "💀",
    },
    {
      mascot: "esther",
      title: "Déception royale... 👑",
      body: "Retourner à la case départ par simple oubli ? C'est regrettable, [name]. Reconstruisons cette discipline dès maintenant.",
      emoji: "🎭",
    },
    {
      mascot: "gedeon",
      title: "LE PIRE EST ARRIVÉ ! 😭",
      body: "Ta série est tombée à zéro ! Tout est à refaire ! Pourquoi as-tu laissé faire ça ?! Allez, on s'y remet vite !",
      emoji: "📉",
    },
    {
      mascot: "noe",
      title: "L'arche a sombré 🌊",
      body: "Ta régularité a coulé. Les grands projets demandent de la rigueur chaque jour. Reconstruisons ensemble aujourd'hui.",
      emoji: "⚓",
    },
    {
      mascot: "manny",
      title: "Rien n'est perdu avec Dieu 🌱",
      body: "La grâce de Dieu se renouvelle chaque matin, [name]. Ne te décourage pas, viens poser la première pierre d'une nouvelle série.",
      emoji: "🕊️",
    },
    {
      mascot: "samson",
      title: "Tombé mais pas K.O. ! 🥊",
      body: "Les champions ne pleurent pas sur leurs échecs. Ils retournent à l'entraînement. Viens regagner ton XP perdue !",
      emoji: "🔥",
    },
    {
      mascot: "esther",
      title: "Une nouvelle opportunité ✨",
      body: "Oublie cette erreur de parcours, [name]. Un vrai souverain sait rebondir. Ta nouvelle couronne commence aujourd'hui.",
      emoji: "💅",
    },
  ],
  streak_milestone_7: [
    {
      mascot: "manny",
      title: "7 jours de fidélité ! 🎉",
      body: "Je suis si fier de toi, [name] ! Une semaine entière à chercher Dieu chaque jour. Continuons sur cette voie !",
      emoji: "🥳",
    },
    {
      mascot: "samson",
      title: "UNE SEMAINE DE DOMINATION ! 💪",
      body: "7 jours d'affilée sans fléchir ! Ton homme intérieur commence à avoir de sacrés muscles. Ne relâche pas la pression !",
      emoji: "🏆",
    },
    {
      mascot: "esther",
      title: "Un premier palier digne de ton rang 👑",
      body: "7 jours consécutifs. Tu commences à acquérir les habitudes de la cour céleste, [name]. C'est magnifique à voir.",
      emoji: "✨",
    },
    {
      mascot: "gedeon",
      title: "7 JOURS SANS ACCIDENT ! 😱",
      body: "Incroyable ! Tu as tenu une semaine complète ! J'avais peur que tu oublies, mais tu l'as fait ! Célébrons ça !",
      emoji: "🎉",
    },
    {
      mascot: "noe",
      title: "Une semaine de navigation tranquille 🚢",
      body: "7 jours à bon port. La Parole de Dieu commence à s'ancrer dans ta vie quotidienne. Tiens bon la barre !",
      emoji: "⚓",
    },
    {
      mascot: "manny",
      title: "Une douce victoire... 🌱",
      body: "[name], 7 jours d'intimité avec le Seigneur. Ton cœur doit être tellement plus apaisé. Je me réjouis avec toi !",
      emoji: "☀️",
    },
    {
      mascot: "samson",
      title: "LA MACHINE EST EN MARCHE ! 🔥",
      body: "Une semaine complète de victoires quotidiennes ! Tu as posé les fondations, maintenant on vise le sommet !",
      emoji: "🏋️‍♂️",
    },
    {
      mascot: "esther",
      title: "7 jours de splendeur ✨",
      body: "Une régularité qui t'honore. Tu es une source d'inspiration pour tous les autres membres, continue ainsi.",
      emoji: "👸",
    },
  ],
  streak_milestone_30: [
    {
      mascot: "manny",
      title: "30 jours de marche spirituelle ! 🕊️",
      body: "Un mois entier, [name] ! C'est un véritable témoignage de ton amour pour la Parole. Merci de partager ce voyage avec moi.",
      emoji: "💖",
    },
    {
      mascot: "samson",
      title: "UN MOIS DE PUISSANCE SPIRITUELLE ! ⚡",
      body: "30 JOURS NON-STOP ! Tu as pulvérisé tous les records ! C'est ce que j'appelle un guerrier de la foi indestructible !",
      emoji: "🏅",
    },
    {
      mascot: "esther",
      title: "Une constance impériale 👑",
      body: "30 jours d'excellence. Tu as prouvé ta noblesse d'esprit et ta fidélité au Roi. Reçois mes hommages les plus sincères.",
      emoji: "💍",
    },
    {
      mascot: "gedeon",
      title: "30 JOURS ?! MAIS C'EST FOU ! 💥",
      body: "Un mois complet sans faillir ! Je n'ose même pas y croire, c'est tout simplement phénoménal ! Félicitations !",
      emoji: "🥳",
    },
    {
      mascot: "noe",
      title: "30 jours sur l'océan de la foi 🌊",
      body: "Un mois de persévérance à bord. La tempête n'a pas eu raison de toi. Tu es un capitaine aguerri désormais.",
      emoji: "🚢",
    },
    {
      mascot: "samson",
      title: "UN MENTAL EN TITANE ! 💪",
      body: "Trente jours d'effort soutenu, de proclamations massives et d'XP accumulée. Tu es officiellement une légende !",
      emoji: "🏆",
    },
    {
      mascot: "esther",
      title: "L'art de la discipline ✨",
      body: "30 jours consécutifs à cultiver ton esprit. Tu es devenu un pilier de sagesse. Félicitations pour ce mois accompli.",
      emoji: "👑",
    },
    {
      mascot: "manny",
      title: "Un mois transformé par la Parole 🌱",
      body: "Ta vie doit porter de si beaux fruits après 30 jours de méditation quotidienne. Que Dieu continue de te guider.",
      emoji: "✨",
    },
  ],
  level_up: [
    {
      mascot: "manny",
      title: "Tu grandis si vite ! 🌱",
      body: "Félicitations [name] ! Tu as atteint le niveau [X]. C'est magnifique de voir ta foi grandir et s'enraciner.",
      emoji: "✨",
    },
    {
      mascot: "samson",
      title: "NOUVEAU NIVEAU DÉVERROUILLÉ ! 🥊",
      body: "BOOM ! Niveau [X] dans la poche ! Ton niveau de puissance spirituelle est en train d'exploser !",
      emoji: "⚡",
    },
    {
      mascot: "esther",
      title: "Une ascension remarquable ✨",
      body: "Tu as atteint le niveau [X], [name]. Ta prestance spirituelle grandit et se remarque. Félicitations.",
      emoji: "👑",
    },
    {
      mascot: "gedeon",
      title: "NIVEAU [X] ATTEINT ! 🎉",
      body: "Tu as monté de niveau ! Ouf, tout ce travail paye enfin ! Je savais que tu y arriverais, bravo !",
      emoji: "🥳",
    },
    {
      mascot: "noe",
      title: "Une nouvelle cime atteinte 🏔️",
      body: "Niveau [X]. Comme la colombe qui trouve une terre ferme, ta progression montre que tu t'élèves. Continue !",
      emoji: "🕊️",
    },
    {
      mascot: "samson",
      title: "PLUS FORT CHAQUE JOUR ! 🔥",
      body: "Tu passes au niveau [X] ! Le diable commence à trembler quand il te voit te connecter le matin. Continue comme ça !",
      emoji: "💪",
    },
    {
      mascot: "esther",
      title: "Une marche de plus vers le trône 💎",
      body: "Le niveau [X] te sied à ravir. C'est un honneur de voir ta constance récompensée par une telle élévation.",
      emoji: "👸",
    },
    {
      mascot: "manny",
      title: "Une belle maturité... 🌟",
      body: "Le niveau [X] témoigne de tes heures passées dans la présence de Dieu. Je suis touché de ton sérieux.",
      emoji: "🕯️",
    },
  ],
  badge_earned: [
    {
      mascot: "manny",
      title: "Un nouveau badge pour toi ! 🏅",
      body: "Regarde, [name] ! Tu as obtenu le badge « [X] ». Ton engagement porte de beaux fruits.",
      emoji: "🎁",
    },
    {
      mascot: "samson",
      title: "TROPHÉE DANS LA POCHE ! 🏆",
      body: "NOUVELLE DÉCORATION MILITAIRE ! Tu as débloqué le badge « [X] » ! Une preuve de plus de ta force !",
      emoji: "🔥",
    },
    {
      mascot: "esther",
      title: "Une distinction impériale 💎",
      body: "Tu as mérité le badge « [X] », [name]. Une décoration raffinée qui s'ajoute à ta collection royale.",
      emoji: "👑",
    },
    {
      mascot: "gedeon",
      title: "UN BADGE !!! TROP BIEN ! 🎉",
      body: "Incroyable, tu as décroché le badge « [X] » ! Je ne pensais pas que c'était possible si vite. Félicitations !",
      emoji: "🥳",
    },
    {
      mascot: "noe",
      title: "Une marque sur ton parcours 🪵",
      body: "Le badge « [X] » est désormais gravé sur ton profil. Une preuve durable de ta persévérance sur l'arche.",
      emoji: "⚓",
    },
    {
      mascot: "esther",
      title: "Un bijou à ta couronne 💍",
      body: "Le badge « [X] » témoigne de ton élégance et de ta discipline spirituelle. Tu le portes à merveille.",
      emoji: "✨",
    },
    {
      mascot: "samson",
      title: "UN DE PLUS DANS LA COLLECTION ! 💪",
      body: "Le badge « [X] » est à toi ! Tu as combattu le bon combat pour l'avoir. Ne t'arrête pas là !",
      emoji: "⚡",
    },
    {
      mascot: "manny",
      title: "Une douce récompense 🌱",
      body: "Tu as obtenu le badge « [X] ». Que ce symbole te rappelle toujours la joie d'étudier la Parole.",
      emoji: "🕊️",
    },
  ],
  comeback: [
    {
      mascot: "manny",
      title: "Tu m'as manqué... 🥺",
      body: "Cela fait 2 jours que je ne t'ai pas vu, [name]. L'application est un peu vide sans toi. Viens méditer avec moi.",
      emoji: "😢",
    },
    {
      mascot: "samson",
      title: "RETOUR AU BERCAIL ! 🥊",
      body: "2 jours sans entraînement ? Tu relâches tes muscles spirituels ! Reconnecte-toi et montre-moi que tu n'es pas ramolli !",
      emoji: "💥",
    },
    {
      mascot: "esther",
      title: "Une absence remarquée 💅",
      body: "Déserter la cour pendant 48 heures ? Quelle désinvolture, [name]. Ton trône t'attend, daigne y faire ton apparition.",
      emoji: "👑",
    },
    {
      mascot: "gedeon",
      title: "J'AI CRU QUE TU AVAIS ABANDONNÉ ! 😭",
      body: "Plus de 2 jours sans nouvelles ! J'ai paniqué ! S'il te plaît, dis-moi que tu vas bien et viens lire un verset !",
      emoji: "🆘",
    },
    {
      mascot: "noe",
      title: "Où étais-tu passé ? 🌊",
      body: "L'arche a continué sa route sans toi pendant 2 jours. Reviens à bord avant que le courant ne t'éloigne trop.",
      emoji: "🚢",
    },
    {
      mascot: "manny",
      title: "Toujours là pour toi 🌱",
      body: "Peu importe ton absence, Dieu t'attend les bras ouverts. Faisons un pas vers Lui ensemble aujourd'hui.",
      emoji: "🕊️",
    },
    {
      mascot: "samson",
      title: "FINI LES VACANCES ! 🔥",
      body: "Tu as séché 2 jours de méditation ! Viens compenser cette perte d'XP avec une session intensive immédiate !",
      emoji: "🏋️‍♂️",
    },
    {
      mascot: "esther",
      title: "Le retour de l'enfant prodige ✨",
      body: "Il est temps de reprendre de bonnes manières, [name]. Laisse de côté tes distractions mondaines et viens méditer.",
      emoji: "👸",
    },
  ],
};

export function getRandomNotification(
  situation: keyof typeof NOTIFICATION_MESSAGES,
  userName: string,
  streakOrLevelOrBadge?: string | number
): NotificationMessage {
  const messages = NOTIFICATION_MESSAGES[situation];
  if (!messages || messages.length === 0) {
    return {
      mascot: "manny",
      title: "Rappel quotidien 📖",
      body: "Prends un moment pour méditer la Parole de Dieu aujourd'hui.",
      emoji: "🌱",
    };
  }

  const randomIndex = Math.floor(Math.random() * messages.length);
  const selected = messages[randomIndex];

  const name = userName || "Ami";
  const replacement = streakOrLevelOrBadge !== undefined ? String(streakOrLevelOrBadge) : "0";

  const formatText = (text: string) => {
    return text.replace(/\[name\]/g, name).replace(/\[X\]/g, replacement);
  };

  return {
    mascot: selected.mascot,
    title: formatText(selected.title),
    body: formatText(selected.body),
    emoji: selected.emoji,
  };
}
