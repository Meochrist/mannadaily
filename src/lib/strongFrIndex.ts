/**
 * Index français → termes anglais des définitions Strong.
 *
 * Les entrées Strong (StrongEntry.definition / kjvUsage) sont en anglais.
 * Un utilisateur francophone tape « lumière », « paix », « amour »… : ce
 * mapping traduit sa requête en mots-clés anglais pour interroger la base.
 *
 * Source unique de vérité utilisée par /api/bible/strong/search.
 */

export const FR_TO_EN: Record<string, string[]> = {
  amour: ["love", "beloved", "charity"],
  aimer: ["love", "beloved"],
  lumiere: ["light", "shine", "bright"],
  tenebres: ["darkness", "dark"],
  paix: ["peace", "peaceful", "quietness"],
  grace: ["grace", "favour", "favor", "gracious"],
  foi: ["faith", "belief", "faithful"],
  croire: ["believe", "faith"],
  esprit: ["spirit", "breath", "wind", "ghost"],
  ame: ["soul", "life", "person"],
  coeur: ["heart", "mind", "inner"],
  dieu: ["God", "god", "deity", "divine"],
  seigneur: ["Lord", "master", "LORD"],
  saint: ["holy", "sacred", "saint", "consecrated"],
  saintete: ["holiness", "holy", "sanctity"],
  peche: ["sin", "transgression", "iniquity", "trespass"],
  pardon: ["forgive", "forgiveness", "pardon", "remission"],
  salut: ["salvation", "save", "deliverance", "saviour"],
  sauver: ["save", "salvation", "deliver", "rescue"],
  vie: ["life", "living", "alive"],
  mort: ["death", "die", "dead"],
  priere: ["prayer", "pray", "supplication", "intercession"],
  prier: ["pray", "prayer", "supplication"],
  louange: ["praise", "laud", "extol"],
  louer: ["praise", "laud", "extol"],
  adoration: ["worship", "adore", "reverence"],
  adorer: ["worship", "bow", "reverence"],
  gloire: ["glory", "honour", "honor", "splendour"],
  puissance: ["power", "might", "strength", "authority"],
  force: ["strength", "might", "power", "strong"],
  joie: ["joy", "rejoice", "gladness", "glad"],
  espoir: ["hope", "expectation", "trust"],
  esperance: ["hope", "expectation", "trust"],
  verite: ["truth", "true", "faithfulness"],
  parole: ["word", "speech", "saying", "utterance"],
  mot: ["word", "speech", "saying"],
  sagesse: ["wisdom", "wise", "prudence"],
  connaissance: ["knowledge", "know", "understanding"],
  justice: ["righteousness", "just", "justice", "righteous"],
  juste: ["righteous", "just", "upright"],
  misericorde: ["mercy", "compassion", "kindness", "lovingkindness"],
  bonte: ["goodness", "kindness", "good"],
  benediction: ["blessing", "bless", "blessed"],
  benir: ["bless", "blessing", "blessed"],
  alliance: ["covenant", "testament", "league"],
  loi: ["law", "commandment", "statute", "precept"],
  commandement: ["commandment", "command", "precept"],
  ange: ["angel", "messenger"],
  ciel: ["heaven", "sky", "heavens"],
  terre: ["earth", "land", "ground", "country"],
  eau: ["water", "waters"],
  feu: ["fire", "flame", "burning"],
  sang: ["blood"],
  pain: ["bread", "loaf", "food"],
  vin: ["wine"],
  huile: ["oil", "ointment"],
  berger: ["shepherd", "pastor", "feed"],
  brebis: ["sheep", "lamb", "flock"],
  agneau: ["lamb", "sheep"],
  roi: ["king", "reign", "royal"],
  royaume: ["kingdom", "reign", "realm"],
  temple: ["temple", "sanctuary", "house"],
  autel: ["altar"],
  sacrifice: ["sacrifice", "offering", "oblation"],
  offrande: ["offering", "oblation", "gift"],
  jeune: ["fast", "fasting"],
  repentance: ["repent", "repentance", "turn"],
  humilite: ["humble", "humility", "lowly"],
  orgueil: ["pride", "proud", "arrogance"],
  colere: ["anger", "wrath", "fury", "indignation"],
  crainte: ["fear", "reverence", "dread"],
  peur: ["fear", "afraid", "terror"],
  courage: ["courage", "strong", "bold", "boldness"],
  patience: ["patience", "longsuffering", "endurance"],
  perseverance: ["perseverance", "endurance", "steadfast"],
  epreuve: ["trial", "temptation", "test", "prove"],
  tentation: ["temptation", "tempt", "trial"],
  victoire: ["victory", "overcome", "conquer"],
  ennemi: ["enemy", "adversary", "foe"],
  guerre: ["war", "battle", "fight"],
  guerison: ["heal", "healing", "cure", "health"],
  guerir: ["heal", "healing", "cure", "restore"],
  malade: ["sick", "sickness", "infirmity", "disease"],
  miracle: ["miracle", "wonder", "sign", "mighty"],
  prophete: ["prophet", "prophesy", "seer"],
  prophetie: ["prophecy", "prophesy", "prophetic"],
  apotre: ["apostle", "sent", "messenger"],
  disciple: ["disciple", "learner", "follower"],
  eglise: ["church", "assembly", "congregation"],
  peuple: ["people", "nation", "folk"],
  nation: ["nation", "gentile", "heathen", "people"],
  serviteur: ["servant", "slave", "minister"],
  service: ["service", "ministry", "minister"],
  don: ["gift", "grace", "present"],
  fruit: ["fruit", "produce", "increase"],
  semence: ["seed", "sow", "offspring"],
  moisson: ["harvest", "reap", "ingathering"],
  chemin: ["way", "path", "road", "journey"],
  porte: ["door", "gate", "entrance"],
  pierre: ["stone", "rock"],
  rocher: ["rock", "stone", "cliff"],
  maison: ["house", "household", "home"],
  pere: ["father", "ancestor"],
  fils: ["son", "child"],
  mere: ["mother"],
  fille: ["daughter", "girl"],
  frere: ["brother", "brethren"],
  enfant: ["child", "children", "son"],
  homme: ["man", "mankind", "person", "male"],
  femme: ["woman", "wife", "female"],
  nom: ["name", "named", "renown"],
  temps: ["time", "season", "period"],
  jour: ["day", "daily"],
  nuit: ["night"],
  eternite: ["eternal", "everlasting", "forever", "eternity"],
  eternel: ["eternal", "everlasting", "forever"],
  gloire_de_dieu: ["glory", "shekinah", "splendour"],
  liberte: ["freedom", "liberty", "free", "deliver"],
  esclave: ["slave", "servant", "bondage"],
  richesse: ["riches", "wealth", "treasure"],
  pauvre: ["poor", "needy", "afflicted"],
  don_de_dieu: ["gift", "grace", "charisma"],
  consolation: ["comfort", "consolation", "encourage"],
  reconfort: ["comfort", "console", "encourage"],
  refuge: ["refuge", "shelter", "fortress", "trust"],
  bouclier: ["shield", "buckler", "defence"],
  epee: ["sword"],
  couronne: ["crown", "diadem", "garland"],
  tresor: ["treasure", "riches", "store"],
  lumiere_du_monde: ["light", "lamp", "shine"],
  lampe: ["lamp", "light", "candle"],
  sel: ["salt"],
  levain: ["leaven"],
  vigne: ["vine", "vineyard"],
  olivier: ["olive", "oliveyard"],
  desert: ["wilderness", "desert", "waste"],
  montagne: ["mountain", "mount", "hill"],
  mer: ["sea", "ocean"],
  fleuve: ["river", "stream", "flood"],
};

/** Retire les accents et met en minuscules : « Lumière » → « lumiere ». */
export function normalizeFr(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim();
}

/**
 * Traduit une requête française en mots-clés anglais présents dans les
 * définitions Strong. Retourne [] si le mot n'est pas dans l'index (on
 * retombe alors sur une recherche directe).
 */
export function resolveFrToEn(query: string): string[] {
  const key = normalizeFr(query);
  if (!key) return [];

  // Correspondance exacte
  if (FR_TO_EN[key]) return FR_TO_EN[key];

  // Correspondance par préfixe (« aimer » trouve « aime », « lumier » → « lumiere »)
  for (const [fr, en] of Object.entries(FR_TO_EN)) {
    if (fr.startsWith(key) || key.startsWith(fr)) return en;
  }

  return [];
}
