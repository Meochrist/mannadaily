import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Contexte historique et culturel statique par livre biblique
// Structure : données générales du livre + chapitres clés avec contexte spécifique
const BOOK_CONTEXT: Record<string, {
  author: string;
  period: string;
  historicalContext: string;
  culturalNotes: string;
  keyEvents: string;
  chapters?: Record<number, string>; // Contexte spécifique par chapitre
}> = {
  "Genèse": {
    author: "Moïse (traditionnellement)",
    period: "~1450-1400 av. J.-C.",
    historicalContext: "Le livre de la Genèse couvre la période de la Création jusqu'à la mort de Joseph en Égypte. Il retrace les origines de l'humanité, le déluge, la Tour de Babel, et l'histoire des patriarches Abraham, Isaac, Jacob et Joseph.",
    culturalNotes: "À l'époque patriarcale, la société était organisée en clans familiaux nomades. L'hospitalité était sacrée, les alliances scellées par des serments. La circoncision était le signe de l'alliance.",
    keyEvents: "Création, Chute, Déluge, Appel d'Abraham, Joseph en Égypte.",
    chapters: {
      1: "Récit de la Création en 7 jours — Dieu crée le ciel, la terre, la lumière, les êtres vivants et l'humanité à son image.",
      2: "Détail de la création de l'homme et de la femme, le jardin d'Éden, l'arbre de la connaissance du bien et du mal.",
      3: "La Chute : tentation du serpent, péché d'Adam et Ève, expulsion du jardin d'Éden.",
      12: "Appel d'Abram — Dieu promet une descendance, une terre et une bénédiction pour toutes les nations.",
      22: "Le sacrifice d'Isaac : mise à l'épreuve de la foi d'Abraham sur le mont Morija.",
    }
  },
  "Exode": {
    author: "Moïse (traditionnellement)",
    period: "~1450-1400 av. J.-C.",
    historicalContext: "L'Exode raconte la libération d'Israël de l'esclavage en Égypte sous le Nouvel Empire (18e-19e dynasties). Les Hébreux étaient une minorité asservie aux travaux de construction.",
    culturalNotes: "Les dix plaies visaient les divinités égyptiennes (Râ, Hâpi, Héqet). La Pâque est le rite fondateur d'Israël.",
    keyEvents: "Dix Plaies, Traversée de la Mer Rouge, Don de la Loi au Sinaï.",
    chapters: {
      3: "Le buisson ardent — Dieu révèle son nom (Je suis) à Moïse et l'envoie libérer Israël.",
      12: "Institution de la Pâque : l'agneau sacrifié, le sang sur les linteaux, la sortie d'Égypte.",
      20: "Les Dix Commandements donnés au mont Sinaï, fondement de l'alliance mosaïque.",
    }
  },
  "Psaumes": {
    author: "David (majorité), Asaph, Fils de Koré, Salomon, Moïse",
    period: "~1000-400 av. J.-C.",
    historicalContext: "Le livre des Psaumes est le recueil de cantiques d'Israël compilé sur plusieurs siècles, couvrant la monarchie, l'exil à Babylone (586 av. J.-C.) et le retour. Le temple de Jérusalem était le centre du culte.",
    culturalNotes: "Les psaumes étaient chantés avec instruments (lyre, harpe). Genres : louange, lamentation, action de grâce. Le parallélisme hébraïque est la technique poétique principale.",
    keyEvents: "Onction de David, Construction du Temple, Exil à Babylone.",
    chapters: {
      1: "Deux voies : le juste médite la Loi jour et nuit, l'impie est comme la paille emportée par le vent.",
      23: "Le Psaume du Berger — l'Éternel est mon berger, je ne manquerai de rien.",
      51: "Psaume de repentance de David après son péché avec Bath-Schéba — crée en moi un cœur pur.",
      119: "Le plus long psaume, entièrement consacré à la beauté et la puissance de la Parole de Dieu.",
    }
  },
  "Ésaïe": {
    author: "Ésaïe ben Amots",
    period: "~740-680 av. J.-C.",
    historicalContext: "Ésaïe prophétise sous les rois Ozias, Jotham, Achaz et Ézéchias. L'Assyrie domine le Proche-Orient. En 722, le Royaume du Nord tombe. Jérusalem est sauvée en 701.",
    culturalNotes: "Les prophètes hébreux étaient des porte-parole de Dieu, confrontés aux rois. Le Serviteur souffrant d'Ésaïe 53 est l'un des textes les plus commentés.",
    keyEvents: "Invasion assyrienne, Siège de Jérusalem, Ambassade babylonienne.",
    chapters: {
      6: "Vision et appel d'Ésaïe dans le temple — 'Me voici, envoie-moi'.",
      9: "Prophétie messianique : un enfant nous est né, le Prince de la paix.",
      53: "Le Serviteur souffrant — prophétie poignante sur les souffrances et la mort du Messie.",
    }
  },
  "Jérémie": {
    author: "Jérémie, fils de Hilkija",
    period: "~627-585 av. J.-C.",
    historicalContext: "Jérémie prophétise pendant les derniers jours de Juda, sous les rois Josias, Jojakim et Sédécias. Il assiste à la chute de Jérusalem en 586 av. J.-C. et à la déportation à Babylone.",
    culturalNotes: "Surnommé le 'prophète des lamentations', Jérémie utilise des actions symboliques (la ceinture de lin, la cruche brisée) pour illustrer ses prophéties.",
    keyEvents: "Réforme de Josias, Siège et chute de Jérusalem, Exil à Babylone.",
    chapters: {
      1: "Appel de Jérémie — 'Avant de te former dans le ventre de ta mère, je te connaissais'.",
      29: "Lettre aux exilés à Babylone — 'Car je connais les projets que j'ai formés sur vous'.",
    }
  },
  "Ézéchiel": {
    author: "Ézéchiel, prêtre et prophète",
    period: "~593-571 av. J.-C.",
    historicalContext: "Ézéchiel fait partie des premiers déportés à Babylone en 597 av. J.-C. Il prophétise depuis la terre d'exil, annonçant à la fois le jugement sur Jérusalem et sa restauration future.",
    culturalNotes: "Ézéchiel utilise des visions spectaculaires (les ossements desséchés, le char céleste), des actions symboliques et des allégories saisissantes.",
    keyEvents: "Vision du char de Dieu, Siège de Jérusalem, Vision du Temple futur.",
    chapters: {
      1: "Vision de la gloire de Dieu — le char céleste et les quatre êtres vivants.",
      37: "La vallée des ossements desséchés — prophétie de la restauration d'Israël.",
    }
  },
  "Daniel": {
    author: "Daniel",
    period: "~605-530 av. J.-C.",
    historicalContext: "Daniel est déporté à Babylone comme jeune noble. Il sert sous Nébucadnetsar, Belschatsar et Darius le Mède. Le livre couvre l'exil babylonien et l'avènement de l'Empire médo-perse.",
    culturalNotes: "Daniel et ses compagnons refusent de se souiller avec les mets du roi. Le livre alterne récits historiques et visions prophétiques apocalyptiques.",
    keyEvents: "Fosse aux lions, Statue de Nébucadnetsar, Vision des 70 semaines.",
    chapters: {
      1: "Daniel et ses amis refusent la nourriture du roi — fidélité en terre étrangère.",
      6: "Daniel dans la fosse aux lions — Dieu ferme la gueule des lions.",
    }
  },
  "Proverbes": {
    author: "Salomon (majorité), Agur, Lemuel",
    period: "~970-700 av. J.-C.",
    historicalContext: "Recueil de maximes de sagesse compilé sous la monarchie israélite. Les proverbes étaient destinés à former les jeunes à une vie sage, craignant Dieu, dans le cadre de l'alliance.",
    culturalNotes: "La sagesse en Israël était pratique : gérer sa maison, ses affaires, ses relations. Le parallélisme antithétique (contraste) est la figure de style dominante. La 'femme vertueuse' de Proverbes 31 est un modèle d'excellence.",
    keyEvents: "Règne de Salomon, Compilation par les gens d'Ézéchias.",
    chapters: {
      1: "Introduction — la crainte de l'Éternel est le commencement de la sagesse.",
      3: "Confie-toi en l'Éternel de tout ton cœur, ne t'appuie pas sur ta sagesse.",
      31: "La femme vertueuse — éloge alphabétique de la femme qui craint l'Éternel.",
    }
  },
  "Ecclésiaste": {
    author: "Salomon (traditionnellement) / Qohéleth",
    period: "~935 av. J.-C.",
    historicalContext: "Méditation philosophique sur le sens de la vie par un roi vieillissant. 'Vanité des vanités' reflète une quête existentielle universelle dans une culture où la sagesse humaine montre ses limites.",
    culturalNotes: "Qohéleth (l'Ecclésiaste) observe la vie 'sous le soleil' — sans perspective céleste. Le livre oscille entre pessimisme et foi. La conclusion : crains Dieu et garde ses commandements.",
    keyEvents: "Règne de Salomon, Quête du sens de la vie.",
  },
  "Job": {
    author: "Anonyme (peut-être Job, Moïse ou Élihu)",
    period: "~2000-500 av. J.-C. (patriarcal)",
    historicalContext: "L'histoire de Job, homme intègre d'Ous (région d'Édom), confronté à une souffrance extrême. Le livre explore la question de la justice divine face au mal et à la souffrance innocente.",
    culturalNotes: "Les amis de Job représentent la sagesse conventionnelle de l'époque : la souffrance serait toujours la conséquence du péché. Le livre est un chef-d'œuvre poétique avec un prologue et épilogue en prose.",
    keyEvents: "Épreuves de Job, Discours des amis, Théophanie finale.",
  },
  "Deutéronome": {
    author: "Moïse (traditionnellement)",
    period: "~1400 av. J.-C.",
    historicalContext: "Dernier discours de Moïse aux portes de Canaan. Israël est sur le point d'entrer dans la Terre Promise. Le livre rappelle l'alliance et la Loi, avec bénédictions et malédictions.",
    culturalNotes: "Deutéronome signifie 'seconde loi'. Le Shema Israël (Deut. 6:4) est la confession de foi fondamentale du judaïsme. Le livre suit le modèle des traités de vassalité hittites.",
    keyEvents: "Discours d'adieu de Moïse, Renouvellement de l'alliance, Mort de Moïse.",
    chapters: {
      6: "Shema Israël — Écoute Israël, l'Éternel notre Dieu est le seul Éternel.",
      28: "Bénédictions et malédictions de l'alliance.",
    }
  },
  "Josué": {
    author: "Josué (traditionnellement)",
    period: "~1400-1375 av. J.-C.",
    historicalContext: "Conquête et partage de Canaan sous Josué. Après 40 ans dans le désert, Israël traverse le Jourdain. Les cités-États cananéennes tombent une à une.",
    culturalNotes: "La guerre sainte (hérem) était une pratique de l'époque où tout était consacré à Dieu. Jéricho est la plus ancienne ville fortifiée connue. Rahab laprostituée est sauvée par sa foi.",
    keyEvents: "Traversée du Jourdain, Chute de Jéricho, Conquête et partage du pays.",
  },
  "Juges": {
    author: "Samuel (traditionnellement)",
    period: "~1375-1050 av. J.-C.",
    historicalContext: "Période obscure entre Josué et les rois. Israël oscille entre idolâtrie, oppression par des peuples voisins, repentance et délivrance par des juges temporaires.",
    culturalNotes: "Le cycle répété : péché → oppression → repentance → délivrance. 'Chacun faisait ce qui lui semblait bon' résume l'anarchie spirituelle de cette époque.",
    keyEvents: "Cycle des Juges, Victoires de Débora/Barak, Gédéon, Samson.",
  },
  "Ruth": {
    author: "Samuel (traditionnellement)",
    period: "~1150 av. J.-C.",
    historicalContext: "Pendant le temps des Juges, une famille de Bethléhem émigre à Moab à cause d'une famine. L'histoire de loyauté de Ruth la Moabite envers sa belle-mère Naomi illustre la rédemption.",
    culturalNotes: "Le droit du rachat (goël) permettait à un parent de racheter la terre et d'épouser la veuve pour perpétuer le nom du défunt. Boaz incarne le goël.",
    keyEvents: "Loyauté de Ruth, Rachat par Boaz, Généalogie de David.",
  },
  "1 Samuel": {
    author: "Samuel, Nathan, Gad",
    period: "~1050-1010 av. J.-C.",
    historicalContext: "Transition d'Israël des Juges à la monarchie. Naissance de Samuel, premier roi Saül, onction de David. Les Philistins sont la menace principale.",
    culturalNotes: "L'Arche de l'Alliance était le trône visible de Dieu. Le prophète Samuel est le dernier des Juges et établit l'onction royale. David et Goliath est l'un des récits les plus célèbres de la Bible.",
    keyEvents: "Naissance de Samuel, Règne de Saül, David et Goliath, Fuite de David.",
  },
  "2 Samuel": {
    author: "Nathan, Gad",
    period: "~1010-970 av. J.-C.",
    historicalContext: "Règne de David sur Juda puis tout Israël. Conquête de Jérusalem, transfert de l'Arche, alliance davidique. Puis chute : adultère avec Bath-Schéba, révolte d'Absalom.",
    culturalNotes: "Jérusalem devient la capitale politique et religieuse. L'alliance davidique promet un trône éternel à la descendance de David — annonce messianique.",
    keyEvents: "Règne de David, Péché avec Bath-Schéba, Révolte d'Absalom.",
  },
  "1 Rois": {
    author: "Jérémie (traditionnellement)",
    period: "~970-853 av. J.-C.",
    historicalContext: "Succession de David par Salomon, construction du Temple, puis division du royaume. Élie le prophète affronte Achab et Jézabel.",
    culturalNotes: "Le Temple de Salomon, merveille architecturale, devient le centre du culte. La division du royaume (Israël au nord, Juda au sud) marque le début du déclin.",
    keyEvents: "Règne de Salomon, Construction du Temple, Division du royaume, Ministère d'Élie.",
  },
  "2 Rois": {
    author: "Jérémie (traditionnellement)",
    period: "~853-586 av. J.-C.",
    historicalContext: "Suite du déclin : les deux royaumes tombent. Israël (nord) est détruit par l'Assyrie en 722. Juda (sud) tombe face à Babylone en 586. Élisée succède à Élie.",
    culturalNotes: "Les réformes d'Ézéchias et de Josias retardent le jugement. La découverte du livre de la Loi sous Josias est un moment clé.",
    keyEvents: "Ministère d'Élisée, Chute de Samarie, Réforme de Josias, Destruction de Jérusalem.",
  },
  "Matthieu": {
    author: "Matthieu (Lévi), apôtre",
    period: "~60-80 ap. J.-C.",
    historicalContext: "Évangile adressé à un public juif après la destruction du Temple (70 ap. J.-C.). La Palestine est sous domination romaine. Pharisiens et sadducéens sont les groupes religieux dominants.",
    culturalNotes: "Plus de 60 citations de l'Ancien Testament. Le Sermon sur la Montagne réinterprète la Loi mosaïque. Les paraboles utilisent des images agricoles galiléennes.",
    keyEvents: "Sermon sur la Montagne, Multiplication des pains, Crucifixion, Résurrection.",
    chapters: {
      5: "Les Béatitudes — Heureux les pauvres en esprit, le sel de la terre, la lumière du monde.",
      6: "Le Notre Père, les trésors dans le ciel, ne vous inquiétez pas du lendemain.",
      28: "La Grande Mission — Allez, faites de toutes les nations des disciples.",
    }
  },
  "Marc": {
    author: "Marc (Jean-Marc), compagnon de Pierre",
    period: "~55-65 ap. J.-C.",
    historicalContext: "Premier évangile écrit, à Rome, pour un public non-juif sous persécution néronienne. Style vif et direct, avec l'adverbe 'aussitôt' qui scande le récit.",
    culturalNotes: "Marc explique les coutumes juives pour ses lecteurs romains. Il insiste sur les actions de Jésus plus que ses discours. L'Évangile se termine par la résurrection.",
    keyEvents: "Baptême de Jésus, Multiplications des pains, Confession de Pierre, Crucifixion, Résurrection.",
  },
  "Luc": {
    author: "Luc, médecin et compagnon de Paul",
    period: "~60-80 ap. J.-C.",
    historicalContext: "Évangile écrit pour Théophile (un Grec cultivé). Luc adopte une approche historique, avec une attention particulière aux pauvres, aux femmes, aux exclus et à l'universalité du salut.",
    culturalNotes: "Seul évangéliste non-juif. Il rapporte les cantiques de Marie, Zacharie et Siméon, des paraboles uniques (le bon Samaritain, le fils prodigue).",
    keyEvents: "Annonciation, Nativité, Parabole du fils prodigue, Emmaüs.",
    chapters: {
      15: "Les paraboles de la miséricorde : la brebis perdue, la pièce perdue, le fils prodigue.",
    }
  },
  "Jean": {
    author: "Jean, fils de Zébédée",
    period: "~85-95 ap. J.-C.",
    historicalContext: "Dernier des quatre évangiles, écrit depuis Éphèse. Le christianisme se sépare du judaïsme. Les chrétiens sont expulsés des synagogues. L'Empire romain, sous Domitien, persécute les chrétiens.",
    culturalNotes: "Vocabulaire dualiste (lumière/ténèbres). Les 7 'Je suis' de Jésus répondent aux besoins spirituels universels. La philosophie grecque (Logos) influence le prologue.",
    keyEvents: "Noces de Cana, Résurrection de Lazare, Dernier discours, Crucifixion.",
    chapters: {
      1: "Le Prologue — Au commencement était la Parole, la Parole était Dieu.",
      15: "La vigne et les sarments — Demeurez en moi, et je demeurerai en vous.",
    }
  },
  "Actes": {
    author: "Luc",
    period: "~62-80 ap. J.-C.",
    historicalContext: "Suite de l'Évangile de Luc, les Actes racontent la naissance et l'expansion de l'Église primitive, de Jérusalem à Rome, portée par la puissance du Saint-Esprit.",
    culturalNotes: "La Pentecôte accomplit les fêtes juives (Shavouot). Paul utilise sa citoyenneté romaine pour se défendre. Le livre documente le premier concile de Jérusalem.",
    keyEvents: "Pentecôte, Conversion de Paul, Concile de Jérusalem, Voyages missionnaires de Paul.",
    chapters: {
      2: "La Pentecôte — l'Esprit descend, les disciples parlent en langues, Pierre prêche.",
    }
  },
  "Romains": {
    author: "Paul (Saul de Tarse)",
    period: "~57 ap. J.-C.",
    historicalContext: "Écrite depuis Corinthe, 3e voyage missionnaire. L'Église de Rome compte Juifs et non-Juifs. Néron est empereur. Paul expose systématiquement le salut par la foi.",
    culturalNotes: "Rome, ~1 million d'habitants, centre du monde méditerranéen. La citoyenneté romaine confère des privilèges. L'esclavage est omniprésent.",
    keyEvents: "Justification par la foi, Adoption, Vie par l'Esprit.",
    chapters: {
      8: "Il n'y a donc maintenant aucune condamnation — la vie par l'Esprit, enfants de Dieu.",
      12: "Le culte raisonnable — offrez vos corps comme un sacrifice vivant, transformez votre intelligence.",
    }
  },
  "1 Corinthiens": {
    author: "Paul",
    period: "~55 ap. J.-C.",
    historicalContext: "Écrite depuis Éphèse. Corinthe, ville portuaire cosmopolite et corrompue, abrite une église divisée, confrontée à l'immoralité et aux désordres cultuels.",
    culturalNotes: "Corinthe était célèbre pour son temple d'Aphrodite et ses mœurs dissolues. L'église devait se démarquer dans cette culture païenne.",
    keyEvents: "Divisions dans l'Église, Discipline ecclésiastique, La Sainte-Cène, Résurrection.",
    chapters: {
      13: "L'hymne à l'amour — l'amour est patient, plein de bonté, il ne cherche pas son intérêt.",
    }
  },
  "2 Corinthiens": {
    author: "Paul",
    period: "~56 ap. J.-C.",
    historicalContext: "Paul défend son apostolat face aux 'super-apôtres' qui le critiquent. Il évoque ses souffrances, ses visions et sa faiblesse comme lieu de la puissance de Dieu.",
    culturalNotes: "Paul parle de sa 'vision du troisième ciel' et de son 'écharde dans la chair'. Il exhorte à la générosité pour la collecte en faveur des pauvres de Jérusalem.",
    keyEvents: "Défense de l'apostolat, la collecte pour Jérusalem, l'écharde dans la chair.",
  },
  "Galates": {
    author: "Paul",
    period: "~48-55 ap. J.-C.",
    historicalContext: "Paul s'oppose aux judaïsants qui veulent imposer la circoncision aux chrétiens non-juifs. Il défend la liberté en Christ et la justification par la foi sans les œuvres de la loi.",
    culturalNotes: "Paul rappelle sa rencontre avec les apôtres à Jérusalem. L'épître est un manifeste passionné pour la liberté chrétienne.",
    keyEvents: "Confrontation avec Pierre à Antioche, Allégorie d'Agar et Sara.",
    chapters: {
      5: "C'est pour la liberté que Christ nous a affranchis — le fruit de l'Esprit.",
    }
  },
  "Éphésiens": {
    author: "Paul",
    period: "~60-62 ap. J.-C.",
    historicalContext: "Écrite probablement pendant l'emprisonnement de Paul à Rome. Éphèse, grand centre commercial et religieux d'Asie Mineure, abrite le temple d'Artémis (une des 7 merveilles du monde).",
    culturalNotes: "Le mur de séparation dans le temple entre Juifs et non-Juifs illustre l'unité en Christ. L'armure du soldat romain sert d'image pour les armes spirituelles.",
    keyEvents: "Élection en Christ, Unité de l'Église, Armure de Dieu.",
  },
  "Philippiens": {
    author: "Paul",
    period: "~61-62 ap. J.-C.",
    historicalContext: "Lettre de joie écrite depuis la prison (probablement à Rome). Paul remercie les Philippiens pour leur soutien financier et les encourage à persévérer malgré les souffrances.",
    culturalNotes: "Philippes était une colonie romaine fière de sa citoyenneté, ce qui donne tout son sens à 'notre cité à nous est dans les cieux'.",
    keyEvents: "Hymne christologique, course vers le but, contentement en toute circonstance.",
    chapters: {
      4: "Réjouissez-vous toujours — je puis tout par celui qui me fortifie.",
    }
  },
  "Colossiens": {
    author: "Paul",
    period: "~60-62 ap. J.-C.",
    historicalContext: "Écrite pour contrer une hérésie naissante mêlant philosophie grecque, mysticisme juif et pratiques ascétiques. Paul exalte la suprématie absolue de Christ.",
    culturalNotes: "Colosses était une petite ville de Phrygie, éclipsée par Laodicée et Hiérapolis voisines. La lettre insiste sur la plénitude de la divinité en Christ.",
    keyEvents: "Hymne christologique — Christ, image du Dieu invisible, premier-né de toute la création.",
  },
  "1 Thessaloniciens": {
    author: "Paul",
    period: "~50-51 ap. J.-C.",
    historicalContext: "Premier écrit du Nouveau Testament. Paul, depuis Corinthe, encourage une jeune église persécutée et répond à leurs questions sur le retour du Seigneur et le sort des croyants décédés.",
    culturalNotes: "Thessalonique, capitale de la Macédoine, était un port prospère et carrefour commercial. L'église y faisait face à l'hostilité de la synagogue.",
    keyEvents: "L'enlèvement de l'Église, le Jour du Seigneur.",
  },
  "1 Timothée": {
    author: "Paul",
    period: "~62-64 ap. J.-C.",
    historicalContext: "Paul écrit à Timothée, son fils spirituel et jeune pasteur à Éphèse. Il donne des instructions sur l'organisation de l'Église, les qualifications des responsables et la saine doctrine.",
    culturalNotes: "Éphèse était un centre de culte païen (Artémis) et de magie. Timothée devait lutter contre les faux enseignants et organiser l'Église selon les principes divins.",
    keyEvents: "Qualifications des anciens et diacres, garder le bon dépôt, conseils pastoraux.",
  },
  "2 Timothée": {
    author: "Paul",
    period: "~64-67 ap. J.-C.",
    historicalContext: "Le dernier écrit de Paul avant son martyre. Prisonnier à Rome dans des conditions difficiles, il exhorte Timothée à rester fidèle et à prêcher la Parole en tout temps.",
    culturalNotes: "Paul attend son exécution imminente sous Néron. Il fait ses adieux en transmettant le flambeau à la génération suivante de disciples.",
    keyEvents: "J'ai combattu le bon combat, toute Écriture est inspirée de Dieu.",
    chapters: {
      3: "Dans les derniers jours — toute Écriture est inspirée de Dieu et utile pour enseigner.",
    }
  },
  "Hébreux": {
    author: "Anonyme (traditionnellement Paul ou Apollos)",
    period: "~60-69 ap. J.-C.",
    historicalContext: "Adressée à des chrétiens juifs tentés de retourner au judaïsme face aux persécutions. L'auteur démontre la supériorité de Christ sur les anges, Moïse, le sacerdoce lévitique et les sacrifices.",
    culturalNotes: "Le système sacerdotal du Temple structure l'argumentation. La Nouvelle Alliance en Christ accomplit et dépasse les ombres de l'Ancienne.",
    keyEvents: "Christ grand-prêtre selon l'ordre de Melchisédek, La foi des héros, La discipline de Dieu.",
    chapters: {
      11: "Le chapitre de la foi — la nuée de témoins, la foi d'Abraham, de Moïse, de Rahab.",
    }
  },
  "Jacques": {
    author: "Jacques, frère du Seigneur",
    period: "~45-50 ap. J.-C.",
    historicalContext: "Première épître du NT, écrite par le chef de l'Église de Jérusalem aux croyants juifs dispersés. Insiste sur une foi qui se manifeste par des œuvres concrètes.",
    culturalNotes: "Style proche de la littérature de sagesse juive et du Sermon sur la Montagne. Conseils pratiques sur la maîtrise de la langue et la patience dans l'épreuve.",
    keyEvents: "La foi sans les œuvres est morte, la maîtrise de la langue.",
  },
  "1 Pierre": {
    author: "Pierre, apôtre",
    period: "~62-64 ap. J.-C.",
    historicalContext: "Écrite aux chrétiens persécutés d'Asie Mineure sous Néron. Pierre les encourage à tenir ferme dans la souffrance, suivant l'exemple de Christ.",
    culturalNotes: "Pierre écrit depuis 'Babylone' (nom symbolique de Rome). L'épître est remplie d'espérance malgré les épreuves et les calomnies.",
    keyEvents: "Une espérance vivante, peuple de Dieu, pierres vivantes, la fin est proche.",
  },
  "1 Jean": {
    author: "Jean, apôtre",
    period: "~85-95 ap. J.-C.",
    historicalContext: "Jean combat les prémices du gnosticisme qui niait l'incarnation de Christ. Il insiste sur l'amour fraternel, la confession des péchés et la certitude du salut.",
    culturalNotes: "Jean oppose lumière et ténèbres, amour et haine, vérité et mensonge. Sa théologie est centrée sur la communion avec Dieu.",
    keyEvents: "Dieu est lumière, Dieu est amour, la certitude de la vie éternelle.",
  },
  "Apocalypse": {
    author: "Jean, apôtre",
    period: "~90-96 ap. J.-C.",
    historicalContext: "Jean, exilé sur l'île de Patmos sous Domitien, reçoit la révélation de Jésus-Christ. Les sept églises d'Asie Mineure subissent persécution, compromis et tiédeur.",
    culturalNotes: "L'apocalyptique juive utilise un langage symbolique (sceaux, trompettes, coupes). Les visions culminent dans le triomphe final de l'Agneau et la Nouvelle Jérusalem.",
    keyEvents: "Lettres aux sept Églises, Sceaux et Trompettes, Retour glorieux de Christ, Nouvelle Création.",
    chapters: {
      21: "La Nouvelle Jérusalem — un nouveau ciel et une nouvelle terre, Dieu essuiera toute larme.",
    }
  },
};

