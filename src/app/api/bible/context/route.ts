import { NextResponse } from "next/server";
import BOOK_CONTEXT from "@/data/book-context.json";

export const dynamic = "force-dynamic";

type BookContext = {
  author: string;
  period: string;
  historicalContext: string;
  culturalNotes: string;
  keyEvents: string;
  chapters?: Record<string, string>;
};

const typedContext = BOOK_CONTEXT as Record<string, BookContext>;

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
          Authorization: `Bearer ${token}`,
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

    // 1. Static context (fast, always available for all 66 books)
    const staticContext = typedContext[book];
    if (staticContext && !forceIA) {
      const chapterNote = (chapter && staticContext.chapters?.[chapter])
        ? staticContext.chapters[chapter]
        : null;

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

    // 2. AI fallback for forced or JSON mismatch
    const aiContext = await generateAIContext(book, chapter);
    if (aiContext) {
      return NextResponse.json({ book, chapter: chapter || null, ...aiContext, source: "ai" });
    }

    // 3. Ultimate fallback (ne devrait plus arriver avec 66 livres)
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
