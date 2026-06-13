import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { isBuildTime } from "@/lib/utils";
import { MannyMood } from "@/types";

// Forçons le dynamic en cas d'utilisation dans des routes dynamiques
export const dynamic = "force-dynamic";

async function callGemini(prompt: string, modelName: string = "gemini-2.5-flash"): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not defined");
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error("Gemini returned empty text");
  return text.trim();
}

async function callGroq(prompt: string, modelName: string = "llama-3.3-70b-versatile"): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not defined");
  
  const groq = new Groq({ apiKey });
  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: modelName,
  });
  const text = chatCompletion.choices[0]?.message?.content || "";
  if (!text) throw new Error("Groq returned empty text");
  return text.trim();
}

async function callGitHub(prompt: string, modelName: string = "gpt-4o"): Promise<string> {
  const apiKey = process.env.GITHUB_TOKEN;
  if (!apiKey) throw new Error("GITHUB_TOKEN is not defined");
  
  const openai = new OpenAI({
    apiKey,
    baseURL: "https://models.inference.ai.azure.com",
  });
  const response = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: modelName,
  });
  const text = response.choices[0]?.message?.content || "";
  if (!text) throw new Error("GitHub Models returned empty text");
  return text.trim();
}

/**
 * Génère une méditation biblique en français (150-200 mots) pour un verset donné.
 * Met en œuvre un triple fallback (Gemini -> Groq -> GitHub Models) et une garde de build.
 */
export async function generateMeditation(
  verse: string,
  reference: string,
  theme: string,
  type: "meditation" | "contexte_biblique" | "contexte_historique" | "priere" = "meditation"
): Promise<string> {
  if (isBuildTime()) {
    if (type === "contexte_biblique") {
      return `Contexte biblique factice pour ${reference} : 2-3 versets de contexte et explication du passage.`;
    }
    if (type === "contexte_historique") {
      return `Contexte historique factice pour ${reference} : détails sur l'époque, les destinataires d'origine et le problème adressé.`;
    }
    if (type === "priere") {
      return `Seigneur Jésus-Christ, nous prions pour que ta paix et ta vérité habitent en nous selon ${reference}. Amen.`;
    }
    return `Méditation factice générée lors du build pour le verset ${reference} ("${verse}") sous le thème ${theme}. Que la grâce et la paix de notre Seigneur Jésus-Christ vous accompagnent tout au long de cette journée de croissance spirituelle.`;
  }

  let prompt = "";
  if (type === "contexte_biblique") {
    prompt = `Génère le contexte biblique immédiat en français (2-3 phrases ou versets) autour de ce verset : ${reference} "${verse}"
Structure : Donne 2-3 versets immédiatement avant et/ou après, avec une brève explication du lien direct avec le verset principal.
Style : clair, instructif, ancré dans le texte. Prose fluide sans titres ni numéros.`;
  } else if (type === "contexte_historique") {
    prompt = `Génère le contexte historique et culturel en français (2-3 phrases) pour ce passage biblique : ${reference} "${verse}"
Structure : Précise qui a écrit le passage (si connu), à quelle époque, à quel peuple/personne ce message était originellement destiné, et quel problème ou situation ce texte adressait.
Style : historique, simple et éclairant. Prose fluide sans titres ni numéros.`;
  } else if (type === "priere") {
    prompt = `Génère une prière personnalisée, courte et inspirante en français (3-4 phrases) basée sur ce verset : ${reference} "${verse}" sous le thème "${theme}".
Structure : Une prière qui aide l'utilisateur à appliquer cette Parole dans sa vie quotidienne et à entrer dans la présence de Dieu.
Style : intime, bienveillant, sincère. Pas de titres ni de numéros.`;
  } else {
    prompt = `Génère une méditation biblique en français (150-200 mots) pour ce verset : ${reference} "${verse}"
Thème : ${theme}
Structure : contexte (2-3 phrases) → enseignement clé (3-4 phrases) → application pratique (2-3 phrases) → prière courte (2-3 phrases)
Style : chaleureux, encourageant, ancré dans la grâce de Dieu.
Prose fluide sans titres ni numéros.`;
  }

  try {
    return await callGemini(prompt, "gemini-2.5-flash");
  } catch (err: unknown) {
    console.warn("Gemini failed. Attempting fallback with Groq...", err);
    try {
      return await callGroq(prompt, "llama-3.3-70b-versatile");
    } catch (groqErr: unknown) {
      console.warn("Groq failed. Attempting fallback with GitHub Models...", groqErr);
      try {
        return await callGitHub(prompt, "gpt-4o");
      } catch (gitErr: unknown) {
        console.error("All AI providers failed.", gitErr);
        throw new Error("Unable to generate meditation. All AI providers failed.");
      }
    }
  }
}

