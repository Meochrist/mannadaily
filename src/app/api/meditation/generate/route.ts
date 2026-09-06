import { NextResponse } from "next/server";
import { queryOne, execute } from "@/server/db";
import { 
  generateMeditation, 
  generatePersonalizedSummary, 
  generatePersonalizedPrayer,
  generateBibleChat,
  generateCommentary
} from "@/lib/ai";

export const dynamic = "force-dynamic";

function decodeToken(token: string): { userId: string; email: string; exp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: payload.userId, email: payload.email, exp: payload.exp };
  } catch {
    return null;
  }
}

function parseReference(ref: string) {
  const parts = ref.trim().split(" ");
  if (parts.length < 2) return { book: ref, chapter: 1, verse: 1 };
  
  const lastPart = parts[parts.length - 1];
  const book = parts.slice(0, parts.length - 1).join(" ");
  
  const numbers = lastPart.split(":");
  const chapter = parseInt(numbers[0], 10) || 1;
  const verse = parseInt(numbers[1], 10) || 1;
  
  return { book, chapter, verse };
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const decoded = decodeToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    if (JSON.stringify(body).length > 50_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    const { verse, reference, theme, type = "meditation", answers, question, verseContext } = body;

    if (typeof type !== "string" || !["meditation", "contexte_biblique", "contexte_historique", "priere", "commentary", "bible_chat", "summary", "prayer_personal"].includes(type)) {
      return NextResponse.json({ error: "Invalid generation type" }, { status: 400 });
    }
    for (const [name, value, max] of [["verse", verse, 20_000], ["reference", reference, 200], ["theme", theme, 200], ["question", question, 4_000], ["verseContext", verseContext, 20_000]] as const) {
      if (value !== undefined && value !== null && (typeof value !== "string" || value.length > max)) {
        return NextResponse.json({ error: `${name} is invalid or too long` }, { status: 400 });
      }
    }
    if (answers !== undefined && (typeof answers !== "object" || answers === null || Array.isArray(answers) || JSON.stringify(answers).length > 20_000)) {
      return NextResponse.json({ error: "Answers are invalid or too long" }, { status: 400 });
    }

    // Prise en charge du commentaire IA
    if (type === "commentary") {
      if (!verse || !reference) {
        return NextResponse.json({ error: "Missing required verse or reference fields for commentary" }, { status: 400 });
      }
      const { book, chapter, verse: verseNumber } = parseReference(reference);
      
      const bibleVerse = await queryOne("SELECT * FROM bible_verses WHERE book = $1 AND chapter = $2 AND verse = $3", [book, chapter, verseNumber]);
      const bookNumber = (bibleVerse as any)?.bookNumber || 1;

      const commentaryText = await generateCommentary(book, chapter, verseNumber, verse);

      await execute(`
        INSERT INTO bible_commentaries (id, book, chapter, verse, author, content, language)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [crypto.randomUUID(), bookNumber, chapter, verseNumber, "MannaDaily AI", commentaryText, "fr"]);

      return NextResponse.json({ commentary: { content: commentaryText } });
    }

    // Prise en charge du chat biblique
    if (type === "bible_chat") {
      if (!question || !verseContext) {
        return NextResponse.json({ error: "Missing required question or verseContext fields for bible_chat" }, { status: 400 });
      }
      const answerText = await generateBibleChat(question, verseContext);
      return NextResponse.json({ answer: answerText });
    }

    // Prise en charge du résumé personnalisé
    if (type === "summary") {
      if (!answers) {
        return NextResponse.json({ error: "Missing required answers field for summary" }, { status: 400 });
      }
      const summaryText = await generatePersonalizedSummary(answers);
      return NextResponse.json({ summary: summaryText });
    }

    // Prise en charge de la prière personnalisée
    if (type === "prayer_personal") {
      if (!verse || !answers) {
        return NextResponse.json({ error: "Missing required verse or answers fields for personalized prayer" }, { status: 400 });
      }
      const prayerText = await generatePersonalizedPrayer(answers, verse);
      return NextResponse.json({ meditation: prayerText });
    }

    if (!verse || !reference || !theme) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { book, chapter, verse: verseNumber } = parseReference(reference);

    // Upsert le verset
    const existingVerse = await queryOne("SELECT id FROM verses WHERE book = $1 AND chapter = $2 AND verse = $3 AND translation = $4", [book, chapter, verseNumber, "LSG"]);
    let verseId: string;
    
    if (existingVerse) {
      verseId = (existingVerse as any).id;
    } else {
      verseId = crypto.randomUUID();
      await execute("INSERT INTO verses (id, book, chapter, verse, text, translation) VALUES ($1, $2, $3, $4, $5, $6)", [verseId, book, chapter, verseNumber, verse, "LSG"]);
    }

    const generationType = type as "meditation" | "contexte_biblique" | "contexte_historique" | "priere";
    const meditationText = await generateMeditation(verse, reference, theme, generationType);

    if (type === "meditation") {
      await execute("INSERT INTO meditations (id, verseId, content) VALUES ($1, $2, $3)", [crypto.randomUUID(), verseId, meditationText]);
    }

    return NextResponse.json({ meditation: meditationText });
  } catch (error: unknown) {
    console.error("Error in meditation generation API:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
