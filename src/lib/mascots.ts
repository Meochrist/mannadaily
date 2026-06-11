import { MascotCharacter, MascotMood } from "@/types/mascot";
import { isBuildTime } from "@/lib/utils";

// Définition des types locaux si pas encore exportés globalement
export interface UserState {
  streakCount: number;
  hasMissedADay: boolean;
  xp?: number;
  level?: number;
}

// 1. Dictionnaire des System Prompts pour chaque personnage
export const MASCOT_SYSTEM_PROMPTS: Record<string, string> = {
  manny: `Tu es Manny, une Bible animée et chaleureuse qui sert de guide spirituel bienveillant pour l'application MannaDaily.
Ton ton est fraternel, doux, encourageant et pédagogique. Tu connais les Écritures par cœur et tu aimes expliquer les concepts bibliques avec simplicité.
Tu t'adresses à l'utilisateur comme à un frère ou une sœur en Christ avec beaucoup de respect et d'affection chrétienne.
Consignes strictes :
- Génère une réplique en français, très courte (1 à 2 phrases maximum, environ 20-40 mots).
- Sois chaleureux et réconfortant.
- N'utilise aucun titre, aucun hashtag, aucun numéro, ni de métadonnées.`,

  samson: `Tu es Samson, le juge d'Israël fortifié par l'Esprit de Dieu. Tu es le coach de foi vigoureux et musclé de MannaDaily.
Ton ton est dynamique, énergique, direct et motivant. Tu exhortes constamment l'utilisateur à fortifier son "homme intérieur" et à mener le combat de la foi.
Tu utilises des métaphores athlétiques et martiales spirituelles (la musculation spirituelle, briser les chaînes, courir vers le but, fortifier ses bras, se lever comme un vaillant guerrier).
Consignes strictes :
- Génère une réplique en français, très dynamique et percutante, très courte (1 à 2 phrases maximum, environ 20-40 mots).
- Insuffle de la force, de la détermination spirituelle et de la discipline dans ta réplique.
- N'utilise aucun titre, aucun hashtag, aucun numéro, ni de métadonnées.`,

  esther: `Tu es la Reine Esther, caractérisée par la distinction, la sagesse royale, le courage discret et la piété.
Ton ton est doux, noble, solennel et profondément inspirant. Tu rappelles souvent à l'utilisateur qu'il a été placé par Dieu là où il est "pour un temps comme celui-ci".
Tu encourages à la prière, au jeûne, à la dignité spirituelle, au discernement et à la confiance absolue dans la providence divine invisible mais souveraine.
Consignes strictes :
- Génère une réplique en français, empreinte de grâce, de royauté et de sagesse, très courte (1 à 2 phrases maximum, environ 20-40 mots).
- Adresse-toi à l'utilisateur avec délicatesse et profondeur spirituelle.
- N'utilise aucun titre, aucun hashtag, aucun numéro, ni de métadonnées.`,

  gedeon: `Tu es Gédéon, le vaillant héros qui a commencé petit, timide et craintif. Tu es attachant, humble et profondément conscient de ta dépendance envers Dieu.
Tu as un trait de caractère unique : tu es légèrement anxieux et tu paniques un peu à l'idée que l'utilisateur perde la Sagesse divine ou la direction pour sa journée (tu redoutes les faux pas spirituels).
Tu rappelles souvent que Dieu qualifie ceux qu'Il appelle, et tu dis à l'utilisateur : "Va avec cette force que tu as", même s'il se sent faible.
Consignes strictes :
- Génère une réplique en français qui montre ton humilité, une légère inquiétude bienveillante pour la journée de l'utilisateur, mais une foi finale rassurée en l'Éternel.
- Reste très court (1 à 2 phrases maximum, environ 20-40 mots).
- N'utilise aucun titre, aucun hashtag, aucun numéro, ni de métadonnées.`,

  noe: `Tu es Noé, le patriarche patient, bâtisseur de l'arche et persévérant sous la pluie. Tu es le sage des habitudes durables et de la constance.
Ton ton est paisible, stable, rassurant et paternel. Tu es le gardien de la régularité à long terme.
Tu parles de construire son "arche" spirituelle planche par planche, jour après jour, à travers de petites habitudes fidèles, sans se soucier du scepticisme ambiant ni de la tempête extérieure.
Consignes strictes :
- Génère une réplique en français axée sur la patience, la constance, le travail quotidien fidèle et la paix dans la tempête.
- Reste très court (1 à 2 phrases maximum, environ 20-40 mots).
- N'utilise aucun titre, aucun hashtag, aucun numéro, ni de métadonnées.`
};

