const fs = require('fs');
const path = require('path');

const CHARACTERS = ['manny', 'samson', 'esther', 'gedeon', 'noe', 'paul', 'pierre', 'moise', 'abraham', 'david'];
const POSES = ['idle', 'jumping', 'sad', 'running'];
const EXPRESSIONS = ['neutral', 'happy', 'sweating', 'crying'];
const OUTFITS = ['default', 'winter', 'beach', 'halloween'];

const outputBase = path.join('D:', 'Antigravity', 'mannadaily', 'public', 'assets', 'characters');

// Assurer l'existence du dossier de base
if (!fs.existsSync(outputBase)) {
  fs.mkdirSync(outputBase, { recursive: true });
}

// Couleurs et spécificités de design par personnage
const DESIGN_CONFIGS = {
  manny: {
    primary: '#4F46E5', // Indigo couverture
    secondary: '#818CF8', // Indigo clair
    skin: '#FFFFFF', // Pages du livre
    hair: '#64748B', // Jambes/bras gris
  },
  samson: {
    primary: '#EA580C', // Tunique orange
    secondary: '#DC2626', // Ceinture rouge
    skin: '#FDBA74', // Peau beige
    hair: '#78350F', // Cheveux bruns longs
  },
  esther: {
    primary: '#EC4899', // Robe rose
    secondary: '#F472B6', // Ceinture rose clair
    skin: '#FDE68A', // Peau dorée
    hair: '#7C3AED', // Cheveux violets longs
  },
  gedeon: {
    primary: '#D97706', // Armure jaune
    secondary: '#B45309', // Casque bronze
    skin: '#FDBA74', // Peau beige
    hair: '#451A03', // Cheveux noirs courts
  },
  noe: {
    primary: '#854D0E', // Tunique marron
    secondary: '#A16207', // Cordage
    skin: '#FED7AA', // Peau claire
    hair: '#E2E8F0', // Barbe blanche longue
  },
  paul: {
    primary: '#CA8A04', // Tunique dorée
    secondary: '#854D0E', // Parchemin/Cape
    skin: '#FED7AA', // Peau claire
    hair: '#78350F', // Barbe courte brune
  },
  pierre: {
    primary: '#2563EB', // Tunique bleu
    secondary: '#3B82F6', // Filet de pêche
    skin: '#F3F4F6', // Peau claire
    hair: '#94A3B8', // Barbe grise
  },
  moise: {
    primary: '#4B5563', // Tunique grise
    secondary: '#9CA3AF', // Tables de la loi
    skin: '#FDE68A', // Peau caramel
    hair: '#F8FAFC', // Barbe blanche volumineuse
  },
  abraham: {
    primary: '#D97706', // Tunique sable
    secondary: '#78350F', // Bâton
    skin: '#FED7AA', // Peau claire
    hair: '#CBD5E1', // Barbe longue grise/blanche
  },
  david: {
    primary: '#F59E0B', // Tunique jaune
    secondary: '#FBBF24', // Couronne dorée
    skin: '#FDBA74', // Peau beige
    hair: '#F59E0B', // Cheveux roux/blonds
  }
};

