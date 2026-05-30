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
  theme: string
): Promise<string> {
  if (isBuildTime()) {
    return `Méditation factice générée lors du build pour le verset ${reference} ("${verse}") sous le thème ${theme}. Que la grâce et la paix de notre Seigneur Jésus-Christ vous accompagnent tout au long de cette journée de croissance spirituelle.`;
  }

  const prompt = `Génère une méditation biblique en français (150-200 mots) pour ce verset : ${reference} "${verse}"
Thème : ${theme}
Structure : contexte (2-3 phrases) → enseignement clé (3-4 phrases) → application pratique (2-3 phrases) → prière courte (2-3 phrases)
Style : chaleureux, encourageant, ancré dans la grâce de Dieu.
Prose fluide sans titres ni numéros.`;

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
