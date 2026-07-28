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
    historicalContext: "Le livre de la Genèse couvre la période de la Création jusqu'à la mort de Joseph en Égypte. Il retrace les origines de l'humanité, le déluge, la Tour de Babel, et l'histoire des patriarches Abraham, Isaac, Jacob et Joseph.",
    culturalNotes: "À l'époque patriarcale, la société était organisée en clans familiaux nomades. L'hospitalité était sacrée, les alliances scellées par des serments. La circoncision était le signe de l'alliance.",
    keyEvents: "Création, Chute, Déluge, Appel d'Abraham, Joseph en Égypte."
  },
  "Exode": {
    author: "Moïse (traditionnellement)",
    period: "~1450-1400 av. J.-C.",
    historicalContext: "L'Exode raconte la libération d'Israël de l'esclavage en Égypte sous le Nouvel Empire (18e-19e dynasties). Les Hébreux étaient une minorité asservie aux travaux de construction.",
    culturalNotes: "Les dix plaies visaient les divinités égyptiennes (Râ, Hâpi, Héqet). La Pâque est le rite fondateur d'Israël.",
    keyEvents: "Dix Plaies, Traversée de la Mer Rouge, Don de la Loi au Sinaï."
  },
  "Psaumes": {
    author: "David (majorité), Asaph, Fils de Koré, Salomon, Moïse",
    period: "~1000-400 av. J.-C.",
    historicalContext: "Le livre des Psaumes est le recueil de cantiques d'Israël compilé sur plusieurs siècles, couvrant la monarchie, l'exil à Babylone (586 av. J.-C.) et le retour. Le temple de Jérusalem était le centre du culte.",
    culturalNotes: "Les psaumes étaient chantés avec instruments (lyre, harpe). Genres : louange, lamentation, action de grâce. Le parallélisme hébraïque est la technique poétique principale.",
    keyEvents: "Onction de David, Construction du Temple, Exil à Babylone."
  },
  "Ésaïe": {
    author: "Ésaïe ben Amots",
    period: "~740-680 av. J.-C.",
    historicalContext: "Ésaïe prophétise sous les rois Ozias, Jotham, Achaz et Ézéchias. L'Assyrie domine le Proche-Orient. En 722, le Royaume du Nord tombe. Jérusalem est sauvée en 701.",
    culturalNotes: "Les prophètes hébreux étaient des porte-parole de Dieu, confrontés aux rois. Le Serviteur souffrant d'Ésaïe 53 est l'un des textes les plus commentés.",
    keyEvents: "Invasion assyrienne, Siège de Jérusalem, Ambassade babylonienne."
  },
  "Matthieu": {
    author: "Matthieu (Lévi), apôtre",
    period: "~60-80 ap. J.-C.",
    historicalContext: "Évangile adressé à un public juif après la destruction du Temple (70 ap. J.-C.). La Palestine est sous domination romaine. Pharisiens et sadducéens sont les groupes religieux dominants.",
    culturalNotes: "Plus de 60 citations de l'Ancien Testament. Le Sermon sur la Montagne réinterprète la Loi mosaïque. Les paraboles utilisent des images agricoles galiléennes.",
    keyEvents: "Sermon sur la Montagne, Multiplication des pains, Crucifixion, Résurrection."
  },
  "Jean": {
    author: "Jean, fils de Zébédée",
    period: "~85-95 ap. J.-C.",
    historicalContext: "Dernier des quatre évangiles, écrit depuis Éphèse. Le christianisme se sépare du judaïsme. Les chrétiens sont expulsés des synagogues. L'Empire romain, sous Domitien, persécute les chrétiens.",
    culturalNotes: "Vocabulaire dualiste (lumière/ténèbres). Les 7 'Je suis' de Jésus répondent aux besoins spirituels universels. La philosophie grecque (Logos) influence le prologue.",
    keyEvents: "Noces de Cana, Résurrection de Lazare, Dernier discours, Crucifixion."
  },
  "Romains": {
    author: "Paul (Saul de Tarse)",
    period: "~57 ap. J.-C.",
    historicalContext: "Écrite depuis Corinthe, 3e voyage missionnaire. L'Église de Rome compte Juifs et non-Juifs. Néron est empereur. Paul expose systématiquement le salut par la foi.",
    culturalNotes: "Rome, ~1 million d'habitants, centre du monde méditerranéen. La citoyenneté romaine confère des privilèges. L'esclavage est omniprésent.",
    keyEvents: "Justification par la foi, Adoption, Vie par l'Esprit."
  }
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
      return NextResponse.json({ book, chapter: chapter || null, ...staticContext, source: "static" });
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
