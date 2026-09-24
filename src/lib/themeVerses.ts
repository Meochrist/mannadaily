import { verses } from "@/lib/verses";

export interface ThemeVerse {
  text: string;
  reference: string;
}

export interface ThemeProgress {
  currentIndex: number;
  completed: boolean;
}

const STORAGE_KEY = "manna_theme_progress";

// Filtre les versets du catalogue par thème interne (verses.ts)
function byTheme(theme: string, limit = 10): ThemeVerse[] {
  return verses
    .filter((v) => v.theme === theme)
    .slice(0, limit)
    .map((v) => ({ text: v.text, reference: v.reference }));
}

// Versets ajoutés manuellement pour les thèmes sans équivalent dans verses.ts
const MANUAL_VERSES: Record<string, ThemeVerse[]> = {
  finances: [
    { text: "Et mon Dieu pourvoira à tous vos besoins selon sa richesse, avec gloire, en Jésus-Christ.", reference: "Philippiens 4:19" },
    { text: "Honore l'Éternel avec tes biens, et avec les prémices de tout ton revenu.", reference: "Proverbes 3:9" },
    { text: "Souviens-toi de l'Éternel, ton Dieu, car c'est lui qui te donne de la force pour les acquérir.", reference: "Deutéronome 8:18" },
    { text: "Cherchez premièrement le royaume et la justice de Dieu ; et toutes ces choses vous seront données par-dessus.", reference: "Matthieu 6:33" },
    { text: "L'Éternel est mon berger : je ne manquerai de rien.", reference: "Psaumes 23:1" },
    { text: "Donnez, et il vous sera donné : on versera dans votre sein une bonne mesure, serrée, secouée et qui déborde.", reference: "Luc 6:38" },
    { text: "Celui qui aime l'argent n'est pas rassasié par l'argent, et celui qui aime les richesses n'en profite pas.", reference: "Ecclésiaste 5:9" },
    { text: "La bénédiction de l'Éternel enrichit, et il ne la fait suivre d'aucun chagrin.", reference: "Proverbes 10:22" },
  ],
  guerison: [
    { text: "Il guérit ceux qui ont le cœur brisé, et il panse leurs blessures.", reference: "Psaumes 147:3" },
    { text: "Mais il était blessé pour nos péchés, brisé pour nos iniquités ; le châtiment qui nous donne la paix est tombé sur lui, et c'est par ses meurtrissures que nous sommes guéris.", reference: "Ésaïe 53:5" },
    { text: "Je suis l'Éternel, qui te guérit.", reference: "Exode 15:26" },
    { text: "Il envoie sa parole et les guérit, il les fait échapper à la tombe.", reference: "Psaumes 107:20" },
    { text: "La prière de la foi sauvera le malade, et le Seigneur le relèvera.", reference: "Jacques 5:15" },
    { text: "Guéris-moi, Éternel, et je serai guéri ; sauve-moi, et je serai sauvé ; car tu es ma gloire.", reference: "Jérémie 17:14" },
    { text: "Mon âme, bénis l'Éternel ! C'est lui qui pardonne toutes tes iniquités, qui guérit toutes tes maladies.", reference: "Psaumes 103:2-3" },
    { text: "Il a porté nos maladies, et il s'est chargé de nos douleurs.", reference: "Ésaïe 53:4" },
  ],
  identite: [
    { text: "Vous, au contraire, vous êtes une race élue, un sacerdoce royal, une nation sainte, un peuple acquis.", reference: "1 Pierre 2:9" },
    { text: "Car nous sommes son ouvrage, ayant été créés en Jésus-Christ pour de bonnes œuvres.", reference: "Éphésiens 2:10" },
    { text: "Mais à tous ceux qui l'ont reçue, elle a donné le pouvoir de devenir enfants de Dieu.", reference: "Jean 1:12" },
    { text: "Vous êtes la lumière du monde. Une ville située sur une montagne ne peut être cachée.", reference: "Matthieu 5:14" },
    { text: "Si quelqu'un est en Christ, il est une nouvelle créature. Les choses anciennes sont passées ; voici, toutes choses sont devenues nouvelles.", reference: "2 Corinthiens 5:17" },
    { text: "Je te loue de ce que je suis une créature si merveilleuse. Tes œuvres sont admirables.", reference: "Psaumes 139:14" },
    { text: "Car vous êtes tous fils de Dieu par la foi en Jésus-Christ.", reference: "Galates 3:26" },
    { text: "Vous êtes le sel de la terre.", reference: "Matthieu 5:13" },
  ],
};

// Mapping slug de thème (THEMES) → versets du parcours
export const THEME_VERSES: Record<string, ThemeVerse[]> = {
  joie: byTheme("Joie"),
  depression: [...byTheme("Espérance", 5), ...byTheme("Paix", 5)],
  finances: MANUAL_VERSES.finances,
  mariage: byTheme("Amour"),
  fiancailles: byTheme("Amour"),
  foi: byTheme("Foi"),
  guerison: MANUAL_VERSES.guerison,
  identite: MANUAL_VERSES.identite,
  priere: byTheme("Prière"),
  leadership: byTheme("Sagesse"),
};

export function getThemeVerses(slug: string): ThemeVerse[] {
  return THEME_VERSES[slug] || [];
}

// === Progression persistée (localStorage) ===

function loadAllProgress(): Record<string, ThemeProgress> {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function getThemeProgress(slug: string): ThemeProgress {
  const all = loadAllProgress();
  return all[slug] || { currentIndex: 0, completed: false };
}

export function advanceThemeProgress(slug: string): ThemeProgress {
  const all = loadAllProgress();
  const themeVerses = getThemeVerses(slug);
  const current = all[slug] || { currentIndex: 0, completed: false };

  const nextIndex = current.completed ? current.currentIndex : current.currentIndex + 1;
  const completed = nextIndex >= themeVerses.length && themeVerses.length > 0;

  const next: ThemeProgress = {
    currentIndex: completed ? themeVerses.length : nextIndex,
    completed,
  };
  all[slug] = next;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore quota/privé
  }
  return next;
}

export function resetThemeProgress(slug: string): void {
  const all = loadAllProgress();
  delete all[slug];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}