async function generateAIContext(book: string, chapter: string | null): Promise<{
  author: string; period: string; historicalContext: string; culturalNotes: string; keyEvents: string;
} | null> {
  const token = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
  if (!token) return null;

  const ref = chapter ? `${book} ${chapter}` : book;
  const prompt = `Tu es un expert en histoire biblique. Donne un résumé concis du contexte historique et culturel du passage biblique suivant : ${ref}. Réponds en français au format JSON avec les champs : author (auteur présumé), period (période approximative), historicalContext (2-3 phrases sur le contexte historique), culturalNotes (2-3 phrases sur les coutumes/culture de l'époque), keyEvents (événements clés du livre). Sois précis et informatif.`;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `*** ${token}`,
        },
        body: JSON.stringify({
          inputs: `<|im_start|>system\nTu es un assistant qui répond UNIQUEMENT en JSON valide, sans texte avant ni après.<|im_end|>\n<|im_start|>user\n${prompt}<|im_end|>\n<|im_start|>assistant\n`,
          parameters: { max_new_tokens: 400, temperature: 0.7, do_sample: true },
        }),
      }
    );

    if (!response.ok) return null;
    const result = await response.json();
    const text = (Array.isArray(result) ? result[0]?.generated_text : result?.generated_text) || "";
    const jsonStr = text.split("<|im_start|>assistant\n").pop()?.replace(/<\|im_end\|>/g, "").trim() || text;

    try {
      return JSON.parse(jsonStr);
    } catch {
      // If JSON parsing fails, return structured fallback
      return {
        author: "Information générée par IA",
        period: "—",
        historicalContext: jsonStr.substring(0, 300) || "Contexte non disponible pour ce passage.",
        culturalNotes: "Consulte une Bible d'étude pour plus de détails.",
        keyEvents: "—",
      };
    }
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const book = searchParams.get("book");
    const chapter = searchParams.get("chapter");
    const forceIA = searchParams.get("forceIA") === "true";

    if (!book) {
      return NextResponse.json({ error: "Le paramètre 'book' est requis" }, { status: 400 });
    }

    // 1. Static context (fast, always available for covered books)
    const staticContext = BOOK_CONTEXT[book];
    if (staticContext && !forceIA) {
      // Enrichir avec le contexte spécifique au chapitre si disponible
      const chapterNum = chapter ? parseInt(chapter, 10) : null;
      const chapterNote = chapterNum && staticContext.chapters?.[chapterNum] 
        ? staticContext.chapters[chapterNum] 
        : null;
      
      // Construire un historicalContext enrichi
      const enrichedContext = chapterNote 
        ? `${staticContext.historicalContext}\n\n📖 Contexte du chapitre ${chapter} : ${chapterNote}`
        : staticContext.historicalContext;

      return NextResponse.json({ 
        book, 
        chapter: chapter || null, 
        author: staticContext.author,
        period: staticContext.period,
        historicalContext: enrichedContext,
        culturalNotes: staticContext.culturalNotes,
        keyEvents: staticContext.keyEvents,
        source: "static",
        chapterNote,
      });
    }

    // 2. AI fallback for uncovered books or forced
    const aiContext = await generateAIContext(book, chapter);
    if (aiContext) {
      return NextResponse.json({ book, chapter: chapter || null, ...aiContext, source: "ai" });
    }

    // 3. Ultimate fallback
    return NextResponse.json({
      book,
      chapter: chapter || null,
      author: "Non disponible pour ce livre",
      period: "—",
      historicalContext: `Le contexte historique détaillé pour ${book} sera ajouté prochainement. Le texte biblique reste la source d'autorité : c'est la Parole de Dieu (2 Timothée 3:16).`,
      culturalNotes: "Pour une compréhension approfondie, nous recommandons une Bible d'étude avec notes historiques.",
      keyEvents: "—",
      source: "fallback",
    });
  } catch (error: unknown) {
    console.error("Error fetching context:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
