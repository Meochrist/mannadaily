export interface NotificationMessage {
  mascot: "manny" | "samson" | "esther" | "gedeon" | "noe";
  title: string;
  body: string;
  emoji: string;
}

export const NOTIFICATION_MESSAGES: Record<string, NotificationMessage[]> = {
  // === MATIN (5h-11h) — Amical, encourageant ===
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

  // === MIDI (11h-14h) — Inquiet, pressant ===
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

  // === APRÈS-MIDI (14h-18h) — Triste, déçu ===
  afternoon: [
    {
      mascot: "manny",
      title: "Je t'attends depuis ce matin... 😢",
      body: "[name], la Parole est là, prête à te parler. Mais toi, tu es où ? Je commence à m'inquiéter.",
      emoji: "😢",
    },
    {
      mascot: "samson",
      title: "TON STREAK FOND COMME NEIGE ❄️",
      body: "Chaque heure sans méditation est un jour de perdu. Tu laisses la victoire t'échapper, [name] !",
      emoji: "💔",
    },
    {
      mascot: "esther",
      title: "Une reine ne traîne pas... 👑",
      body: "L'après-midi avance et ton trône est vide. La cour céleste te regarde. Fais ton apparition, [name].",
      emoji: "⏰",
    },
    {
      mascot: "gedeon",
      title: "LA PRESSION MONTE ! 😤",
      body: "Tu n'es pas protégé ! L'ennemi rit dans son coin parce qu'il sait que tu n'as pas médité. Ne lui donne pas cette joie !",
      emoji: "😤",
    },
    {
      mascot: "noe",
      title: "Le ciel s'assombrit... ⛈️",
      body: "Les nuages s'accumulent au-dessus de ta tête. Tu as l'abri de la Parole mais tu restes dehors sous la pluie.",
      emoji: "⛈️",
    },
    {
      mascot: "manny",
      title: "Un petit effort, s'il te plaît ? 🥺",
      body: "Je ne demande pas grand-chose. Juste 10 minutes avec Dieu. Tu peux bien ça pour moi, [name] ?",
      emoji: "🙏",
    },
    {
      mascot: "samson",
      title: "TU ME DÉÇOIS. 😠",
      body: "Je croyais en toi. Je croyais que tu étais un guerrier. Mais tu laisses le temps passer sans rien faire.",
      emoji: "😠",
    },
    {
      mascot: "esther",
      title: "L'heure tourne... ⏳",
      body: "Chaque minute sans méditation est une minute volée à ta destinée. Lève-toi, [name], et viens prier.",
      emoji: "⏳",
    },
  ],

  // === SOIR (18h-22h) — Désespéré, paniqué ===
  evening: [
    {
      mascot: "manny",
      title: "Ton cœur est lourd ce soir... 😭",
      body: "Le soir tombe et tu n'as pas médité. Je ne suis pas en colère, [name]... je suis triste. Viens te réconforter dans la Parole.",
      emoji: "😭",
    },
    {
      mascot: "samson",
      title: "C'EST LA HONTE ! 💀",
      body: "UNE JOURNÉE SANS MÉDITER. Zéro. Nada. Tu as gaspillé 24 heures. Tu vas te coucher vide, [name] !",
      emoji: "💀",
    },
    {
      mascot: "esther",
      title: "Une journée gâchée... 🎭",
      body: "Tu as eu 24 heures pour glorifier Dieu et tu n'as pas trouvé 10 minutes. Quel gâchis, [name].",
      emoji: "🎭",
    },
    {
      mascot: "gedeon",
      title: "JE STRESSE POUR TOI ! 😱",
      body: "MINUIT APPROCHE ! Tu vas te coucher sans la Parole ! Comment vas-tu dormir ?! MÉDITE MAINTENANT !",
      emoji: "😱",
    },
    {
      mascot: "noe",
      title: "Le déluge est là... 🌊",
      body: "Tu as ignoré l'arche toute la journée. L'eau monte. Il reste peu de temps. Monte à bord, [name] !",
      emoji: "🌊",
    },
    {
      mascot: "manny",
      title: "Il n'est pas trop tard... 🌙",
      body: "Même à cette heure, Dieu t'attend. Un seul verset. Une seule prière. C'est tout ce qu'il te faut.",
      emoji: "🌙",
    },
    {
      mascot: "samson",
      title: "DERNIER APPEL ! 🚨",
      body: "AVANT MINUIT. C'EST TOI OU LE STREAK ZÉRO. Choisis ton camp, [name] !",
      emoji: "🚨",
    },
    {
      mascot: "esther",
      title: "Le crépuscule de ta série... 🌆",
      body: "Ton streak de [X] jours va mourir ce soir si tu n'agis pas. Ne laisse pas la nuit emporter tes efforts.",
      emoji: "🌆",
    },
  ],

  // === URGENT (22h+) — Paniqué, menaçant ===
  urgent: [
    {
      mascot: "manny",
      title: "IL RESTE 2 HEURES ! 😭",
      body: "Ton streak va EXPIRER ! [name], ne laisse pas tes efforts s'effacer... MÉDITE MAINTENANT !",
      emoji: "⏰",
    },
    {
      mascot: "samson",
      title: "CATASTROPHE IMMINENTE ! 💥",
      body: "TON STREAK DE [X] JOURS VA SE BRISER ! TU AS MOINS DE 2 HEURES ! LÈVE-TOI ET MÉDITE !",
      emoji: "💥",
    },
    {
      mascot: "esther",
      title: "MINUIT APPROCHE ! 👑",
      body: "La cour céleste te regarde. Ta série de [X] jours va s'éteindre. Agis en reine, [name] !",
      emoji: "👑",
    },
    {
      mascot: "gedeon",
      title: "C'EST LA FIN !!! 😱",
      body: "PLUS QU'UNE HEURE ! TON STREAK EST CONDAMNÉ ! SI TU NE MÉDITES PAS, TOUT EST PERDU !",
      emoji: "🔥",
    },
    {
      mascot: "noe",
      title: "LA PORTE SE FERME ! 🚢",
      body: "LA RAMPE DE L'ARCHE SE FERME À MINUIT ! MONTE À BORD OU NOIE DANS TES REGRETS !",
      emoji: "🚢",
    },
    {
      mascot: "manny",
      title: "Je crois en toi... 🥺",
      body: "Même dans la panique, je crois que tu peux le faire. Un dernier effort, [name]. Pour toi. Pour Dieu.",
      emoji: "🥺",
    },
    {
      mascot: "samson",
      title: "PAS MAINTENANT ! PAS COMME ÇA ! 😤",
      body: "TU NE PEUX PAS PERDRE MAINTENANT ! PAS APRÈS [X] JOURS ! BATS-TOI JUSQU'AU BOUT !",
      emoji: "😤",
    },
    {
      mascot: "esther",
      title: "Le trône s'effondre... 💔",
      body: "Ton règne de [X] jours touche à sa fin. Ne laisse pas la nuit détruire ton héritage, [name].",
      emoji: "💔",
    },
  ],

  // === 1 JOUR SANS MÉDITER — Encouragement ===
  missed_1_day: [
    {
      mascot: "manny",
      title: "Tu m'as manqué hier... 🥺",
      body: "Cela fait 1 jour que je ne t'ai pas vu, [name]. Ce n'est pas grave, on recommence ensemble aujourd'hui ?",
      emoji: "😢",
    },
    {
      mascot: "samson",
      title: "UN JOUR DE PERDU ! 🥊",
      body: "1 jour sans méditation. Tu as glissé, [name]. Mais un guerrier ne reste pas au sol. Relève-toi !",
      emoji: "🥊",
    },
    {
      mascot: "esther",
      title: "Une journée d'absence 👑",
      body: "Tu as manqué hier, [name]. Un oubli, ça arrive. Mais aujourd'hui, tu peux rattraper ça.",
      emoji: "👑",
    },
    {
      mascot: "gedeon",
      title: "J'AI EU PEUR POUR TOI ! 😰",
      body: "Hier tu n'es pas venu ! J'ai cru que tu avais abandonné ! S'il te plaît, reviens aujourd'hui !",
      emoji: "😰",
    },
    {
      mascot: "noe",
      title: "L'arche a navigué sans toi 🚢",
      body: "1 jour sans toi. Le courant continue. Mais tu peux remonter à bord, [name].",
      emoji: "🚢",
    },
    {
      mascot: "manny",
      title: "Dieu t'attend les bras ouverts 🤗",
      body: "Hier est passé, [name]. Aujourd'hui est un nouveau commencement. Viens méditer avec moi.",
      emoji: "🤗",
    },
    {
      mascot: "samson",
      title: "ON RECOMMENCE ! 💪",
      body: "1 jour de perdu ? Ce n'est rien. On repart de plus fort aujourd'hui. Montre-moi ce que tu vaux !",
      emoji: "💪",
    },
    {
      mascot: "esther",
      title: "Une nouvelle chance ✨",
      body: "Hier tu as manqué, mais aujourd'hui tu as une nouvelle occasion. Saisis-la, [name].",
      emoji: "✨",
    },
  ],

  // === 2 JOURS SANS MÉDITER — Inquiet ===
  missed_2_days: [
    {
      mascot: "manny",
      title: "Ça fait 2 jours... 😟",
      body: "Deux jours sans te voir, [name]. Je commence à m'inquiéter. Est-ce que tu vas bien ?",
      emoji: "😟",
    },
    {
      mascot: "samson",
      title: "DEUX JOURS SANS RIEN ! 😠",
      body: "48 HEURES SANS MÉDITER. Tu relâches tout, [name] ! Ton streak est en danger !",
      emoji: "😠",
    },
    {
      mascot: "esther",
      title: "Une absence prolongée 💅",
      body: "2 jours sans apparaître à la cour ? Les autres membres parlent. Reviens, [name].",
      emoji: "💅",
    },
    {
      mascot: "gedeon",
      title: "POURQUOI TU AS DISPARU ?! 😭",
      body: "DEUX JOURS ! J'AI PANIQUÉ ! Tu es parti sans dire au revoir ! Reviens, je t'en prie !",
      emoji: "😭",
    },
    {
      mascot: "noe",
      title: "Le courant t'éloigne... 🌊",
      body: "2 jours sans toi. Le courant spirituel t'éloigne du port. Reviens avant d'être trop loin.",
      emoji: "🌊",
    },
    {
      mascot: "manny",
      title: "Je crois en toi malgré tout 🌱",
      body: "Même si tu as raté 2 jours, [name], je crois que tu peux recommencer. Un pas à la fois.",
      emoji: "🌱",
    },
    {
      mascot: "samson",
      title: "CE N'EST PAS FINI ! 🔥",
      body: "2 jours de perdus ? Tu peux encore rattraper ! Mais ne attends pas un 3ème jour !",
      emoji: "🔥",
    },
    {
      mascot: "esther",
      title: "Le trône se refroidit... ❄️",
      body: "2 jours d'absence et ton trône se refroidit. Viens le réchauffer, [name].",
      emoji: "❄️",
    },
  ],

  // === 3+ JOURS SANS MÉDITER — Panique totale ===
  missed_3_plus_days: [
    {
      mascot: "manny",
      title: "Ça fait 3 jours que tu n'es pas venu... 😭",
      body: "Je t'attends, [name]. Chaque jour sans toi est un jour où la Parole te manque. Reviens.",
      emoji: "😭",
    },
    {
      mascot: "samson",
      title: "TROIS JOURS ! TON STREAK EST MORT ! 💀",
      body: "3 JOURS SANS MÉDITER. TON STREAK EST ZÉRO. TU AS TOUT DÉTRUIT. RECOMMENCE MAINTENANT !",
      emoji: "💀",
    },
    {
      mascot: "esther",
      title: "Le royaume t'a oublié... 👑",
      body: "3 jours d'absence. La cour a tourné la page. Veux-tu reconquérir ton trône, [name] ?",
      emoji: "👑",
    },
    {
      mascot: "gedeon",
      title: "J'AI PERDU ESPOIR... 😢",
      body: "3 jours sans toi. Je ne sais plus quoi faire. Reviens, [name]. S'il te plaît.",
      emoji: "😢",
    },
    {
      mascot: "noe",
      title: "L'arche a coulé... 🌊",
      body: "3 jours sans toi. L'arche a sombré. Mais tu peux en construire une nouvelle, [name].",
      emoji: "🌊",
    },
    {
      mascot: "manny",
      title: "Même dans la panique, je crois en toi 🥺",
      body: "Tu as raté 3 jours, [name]. Mais je crois que tu peux recommencer. Un verset. Une prière. C'est tout.",
      emoji: "🥺",
    },
    {
      mascot: "samson",
      title: "IL EST TEMPS DE SE BATTRE ! ⚔️",
      body: "3 JOURS DE PERDUS. ASSEZ. C'est l'heure de reprendre le combat. Viens regagner ton XP !",
      emoji: "⚔️",
    },
    {
      mascot: "esther",
      title: "La couronne est par terre... 💎",
      body: "3 jours d'absence et ta couronne est tombée. Relève-la, [name]. Elle t'appartient encore.",
      emoji: "💎",
    },
  ],

  // === STREAK BRISÉ — Choc, déception ===
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

  // === COMEBACK — Retour après absence ===
  comeback: [
    {
      mascot: "manny",
      title: "TU ES DE RETOUR ! 🎉",
      body: "Je t'ai tellement manqué, [name] ! Bienvenue parmi nous. La Parole est heureuse de te revoir !",
      emoji: "🎉",
    },
    {
      mascot: "samson",
      title: "LE GUERRIER EST DE RETOUR ! ⚡",
      body: "ENFIN ! Tu as disparu mais tu es revenu. C'est l'esprit d'un vrai champion. Continue comme ça !",
      emoji: "⚡",
    },
    {
      mascot: "esther",
      title: "Le retour de la reine 👑",
      body: "Tu as pris le temps de revenir, [name]. C'est la marque des grands. Bienvenue à la cour !",
      emoji: "👑",
    },
    {
      mascot: "gedeon",
      title: "JE SUIS SOULAGÉ ! 😭",
      body: "TU ES LÀ ! J'avais tellement peur que tu ne reviennes plus ! Merci d'être là, [name] !",
      emoji: "😭",
    },
    {
      mascot: "noe",
      title: "L'arche a retrouvé son capitaine 🚢",
      body: "Tu es de retour, [name]. L'arche reprend sa route. Ensemble, naviguons vers Dieu !",
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
      body: "Tu as séché mais tu es revenu. Viens compenser cette perte d'XP avec une session intensive !",
      emoji: "🏋️‍♂️",
    },
    {
      mascot: "esther",
      title: "Le retour de l'enfant prodige ✨",
      body: "Il est temps de reprendre de bonnes manières, [name]. Laisse de côté tes distractions et viens méditer.",
      emoji: "👸",
    },
  ],

  // === MILESTONES ===
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

  reading_plan_reminder: [
    {
      mascot: "noe",
      title: "Les plans de l'arche 🚢",
      body: "Tu as oublié ta lecture du jour ! J'ai bien lu tous mes plans de construction de l'arche. Chapitre [X] t'attend !",
      emoji: "🚢",
    },
    {
      mascot: "manny",
      title: "Ton plan de lecture t'attend 🌱",
      body: "Tes [chapitres] du jour ne se liront pas tout seuls... Je t'attends dans [Livre] [Chapitre] !",
      emoji: "📖",
    },
    {
      mascot: "samson",
      title: "DISCIPLINE MAXIMALE ⚡",
      body: "PLAN DE LECTURE. PAS DE SKIP. [chapitres] aujourd'hui. On y va !",
      emoji: "🔥",
    },
    {
      mascot: "esther",
      title: "Une habitude royale 👑",
      body: "Un héritier du Royaume suit son plan de lecture. [chapitres] t'attendent aujourd'hui.",
      emoji: "✨",
    },
    {
      mascot: "gedeon",
      title: "ALERTE PLAN DE LECTURE ! 🚨",
      body: "OH NON ! Le plan de lecture ! Sans cette lecture tu vas prendre des décisions sans la sagesse de ce passage ! Vite !",
      emoji: "😱",
    },
  ],

  reading_plan_milestone: [
    {
      mascot: "manny",
      title: "Jalon atteint ! 🎉",
      body: "Félicitations [name] ! Tu as atteint un jalon de [X] jours consécutifs sur ton plan de lecture ! Dieu est fidèle.",
      emoji: "🥳",
    },
    {
      mascot: "samson",
      title: "FORCE DE FER ! 💪",
      body: "[X] JOURS DE LECTURE ININTERROMPUE ! Tu es une véritable machine de guerre spirituelle ! Continue à détruire tes limites !",
      emoji: "🏆",
    },
    {
      mascot: "esther",
      title: "Une constance impériale 👑",
      body: "Une constance couronnée de succès ! Atteindre [X] jours sur ton plan montre une noblesse d'esprit admirable.",
      emoji: "✨",
    },
    {
      mascot: "noe",
      title: "Navigation tranquille ⚓",
      body: "[X] jours à tenir le cap. Même pendant la tempête, tu n'as pas lâché le gouvernail de la Parole. Bravo.",
      emoji: "⚓",
    },
    {
      mascot: "gedeon",
      title: "C'EST EXTRAORDINAIRE ! 🥳",
      body: "Incroyable ! [X] jours consécutifs ! Au début j'avais peur qu'on ne tienne pas, mais tu l'as fait ! C'est magique !",
      emoji: "🎉",
    },
  ],

  reading_plan_complete: [
    {
      mascot: "manny",
      title: "Victoire spirituelle ! 💖",
      body: "Quel honneur d'avoir fini ce plan de lecture avec toi, [name] ! Tu as terminé le plan [X] ! Gloire à Dieu.",
      emoji: "💖",
    },
    {
      mascot: "samson",
      title: "OBJECTIF ATTEINT ! 🥇",
      body: "PLAN [X] COMPLÈTEMENT DÉTRUIT ! 100% accompli ! Tu as combattu et tu as triomphé ! Quel exploit !",
      emoji: "🥇",
    },
    {
      mascot: "esther",
      title: "Accomplissement royal ✨",
      body: "Le plan [X] est achevé. Tu as parcouru ce chemin avec grâce et dévotion. Le Roi est fier de toi.",
      emoji: "👑",
    },
    {
      mascot: "noe",
      title: "Terre ferme en vue ! 🕊️",
      body: "La colombe est revenue avec un rameau d'olivier ! Tu as fini le plan [X]. La terre ferme de la sagesse est à toi.",
      emoji: "🕊️",
    },
    {
      mascot: "gedeon",
      title: "BRAVO BRAVO BRAVO ! 🎉",
      body: "TU AS FINI LE PLAN [X] !!! C'est extraordinaire ! J'en ai les larmes aux yeux ! Quelle persévérance !",
      emoji: "🥳",
    },
  ],
};