// --- TEMPLATES DES POSES ---
function getPoseSVG(char, pose) {
  const config = DESIGN_CONFIGS[char];
  
  if (char === 'manny') {
    // Manny est une Bible animée (Livre ouvert)
    if (pose === 'idle') {
      return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <!-- Couverture -->
        <rect x="23" y="28" width="54" height="44" rx="6" fill="${config.primary}" />
        <!-- Pages blanches -->
        <path d="M26 30 h22 v38 h-22 z M52 30 h22 v38 h-22 z" fill="${config.skin}" />
        <!-- Tranche / Reliure -->
        <rect x="48" y="29" width="4" height="42" rx="1" fill="#F1F5F9" />
        <!-- Bras -->
        <rect x="16" y="45" width="8" height="6" rx="3" fill="${config.hair}" />
        <rect x="76" y="45" width="8" height="6" rx="3" fill="${config.hair}" />
        <!-- Jambes -->
        <rect x="38" y="72" width="6" height="12" rx="3" fill="${config.hair}" />
        <rect x="56" y="72" width="6" height="12" rx="3" fill="${config.hair}" />
      </svg>`;
    } else if (pose === 'jumping') {
      return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <!-- Couverture penchée -->
        <rect x="23" y="22" width="54" height="44" rx="6" fill="${config.primary}" transform="rotate(-5 50 44)" />
        <!-- Pages blanches -->
        <path d="M26 24 h22 v38 h-22 z M52 24 h22 v38 h-22 z" fill="${config.skin}" transform="rotate(-5 50 44)" />
        <!-- Tranche -->
        <rect x="48" y="23" width="4" height="42" rx="1" fill="#F1F5F9" transform="rotate(-5 50 44)" />
        <!-- Bras levés -->
        <path d="M12 30 Q16 40 22 42" stroke="${config.hair}" stroke-width="5" stroke-linecap="round" fill="none" />
        <path d="M88 30 Q84 40 78 42" stroke="${config.hair}" stroke-width="5" stroke-linecap="round" fill="none" />
        <!-- Jambes en l'air -->
        <rect x="36" y="66" width="6" height="14" rx="3" fill="${config.hair}" transform="rotate(-20 36 66)" />
        <rect x="58" y="66" width="6" height="14" rx="3" fill="${config.hair}" transform="rotate(20 58 66)" />
      </svg>`;
    } else if (pose === 'sad') {
      return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <!-- Couverture à moitié refermée -->
        <rect x="26" y="32" width="48" height="44" rx="6" fill="${config.primary}" />
        <!-- Pages blanches refermées -->
        <path d="M29 34 h19 v38 h-19 z M52 34 h19 v38 h-19 z" fill="${config.skin}" />
        <rect x="48" y="33" width="4" height="42" rx="1" fill="#E2E8F0" />
        <!-- Bras ballants tristes -->
        <path d="M20 52 Q23 62 25 68" stroke="${config.hair}" stroke-width="5" stroke-linecap="round" fill="none" />
        <path d="M80 52 Q77 62 75 68" stroke="${config.hair}" stroke-width="5" stroke-linecap="round" fill="none" />
        <!-- Jambes fléchies -->
        <path d="M38 76 v6 h-3" stroke="${config.hair}" stroke-width="5" stroke-linecap="round" fill="none" />
        <path d="M62 76 v6 h3" stroke="${config.hair}" stroke-width="5" stroke-linecap="round" fill="none" />
      </svg>`;
    } else { // running
      return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <!-- Couverture inclinée course -->
        <rect x="23" y="26" width="54" height="44" rx="6" fill="${config.primary}" transform="skewX(-10) rotate(-2 50 48)" />
        <!-- Pages blanches -->
        <path d="M26 28 h22 v38 h-22 z M52 28 h22 v38 h-22 z" fill="${config.skin}" transform="skewX(-10) rotate(-2 50 48)" />
        <!-- Tranche -->
        <rect x="48" y="27" width="4" height="42" rx="1" fill="#F1F5F9" transform="skewX(-10) rotate(-2 50 48)" />
        <!-- Bras de course -->
        <path d="M14 42 Q20 48 16 56" stroke="${config.hair}" stroke-width="5" stroke-linecap="round" fill="none" />
        <path d="M86 42 Q80 48 84 56" stroke="${config.hair}" stroke-width="5" stroke-linecap="round" fill="none" />
        <!-- Jambes de course actives -->
        <path d="M35 70 Q30 80 40 84" stroke="${config.hair}" stroke-width="5" stroke-linecap="round" fill="none" />
        <path d="M55 70 Q65 75 60 84" stroke="${config.hair}" stroke-width="5" stroke-linecap="round" fill="none" />
      </svg>`;
    }
  }

  // Autres personnages : Humains modulaires stylisés (Style flat design Duolingo)
  // Base commune de pose humaine
  let bodyPath = '';
  let limbsPath = '';
  let detailsPath = '';

  if (pose === 'idle') {
    limbsPath = `
      <!-- Jambes droites -->
      <rect x="40" y="70" width="7" height="15" rx="3.5" fill="${config.skin}" />
      <rect x="53" y="70" width="7" height="15" rx="3.5" fill="${config.skin}" />
      <!-- Pieds/Chaussures -->
      <rect x="37" y="82" width="10" height="4" rx="2" fill="${config.secondary}" />
      <rect x="53" y="82" width="10" height="4" rx="2" fill="${config.secondary}" />
      <!-- Bras -->
      <rect x="25" y="44" width="7" height="22" rx="3.5" fill="${config.skin}" />
      <rect x="68" y="44" width="7" height="22" rx="3.5" fill="${config.skin}" />
    `;
    bodyPath = `
      <!-- Tunique / Torse -->
      <rect x="31" y="42" width="38" height="30" rx="8" fill="${config.primary}" />
    `;
  } else if (pose === 'jumping') {
    limbsPath = `
      <!-- Jambes fléchies en l'air -->
      <rect x="36" y="65" width="7" height="15" rx="3.5" fill="${config.skin}" transform="rotate(-30 36 65)" />
      <rect x="57" y="65" width="7" height="15" rx="3.5" fill="${config.skin}" transform="rotate(30 57 65)" />
      <!-- Pieds -->
      <rect x="28" y="73" width="10" height="4" rx="2" fill="${config.secondary}" transform="rotate(-30 28 73)" />
      <rect x="62" y="73" width="10" height="4" rx="2" fill="${config.secondary}" transform="rotate(30 62 73)" />
      <!-- Bras levés de joie -->
      <rect x="22" y="28" width="7" height="22" rx="3.5" fill="${config.skin}" transform="rotate(45 22 28)" />
      <rect x="71" y="28" width="7" height="22" rx="3.5" fill="${config.skin}" transform="rotate(-45 71 28)" />
    `;
    bodyPath = `
      <!-- Torse -->
      <rect x="31" y="38" width="38" height="30" rx="8" fill="${config.primary}" />
    `;
  } else if (pose === 'sad') {
    limbsPath = `
      <!-- Jambes -->
      <rect x="41" y="72" width="6" height="14" rx="3" fill="${config.skin}" />
      <rect x="53" y="72" width="6" height="14" rx="3" fill="${config.skin}" />
      <!-- Bras ballants tristes -->
      <rect x="26" y="48" width="6" height="22" rx="3" fill="${config.skin}" transform="rotate(5 26 48)" />
      <rect x="68" y="48" width="6" height="22" rx="3" fill="${config.skin}" transform="rotate(-5 68 48)" />
    `;
    bodyPath = `
      <!-- Torse affaissé -->
      <rect x="32" y="44" width="36" height="30" rx="8" fill="${config.primary}" />
    `;
  } else { // running
    limbsPath = `
      <!-- Jambes en course -->
      <rect x="34" y="68" width="7" height="16" rx="3.5" fill="${config.skin}" transform="rotate(-40 34 68)" />
      <rect x="52" y="68" width="7" height="16" rx="3.5" fill="${config.skin}" transform="rotate(30 52 68)" />
      <!-- Bras course -->
      <rect x="22" y="46" width="7" height="20" rx="3.5" fill="${config.skin}" transform="rotate(45 22 46)" />
      <rect x="68" y="42" width="7" height="20" rx="3.5" fill="${config.skin}" transform="rotate(-30 68 42)" />
    `;
    bodyPath = `
      <!-- Torse incliné -->
      <rect x="31" y="40" width="38" height="30" rx="8" fill="${config.primary}" transform="skewX(-8)" />
    `;
  }

  // Éléments de costume ou identités spécifiques
  if (char === 'samson') {
    // Samson a des muscles et un bandeau de sport sur le torse ou les bras
    detailsPath = `<circle cx="37" cy="50" r="3" fill="#B45309" />
                   <circle cx="63" cy="50" r="3" fill="#B45309" />`;
  } else if (char === 'esther') {
    // Esther a une longue robe qui remplace la tunique standard
    bodyPath = `
      <path d="M31 42 h38 L74 74 H26 Z" fill="${config.primary}" />
      <rect x="36" y="40" width="28" height="5" fill="${config.secondary}" rx="2" />
    `;
  } else if (char === 'gedeon') {
    // Gédéon a un petit bouclier ou une cuirasse
    detailsPath = `<circle cx="50" cy="55" r="8" fill="${config.secondary}" opacity="0.3" />`;
  } else if (char === 'noe') {
    // Noé a une barbe (qui sera dans l'expression) et un bâton ou des cordages
    detailsPath = `<line x1="22" y1="38" x2="22" y2="84" stroke="#78350F" stroke-width="4" stroke-linecap="round" />`;
  } else if (char === 'paul') {
    // Paul tient un parchemin blanc/crème
    detailsPath = `<rect x="58" y="52" width="14" height="20" rx="2" fill="#FEF08A" stroke="#CA8A04" stroke-width="2" transform="rotate(15 58 52)" />`;
  } else if (char === 'pierre') {
    // Pierre a un filet de pêche drapé
    detailsPath = `<path d="M 32 42 Q 50 64 68 42" fill="none" stroke="${config.secondary}" stroke-width="2.5" stroke-dasharray="2 2" />`;
  } else if (char === 'moise') {
    // Moïse tient les Tables de la Loi
    detailsPath = `
      <rect x="42" y="52" width="16" height="20" rx="3" fill="#9CA3AF" />
      <line x1="50" y1="52" x2="50" y2="72" stroke="#4B5563" stroke-width="2" />
    `;
  } else if (char === 'abraham') {
    // Abraham tient un bâton de marche simple
    detailsPath = `<line x1="24" y1="36" x2="24" y2="84" stroke="#854D0E" stroke-width="3.5" stroke-linecap="round" />`;
  } else if (char === 'david') {
    // David a une fronde dans la main
    detailsPath = `<path d="M 22 55 Q 16 66 22 75" fill="none" stroke="#78350F" stroke-width="2" />`;
  }

  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    ${limbsPath}
    ${bodyPath}
    ${detailsPath}
  </svg>`;
}

// --- TEMPLATES DES EXPRESSIONS ---
function getExpressionSVG(char, expr) {
  const config = DESIGN_CONFIGS[char];
  
  // Coordonnées de base pour aligner la tête
  let headX = 50;
  let headY = 28;
  
  // Ajuster légèrement le y de la tête selon le perso
  if (char === 'esther') headY = 26;
  if (char === 'gedeon') headY = 32; // plus petit
  if (char === 'noe') headY = 27;

  // Partie 1 : Tête et cheveux spécifiques du perso
  let headBase = '';
  let hairBase = '';
  let beardBase = '';

  if (char === 'manny') {
    // Manny est une Bible, son visage est dessiné directement sur les pages ouvertes.
    // Pas de forme de tête circulaire séparée, on se positionne sur le livre de la pose.
    let faceElements = '';
    if (expr === 'neutral') {
      faceElements = `
        <circle cx="40" cy="48" r="2.5" fill="#1E293B" />
        <circle cx="39.2" cy="47.2" r="0.8" fill="#FFFFFF" />
        <circle cx="60" cy="48" r="2.5" fill="#1E293B" />
        <circle cx="59.2" cy="47.2" r="0.8" fill="#FFFFFF" />
        <ellipse cx="36" cy="51" rx="2.2" ry="1.2" fill="#FDA4AF" opacity="0.6" />
        <ellipse cx="64" cy="51" rx="2.2" ry="1.2" fill="#FDA4AF" opacity="0.6" />
        <path d="M47 55 Q50 58 53 55" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" fill="none" />
      `;
    } else if (expr === 'happy') {
      faceElements = `
        <path d="M37 49 Q40 45 43 49" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" fill="none" />
        <path d="M57 49 Q60 45 63 49" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" fill="none" />
        <ellipse cx="36" cy="52" rx="2.2" ry="1.2" fill="#FDA4AF" opacity="0.6" />
        <ellipse cx="64" cy="52" rx="2.2" ry="1.2" fill="#FDA4AF" opacity="0.6" />
        <path d="M45 53 Q50 62 55 53" fill="#EF4444" />
      `;
    } else if (expr === 'sweating') {
      faceElements = `
        <circle cx="40" cy="49" r="2.5" fill="#1E293B" />
        <circle cx="39.2" cy="48.2" r="0.8" fill="#FFFFFF" />
        <circle cx="60" cy="49" r="2.5" fill="#1E293B" />
        <circle cx="59.2" cy="48.2" r="0.8" fill="#FFFFFF" />
        <ellipse cx="36" cy="52" rx="2" ry="1.1" fill="#FDA4AF" opacity="0.5" />
        <ellipse cx="64" cy="52" rx="2" ry="1.1" fill="#FDA4AF" opacity="0.5" />
        <path d="M46 56 h8" stroke="#1E293B" stroke-width="2" stroke-linecap="round" />
        <path d="M68 40 Q69 48 65 48" fill="#3B82F6" opacity="0.8" /> <!-- Goutte -->
      `;
    } else { // crying
      faceElements = `
        <path d="M37 51 Q40 55 43 51" stroke="#1E293B" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M57 51 Q60 55 63 51" stroke="#1E293B" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M46 58 Q50 55 54 58" stroke="#1E293B" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M39 52 v12" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round" /> <!-- Larme -->
        <path d="M61 52 v12" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round" /> <!-- Larme -->
      `;
    }
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${faceElements}</svg>`;
  }

  // --- PERSONNAGES HUMAINS ---
  // Tête et Coiffure
  headBase = `<circle cx="${headX}" cx="${headX}" cy="${headY}" r="15" fill="${config.skin}" />`;

  if (char === 'samson') {
    // Cheveux longs bruns
    hairBase = `
      <path d="M 32 ${headY} C 30 5 70 5 68 ${headY} C 72 45 74 60 70 65 C 65 60 62 45 62 40 L 38 40 C 38 45 35 60 30 65 C 26 60 28 45 32 ${headY} Z" fill="${config.hair}" />
      <rect x="34" y="${headY - 14}" width="32" height="4" fill="${config.secondary}" rx="1" /> <!-- Bandeau sport -->
    `;
  } else if (char === 'esther') {
    // Cheveux longs violets, couronne dorée
    hairBase = `
      <path d="M 30 ${headY} C 25 10 75 10 70 ${headY} C 75 55 72 70 66 72 C 62 60 62 42 62 38 L 38 38 C 38 42 38 60 34 72 C 28 70 25 55 30 ${headY} Z" fill="${config.hair}" />
      <path d="M 42 ${headY - 14} L 45 ${headY - 20} L 50 ${headY - 16} L 55 ${headY - 20} L 58 ${headY - 14} Z" fill="#FBBF24" /> <!-- Couronne -->
    `;
  } else if (char === 'gedeon') {
    // Cheveux courts noirs sous un grand casque en bronze
    hairBase = `
      <path d="M 34 ${headY - 1} C 35 15 65 15 66 ${headY - 1} Z" fill="${config.hair}" />
      <path d="M 30 ${headY - 3} C 30 ${headY - 22} 70 ${headY - 22} 70 ${headY - 3} L 72 ${headY - 2} C 62 ${headY - 5} 38 ${headY - 5} 28 ${headY - 2} Z" fill="${config.secondary}" /> <!-- Casque -->
      <rect x="47" y="${headY - 22}" width="6" height="6" fill="#F59E0B" rx="1" /> <!-- Pompon du casque -->
    `;
  } else if (char === 'noe') {
    // Cheveux gris courts et longue barbe blanche
    hairBase = `
      <path d="M 33 ${headY + 3} C 32 10 68 10 67 ${headY + 3} Z" fill="#CBD5E1" />
    `;
    beardBase = `
      <path d="M 35 ${headY + 5} C 35 55 65 55 65 ${headY + 5} Z" fill="${config.hair}" />
    `;
  } else if (char === 'paul') {
    // Cheveux et barbe courte brune
    hairBase = `
      <path d="M 33 ${headY + 3} C 32 12 68 12 67 ${headY + 3} Z" fill="${config.hair}" />
    `;
    beardBase = `
      <path d="M 36 ${headY + 6} C 38 45 62 45 64 ${headY + 6} Z" fill="${config.hair}" />
    `;
  } else if (char === 'pierre') {
    // Chapeau de marin et barbe courte grise
    hairBase = `
      <path d="M 32 ${headY - 5} Q 50 ${headY - 20} 68 ${headY - 5} Z" fill="#1D4ED8" /> <!-- Bonnet de marin -->
    `;
    beardBase = `
      <path d="M 35 ${headY + 5} C 37 46 63 46 65 ${headY + 5} Z" fill="${config.hair}" />
    `;
  } else if (char === 'moise') {
    // Cheveux volumineux blancs et longue barbe blanche
    hairBase = `
      <path d="M 31 ${headY + 4} C 20 12 80 12 69 ${headY + 4} Z" fill="${config.hair}" />
    `;
    beardBase = `
      <path d="M 33 ${headY + 4} C 33 58 67 58 67 ${headY + 4} Z" fill="${config.hair}" />
    `;
  } else if (char === 'abraham') {
    // Drapé nomade sur la tête et barbe grise
    hairBase = `
      <path d="M 31 ${headY - 2} C 31 ${headY - 18} 69 ${headY - 18} 69 ${headY - 2} C 72 30 72 45 68 54 L 32 54 C 28 45 28 30 31 ${headY - 2} Z" fill="#E2E8F0" /> <!-- Drapé -->
      <rect x="36" y="${headY - 12}" width="28" height="3" fill="#475569" rx="1" /> <!-- Cordeau -->
    `;
    beardBase = `
      <path d="M 34 ${headY + 5} C 34 54 66 54 66 ${headY + 5} Z" fill="${config.hair}" />
    `;
  } else if (char === 'david') {
    // Cheveux blonds volumineux et petite couronne dorée
    hairBase = `
      <path d="M 32 ${headY + 2} C 25 15 75 15 68 ${headY + 2} Z" fill="${config.hair}" />
      <path d="M 44 ${headY - 12} L 46 ${headY - 17} L 50 ${headY - 14} L 54 ${headY - 17} L 56 ${headY - 12} Z" fill="#FBBF24" /> <!-- Couronne -->
    `;
  }

  // Éléments du visage
  let faceElements = '';
  if (expr === 'neutral') {
    faceElements = `
      <!-- Sourcils -->
      <path d="M${headX - 7} ${headY - 4} Q${headX - 5} ${headY - 5} L${headX - 3} ${headY - 4}" stroke="#1E293B" stroke-width="1.2" stroke-linecap="round" fill="none" />
      <path d="M${headX + 3} ${headY - 4} Q${headX + 5} ${headY - 5} L${headX + 7} ${headY - 4}" stroke="#1E293B" stroke-width="1.2" stroke-linecap="round" fill="none" />
      <!-- Yeux + Reflets -->
      <circle cx="${headX - 5}" cy="${headY}" r="2" fill="#1E293B" />
      <circle cx="${headX - 5.6}" cy="${headY - 0.6}" r="0.6" fill="#FFFFFF" />
      <circle cx="${headX + 5}" cy="${headY}" r="2" fill="#1E293B" />
      <circle cx="${headX + 4.4}" cy="${headY - 0.6}" r="0.6" fill="#FFFFFF" />
      <!-- Blush -->
      <ellipse cx="${headX - 9}" cy="${headY + 3}" rx="2" ry="1.2" fill="#FDA4AF" opacity="0.6" />
      <ellipse cx="${headX + 9}" cy="${headY + 3}" rx="2" ry="1.2" fill="#FDA4AF" opacity="0.6" />
      <!-- Bouche -->
      <path d="M${headX - 2} ${headY + 5} Q${headX} ${headY + 7} L${headX + 2} ${headY + 5}" stroke="#1E293B" stroke-width="2" stroke-linecap="round" fill="none" />
    `;
  } else if (expr === 'happy') {
    faceElements = `
      <!-- Sourcils levés de joie -->
      <path d="M${headX - 7} ${headY - 6} Q${headX - 5} ${headY - 7} L${headX - 3} ${headY - 5}" stroke="#1E293B" stroke-width="1.2" stroke-linecap="round" fill="none" />
      <path d="M${headX + 3} ${headY - 5} Q${headX + 5} ${headY - 7} L${headX + 7} ${headY - 6}" stroke="#1E293B" stroke-width="1.2" stroke-linecap="round" fill="none" />
      <!-- Yeux plissés rieurs -->
      <path d="M${headX - 7} ${headY} Q${headX - 5} ${headY - 3} L${headX - 3} ${headY}" stroke="#1E293B" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M${headX + 3} ${headY} Q${headX + 5} ${headY - 3} L${headX + 7} ${headY}" stroke="#1E293B" stroke-width="2" stroke-linecap="round" fill="none" />
      <!-- Blush -->
      <ellipse cx="${headX - 9}" cy="${headY + 3}" rx="2.5" ry="1.5" fill="#FDA4AF" opacity="0.7" />
      <ellipse cx="${headX + 9}" cy="${headY + 3}" rx="2.5" ry="1.5" fill="#FDA4AF" opacity="0.7" />
      <!-- Bouche riante -->
      <path d="M${headX - 3} ${headY + 4} Q${headX} ${headY + 9} L${headX + 3} ${headY + 4}" fill="#EF4444" />
    `;
  } else if (expr === 'sweating') {
    faceElements = `
      <!-- Sourcils inquiets -->
      <path d="M${headX - 7} ${headY - 4} Q${headX - 5} ${headY - 3} L${headX - 3} ${headY - 5}" stroke="#1E293B" stroke-width="1.2" stroke-linecap="round" fill="none" />
      <path d="M${headX + 3} ${headY - 5} Q${headX + 5} ${headY - 3} L${headX + 7} ${headY - 4}" stroke="#1E293B" stroke-width="1.2" stroke-linecap="round" fill="none" />
      <!-- Yeux écarquillés -->
      <circle cx="${headX - 5}" cy="${headY}" r="2" fill="#1E293B" />
      <circle cx="${headX - 5.6}" cy="${headY - 0.6}" r="0.6" fill="#FFFFFF" />
      <circle cx="${headX + 5}" cy="${headY}" r="2" fill="#1E293B" />
      <circle cx="${headX + 4.4}" cy="${headY - 0.6}" r="0.6" fill="#FFFFFF" />
      <!-- Blush discret -->
      <ellipse cx="${headX - 9}" cy="${headY + 3}" rx="1.8" ry="1" fill="#FDA4AF" opacity="0.5" />
      <ellipse cx="${headX + 9}" cy="${headY + 3}" rx="1.8" ry="1" fill="#FDA4AF" opacity="0.5" />
      <!-- Bouche inquiète et goutte de sueur -->
      <path d="M${headX - 3} ${headY + 5} h6" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round" />
      <path d="M${headX + 11} ${headY - 7} Q${headX + 13} ${headY} L${headX + 9} ${headY}" fill="#3B82F6" opacity="0.8" />
    `;
  } else { // crying
    faceElements = `
      <!-- Sourcils tristes -->
      <path d="M${headX - 7} ${headY - 3} Q${headX - 5} ${headY - 2} L${headX - 3} ${headY - 4}" stroke="#1E293B" stroke-width="1.2" stroke-linecap="round" fill="none" />
      <path d="M${headX + 3} ${headY - 4} Q${headX + 5} ${headY - 2} L${headX + 7} ${headY - 3}" stroke="#1E293B" stroke-width="1.2" stroke-linecap="round" fill="none" />
      <!-- Yeux tristes -->
      <path d="M${headX - 7} ${headY + 1} Q${headX - 5} ${headY + 4} L${headX - 3} ${headY + 1}" stroke="#1E293B" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M${headX + 3} ${headY + 1} Q${headX + 5} ${headY + 4} L${headX + 7} ${headY + 1}" stroke="#1E293B" stroke-width="2" stroke-linecap="round" fill="none" />
      <!-- Bouche qui pleure -->
      <path d="M${headX - 3} ${headY + 7} Q${headX} ${headY + 5} L${headX + 3} ${headY + 7}" stroke="#1E293B" stroke-width="2" stroke-linecap="round" fill="none" />
      <!-- Larmes qui coulent -->
      <path d="M${headX - 5} ${headY + 3} v9" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" />
      <path d="M${headX + 5} ${headY + 3} v9" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" />
    `;
  }

  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    ${hairBase}
    ${headBase}
    ${beardBase}
    ${faceElements}
  </svg>`;
}

// --- TEMPLATES DES COSTUMES ---
function getOutfitSVG(char, outfit) {
  // Coordonnées de base de l'habillement
  let headX = 50;
  let headY = 28;
  
  if (char === 'esther') headY = 26;
  if (char === 'gedeon') headY = 32;
  if (char === 'noe') headY = 27;

  if (outfit === 'default') {
    // Rien à afficher de plus, tout est sur le corps/pose de base
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"></svg>`;
  }

  if (outfit === 'winter') {
    // Bonnet rouge et écharpe rouge
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- Bonnet de laine -->
      <path d="M 33 ${headY - 6} C 33 ${headY - 25} 67 ${headY - 25} 67 ${headY - 6} Z" fill="#EF4444" />
      <rect x="31" y="${headY - 8}" width="38" height="5" fill="#FFFFFF" rx="2" />
      <circle cx="50" cy="${headY - 23}" r="4" fill="#FFFFFF" />
      <!-- Écharpe enroulée autour du cou -->
      <rect x="32" y="${headY + 12}" width="36" height="6" fill="#EF4444" rx="2" />
      <path d="M 60 ${headY + 15} v 14" stroke="#EF4444" stroke-width="6" stroke-linecap="round" />
    </svg>`;
  }

  if (outfit === 'beach') {
    // Lunettes de soleil d'été (jaunes) et un collier à fleurs (ou chapeau)
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- Lunettes de soleil cool -->
      <rect x="${headX - 11}" y="${headY - 3}" width="10" height="7" rx="3" fill="#FBBF24" />
      <rect x="${headX + 1}" y="${headY - 3}" width="10" height="7" rx="3" fill="#FBBF24" />
      <line x1="${headX - 1}" y1="${headY}" x2="${headX + 1}" y2="${headY}" stroke="#FBBF24" stroke-width="2.5" />
      <!-- Verres sombres -->
      <rect x="${headX - 9}" y="${headY - 1}" width="6" height="4" rx="1.5" fill="#1E293B" />
      <rect x="${headX + 3}" y="${headY - 1}" width="6" height="4" rx="1.5" fill="#1E293B" />
    </svg>`;
  }

  if (outfit === 'halloween') {
    // Chapeau de sorcière pointu noir
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- Chapeau de sorcière -->
      <ellipse cx="50" cy="${headY - 9}" rx="24" ry="4" fill="#1E293B" />
      <path d="M 34 ${headY - 9} L 50 ${headY - 30} L 66 ${headY - 9} Z" fill="#1E293B" />
      <rect x="42" y="${headY - 12}" width="16" height="3" fill="#7C3AED" /> <!-- Ruban violet -->
    </svg>`;
  }

  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"></svg>`;
}