/**
 * Génère un court message de réaction de notre mascotte Manny (1-2 phrases max).
 * Met en œuvre le même triple fallback et la même garde de build.
 */
export async function generateMannyMessage(
  context: string,
  mood: MannyMood
): Promise<string> {
  if (isBuildTime()) {
    return `Bonjour ! Je suis Manny, ton compagnon spirituel en humeur "${mood}". Prêt à grandir aujourd'hui ?`;
  }

  const prompt = `Tu es Manny, une Bible animée et chaleureuse qui encourage l'utilisateur dans sa croissance spirituelle.
Génère un court message d'encouragement ou de réaction en français (1 à 2 phrases maximum) correspondant à ce contexte et à ton humeur actuelle.
Contexte de l'utilisateur : "${context}"
Ton humeur actuelle : "${mood}"
Style : très chaleureux, court, bienveillant, et fraternel. Pas de titres ni de numéros.`;

  try {
    return await callGemini(prompt, "gemini-2.5-flash");
  } catch (err: unknown) {
    console.warn("Gemini failed for Manny message. Attempting Groq...", err);
    try {
      return await callGroq(prompt, "llama-3.3-70b-versatile");
    } catch (groqErr: unknown) {
      console.warn("Groq failed for Manny message. Attempting GitHub Models...", groqErr);
      try {
        return await callGitHub(prompt, "gpt-4o");
      } catch (gitErr: unknown) {
        console.error("All AI providers failed for Manny message.", gitErr);
        throw new Error("Unable to generate Manny message. All AI providers failed.");
      }
    }
  }
}

/**
 * Détermine si les réponses fournies par l'utilisateur sont sérieuses.
 */
function isAnswersSerious(answers: Record<string, string>): boolean {
  if (!answers) return false;
  
  // Concaténer toutes les réponses pour vérifier la longueur globale
  const allText = Object.values(answers).join("").trim();
  // Enlever les espaces et les ponctuations
  const cleanedText = allText.replace(/[\s\p{P}]/gu, "");
  if (cleanedText.length < 20) return false;

  // Expressions de remplissage typiques à rejeter
  const fillerWords = [
    "rien", "ok", "okay", "jesaispas", "jenesaispas", "ras", "aucun", 
    "none", "test", "pasde", "sans", "neant", "néant", "sansobjet"
  ];

  // Nettoyer une chaîne (accents, espaces, minuscules)
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
      .replace(/[^a-z0-9]/g, "");     // Garder uniquement l'alphanumérique
  };

  // Vérifier si au moins une réponse significative n'est pas du remplissage
  let hasSeriousAnswer = false;
  for (const key of Object.keys(answers)) {
    const val = answers[key]?.trim();
    if (!val) continue;
    
    const normVal = normalize(val);
    if (normVal.length > 0 && !fillerWords.includes(normVal)) {
      hasSeriousAnswer = true;
      break;
    }
  }

  return hasSeriousAnswer;
}

/**
 * Génère un résumé personnalisé réel en 3-4 phrases de ce que Dieu a dit à l'utilisateur,
 * basé uniquement sur ses réponses.
 */
