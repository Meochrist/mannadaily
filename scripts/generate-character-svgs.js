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

// Couleurs et spécificités de design par personnage (Flat Design 2.0 Duolingo)
const DESIGN_CONFIGS = {
  manny: {
    primary: '#4F46E5',        // Indigo principal couverture
    secondary: '#3730A3',    // Indigo foncé pour dos/ombres nettes
    skin: '#FFFFFF',          // Pages blanches
    hair: '#64748B',          // Bras/jambes ardoise
    accent: '#FBBF24',        // Bottes jaunes
  },
  samson: {
    primary: '#EA580C',        // Tunique orange de guerrier
    secondary: '#B45309',      // Bottes / détails cuir marron foncé
    skin: '#FDBA74',          // Peau beige musclée
    hair: '#78350F',          // Cheveux longs bruns soyeux
    accent: '#F59E0B',        // Bracelets dorés
  },
  esther: {
    primary: '#EC4899',        // Robe violette/rose royale
    secondary: '#BE185D',      // Ombre de robe et ceintures
    skin: '#FED7AA',          // Peau claire
    hair: '#1E293B',          // Cheveux noirs de jais ondulés
    accent: '#FBBF24',        // Couronne royale dorée
  },
  gedeon: {
    primary: '#10B981',        // Tunique verte
    secondary: '#047857',      // Bottes et ceinture
    skin: '#FDBA74',          // Peau beige
    hair: '#451A03',          // Cheveux bruns courts
    accent: '#D97706',        // Casque et bouclier de bronze
  },
  noe: {
    primary: '#78350F',        // Tunique de laine marron terre
    secondary: '#451A03',      // Ceinture et bottes marron foncé
    skin: '#FED7AA',          // Peau claire ridée
    hair: '#CBD5E1',          // Barbe blanche fluide et cheveux gris
    accent: '#FFFFFF',        // Colombe blanche mignonne
  },
  paul: {
    primary: '#8B5CF6',        // Tunique mauve
    secondary: '#6D28D9',      // Bottes
    skin: '#FED7AA',          // Peau claire
    hair: '#78350F',          // Cheveux et barbe courte brune
    accent: '#FEF08A',        // Rouleau de parchemin en cuir
  },
  pierre: {
    primary: '#2563EB',        // Robe de pêcheur bleue
    secondary: '#1D4ED8',      // Ceinturon et bottes
    skin: '#FED7AA',          // Peau claire
    hair: '#94A3B8',          // Cheveux gris bouclés et barbe grise
    accent: '#FBBF24',        // Grande clé en or
  },
  moise: {
    primary: '#DC2626',        // Tunique rouge cardinal
    secondary: '#991B1B',      // Drapé de robe
    skin: '#FDBA74',          // Peau dorée
    hair: '#E2E8F0',          // Longue barbe et cheveux blancs ondulés
    accent: '#9CA3AF',        // Tablettes de la Loi en pierre grise
  },
  abraham: {
    primary: '#F59E0B',        // Tunique jaune sable
    secondary: '#D97706',      // Bottes et drapés
    skin: '#FED7AA',          // Peau claire
    hair: '#E2E8F0',          // Longue barbe et turban blanc
    accent: '#78350F',        // Bâton de bois de nomade
  },
  david: {
    primary: '#E2E8F0',        // Tunique en peau de mouton texturée blanche
    secondary: '#64748B',      // Ceinture en cuir et fronde
    skin: '#FDBA74',          // Peau dorée
    hair: '#EA580C',          // Cheveux roux bouclés courts
    accent: '#F59E0B',        // Petite harpe dorée
  }
};

