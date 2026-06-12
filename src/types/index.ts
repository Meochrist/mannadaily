export type MannyMood =
  | "happy"
  | "excited"
  | "thinking"
  | "encouraging"
  | "celebrating"
  | "sleeping"
  | "praying"
  | "sad";

export interface LevelConfig {
  level: number;
  name: string;
  xpRequired: number;
}

export const LEVELS: LevelConfig[] = [
  { level: 1, name: "Semence", xpRequired: 0 },
  { level: 2, name: "Pousse", xpRequired: 100 },
  { level: 3, name: "Arbre", xpRequired: 300 },
  { level: 4, name: "Berger", xpRequired: 600 },
  { level: 5, name: "Prophète", xpRequired: 1000 },
  { level: 6, name: "Apôtre", xpRequired: 2000 },
  { level: 7, name: "Lumière", xpRequired: 5000 },
];

export const XP_RULES = {
  DAILY_MEDITATION: 15,
  MEMORIZATION: 25,
  PROCLAMATION_SESSION: 20,
  STREAK_BONUS_BASE: 5,
};

export interface ThemeConfig {
  slug: ThemeSlug;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

export type ThemeSlug =
  | "joie"
  | "depression"
  | "finances"
  | "mariage"
  | "fiancailles"
  | "foi"
  | "guerison"
  | "identite"
  | "priere"
  | "leadership";

export const THEMES: ThemeConfig[] = [
  {
    slug: "joie",
    name: "Joie",
    emoji: "☀️",
    color: "from-amber-400 to-orange-500",
    description: "Célébrer la présence de Dieu et cultiver une joie inébranlable.",
  },
  {
    slug: "depression",
    name: "Dépression",
    emoji: "🌧️",
    color: "from-slate-500 to-indigo-800",
    description: "Trouver de l'espoir, du réconfort et de la lumière dans les moments sombres.",
  },
  {
    slug: "finances",
    name: "Finances",
    emoji: "💰",
    color: "from-emerald-400 to-teal-600",
    description: "Sagesse biblique sur la gestion financière et la provision divine.",
  },
  {
    slug: "mariage",
    name: "Mariage",
    emoji: "💍",
    color: "from-rose-400 to-pink-600",
    description: "Bâtir une union forte, sainte et épanouie selon le dessein de Dieu.",
  },
  {
    slug: "fiancailles",
    name: "Fiançailles",
    emoji: "💞",
    color: "from-purple-400 to-pink-500",
    description: "Se préparer spirituellement et émotionnellement à l'alliance du mariage.",
  },
  {
    slug: "foi",
    name: "Foi",
    emoji: "🛡️",
    color: "from-blue-500 to-indigo-600",
    description: "Développer une confiance absolue et inébranlable en Dieu et Ses promesses.",
  },
  {
    slug: "guerison",
    name: "Guérison",
    emoji: "🩹",
    color: "from-green-400 to-emerald-500",
    description: "Saisir la promesse de restauration et de santé physique et spirituelle.",
  },
  {
    slug: "identite",
    name: "Identité",
    emoji: "👑",
    color: "from-amber-500 to-yellow-600",
    description: "Découvrir qui nous sommes réellement en Christ et notre héritage spirituel.",
  },
  {
    slug: "priere",
    name: "Prière",
    emoji: "🙏",
    color: "from-sky-400 to-blue-600",
    description: "Approfondir sa communication intime et sa communion avec le Créateur.",
  },
  {
    slug: "leadership",
    name: "Leadership",
    emoji: "🦅",
    color: "from-violet-500 to-fuchsia-600",
    description: "Guider et influencer les autres avec intégrité, service et vision divine.",
  },
];