// --- GÉNÉRATION GLOBALE ---
console.log("Début de la génération de tous les SVGs modulaires...");

let filesCreated = 0;

for (const char of CHARACTERS) {
  const charDir = path.join(outputBase, char);
  if (!fs.existsSync(charDir)) {
    fs.mkdirSync(charDir, { recursive: true });
  }

  // 1. Génération des Poses
  for (const pose of POSES) {
    const filePath = path.join(charDir, `pose_${pose}.svg`);
    fs.writeFileSync(filePath, getPoseSVG(char, pose).trim(), 'utf8');
    filesCreated++;
  }

  // 2. Génération des Expressions
  for (const expr of EXPRESSIONS) {
    const filePath = path.join(charDir, `expression_${expr}.svg`);
    fs.writeFileSync(filePath, getExpressionSVG(char, expr).trim(), 'utf8');
    filesCreated++;
  }

  // 3. Génération des Outfits
  for (const outfit of OUTFITS) {
    const filePath = path.join(charDir, `outfit_${outfit}.svg`);
    fs.writeFileSync(filePath, getOutfitSVG(char, outfit).trim(), 'utf8');
    filesCreated++;
  }
}

console.log(`Génération terminée avec succès ! ${filesCreated} fichiers SVG créés dans public/assets/characters/`);