// ----------------------------------------------------
// 1. DESSINER LES POSES DE CORPS COMPLET (SQUELETTES)
// ----------------------------------------------------
function getPoseSVG(char, pose) {
  const config = DESIGN_CONFIGS[char];
  
  // Cas spécial Manny (Livre animé)
  if (char === 'manny') {
    if (pose === 'idle') {
      return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="250" cy="450" rx="90" ry="12" fill="#E2E8F0" />
        <g id="legs">
          <path d="M200 360 v50" fill="none" stroke="${config.hair}" stroke-width="16" stroke-linecap="round" />
          <path d="M180 410 h35 c8 0, 8 16, 0 16 h-35 c-8 0, -8 -16, 0 -16z" fill="${config.accent}" />
          <path d="M180 426 h35 v2 h-35z" fill="#D97706" />
          <path d="M300 360 v50" fill="none" stroke="${config.hair}" stroke-width="16" stroke-linecap="round" />
          <path d="M285 410 h35 c8 0, 8 16, 0 16 h-35 c-8 0, -8 -16, 0 -16z" fill="${config.accent}" />
          <path d="M285 426 h35 v2 h-35z" fill="#D97706" />
        </g>
        <g id="arms">
          <path d="M140 240 C110 240, 95 260, 105 285" fill="none" stroke="${config.hair}" stroke-width="16" stroke-linecap="round" />
          <path d="M360 240 C390 240, 405 260, 395 285" fill="none" stroke="${config.hair}" stroke-width="16" stroke-linecap="round" />
        </g>
        <g id="book-body">
          <rect x="135" y="115" width="230" height="250" rx="35" fill="${config.secondary}" />
          <rect x="140" y="110" width="220" height="240" rx="32" fill="${config.primary}" />
          <path d="M140 110 v240 c0 17.67 14.33 32 32 32 h18 v-304 h-18 c-17.67 0 -32 14.33 -32 32z" fill="${config.secondary}" />
          <path d="M360 135 h12 v190 h-12z" fill="${config.skin}" />
          <path d="M372 145 h4 v170 h-4z" fill="#E2E8F0" />
          <path d="M185 350 c40 8, 120 8, 175 0 v10 c-55 8, -135 8, -175 0z" fill="${config.skin}" />
          <path d="M195 360 c30 5, 100 5, 150 0 v6 c-50 5, -120 5, -195 0z" fill="#E2E8F0" />
        </g>
      </svg>`;
    } else if (pose === 'jumping') {
      return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="250" cy="460" rx="50" ry="7" fill="#CBD5E1" opacity="0.6" />
        <g id="legs">
          <path d="M195 345 L175 385" fill="none" stroke="${config.hair}" stroke-width="16" stroke-linecap="round" />
          <path d="M150 380 h35 c8 0, 8 16, 0 16 h-35 c-8 0, -8 -16, 0 -16z" fill="${config.accent}" transform="rotate(-15 150 380)" />
          <path d="M305 345 L325 385" fill="none" stroke="${config.hair}" stroke-width="16" stroke-linecap="round" />
          <path d="M315 380 h35 c8 0, 8 16, 0 16 h-35 c-8 0, -8 -16, 0 -16z" fill="${config.accent}" transform="rotate(15 315 380)" />
        </g>
        <g id="arms">
          <path d="M140 220 Q100 150, 90 125" fill="none" stroke="${config.hair}" stroke-width="16" stroke-linecap="round" />
          <path d="M360 220 Q400 150, 410 125" fill="none" stroke="${config.hair}" stroke-width="16" stroke-linecap="round" />
        </g>
        <g id="book-body" transform="translate(0, -30) rotate(2 250 230)">
          <rect x="135" y="115" width="230" height="250" rx="35" fill="${config.secondary}" />
          <rect x="140" y="110" width="220" height="240" rx="32" fill="${config.primary}" />
          <path d="M140 110 v240 c0 17.67 14.33 32 32 32 h18 v-304 h-18 c-17.67 0 -32 14.33 -32 32z" fill="${config.secondary}" />
          <path d="M360 135 h12 v190 h-12z" fill="${config.skin}" />
          <path d="M372 145 h4 v170 h-4z" fill="#E2E8F0" />
          <path d="M185 350 c40 8, 120 8, 175 0 v10 c-55 8, -135 8, -175 0z" fill="${config.skin}" />
        </g>
      </svg>`;
    } else if (pose === 'sad') {
      return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="250" cy="450" rx="80" ry="10" fill="#E2E8F0" />
        <g id="legs">
          <path d="M205 365 v35 h-10" fill="none" stroke="${config.hair}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M175 395 h35 c8 0, 8 16, 0 16 h-35 c-8 0, -8 -16, 0 -16z" fill="${config.accent}" />
          <path d="M295 365 v35 h10" fill="none" stroke="${config.hair}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M290 395 h35 c8 0, 8 16, 0 16 h-35 c-8 0, -8 -16, 0 -16z" fill="${config.accent}" />
        </g>
        <g id="arms">
          <path d="M140 250 Q115 300, 120 330" fill="none" stroke="${config.hair}" stroke-width="16" stroke-linecap="round" />
          <path d="M360 250 Q385 300, 380 330" fill="none" stroke="${config.hair}" stroke-width="16" stroke-linecap="round" />
        </g>
        <g id="book-body" transform="translate(0, 15) scale(0.98, 0.96) translate(5, 5)">
          <rect x="135" y="115" width="230" height="250" rx="35" fill="${config.secondary}" />
          <rect x="140" y="110" width="220" height="240" rx="32" fill="${config.primary}" />
          <path d="M140 110 v240 c0 17.67 14.33 32 32 32 h18 v-304 h-18 c-17.67 0 -32 14.33 -32 32z" fill="${config.secondary}" />
          <path d="M360 145 h12 v170 h-12z" fill="#E2E8F0" />
          <path d="M185 350 c40 8, 120 8, 175 0 v10 c-55 8, -135 8, -175 0z" fill="${config.skin}" />
        </g>
      </svg>`;
    } else { // running
      return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="230" cy="450" rx="80" ry="10" fill="#E2E8F0" transform="skewX(-15 230 450)" />
        <g id="legs">
          <path d="M190 350 Q150 400, 180 420" fill="none" stroke="${config.hair}" stroke-width="16" stroke-linecap="round" />
          <path d="M160 415 h35 c8 0, 8 16, 0 16 h-35 c-8 0, -8 -16, 0 -16z" fill="${config.accent}" transform="rotate(-10 160 415)" />
          <path d="M290 350 Q330 380, 310 425" fill="none" stroke="${config.hair}" stroke-width="16" stroke-linecap="round" />
          <path d="M295 420 h35 c8 0, 8 16, 0 16 h-35 c-8 0, -8 -16, 0 -16z" fill="${config.accent}" transform="rotate(15 295 420)" />
        </g>
        <g id="arms">
          <path d="M130 240 Q95 270, 115 300" fill="none" stroke="${config.hair}" stroke-width="16" stroke-linecap="round" />
          <path d="M360 230 Q395 210, 370 175" fill="none" stroke="${config.hair}" stroke-width="16" stroke-linecap="round" />
        </g>
        <g id="book-body" transform="translate(-10, 5) skewX(-8) rotate(-2 250 230)">
          <rect x="135" y="115" width="230" height="250" rx="35" fill="${config.secondary}" />
          <rect x="140" y="110" width="220" height="240" rx="32" fill="${config.primary}" />
          <path d="M140 110 v240 c0 17.67 14.33 32 32 32 h18 v-304 h-18 c-17.67 0 -32 14.33 -32 32z" fill="${config.secondary}" />
          <path d="M360 135 h12 v190 h-12z" fill="${config.skin}" />
          <path d="M372 145 h4 v170 h-4z" fill="#E2E8F0" />
          <path d="M185 350 c40 8, 120 8, 175 0 v10 c-55 8, -135 8, -175 0z" fill="${config.skin}" />
        </g>
      </svg>`;
    }
  }

  // Autres personnages humains (Full Body)
  let bodyHTML = '';
  let limbsHTML = '';
  let detailsHTML = '';

  // 1. Dessin des membres selon la pose (ViewBox 0 0 500 500)
  if (pose === 'idle') {
    limbsHTML = `
      <!-- Jambes droites -->
      <rect x="205" y="340" width="30" height="90" rx="15" fill="${config.skin}" />
      <rect x="265" y="340" width="30" height="90" rx="15" fill="${config.skin}" />
      <!-- Sandales / Chaussures nettes -->
      <path d="M190 420 h50 c6 0, 6 15, 0 15 h-50 z" fill="${config.secondary}" />
      <path d="M260 420 h50 c6 0, 6 15, 0 15 h-50 z" fill="${config.secondary}" />
      <!-- Bras ballants stables -->
      <path d="M135 240 v100" fill="none" stroke="${config.skin}" stroke-width="20" stroke-linecap="round" />
      <path d="M365 240 v100" fill="none" stroke="${config.skin}" stroke-width="20" stroke-linecap="round" />
    `;
    bodyHTML = `
      <!-- Tunique drapée -->
      <rect x="145" y="215" width="210" height="150" rx="40" fill="${config.primary}" />
      <!-- Ombre nette sur la tunique pour donner de la profondeur (Duolingo 2.0) -->
      <path d="M145 270 C145 330, 355 330, 355 270 V325 C355 350, 145 350, 145 325 Z" fill="${config.secondary}" opacity="0.3" />
    `;
  } else if (pose === 'jumping') {
    limbsHTML = `
      <!-- Jambes pliées vers l'extérieur -->
      <path d="M210 340 L180 395" fill="none" stroke="${config.skin}" stroke-width="20" stroke-linecap="round" />
      <path d="M160 390 h40 c5 0, 5 15, 0 15 h-40 z" fill="${config.secondary}" transform="rotate(-15 160 390)" />
      <path d="M290 340 L320 395" fill="none" stroke="${config.skin}" stroke-width="20" stroke-linecap="round" />
      <path d="M300 390 h40 c5 0, 5 15, 0 15 h-40 z" fill="${config.secondary}" transform="rotate(15 300 390)" />
      <!-- Bras levés en signe de victoire -->
      <path d="M140 220 Q90 145, 80 120" fill="none" stroke="${config.skin}" stroke-width="20" stroke-linecap="round" />
      <path d="M360 220 Q410 145, 420 120" fill="none" stroke="${config.skin}" stroke-width="20" stroke-linecap="round" />
    `;
    bodyHTML = `
      <rect x="145" y="200" width="210" height="150" rx="40" fill="${config.primary}" />
    `;
  } else if (pose === 'sad') {
    limbsHTML = `
      <!-- Jambes légèrement pliées de tristesse -->
      <path d="M210 350 v60 h-10" fill="none" stroke="${config.skin}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M290 350 v60 h10" fill="none" stroke="${config.skin}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M185 400 h35 c5 0, 5 15, 0 15 h-35 z" fill="${config.secondary}" />
      <path d="M280 400 h35 c5 0, 5 15, 0 15 h-35 z" fill="${config.secondary}" />
      <!-- Bras refermés ou tombants d'abattement -->
      <path d="M140 250 Q115 310, 125 350" fill="none" stroke="${config.skin}" stroke-width="18" stroke-linecap="round" />
      <path d="M360 250 Q385 310, 375 350" fill="none" stroke="${config.skin}" stroke-width="18" stroke-linecap="round" />
    `;
    bodyHTML = `
      <!-- Torse affaissé (plus petit) -->
      <rect x="150" y="225" width="200" height="140" rx="35" fill="${config.primary}" />
    `;
  } else { // running
    limbsHTML = `
      <!-- Jambe arrière en course -->
      <path d="M200 340 L160 400" fill="none" stroke="${config.skin}" stroke-width="20" stroke-linecap="round" />
      <path d="M140 395 h40 c5 0, 5 15, 0 15 h-40 z" fill="${config.secondary}" transform="rotate(-15 140 395)" />
      <!-- Jambe avant en foulée -->
      <path d="M280 340 Q320 375, 300 420" fill="none" stroke="${config.skin}" stroke-width="20" stroke-linecap="round" />
      <path d="M285 415 h40 c5 0, 5 15, 0 15 h-40 z" fill="${config.secondary}" transform="rotate(10 285 415)" />
      <!-- Bras de course fléchis -->
      <path d="M140 230 Q90 260, 115 300" fill="none" stroke="${config.skin}" stroke-width="18" stroke-linecap="round" />
      <path d="M360 220 Q400 190, 385 155" fill="none" stroke="${config.skin}" stroke-width="18" stroke-linecap="round" />
    `;
    bodyHTML = `
      <!-- Torse projeté vers l'avant -->
      <rect x="145" y="210" width="210" height="150" rx="40" fill="${config.primary}" transform="skewX(-8 250 285)" />
    `;
  }

  // 2. Décors et accessoires spécifiques par personnage (DA riche)
  if (char === 'samson') {
    // Buste musclé de Samson (Pectoraux, abdominaux et bracelets de force)
    detailsHTML = `
      <!-- Pectoraux / Reliefs musculaires -->
      <path d="M185 240 Q250 255 315 240" stroke="${config.secondary}" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.4" />
      <path d="M250 245 v60" stroke="${config.secondary}" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.4" />
      <circle cx="215" cy="275" r="5" fill="${config.secondary}" opacity="0.3" />
      <circle cx="285" cy="275" r="5" fill="${config.secondary}" opacity="0.3" />
      <!-- Bracelets de force dorés sur les bras -->
      <rect x="120" y="280" width="30" height="20" rx="4" fill="${config.accent}" transform="rotate(-5 120 280)" />
      <rect x="350" y="280" width="30" height="20" rx="4" fill="${config.accent}" transform="rotate(5 350 280)" />
    `;
  } else if (char === 'esther') {
    // Robe royale élégante évasée
    bodyHTML = `
      <path d="M150 215 h200 L370 360 H130 Z" fill="${config.primary}" />
      <rect x="175" y="210" width="150" height="22" fill="${config.secondary}" rx="8" />
    `;
  } else if (char === 'gedeon') {
    // Bouclier rond de bronze accroché au dos/bras
    detailsHTML = `
      <circle cx="365" cy="270" r="38" fill="${config.accent}" stroke="#1E293B" stroke-width="6" />
      <circle cx="365" cy="270" r="16" fill="${config.secondary}" stroke="#1E293B" stroke-width="4" />
    `;
  } else if (char === 'noe') {
    // Colombe blanche de Noé sur son bras
    detailsHTML = `
      <!-- Petite colombe plate mignonne -->
      <path d="M110 200 c5 -15, 25 -15, 30 0 v15 h-30z" fill="${config.accent}" stroke="#1E293B" stroke-width="4" />
      <path d="M140 205 L155 195 L145 210 Z" fill="#FBBF24" /> <!-- Bec -->
      <circle cx="125" cy="205" r="2" fill="#1E293B" /> <!-- Oeil colombe -->
    `;
  } else if (char === 'paul') {
    // Paul tient un rouleau de parchemin
    detailsHTML = `
      <rect x="295" y="280" width="50" height="80" rx="8" fill="${config.accent}" stroke="#1E293B" stroke-width="6" transform="rotate(20 295 280)" />
      <line x1="315" y1="280" x2="315" y2="360" stroke="#CA8A04" stroke-width="4" transform="rotate(20 295 280)" />
    `;
  } else if (char === 'pierre') {
    // Pierre tient sa grande clé dorée
    detailsHTML = `
      <g id="key" transform="translate(325, 260) rotate(-15)">
        <circle cx="20" cy="20" r="20" fill="none" stroke="${config.accent}" stroke-width="8" />
        <rect x="16" y="40" width="8" height="60" fill="${config.accent}" rx="2" />
        <rect x="24" y="80" width="16" height="8" fill="${config.accent}" rx="2" />
        <rect x="24" y="92" width="16" height="8" fill="${config.accent}" rx="2" />
      </g>
    `;
  } else if (char === 'moise') {
    // Les deux Tablettes de la Loi en pierre grise sous le bras
    detailsHTML = `
      <g id="tablets" transform="translate(110, 240) rotate(-5)">
        <rect x="0" y="0" width="70" height="90" rx="15" fill="${config.accent}" stroke="#1E293B" stroke-width="6" />
        <line x1="35" y1="5" x2="35" y2="85" stroke="#4B5563" stroke-width="4" />
        <!-- Inscriptions hébraïques factices (points/traits fins net) -->
        <line x1="10" y1="25" x2="25" y2="25" stroke="#374151" stroke-width="3" stroke-linecap="round" />
        <line x1="10" y1="45" x2="28" y2="45" stroke="#374151" stroke-width="3" stroke-linecap="round" />
        <line x1="45" y1="25" x2="60" y2="25" stroke="#374151" stroke-width="3" stroke-linecap="round" />
        <line x1="45" y1="45" x2="58" y2="45" stroke="#374151" stroke-width="3" stroke-linecap="round" />
      </g>
    `;
  } else if (char === 'abraham') {
    // Abraham tient son bâton de nomade en bois
    detailsHTML = `
      <line x1="110" y1="180" x2="110" y2="450" stroke="${config.accent}" stroke-width="16" stroke-linecap="round" />
    `;
  } else if (char === 'david') {
    // David porte sa petite harpe en bandoulière
    detailsHTML = `
      <g id="harp" transform="translate(120, 260) rotate(10)">
        <path d="M 0 0 L 50 10 L 40 70 C 10 70, 0 40, 0 0 Z" fill="none" stroke="${config.accent}" stroke-width="8" />
        <line x1="10" y1="5" x2="10" y2="65" stroke="#D97706" stroke-width="2" />
        <line x1="20" y1="7" x2="20" y2="65" stroke="#D97706" stroke-width="2" />
        <line x1="30" y1="9" x2="30" y2="65" stroke="#D97706" stroke-width="2" />
      </g>
    `;
  }

  return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
    <!-- Ombre nette au sol -->
    <ellipse cx="250" cy="450" rx="90" ry="12" fill="#E2E8F0" />
    ${limbsHTML}
    ${bodyHTML}
    ${detailsHTML}
  </svg>`;
}

// ----------------------------------------------------
// 2. DESSINER LES EXPRESSIONS (YEUX GÉANTS 60% VISAGE)
// ----------------------------------------------------
function getExpressionSVG(char, expr) {
  const config = DESIGN_CONFIGS[char];
  
  // Manny a ses expressions sur le livre
  if (char === 'manny') {
    if (expr === 'neutral') {
      return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <g id="eyes">
          <circle cx="205" cy="215" r="24" fill="${config.hair}" />
          <circle cx="197" cy="207" r="7" fill="#FFFFFF" />
          <circle cx="212" cy="222" r="3" fill="#FFFFFF" />
          <circle cx="295" cy="215" r="24" fill="${config.hair}" />
          <circle cx="287" cy="207" r="7" fill="#FFFFFF" />
          <circle cx="302" cy="222" r="3" fill="#FFFFFF" />
        </g>
        <g id="blush">
          <ellipse cx="170" cy="250" rx="18" ry="10" fill="#FDA4AF" opacity="0.65" />
          <ellipse cx="330" cy="250" rx="18" ry="10" fill="#FDA4AF" opacity="0.65" />
        </g>
        <path d="M235 255 Q250 270 265 255" stroke="${config.hair}" stroke-width="8" stroke-linecap="round" fill="none" />
      </svg>`;
    } else if (expr === 'happy') {
      return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <g id="eyes">
          <path d="M185 220 Q205 195 225 220" stroke="${config.hair}" stroke-width="9" stroke-linecap="round" fill="none" />
          <path d="M275 220 Q295 195 315 220" stroke="${config.hair}" stroke-width="9" stroke-linecap="round" fill="none" />
        </g>
        <g id="blush">
          <ellipse cx="170" cy="250" rx="20" ry="12" fill="#FDA4AF" opacity="0.75" />
          <ellipse cx="330" cy="250" rx="20" ry="12" fill="#FDA4AF" opacity="0.75" />
        </g>
        <g id="mouth">
          <path d="M230 245 Q250 285 270 245 Z" fill="#EF4444" stroke="${config.hair}" stroke-width="7" stroke-linejoin="round" />
          <path d="M240 265 Q250 252 260 265 Q250 278 240 265" fill="#F472B6" />
        </g>
      </svg>`;
    } else if (expr === 'sweating') {
      return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <g id="eyes">
          <path d="M190 220 h30" stroke="${config.hair}" stroke-width="9" stroke-linecap="round" />
          <path d="M280 220 h30" stroke="${config.hair}" stroke-width="9" stroke-linecap="round" />
        </g>
        <g id="blush">
          <ellipse cx="170" cy="250" rx="16" ry="9" fill="#FDA4AF" opacity="0.5" />
          <ellipse cx="330" cy="250" rx="16" ry="9" fill="#FDA4AF" opacity="0.5" />
        </g>
        <ellipse cx="250" cy="255" rx="14" ry="8" fill="${config.hair}" />
        <path d="M330 170 Q340 200 325 210 Q310 210 320 190 Z" fill="#3B82F6" stroke="${config.hair}" stroke-width="4" stroke-linejoin="round" />
      </svg>`;
    } else { // crying
      return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <g id="eyes">
          <path d="M185 225 Q205 240 225 225" stroke="${config.hair}" stroke-width="8" stroke-linecap="round" fill="none" />
          <path d="M275 225 Q295 240 315 225" stroke="${config.hair}" stroke-width="8" stroke-linecap="round" fill="none" />
        </g>
        <path d="M232 265 Q250 252 268 265" stroke="${config.hair}" stroke-width="8" stroke-linecap="round" fill="none" />
        <path d="M195 235 v45 c0 8, 12 8, 12 0 v-45z" fill="#60A5FA" />
        <path d="M293 235 v45 c0 8, 12 8, 12 0 v-45z" fill="#60A5FA" />
      </svg>`;
    }
  }

  // Humains (Visage modulaire à cx=250, cy=180)
  const headX = 250;
  const headY = 175;

  let headSkin = `<circle cx="${headX}" cy="${headY}" r="70" fill="${config.skin}" />`;
  let hairBack = '';
  let hairFront = '';
  let beardHTML = '';

  // Coiffures et barbes selon le personnage
  if (char === 'samson') {
    hairBack = `<path d="M 170 ${headY} C 120 50 380 50 330 ${headY} C 360 220 370 310 330 330 C 310 250 310 210 310 190 L 190 190 C 190 210 190 250 170 330 C 130 310 140 220 170 ${headY} Z" fill="${config.hair}" />`;
    hairFront = `<rect x="170" y="${headY - 65}" width="160" height="15" fill="${config.accent}" rx="5" />`;
  } else if (char === 'esther') {
    hairBack = `<path d="M 160 ${headY} C 120 50 380 50 340 ${headY} C 380 280 350 350 320 360 C 300 280 305 200 305 180 L 195 180 C 195 200 200 280 180 360 C 150 350 120 280 160 ${headY} Z" fill="${config.hair}" />`;
    hairFront = `<path d="M 210 ${headY - 60} L 225 ${headY - 85} L 250 ${headY - 70} L 275 ${headY - 85} L 290 ${headY - 60} Z" fill="${config.accent}" />`;
  } else if (char === 'gedeon') {
    hairFront = `
      <path d="M 180 ${headY - 45} C 180 ${headY - 100} 320 ${headY - 100} 320 ${headY - 45} Z" fill="${config.accent}" />
      <rect x="235" y="${headY - 105}" width="30" height="25" fill="#EF4444" rx="5" /> <!-- Plumet rouge -->
    `;
  } else if (char === 'noe') {
    hairBack = `<path d="M 170 ${headY} C 160 80 340 80 330 ${headY} Z" fill="${config.hair}" opacity="0.8" />`;
    beardHTML = `<path d="M 180 ${headY + 25} C 180 270 320 270 320 ${headY + 25} Z" fill="${config.hair}" />`;
  } else if (char === 'paul') {
    hairBack = `<path d="M 175 ${headY} C 170 85 330 85 325 ${headY} Z" fill="${config.hair}" />`;
    beardHTML = `<path d="M 185 ${headY + 20} C 190 220 310 220 315 ${headY + 20} Z" fill="${config.hair}" />`;
  } else if (char === 'pierre') {
    hairBack = `<path d="M 170 ${headY - 10} Q 250 ${headY - 80} 330 ${headY - 10} Z" fill="${config.hair}" />`;
    beardHTML = `<path d="M 180 ${headY + 20} C 180 230 320 230 320 ${headY + 20} Z" fill="${config.hair}" />`;
  } else if (char === 'moise') {
    hairBack = `<path d="M 170 ${headY} C 110 80 390 80 330 ${headY} Z" fill="${config.hair}" />`;
    beardHTML = `<path d="M 175 ${headY + 15} C 175 285 325 285 325 ${headY + 15} Z" fill="${config.hair}" />`;
  } else if (char === 'abraham') {
    hairBack = `
      <!-- Turban nomade -->
      <path d="M 170 ${headY - 10} C 170 ${headY - 80} 330 ${headY - 80} 330 ${headY - 10} Z" fill="#FFFFFF" stroke="#1E293B" stroke-width="4" />
      <rect x="190" y="${headY - 55}" width="120" height="10" fill="${config.secondary}" rx="3" />
    `;
    beardHTML = `<path d="M 180 ${headY + 20} C 180 270 320 270 320 ${headY + 20} Z" fill="${config.hair}" />`;
  } else if (char === 'david') {
    hairBack = `
      <path d="M 175 ${headY} C 140 80 360 80 325 ${headY} Z" fill="${config.hair}" />
      <path d="M 225 ${headY - 45} L 235 ${headY - 65} L 250 ${headY - 55} L 265 ${headY - 65} L 275 ${headY - 45} Z" fill="${config.accent}" />
    `;
  }

  // 3. Dessin des yeux géants et bouches selon l'expression
  let faceHTML = '';
  if (expr === 'neutral') {
    faceHTML = `
      <!-- Yeux géants mignons -->
      <circle cx="${headX - 22}" cy="${headY}" r="22" fill="#1E293B" />
      <circle cx="${headX - 28}" cy="${headY - 6}" r="7" fill="#FFFFFF" />
      <circle cx="${headX - 16}" cy="${headY + 6}" r="3" fill="#FFFFFF" />

      <circle cx="${headX + 22}" cy="${headY}" r="22" fill="#1E293B" />
      <circle cx="${headX + 16}" cy="${headY - 6}" r="7" fill="#FFFFFF" />
      <circle cx="${headX + 28}" cy="${headY + 6}" r="3" fill="#FFFFFF" />

      <ellipse cx="${headX - 42}" cy="${headY + 25}" rx="16" ry="9" fill="#FDA4AF" opacity="0.65" />
      <ellipse cx="${headX + 42}" cy="${headY + 25}" rx="16" ry="9" fill="#FDA4AF" opacity="0.65" />

      <path d="M${headX - 12} ${headY + 30} Q${headX} ${headY + 42} L${headX + 12} ${headY + 30}" stroke="#1E293B" stroke-width="7" stroke-linecap="round" fill="none" />
    `;
  } else if (expr === 'happy') {
    faceHTML = `
      <!-- Yeux joyeux arqués -->
      <path d="M${headX - 38} ${headY + 5} Q${headX - 22} ${headY - 18} L${headX - 6} ${headY + 5}" stroke="#1E293B" stroke-width="9" stroke-linecap="round" fill="none" />
      <path d="M${headX + 6} ${headY + 5} Q${headX + 22} ${headY - 18} L${headX + 38} ${headY + 5}" stroke="#1E293B" stroke-width="9" stroke-linecap="round" fill="none" />

      <ellipse cx="${headX - 42}" cy="${headY + 25}" rx="18" ry="11" fill="#FDA4AF" opacity="0.75" />
      <ellipse cx="${headX + 42}" cy="${headY + 25}" rx="18" ry="11" fill="#FDA4AF" opacity="0.75" />

      <path d="M${headX - 14} ${headY + 25} Q${headX} ${headY + 55} L${headX + 14} ${headY + 25} Z" fill="#EF4444" stroke="#1E293B" stroke-width="6" stroke-linejoin="round" />
      <path d="M${headX - 7} ${headY + 42} Q${headX} ${headY + 32} L${headX + 7} ${headY + 42} Q${headX} ${headY + 52} L${headX - 7} ${headY + 42}" fill="#F472B6" />
    `;
  } else if (expr === 'sweating') {
    faceHTML = `
      <path d="M${headX - 35} ${headY + 5} h25" stroke="#1E293B" stroke-width="8" stroke-linecap="round" />
      <path d="M${headX + 10} ${headY + 5} h25" stroke="#1E293B" stroke-width="8" stroke-linecap="round" />

      <ellipse cx="${headX - 42}" cy="${headY + 25}" rx="14" ry="8" fill="#FDA4AF" opacity="0.5" />
      <ellipse cx="${headX + 42}" cy="${headY + 25}" rx="14" ry="8" fill="#FDA4AF" opacity="0.5" />

      <ellipse cx="${headX}" cy="${headY + 25}" rx="12" ry="7" fill="#1E293B" />
      <path d="M${headX + 50} ${headY - 30} Q${headX + 60} ${headY} L${headX + 40} ${headY} Z" fill="#3B82F6" stroke="#1E293B" stroke-width="4" stroke-linejoin="round" />
    `;
  } else { // crying
    faceHTML = `
      <path d="M${headX - 36} ${headY + 8} Q${headX - 22} ${headY + 22} L${headX - 8} ${headY + 8}" stroke="#1E293B" stroke-width="8" stroke-linecap="round" fill="none" />
      <path d="M${headX + 8} ${headY + 8} Q${headX + 22} ${headY + 22} L${headX + 36} ${headY + 8}" stroke="#1E293B" stroke-width="8" stroke-linecap="round" fill="none" />

      <path d="M${headX - 16} ${headY + 35} Q${headX} ${headY + 22} L${headX + 16} ${headY + 35}" stroke="#1E293B" stroke-width="7" stroke-linecap="round" fill="none" />
      <path d="M${headX - 22} ${headY + 12} v40 c0 6, 10 6, 10 0 v-40z" fill="#60A5FA" />
      <path d="M${headX + 12} ${headY + 12} v40 c0 6, 10 6, 10 0 v-40z" fill="#60A5FA" />
    `;
  }

  return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
    ${hairBack}
    ${headSkin}
    ${beardHTML}
    ${hairFront}
    ${faceHTML}
  </svg>`;
}