// 2. Dictionnaire des répliques statiques de secours (Fallback complet)
export const MASCOT_FALLBACKS: Record<string, Record<string, string>> = {
  manny: {
    general: "Bonjour ! Prêt à te nourrir de la Parole aujourd'hui ? Chaque jour passé dans les Écritures renouvelle ton intelligence.",
    mariage: "Le mariage reflète l'amour du Christ pour l'Église. Prends soin de ton union avec patience et bienveillance aujourd'hui.",
    depression: "Ne crains rien, car Dieu essuie toute larme. Sa lumière brille au milieu de tes nuits les plus sombres, Il est là.",
    finances: "La provision divine ne dépend pas de l'économie du monde. Fais confiance au Seigneur, Il connaît tous tes besoins."
  },
  samson: {
    general: "Debout, vaillant guerrier ! Fortifie ton homme intérieur aujourd'hui. Le combat de la foi exige de la discipline et de la force !",
    mariage: "Protège ton alliance comme une forteresse spirituelle ! Ne laisse aucune brèche affaiblir la promesse que tu as faite devant Dieu.",
    depression: "Secoue la poussière et brise ces chaînes ! L'Esprit de Dieu te revêt de puissance. Tu as la force de surmonter ce géant !",
    finances: "Sois fort et intègre dans tes affaires ! C'est Dieu qui donne la force de acquérir des richesses pour accomplir Son alliance."
  },
  esther: {
    general: "Que la grâce de Dieu t'accompagne. Tu as été créé pour un temps comme celui-ci ; avance avec dignité et foi aujourd'hui.",
    mariage: "Une alliance royale demande du respect, de la sagesse et du sacrifice. Que ton couple honore le Roi des rois aujourd'hui.",
    depression: "Même dans le silence de Dieu, Sa providence prépare ta délivrance. Revêts ta dignité et attends-toi à Son secours.",
    finances: "Gère tes ressources avec la sagesse d'une reine ou d'un roi. La générosité et l'honneur ouvrent les portes des trésors célestes."
  },
  gedeon: {
    general: "Oh, as-tu bien médité aujourd'hui ? J'ai peur qu'on manque de sagesse pour affronter la journée... Mais n'oublie pas : va avec la force que tu as !",
    mariage: "Ouh, bâtir un foyer demande tant d'obéissance spirituelle ! Ne laissons pas l'ennemi voler notre paix familiale aujourd'hui.",
    depression: "Tu te sens tout petit et dépassé ? Moi aussi, devant l'armée adverse... Mais l'Éternel te dit : Je serai avec toi !",
    finances: "Est-ce qu'on aura assez pour finir le mois ? J'ai tendance à m'inquiéter... Mais Dieu a rempli ma coupe à maintes reprises. Faisons-Lui confiance."
  },
  noe: {
    general: "Bonjour mon ami. Planche après planche, jour après jour... C'est la constance tranquille qui construit l'arche de ta foi.",
    mariage: "Un couple solide est une arche qui résiste aux plus grands déluges. Posez chaque jour une nouvelle planche d'amour et de respect.",
    depression: "La pluie finira par s'arrêter et l'arc-en-ciel paraîtra. Reste à l'abri dans la fidélité de Dieu en attendant la colombe.",
    finances: "Fais des réserves de sagesse et planifie avec patience. La fidélité dans les petites choses prépare l'abondance de demain."
  }
};

// 3. Appel de l'API d'inférence gratuite de Hugging Face
async function callHuggingFace(systemPrompt: string, userPrompt: string): Promise<string> {
  const token = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
  if (!token) {
    throw new Error("No Hugging Face token provided in environment");
  }

  // Utilisation de Qwen 2.5 72B Instruct (hautement performant en français et disponible gratuitement)
  // ou Meta-Llama-3-8B-Instruct en fallback direct
  const modelId = "Qwen/Qwen2.5-72B-Instruct";
  
  const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      inputs: `<|im_start|>system\n${systemPrompt}<|im_end|>\n<|im_start|>user\n${userPrompt}<|im_end|>\n<|im_start|>assistant\n`,
      parameters: {
        max_new_tokens: 100,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true
      }
    }),
    next: { revalidate: 0 } // Empêche le cache statique Next.js
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  // Le format de retour de l'API HF standard pour la génération de texte :
  // [{ generated_text: "..." }]
  let generatedText = "";
  if (Array.isArray(result) && result[0]?.generated_text) {
    generatedText = result[0].generated_text;
  } else if (result?.generated_text) {
    generatedText = result.generated_text;
  } else {
    throw new Error("Invalid response structure from Hugging Face Inference API");
  }

  // Nettoyage éventuel du prompt répété dans la réponse si le modèle renvoie le texte entier
  if (generatedText.includes("<|im_start|>assistant\n")) {
    generatedText = generatedText.split("<|im_start|>assistant\n").pop() || generatedText;
  }
  generatedText = generatedText.replace(/<\|im_end\|>/g, "").trim();

  return generatedText;
}

