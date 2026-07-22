import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Contexte historique et culturel statique par livre biblique
const BOOK_CONTEXT: Record<string, {
  author: string;
  period: string;
  historicalContext: string;
  culturalNotes: string;
  keyEvents: string;
}> = {
  "Genèse": {
    author: "Moïse (traditionnellement)",
    period: "~1450-1400 av. J.-C.",
    historicalContext: "Le livre de la Genèse couvre la période de la Création jusqu'à la mort de Joseph en Égypte. Il retrace les origines de l'humanité, le déluge, la Tour de Babel, et l'histoire des patriarches Abraham, Isaac, Jacob et Joseph. Le Proche-Orient ancien était dominé par de grandes civilisations : l'Égypte, la Mésopotamie (Sumer, Babylone), les Hittites.",
    culturalNotes: "À l'époque patriarcale, la société était organisée en clans familiaux nomades ou semi-nomades. L'hospitalité était sacrée, les alliances scellées par des serments solennels. La circoncision était le signe de l'alliance. Les mariages étaient arrangés au sein de la parenté. La bénédiction du patriarche avait une valeur juridique et prophétique.",
    keyEvents: "Création, Chute, Déluge, Tour de Babel, Appel d'Abraham, Alliance, Naissance d'Isaac, Sacrifice d'Isaac, Échelle de Jacob, Joseph vendu par ses frères, Joseph en Égypte, Famine, Migration en Égypte."
  },
  "Exode": {
    author: "Moïse (traditionnellement)",
    period: "~1450-1400 av. J.-C.",
    historicalContext: "L'Exode raconte la libération du peuple d'Israël de l'esclavage en Égypte. L'Égypte du Nouvel Empire (18e-19e dynasties) était la superpuissance de l'époque, avec des pharaons comme Thoutmosis III, Ramsès II. Les Hébreux étaient une minorité asservie, employée aux travaux de construction (briques, cités-entrepôts de Pitom et Ramsès).",
    culturalNotes: "La magie égyptienne était réputée ; les magiciens de Pharaon reproduisaient certains signes. Le culte égyptien était polythéiste avec des dieux comme Râ (soleil), Hâpi (Nil), Héqet (grenouille). Les dix plaies visaient directement ces divinités égyptiennes. La Pâque instituée au chapitre 12 est le rite fondateur d'Israël.",
    keyEvents: "Esclavage en Égypte, Naissance de Moïse, Buisson Ardent, Dix Plaies, Pâque, Traversée de la Mer Rouge, Don de la Loi au Sinaï, Veau d'Or, Construction du Tabernacle."
  },
  "Psaumes": {
    author: "David (majorité), Asaph, Fils de Koré, Salomon, Moïse, anonymes",
    period: "~1000-400 av. J.-C.",
    historicalContext: "Le livre des Psaumes est le recueil de cantiques d'Israël, compilé sur plusieurs siècles. Il couvre toute la période de la monarchie israélite (David, Salomon), l'exil à Babylone (586 av. J.-C.), et le retour d'exil. Le temple de Jérusalem était le centre du culte, avec des lévites musiciens organisés par David.",
    culturalNotes: "Les psaumes étaient chantés avec accompagnement instrumental (lyre, harpe, cymbales). Les genres incluent : louange, lamentation, action de grâce, psaumes royaux, psaumes de sagesse. Le parallélisme hébraïque est la technique poétique principale (synonymique, antithétique, synthétique). Le mot 'Sélah' (71 fois) indique probablement une pause musicale.",
    keyEvents: "Onction de David, Fuite devant Saül, Construction du Temple, Exil à Babylone, Retour d'exil, Reconstruction du Temple."
  },
  "Ésaïe": {
    author: "Ésaïe ben Amots",
    period: "~740-680 av. J.-C.",
    historicalContext: "Ésaïe prophétise sous les rois Ozias, Jotham, Achaz et Ézéchias de Juda. L'Assyrie est la puissance dominante qui menace le Proche-Orient. En 722, le Royaume du Nord (Israël/Samarie) tombe aux mains des Assyriens. Jérusalem est miraculeusement sauvée en 701. Le livre annonce aussi l'exil babylonien (586) et le retour.",
    culturalNotes: "Les prophètes hébreux étaient des porte-parole de Dieu, souvent confrontés aux rois et aux faux prophètes. Leurs messages étaient parfois mis en scène (Ésaïe marche nu 3 ans). Le conseil divin est évoqué. Le Serviteur souffrant d'Ésaïe 53 est l'un des textes les plus commentés de l'Ancien Testament.",
    keyEvents: "Guerre syro-éphraïmite, Invasion assyrienne, Siège de Jérusalem, Miracle de l'ombre qui recule, Ambassade babylonienne."
  },
  "Matthieu": {
    author: "Matthieu (Lévi), apôtre et ancien collecteur d'impôts",
    period: "~60-80 ap. J.-C.",
    historicalContext: "L'Évangile de Matthieu s'adresse principalement à un public juif. Écrit après la destruction du Temple de Jérusalem (70 ap. J.-C.), il cherche à démontrer que Jésus est le Messie annoncé par les Écritures. La Palestine était sous domination romaine, avec Hérode Antipas comme tétrarque de Galilée. Les pharisiens et sadducéens étaient les principaux groupes religieux juifs.",
    culturalNotes: "Matthieu cite abondamment l'Ancien Testament (plus de 60 citations explicites). La généalogie de Jésus (ch.1) suit la structure juive en trois groupes de 14. Le Sermon sur la Montagne (ch.5-7) réinterprète la Loi mosaïque. Les paraboles du Royaume (ch.13) utilisent des images agricoles familières au public galiléen.",
    keyEvents: "Naissance de Jésus, Visite des Mages, Baptême de Jésus, Sermon sur la Montagne, Multiplication des pains, Transfiguration, Entrée triomphale, Crucifixion, Résurrection, Grande Commission."
  },
  "Jean": {
    author: "Jean, fils de Zébédée, le 'disciple que Jésus aimait'",
    period: "~85-95 ap. J.-C.",
    historicalContext: "L'Évangile de Jean est le dernier des quatre évangiles. Il est écrit depuis Éphèse, dans un contexte où le christianisme se sépare progressivement du judaïsme. Les chrétiens sont expulsés des synagogues. L'Empire romain, sous Domitien, commence à persécuter les chrétiens. La philosophie grecque (Logos) influence le vocabulaire théologique de Jean.",
    culturalNotes: "Jean utilise un vocabulaire dualiste (lumière/ténèbres, vérité/mensonge, vie/mort) compréhensible dans le monde hellénistique. Les 7 'Je suis' de Jésus (Pain de vie, Lumière du monde, Porte, Bon Berger, Résurrection, Chemin, Cep) répondent aux besoins spirituels universels. La fête des Tabernacles (ch.7-8) et la Dédicace (ch.10) servent de cadre aux discours de Jésus.",
    keyEvents: "Projet du Verbe, Noces de Cana, Nicodème, Samaritaine, Résurrection de Lazare, Lavement des pieds, Dernier discours, Crucifixion, Résurrection, Thomas, Pêche miraculeuse."
  },
  "Romains": {
    author: "Paul (Saul de Tarse), apôtre des nations",
    period: "~57 ap. J.-C.",
    historicalContext: "L'épître aux Romains est écrite depuis Corinthe, pendant le 3e voyage missionnaire de Paul. L'Église de Rome était composée de Juifs et de non-Juifs, dans la capitale de l'Empire romain. Néron était empereur. Paul n'avait pas encore visité Rome, mais souhaitait y passer avant d'aller en Espagne. L'épître expose systématiquement la doctrine du salut par la foi.",
    culturalNotes: "Rome, ville d'environ 1 million d'habitants, était le centre politique, économique et culturel du monde méditerranéen. La citoyenneté romaine conférait des privilèges. L'esclavage était omniprésent. Le culte impérial se développait. Les Juifs de Rome avaient été expulsés sous Claude (49 ap.) puis étaient revenus.",
    keyEvents: "Condamnation universelle, Justification par la foi, Paix avec Dieu, Adoption, Élection, Israël et les nations, Vie par l'Esprit."
  }
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const book = searchParams.get("book");
    const chapter = searchParams.get("chapter");

    if (!book) {
      return NextResponse.json({ error: "Le paramètre 'book' est requis" }, { status: 400 });
    }

    // Chercher le contexte du livre (supporte les noms courts comme "Jn" pour "Jean")
    const context = BOOK_CONTEXT[book] || {
      author: "Non disponible pour ce livre",
      period: "—",
      historicalContext: "Le contexte historique détaillé pour ce livre sera ajouté prochainement. Le texte biblique reste la source d'autorité : c'est la Parole de Dieu, inspirée et utile pour enseigner, convaincre, corriger et instruire dans la justice (2 Timothée 3:16).",
      culturalNotes: "Les coutumes et pratiques culturelles varient selon l'époque et le lieu. Pour une compréhension approfondie, nous recommandons de consulter une Bible d'étude avec notes historiques.",
      keyEvents: "—"
    };

    return NextResponse.json({
      book,
      chapter: chapter || null,
      ...context,
    });
  } catch (error: unknown) {
    console.error("Error fetching context:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