/**
 * Personalized notification messages by mascot, hour, and progression.
 * Each mascot has 5 message tiers: 0 session, 1 session, 2 sessions, 3 sessions, streak danger.
 */
const PERSONALIZED_MESSAGES: Record<string, { title: string; body: string; emoji: string }> = {
  // === ABRAHAM — Morning (5h-11h) — Père encourageant ===
  "abraham_0": { title: "🌅 Un nouveau jour t'attend", body: "[name], le soleil se lève ! La Parole de Dieu t'attend. Prends 5 minutes pour L'écouter. 📖", emoji: "📖" },
  "abraham_1": { title: "🌅 Bien débuté !", body: "Bien, [name] ! Une mini-session de faite. Continue à marcher avec Dieu aujourd'hui.", emoji: "🌅" },
  "abraham_2": { title: "💪 Presque au sommet !", body: "[name], une dernière mini-session et ta journée sera complète. Dieu t'attend.", emoji: "🏔️" },
  "abraham_3": { title: "🎉 Journée bénie !", body: "🎉 [name], ta journée est remplie de la Parole ! Que Dieu te bénisse abondamment.", emoji: "🙌" },
  "abraham_streak": { title: "🔥 Ta flamme vacille !", body: "[name], ta flamme de [X] jours est sur le point de s'éteindre ! Ouvre l'app maintenant !", emoji: "🔥" },

  // === GÉDÉON — Midday (11h-14h) — Guerrier déterminé ===
  "gedeon_0": { title: "⚔️ Il est déjà midi !", body: "[name] ! Il est midi et tu n'as pas encore médité. Le Seigneur est avec toi, lève-toi !", emoji: "⚔️" },
  "gedeon_1": { title: "🛡️ Belle progression !", body: "[name], le Seigneur combat pour toi. Continue ta méditation. Une mini-session de faite !", emoji: "🛡️" },
  "gedeon_2": { title: "🏆 La victoire est proche !", body: "[name], une dernière mini-session et tu auras vaincu. Termine le combat !", emoji: "🏆" },
  "gedeon_3": { title: "✝️ Victoire totale !", body: "🎉 [name], tu as vaincu ! Ta journée est scellée dans la Parole. Gloire à Dieu !", emoji: "✝️" },
  "gedeon_streak": { title: "⚔️ Ton épée s'émousse !", body: "[name], ton streak de [X] jours est menacé ! Sauve-le maintenant !", emoji: "⚔️🔥" },

  // === ESTHER — Afternoon (14h-18h) — Reine stratégique ===
  "esther_0": { title: "👑 Pour un temps comme celui-ci", body: "[name], c'est pour un temps comme celui-ci que tu es appelé à méditer. N'attends pas !", emoji: "👑" },
  "esther_1": { title: "🌟 Fidélité remarquable", body: "Bien joué, [name] ! Ta fidélité à la Parole est remarquable. Continue.", emoji: "🌟" },
  "esther_2": { title: "🕊️ La délivrance est proche", body: "[name], une dernière mini-session et tu seras libre. Termine ta course !", emoji: "🕊️" },
  "esther_3": { title: "✨ Destinée accomplie !", body: "🎉 [name], tu as accompli ta destinée du jour ! Que Dieu soit glorifié !", emoji: "✨" },
  "esther_streak": { title: "👑 Ta couronne est en danger !", body: "[name], ta couronne de [X] jours vacille ! Sauve ton streak maintenant !", emoji: "👑🔥" },

  // === NOÉ — Evening (18h-22h) — Sage patient ===
  "noe_0": { title: "🌙 Le soir tombe", body: "[name], le soir approche. Prends un moment pour te recentrer sur la Parole avant la nuit.", emoji: "🌙" },
  "noe_1": { title: "🌈 Belle méditation !", body: "[name], une session de faite. La pluie s'arrête et le soleil revient. Continue.", emoji: "🌈" },
  "noe_2": { title: "🕊️ Presque arrivé !", body: "[name], une dernière mini-session et tu pourras te reposer en paix. Dieu veille.", emoji: "🕊️" },
  "noe_3": { title: "🌙✨ Paix complète", body: "🎉 [name], ta journée est complète ! Repose-toi en paix, Dieu veille sur toi.", emoji: "🌙✨" },
  "noe_streak": { title: "🌊 L'arche s'éloigne !", body: "[name], ton streak de [X] jours va couler ! Sauve-le avant qu'il ne soit trop tard !", emoji: "🌊🔥" },

  // === MANNY — Urgent (22h+) — Paniqué ===
  "manny_urgent_0": { title: "⏰ IL RESTE 2 HEURES !", body: "[name], ton streak va EXPIRER ! MÉDITE MAINTENANT !", emoji: "⏰" },
  "manny_urgent_1": { title: "😭 Je crois en toi...", body: "Même dans la panique, je crois que tu peux le faire. Un dernier effort, [name].", emoji: "🥺" },
  "manny_urgent_streak": { title: "💔 Ton streak va mourir !", body: "[name], ta série de [X] jours va s'éteindre ! SAUVE-LA !", emoji: "💔" },

  // === SAMSON — Urgent (22h+) — En colère ===
  "samson_urgent_0": { title: "💥 CATASTROPHE IMMINENTE !", body: "TON STREAK DE [X] JOURS VA SE BRISER ! LÈVE-TOI ET MÉDITE !", emoji: "💥" },
  "samson_urgent_1": { title: "😤 PAS MAINTENANT !", body: "TU NE PEUX PAS PERDRE MAINTENANT ! PAS APRÈS [X] JOURS ! BATS-TOI !", emoji: "😤" },
  "samson_urgent_streak": { title: "💀 STREAK EN DANGER !", body: "IL RESTE MOINS DE 3 HEURES ! COMPLÈTE TA JOURNÉE !", emoji: "💀" },

  // === GÉDÉON — Urgent (22h+) — Paniqué ===
  "gedeon_urgent_0": { title: "😱 C'EST LA FIN !!!", body: "PLUS QU'UNE HEURE ! TON STREAK EST CONDAMNÉ ! MÉDITE OU TOUT EST PERDU !", emoji: "😱" },
  "gedeon_urgent_1": { title: "🔥 MINUIT APPROCHE !", body: "J'AI PEUR POUR TOI ! TA SÉRIE DE [X] JOURS VA MOURIR CE SOIR !", emoji: "🔥" },
  "gedeon_urgent_streak": { title: "🚨 URGENCE MAXIMALE !", body: "SI TU NE MÉDITES PAS DANS L'HEURE, TON STREAK EST MORT !", emoji: "🚨" },

  // === ESTHER — Urgent (22h+) — Désespéré ===
  "esther_urgent_0": { title: "👑 MINUIT APPROCHE !", body: "La cour céleste te regarde. Ta série de [X] jours va s'éteindre. Agis, [name] !", emoji: "👑" },
  "esther_urgent_1": { title: "💔 Le trône s'effondre...", body: "Ton règne de [X] jours touche à sa fin. Ne laisse pas la nuit détruire ton héritage.", emoji: "💔" },
  "esther_urgent_streak": { title: "🌆 Le crépuscule de ta série", body: "Ton streak va mourir ce soir si tu n'agis pas. Ne laisse pas la nuit emporter tes efforts.", emoji: "🌆" },

  // === NOÉ — Urgent (22h+) — Sage paniqué ===
  "noe_urgent_0": { title: "🚢 LA PORTE SE FERME !", body: "LA RAMPE DE L'ARCHE SE FERME À MINUIT ! MONTE À BORD OU NOIE DANS TES REGRETS !", emoji: "🚢" },
  "noe_urgent_1": { title: "🌊 Le déluge est là...", body: "Tu as ignoré l'arche toute la journée. L'eau monte. Il reste peu de temps.", emoji: "🌊" },
  "noe_urgent_streak": { title: "⏳ L'heure est grave", body: "Ton streak de [X] jours va couler. Sauve-le avant qu'il ne soit trop tard !", emoji: "⏳" },
};