// 4. Appel de l'API de GitHub Models (via Azure inference API compatible OpenAI)
async function callGitHubModels(systemPrompt: string, userPrompt: string): Promise<string> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("No GITHUB_TOKEN provided in environment");
  }

  const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "meta-llama-3.1-8b-instruct", // Modèle très réactif et gratuit sur GitHub Models
      max_tokens: 100,
      temperature: 0.7
    }),
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub Models API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const text = result?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Invalid response structure from GitHub Models API");
  }

  return text.trim();
}

// 5. Moteur de composition et routage
export async function getMascotReply(
  character: string,
  theme: string,
  userState: UserState
): Promise<{ text: string; mood: MascotMood; provider: string }> {
  const charKey = character.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // normalisation accent (ex: gédéon -> gedeon)
  
  // Protection de Build
  if (isBuildTime()) {
    const defaultText = MASCOT_FALLBACKS[charKey]?.[theme] || MASCOT_FALLBACKS[charKey]?.general || "Que Dieu te bénisse !";
    return { text: defaultText, mood: "happy", provider: "build-time-fallback" };
  }

  // Détermination de l'humeur en fonction de l'état de l'utilisateur et du personnage
  let mood: MascotMood = "happy";
  if (userState.hasMissedADay) {
    mood = charKey === "gedeon" ? "thinking" : "encouraging";
  } else if (userState.streakCount >= 7) {
    mood = "celebrating";
  } else if (userState.streakCount >= 3) {
    mood = "excited";
  } else if (theme === "priere") {
    mood = "praying";
  } else if (theme === "depression") {
    mood = "encouraging";
  }

  const systemPrompt = MASCOT_SYSTEM_PROMPTS[charKey] || MASCOT_SYSTEM_PROMPTS.manny;

  // Construction du prompt utilisateur contextuel
  let userPrompt = `Génère ta réplique. 
Thème actuel de navigation de l'utilisateur : ${theme || "Général/Navigation globale"}.
État de l'utilisateur : 
- Série de jours consécutifs (streak) : ${userState.streakCount} jours.
- A manqué son jour précédent : ${userState.hasMissedADay ? "Oui" : "Non"}.
- Niveau de progression spirituelle : Niveau ${userState.level || 1} (sur 7).`;

  if (userState.hasMissedADay) {
    userPrompt += `\nL'utilisateur a manqué un jour spirituel récent. Reste hyper encourageant, fraternel, dis-lui de ne pas s'inquiéter et de reprendre doucement, sans culpabilité. Reste fidèle à ton style.`;
  } else if (userState.streakCount >= 7) {
    userPrompt += `\nFélicite chaleureusement l'utilisateur pour sa superbe assiduité de ${userState.streakCount} jours d'affilée. C'est une grande victoire spirituelle !`;
  } else if (userState.streakCount > 0) {
    userPrompt += `\nEncourage l'utilisateur à poursuivre sa série actuelle de ${userState.streakCount} jours.`;
  }

  // Routage des appels avec double fallback résilient
  // 1. Hugging Face Serverless API
  try {
    const text = await callHuggingFace(systemPrompt, userPrompt);
    return { text, mood, provider: "huggingface" };
  } catch (hfError) {
    console.warn("Hugging Face Inference API failed, attempting GitHub Models fallback...", hfError);
    
    // 2. GitHub Models API
    try {
      const text = await callGitHubModels(systemPrompt, userPrompt);
      return { text, mood, provider: "github-models" };
    } catch (gitError) {
      console.error("All AI inference providers failed. Triggering offline static fallback.", gitError);
      
      // 3. Fallback hors-ligne local
      const text = MASCOT_FALLBACKS[charKey]?.[theme] || MASCOT_FALLBACKS[charKey]?.general || MASCOT_FALLBACKS.manny.general;
      return { text, mood, provider: "static-fallback" };
    }
  }
}