// ----------------------------------------------------
// 3. DESSINER LES TENUES (OUTFITS) ALIGNÉES
// ----------------------------------------------------
function getOutfitSVG(char, outfit) {
  if (outfit === 'default') {
    return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"></svg>`;
  }

  const headY = 175;

  if (outfit === 'winter') {
    // Bonnet rouge et écharpe rouge tricotée
    return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
      <g id="winter-hat">
        <rect x="160" y="${headY - 95}" width="180" height="35" rx="15" fill="#EF4444" stroke="#1E293B" stroke-width="6" />
        <path d="M175 ${headY - 95} C175 ${headY - 145}, 325 ${headY - 145}, 325 ${headY - 95} Z" fill="#DC2626" stroke="#1E293B" stroke-width="6" stroke-linejoin="round" />
        <circle cx="250" cy="${headY - 150}" r="16" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
      </g>
      <g id="winter-scarf">
        <rect x="165" y="325" width="170" height="30" rx="12" fill="#EF4444" stroke="#1E293B" stroke-width="6" />
        <path d="M295 345 v50 c0 6, -20 6, -20 0 v-50z" fill="#DC2626" stroke="#1E293B" stroke-width="6" stroke-linejoin="round" />
      </g>
    </svg>`;
  } else if (outfit === 'beach') {
    // Lunettes de soleil et collier hawaien
    return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
      <g id="sunglasses" transform="translate(0, -5)">
        <rect x="175" y="${headY - 20}" width="56" height="38" rx="10" fill="#1E293B" />
        <path d="M185 ${headY - 10} l10 -5 v22 l-10 -5 z" fill="#FFFFFF" opacity="0.3" />
        <rect x="269" y="${headY - 20}" width="56" height="38" rx="10" fill="#1E293B" />
        <path d="M279 ${headY - 10} l10 -5 v22 l-10 -5 z" fill="#FFFFFF" opacity="0.3" />
        <path d="M231 ${headY - 10} h38" stroke="#FBBF24" stroke-width="8" stroke-linecap="round" />
        <path x1="165" y1="${headY - 5}" x2="175" y2="${headY - 5}" stroke="#FBBF24" stroke-width="8" stroke-linecap="round" />
        <path x1="325" y1="${headY - 5}" x2="335" y2="${headY - 5}" stroke="#FBBF24" stroke-width="8" stroke-linecap="round" />
      </g>
      <g id="hawaiian-flowers">
        <circle cx="180" cy="335" r="10" fill="#F43F5E" stroke="#1E293B" stroke-width="3" />
        <circle cx="210" cy="345" r="10" fill="#3B82F6" stroke="#1E293B" stroke-width="3" />
        <circle cx="250" cy="350" r="10" fill="#10B981" stroke="#1E293B" stroke-width="3" />
        <circle cx="290" cy="345" r="10" fill="#FBBF24" stroke="#1E293B" stroke-width="3" />
        <circle cx="320" cy="335" r="10" fill="#8B5CF6" stroke="#1E293B" stroke-width="3" />
      </g>
    </svg>`;
  } else if (outfit === 'halloween') {
    // Chapeau de sorcière noir pointu
    return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
      <g id="witch-hat">
        <ellipse cx="250" cy="${headY - 75}" rx="120" ry="15" fill="#1E293B" stroke="#1E293B" stroke-width="6" />
        <path d="M175 ${headY - 80} Q220 ${headY - 150}, 270 ${headY - 160} Q280 ${headY - 120}, 325 ${headY - 80} Z" fill="#0F172A" stroke="#1E293B" stroke-width="6" stroke-linejoin="round" />
        <path d="M180 ${headY - 80} c30 -5, 110 -5, 140 0 v5 c-30 -5, -110 -5, -140 0z" fill="#F97316" />
        <rect x="238" y="${headY - 92}" width="24" height="18" fill="#FBBF24" stroke="#1E293B" stroke-width="3" rx="3" />
      </g>
    </svg>`;
  }
}

// ----------------------------------------------------
// 4. BOUCLE D'ÉCRITURE DE TOUS LES 120 SVG
// ----------------------------------------------------
CHARACTERS.forEach(char => {
  const charDir = path.join(outputBase, char);
  if (!fs.existsSync(charDir)) {
    fs.mkdirSync(charDir, { recursive: true });
  }

  // Écrire les 4 Poses
  POSES.forEach(pose => {
    const content = getPoseSVG(char, pose);
    fs.writeFileSync(path.join(charDir, `pose_${pose}.svg`), content, 'utf8');
  });

  // Écrire les 4 Expressions
  EXPRESSIONS.forEach(expr => {
    const content = getExpressionSVG(char, expr);
    fs.writeFileSync(path.join(charDir, `expression_${expr}.svg`), content, 'utf8');
  });

  // Écrire les 4 Outfits
  OUTFITS.forEach(outfit => {
    const content = getOutfitSVG(char, outfit);
    fs.writeFileSync(path.join(charDir, `outfit_${outfit}.svg`), content, 'utf8');
  });

  console.log(`[Production] Fichiers générés avec succès pour : ${char}`);
});

console.log('--- TOUTES LES MASCOTTES SONT DÉSORMAIS PRODUITES EN CORPS COMPLET DANS LE PROJET ! ---');