/**
 * Maps the hour of day to a mascot personality.
 */
function getMascotForHour(hour: number): "abraham" | "gedeon" | "esther" | "noe" | "manny" | "samson" {
  if (hour >= 5 && hour < 11) return "abraham";
  if (hour >= 11 && hour < 14) return "gedeon";
  if (hour >= 14 && hour < 18) return "esther";
  if (hour >= 18 && hour < 22) return "noe";
  // Urgent (22h+) : rotation entre manny et samson
  return hour % 2 === 0 ? "manny" : "samson";
}

export function getRandomNotification(
  situation: keyof typeof NOTIFICATION_MESSAGES,
  userName: string,
  streakOrLevelOrBadge?: string | number,
  extraReplacements?: Record<string, string>,
  sessionsCompleted?: number
): NotificationMessage {
  const name = userName || "Ami";
  const streak = streakOrLevelOrBadge !== undefined ? String(streakOrLevelOrBadge) : "0";

  // Determine mascot based on current hour
  const hour = new Date().getHours();
  const mascot = getMascotForHour(hour);

  // Determine progression tier
  let tier: string;
  if (sessionsCompleted === 3) tier = "3";
  else if (sessionsCompleted === 2) tier = "2";
  else if (sessionsCompleted === 1) tier = "1";
  else if (extraReplacements?.streak_danger === "true") tier = "streak";
  else tier = "0";

  const key = `${mascot}_${tier}`;
  const msg = PERSONALIZED_MESSAGES[key];

  if (msg) {
    const format = (text: string) =>
      text.replace(/\[name\]/g, name).replace(/\[X\]/g, streak);
    return {
      mascot: mascot as any,
      title: format(msg.title),
      body: format(msg.body),
      emoji: msg.emoji,
    };
  }

  // Fallback to old system for backward compatibility
  const messages = NOTIFICATION_MESSAGES[situation];
  if (!messages || messages.length === 0) {
    return {
      mascot: "manny",
      title: "Rappel quotidien 📖",
      body: `${name}, prends un moment pour méditer la Parole de Dieu aujourd'hui.`,
      emoji: "🌱",
    };
  }

  const randomIndex = Math.floor(Math.random() * messages.length);
  const selected = messages[randomIndex];
  const formatText = (text: string) =>
    text.replace(/\[name\]/g, name).replace(/\[X\]/g, streak);

  return {
    mascot: selected.mascot,
    title: formatText(selected.title),
    body: formatText(selected.body),
    emoji: selected.emoji,
  };
}