export async function generatePersonalizedSummary(
  answers: Record<string, string>
): Promise<string | null> {
  if (isBuildTime()) {
    return "Dans cette méditation, Dieu t'a parlé de marcher avec assurance et foi face aux défis (résumé factice de build).";
  }

  if (!isAnswersSerious(answers)) {
    return null;
  }

  // Formater les réponses pour le prompt
  const formattedAnswers = Object.entries(answers)
    .filter(([_, val]) => val && val.trim().length > 0)
    .map(([key, val]) => `${key}: ${val.trim()}`)
    .join("\n");

  const prompt = `Voici ce qu'un croyant a écrit pendant sa méditation biblique :
${formattedAnswers}

Génère un résumé PERSONNEL en 3-4 phrases de ce que DIEU lui a dit à travers ce verset, basé UNIQUEMENT sur ce qu'il a écrit. Ne génère pas de résumé générique. Parle-lui directement à la deuxième personne. Commence par 'Dans cette méditation, Dieu t'a parlé de...'`;

  try {
    return await callGemini(prompt, "gemini-2.5-flash");
  } catch (err: unknown) {
    console.warn("Gemini failed for summary. Trying Groq...", err);
    try {
      return await callGroq(prompt, "llama-3.3-70b-versatile");
    } catch (groqErr: unknown) {
      console.warn("Groq failed for summary. Trying GitHub...", groqErr);
      try {
        return await callGitHub(prompt, "gpt-4o");
      } catch (gitErr: unknown) {
        console.error("All AI providers failed for summary.", gitErr);
        throw new Error("Unable to generate personalized summary. All AI providers failed.");
      }
    }
  }
}

/**
 * Génère une prière personnelle basée sur les réponses de méditation de l'utilisateur.
 */
export async function generatePersonalizedPrayer(
  answers: Record<string, string>,
  verse: string
): Promise<string> {
  const genericPrayer = "Seigneur, merci pour ta Parole aujourd'hui. Aide-moi à la garder précieusement dans mon cœur, à marcher selon tes voies et à te faire confiance à chaque étape de ma vie. Donne-moi la force d'appliquer cette vérité dans mes actions quotidiennes. Amen.";

  if (isBuildTime()) {
    return "Seigneur, tu m'as parlé aujourd'hui de marcher par la foi et de te faire confiance au quotidien. Merci pour ta grâce et ta Parole qui éclaire ma route. Amen. (prière factice)";
  }

  if (!isAnswersSerious(answers)) {
    return genericPrayer;
  }

  // Formater les réponses
  const formattedAnswers = Object.entries(answers)
    .filter(([_, val]) => val && val.trim().length > 0)
    .map(([key, val]) => `${key}: ${val.trim()}`)
    .join("\n");

  const prompt = `Voici ce qu'un croyant a vécu pendant sa méditation sur le verset "${verse}" :
${formattedAnswers}

Génère une prière PERSONNELLE de 4-6 phrases basée UNIQUEMENT sur ce qu'il a écrit et vécu. La prière doit mentionner les situations concrètes qu'il a partagées. Commence par 'Seigneur, tu m'as parlé aujourd'hui de...'`;

  try {
    return await callGemini(prompt, "gemini-2.5-flash");
  } catch (err: unknown) {
    console.warn("Gemini failed for personalized prayer. Trying Groq...", err);
    try {
      return await callGroq(prompt, "llama-3.3-70b-versatile");
    } catch (groqErr: unknown) {
      console.warn("Groq failed for personalized prayer. Trying GitHub...", groqErr);
      try {
        return await callGitHub(prompt, "gpt-4o");
      } catch (gitErr: unknown) {
        console.error("All AI providers failed for personalized prayer.", gitErr);
        return genericPrayer;
      }
    }
  }
}

/**
 * Génère une réponse d'assistance IA / Chat biblique autour d'un verset.
 */
export async function generateBibleChat(
  question: string,
  verseContext: string
): Promise<string> {
  if (isBuildTime()) {
    return "Je suis ton assistant biblique. À la lumière de ce verset, marchons par la foi et grandissons dans sa parole (réponse factice de build).";
  }

  const prompt = `Tu es un guide biblique bienveillant.
L'utilisateur lit le passage suivant : "${verseContext}"
Il pose cette question : "${question}"
Réponds en 3-4 phrases en français, de façon simple, profonde et pratique. Ne mets pas de titres ni de numéros.`;

  try {
    return await callGemini(prompt, "gemini-2.5-flash");
  } catch (err: unknown) {
    console.warn("Gemini failed for Bible chat. Trying Groq...", err);
    try {
      return await callGroq(prompt, "llama-3.3-70b-versatile");
    } catch (groqErr: unknown) {
      console.warn("Groq failed for Bible chat. Trying GitHub...", groqErr);
      try {
        return await callGitHub(prompt, "gpt-4o");
      } catch (gitErr: unknown) {
        console.error("All AI providers failed for Bible chat.", gitErr);
        throw new Error("Unable to answer. All AI providers failed.");
      }
    }
  }
}


