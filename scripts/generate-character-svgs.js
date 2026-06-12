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
      <!-- Jambes en fuseau organiques -->
      <path d="M 215 340 L 205 420" fill="none" stroke="${config.skin}" stroke-width="24" stroke-linecap="round" />
      <path d="M 285 340 L 295 420" fill="none" stroke="${config.skin}" stroke-width="24" stroke-linecap="round" />
      <!-- Pieds en haricot style cartoon orientés vers l'extérieur -->
      <path d="M 170 412 C 170 425, 215 428, 215 410 C 215 398, 185 398, 170 412 Z" fill="${config.secondary}" />
      <path d="M 330 412 C 330 425, 285 428, 285 410 C 285 398, 315 398, 330 412 Z" fill="${config.secondary}" />
      <!-- Bras ballants avec courbes douces (écartés du corps) -->
      <path d="M 150 220 Q 115 275, 130 325" fill="none" stroke="${config.skin}" stroke-width="22" stroke-linecap="round" />
      <path d="M 350 220 Q 385 275, 370 325" fill="none" stroke="${config.skin}" stroke-width="22" stroke-linecap="round" />
    `;
    bodyHTML = `
      <!-- Tunique en forme de poire/cloche organique (Duolingo Style) -->
      <path d="M 175 210 C 150 245, 125 315, 150 350 C 175 365, 325 365, 350 350 C 375 315, 350 245, 325 210 Z" fill="${config.primary}" />
      <!-- Ombre de volume nette sous le cou et drapés en bas -->
      <path d="M 150 350 C 175 365, 325 365, 350 350 C 340 310, 160 310, 150 350 Z" fill="${config.secondary}" opacity="0.25" />
      <path d="M 200 210 Q 250 230, 300 210 C 290 225, 210 225, 200 210 Z" fill="${config.secondary}" opacity="0.3" />
    `;
  } else if (pose === 'jumping') {
    limbsHTML = `
      <!-- Jambes repliées vers l'extérieur pour un saut dynamique -->
      <path d="M 210 330 Q 175 365, 185 395" fill="none" stroke="${config.skin}" stroke-width="24" stroke-linecap="round" />
      <path d="M 150 385 C 150 398, 195 400, 195 385 C 195 372, 165 372, 150 385 Z" fill="${config.secondary}" transform="rotate(-15 150 385)" />
      
      <path d="M 290 330 Q 325 365, 315 395" fill="none" stroke="${config.skin}" stroke-width="24" stroke-linecap="round" />
      <path d="M 350 385 C 350 398, 305 400, 305 385 C 305 372, 335 372, 350 385 Z" fill="${config.secondary}" transform="rotate(15 350 385)" />
      
      <!-- Bras levés de joie et de victoire -->
      <path d="M 150 210 Q 110 160, 100 125" fill="none" stroke="${config.skin}" stroke-width="22" stroke-linecap="round" />
      <path d="M 350 210 Q 390 160, 400 125" fill="none" stroke="${config.skin}" stroke-width="22" stroke-linecap="round" />
    `;
    bodyHTML = `
      <!-- Tunique étirée vers le haut -->
      <path d="M 175 195 C 155 230, 130 300, 155 335 C 180 350, 320 350, 345 335 C 370 300, 345 230, 325 195 Z" fill="${config.primary}" />
      <path d="M 155 335 C 180 350, 320 350, 345 335 C 335 305, 165 305, 155 335 Z" fill="${config.secondary}" opacity="0.25" />
    `;
  } else if (pose === 'sad') {
    limbsHTML = `
      <!-- Jambes rentrées vers l'intérieur (tristesse) -->
      <path d="M 215 340 L 230 410" fill="none" stroke="${config.skin}" stroke-width="24" stroke-linecap="round" />
      <path d="M 285 340 L 270 410" fill="none" stroke="${config.skin}" stroke-width="24" stroke-linecap="round" />
      <path d="M 200 405 C 200 418, 240 418, 240 400 C 240 390, 215 390, 200 405 Z" fill="${config.secondary}" />
      <path d="M 300 405 C 300 418, 260 418, 260 400 C 260 390, 285 390, 300 405 Z" fill="${config.secondary}" />
      <!-- Bras repliés vers le corps (abattement) -->
      <path d="M 145 220 Q 120 280, 140 330" fill="none" stroke="${config.skin}" stroke-width="20" stroke-linecap="round" />
      <path d="M 355 220 Q 380 280, 360 330" fill="none" stroke="${config.skin}" stroke-width="20" stroke-linecap="round" />
    `;
    bodyHTML = `
      <!-- Tunique affaissée -->
      <path d="M 175 220 C 155 250, 135 320, 155 345 C 180 358, 320 358, 345 345 C 365 320, 345 250, 325 220 Z" fill="${config.primary}" />
      <path d="M 155 345 C 180 358, 320 358, 345 345 C 335 315, 165 315, 155 345 Z" fill="${config.secondary}" opacity="0.25" />
    `;
  } else { // running
    limbsHTML = `
      <!-- Jambes en plein mouvement asymétrique de course -->
      <path d="M 210 330 Q 165 375, 185 410" fill="none" stroke="${config.skin}" stroke-width="24" stroke-linecap="round" />
      <path d="M 155 405 C 155 418, 195 420, 195 405 C 195 392, 170 392, 155 405 Z" fill="${config.secondary}" transform="rotate(-15 155 405)" />
      
      <path d="M 285 330 Q 325 360, 290 415" fill="none" stroke="${config.skin}" stroke-width="24" stroke-linecap="round" />
      <path d="M 270 410 C 270 423, 310 425, 310 410 C 310 398, 285 398, 270 410 Z" fill="${config.secondary}" transform="rotate(15 270 410)" />
      
      <!-- Bras fléchis de façon dynamique -->
      <path d="M 145 210 Q 100 240, 130 285" fill="none" stroke="${config.skin}" stroke-width="20" stroke-linecap="round" />
      <path d="M 355 210 Q 380 180, 360 145" fill="none" stroke="${config.skin}" stroke-width="20" stroke-linecap="round" />
    `;
    bodyHTML = `
      <!-- Tunique penchée vers l'avant (dynamisme de la course) -->
      <g transform="skewX(-8 250 280)">
        <path d="M 175 210 C 150 245, 125 315, 150 350 C 175 365, 325 365, 350 350 C 375 315, 350 245, 325 210 Z" fill="${config.primary}" />
        <path d="M 150 350 C 175 365, 325 365, 350 350 C 340 310, 160 310, 150 350 Z" fill="${config.secondary}" opacity="0.25" />
      </g>
    `;
  }

  // 2. Décors et accessoires spécifiques par personnage (DA riche et soignée)
  if (char === 'samson') {
    // Buste musclé de Samson redessiné avec soin
    detailsHTML = `
      <!-- Reliefs musculaires pectoraux / abdominaux organiques -->
      <path d="M 190 235 C 215 242, 285 242, 310 235" stroke="${config.secondary}" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.45" />
      <path d="M 250 238 L 250 295" stroke="${config.secondary}" stroke-width="4.5" stroke-linecap="round" fill="none" opacity="0.45" />
      <!-- Abdos en courbes douces -->
      <path d="M 225 265 Q 250 270 275 265" stroke="${config.secondary}" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.35" />
      <path d="M 225 285 Q 250 290 275 285" stroke="${config.secondary}" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.35" />
      <!-- Bracelets de force dorés courbés sur les bras -->
      <rect x="110" y="270" width="30" height="22" rx="6" fill="${config.accent}" stroke="#1E293B" stroke-width="4.5" transform="rotate(-10 110 270)" />
      <rect x="360" y="270" width="30" height="22" rx="6" fill="${config.accent}" stroke="#1E293B" stroke-width="4.5" transform="rotate(10 360 270)" />
    `;
  } else if (char === 'esther') {
    // Robe royale asymétrique drapée fluide
    bodyHTML = `
      <path d="M 175 210 H 325 L 365 350 C 365 365, 135 365, 135 350 Z" fill="${config.primary}" />
      <!-- Ceinture dorée et drapés de la robe -->
      <path d="M 168 250 C 210 262, 290 262, 332 250 L 338 270 C 290 282, 210 282, 162 270 Z" fill="${config.accent}" stroke="#1E293B" stroke-width="4.5" />
      <path d="M 195 275 Q 250 330, 210 355" fill="none" stroke="${config.secondary}" stroke-width="5" stroke-linecap="round" opacity="0.4" />
      <path d="M 295 275 Q 250 330, 280 355" fill="none" stroke="${config.secondary}" stroke-width="5" stroke-linecap="round" opacity="0.4" />
    `;
  } else if (char === 'gedeon') {
    // Bouclier rond et détails d'armure de Gédéon
    detailsHTML = `
      <!-- Bouclier de bronze fixé au bras -->
      <g id="shield" transform="translate(365, 275)">
        <circle cx="0" cy="0" r="42" fill="${config.accent}" stroke="#1E293B" stroke-width="6.5" />
        <circle cx="0" cy="0" r="28" fill="${config.secondary}" stroke="#1E293B" stroke-width="4.5" />
        <circle cx="0" cy="0" r="10" fill="${config.accent}" stroke="#1E293B" stroke-width="3" />
        <!-- Clous dorés autour du bouclier -->
        <circle cx="-30" cy="0" r="3" fill="#FFFFFF" />
        <circle cx="30" cy="0" r="3" fill="#FFFFFF" />
        <circle cx="0" cy="-30" r="3" fill="#FFFFFF" />
        <circle cx="0" cy="30" r="3" fill="#FFFFFF" />
      </g>
    `;
  } else if (char === 'noe') {
    // Colombe mignonne aux ailes déployées posée sur son bras
    detailsHTML = `
      <g id="dove" transform="translate(100, 195)">
        <!-- Corps de la colombe -->
        <path d="M 10 15 C 10 0, 35 0, 40 10 C 45 5, 55 10, 50 20 C 45 25, 15 25, 10 15 Z" fill="${config.accent}" stroke="#1E293B" stroke-width="4" />
        <!-- Bec orange -->
        <path d="M 38 7 L 48 5 L 42 12 Z" fill="#FBBF24" />
        <circle cx="30" cy="8" r="2.5" fill="#1E293B" />
        <!-- Aile de la colombe -->
        <path d="M 20 12 C 15 2, 5 8, 12 18 Z" fill="#E2E8F0" stroke="#1E293B" stroke-width="3" />
      </g>
    `;
  } else if (char === 'paul') {
    // Paul tient un rouleau de parchemin en cuir
    detailsHTML = `
      <g id="parchment" transform="translate(295, 280) rotate(22)">
        <rect x="0" y="0" width="48" height="75" rx="8" fill="${config.accent}" stroke="#1E293B" stroke-width="5.5" />
        <path d="M 6 0 H 42" stroke="#D97706" stroke-width="4.5" />
        <path d="M 6 75 H 42" stroke="#D97706" stroke-width="4.5" />
        <!-- Lignes d'écriture fines sur le rouleau -->
        <line x1="12" y1="20" x2="36" y2="20" stroke="#78350F" stroke-width="3" stroke-linecap="round" />
        <line x1="12" y1="35" x2="36" y2="35" stroke="#78350F" stroke-width="3" stroke-linecap="round" />
        <line x1="12" y1="50" x2="28" y2="50" stroke="#78350F" stroke-width="3" stroke-linecap="round" />
      </g>
    `;
  } else if (char === 'pierre') {
    // Pierre tient sa grande clé dorée
    detailsHTML = `
      <g id="key" transform="translate(325, 255) rotate(-10)">
        <circle cx="20" cy="20" r="18" fill="none" stroke="${config.accent}" stroke-width="7" />
        <circle cx="20" cy="20" r="6" fill="none" stroke="${config.accent}" stroke-width="4.5" />
        <rect x="16" y="38" width="8" height="52" fill="${config.accent}" rx="2.5" stroke="#1E293B" stroke-width="1.5" />
        <!-- Dents de la clé dorée -->
        <path d="M 24 70 h 12 v 10 h -12 Z" fill="${config.accent}" />
        <path d="M 24 82 h 12 v 10 h -12 Z" fill="${config.accent}" />
      </g>
    `;
  } else if (char === 'moise') {
    // Les deux Tablettes de la Loi en pierre grise sous le bras
    detailsHTML = `
      <g id="tablets" transform="translate(100, 235) rotate(-6)">
        <rect x="0" y="0" width="75" height="95" rx="18" fill="${config.accent}" stroke="#1E293B" stroke-width="6" />
        <line x1="37.5" y1="5" x2="37.5" y2="90" stroke="#4B5563" stroke-width="4.5" />
        <!-- Commandements hébraïques schématisés -->
        <path d="M 10 25 h 18" stroke="#374151" stroke-width="4.5" stroke-linecap="round" />
        <path d="M 10 45 h 15" stroke="#374151" stroke-width="4.5" stroke-linecap="round" />
        <path d="M 10 65 h 20" stroke="#374151" stroke-width="4.5" stroke-linecap="round" />
        <path d="M 47 25 h 18" stroke="#374151" stroke-width="4.5" stroke-linecap="round" />
        <path d="M 47 45 h 20" stroke="#374151" stroke-width="4.5" stroke-linecap="round" />
        <path d="M 47 65 h 15" stroke="#374151" stroke-width="4.5" stroke-linecap="round" />
      </g>
    `;
  } else if (char === 'abraham') {
    // Abraham tient son bâton de berger courbé en bois
    detailsHTML = `
      <!-- Bâton noueux et texturé en bois -->
      <path d="M 115 180 Q 110 240, 115 310 T 110 440" fill="none" stroke="${config.accent}" stroke-width="12" stroke-linecap="round" />
      <circle cx="112" cy="180" r="10" fill="${config.accent}" />
    `;
  } else if (char === 'david') {
    // David porte sa petite harpe dorée
    detailsHTML = `
      <g id="harp" transform="translate(115, 255) rotate(12)">
        <path d="M 0 0 C 15 -10, 45 -5, 52 12 C 55 25, 42 68, 42 68 C 42 68, 15 65, 0 45 Z" fill="none" stroke="${config.accent}" stroke-width="7.5" />
        <!-- Barre centrale et cordes -->
        <line x1="0" y1="0" x2="42" y2="68" stroke="${config.accent}" stroke-width="7.5" />
        <line x1="12" y1="5" x2="12" y2="50" stroke="#D97706" stroke-width="2.5" />
        <line x1="22" y1="7" x2="22" y2="55" stroke="#D97706" stroke-width="2.5" />
        <line x1="32" y1="9" x2="32" y2="60" stroke="#D97706" stroke-width="2.5" />
      </g>
    `;
  }

  return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
    <!-- Ombre de contact propre style Duolingo (le composant CharacterRenderer applique aussi son ombre de sol) -->
    <ellipse cx="250" cy="425" rx="85" ry="11" fill="#E2E8F0" />
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
          <circle cx="202" cy="215" r="28" fill="${config.hair}" />
          <circle cx="193" cy="206" r="9.5" fill="#FFFFFF" />
          <circle cx="210" cy="223" r="4.5" fill="#FFFFFF" />
          <circle cx="298" cy="215" r="28" fill="${config.hair}" />
          <circle cx="289" cy="206" r="9.5" fill="#FFFFFF" />
          <circle cx="306" cy="223" r="4.5" fill="#FFFFFF" />
        </g>
        <g id="blush">
          <ellipse cx="165" cy="252" rx="20" ry="11" fill="#FDA4AF" opacity="0.7" />
          <ellipse cx="335" cy="252" rx="20" ry="11" fill="#FDA4AF" opacity="0.7" />
        </g>
        <path d="M232 258 Q250 272 268 258" stroke="${config.hair}" stroke-width="8" stroke-linecap="round" fill="none" />
      </svg>`;
    } else if (expr === 'happy') {
      return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <g id="eyes">
          <path d="M180 220 Q202 192 224 220" stroke="${config.hair}" stroke-width="9.5" stroke-linecap="round" fill="none" />
          <path d="M276 220 Q298 192 320 220" stroke="${config.hair}" stroke-width="9.5" stroke-linecap="round" fill="none" />
        </g>
        <g id="blush">
          <ellipse cx="165" cy="252" rx="22" ry="13" fill="#FDA4AF" opacity="0.75" />
          <ellipse cx="335" cy="252" rx="22" ry="13" fill="#FDA4AF" opacity="0.75" />
        </g>
        <g id="mouth">
          <path d="M230 248 Q250 288 270 248 Z" fill="#EF4444" stroke="${config.hair}" stroke-width="7" stroke-linejoin="round" />
          <path d="M240 268 Q250 255 260 268 Q250 281 240 268" fill="#F472B6" />
        </g>
      </svg>`;
    } else if (expr === 'sweating') {
      return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <g id="eyes">
          <path d="M185 220 h35" stroke="${config.hair}" stroke-width="9.5" stroke-linecap="round" />
          <path d="M280 220 h35" stroke="${config.hair}" stroke-width="9.5" stroke-linecap="round" />
        </g>
        <g id="blush">
          <ellipse cx="165" cy="252" rx="18" ry="10" fill="#FDA4AF" opacity="0.5" />
          <ellipse cx="335" cy="252" rx="18" ry="10" fill="#FDA4AF" opacity="0.5" />
        </g>
        <ellipse cx="250" cy="256" rx="15" ry="8.5" fill="${config.hair}" />
        <path d="M335 170 C348 200, 320 210, 325 190 Z" fill="#3B82F6" stroke="${config.hair}" stroke-width="4.5" stroke-linejoin="round" />
      </svg>`;
    } else { // crying
      return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <g id="eyes">
          <path d="M180 225 Q202 242 224 225" stroke="${config.hair}" stroke-width="8.5" stroke-linecap="round" fill="none" />
          <path d="M276 225 Q298 242 320 225" stroke="${config.hair}" stroke-width="8.5" stroke-linecap="round" fill="none" />
        </g>
        <path d="M232 268 Q250 252 268 268" stroke="${config.hair}" stroke-width="8" stroke-linecap="round" fill="none" />
        <path d="M190 235 v48 c0 7, 10 7, 10 0 v-48z" fill="#60A5FA" />
        <path d="M298 235 v48 c0 7, 10 7, 10 0 v-48z" fill="#60A5FA" />
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

  // Coiffures et barbes selon le personnage (Formes fluides, drapées et volumineuses)
  if (char === 'samson') {
    // Cheveux longs et volumineux ondulés de Samson
    hairBack = `<path d="M 160 170 C 130 110, 140 50, 250 50 C 360 50, 370 110, 340 170 C 375 220, 380 300, 335 320 C 310 240, 310 190, 310 170 L 190 170 C 190 190, 190 240, 165 320 C 120 300, 125 220, 160 170 Z" fill="${config.hair}" />`;
    hairFront = `<path d="M 175 125 C 205 105, 295 105, 325 125 L 330 142 C 290 135, 210 135, 170 142 Z" fill="${config.accent}" stroke="#1E293B" stroke-width="5" />`; // Bandeau
  } else if (char === 'esther') {
    // Cheveux de reine très ondulés et couronne dorée ciselée
    hairBack = `<path d="M 155 170 C 120 100, 150 40, 250 40 C 350 40, 380 100, 345 170 C 385 240, 360 320, 330 330 C 305 240, 305 180, 305 165 L 195 165 C 195 180, 195 240, 170 330 C 140 320, 115 240, 155 170 Z" fill="${config.hair}" />`;
    hairFront = `<path d="M 195 120 L 210 80 L 235 100 L 250 75 L 265 100 L 290 80 L 305 120 Z" fill="${config.accent}" stroke="#1E293B" stroke-width="4.5" />`; // Couronne
  } else if (char === 'gedeon') {
    // Casque de Gédéon avec plumet ondulé
    hairFront = `
      <path d="M 175 160 C 175 90, 325 90, 325 160 Z" fill="${config.accent}" stroke="#1E293B" stroke-width="5" />
      <path d="M 235 105 Q 250 50, 265 105 Z" fill="#EF4444" stroke="#1E293B" stroke-width="4" /> <!-- Plumet -->
      <path d="M 220 105 h 60 v 10 h -60 Z" fill="${config.secondary}" />
    `;
  } else if (char === 'noe') {
    // Barbe de patriarche en nuage et cheveux gris
    hairBack = `<path d="M 170 170 C 160 80, 340 80, 330 170 Z" fill="${config.hair}" />`;
    beardHTML = `<path d="M 175 185 C 175 290, 325 290, 325 185 C 300 290, 200 290, 175 185 Z" fill="${config.hair}" stroke="#E2E8F0" stroke-width="2" />`;
  } else if (char === 'paul') {
    // Cheveux et barbe taillés propres
    hairBack = `<path d="M 175 170 C 170 70, 330 70, 325 170 Z" fill="${config.hair}" />`;
    beardHTML = `<path d="M 180 185 C 180 270, 320 270, 320 185 C 300 260, 200 260, 180 185 Z" fill="${config.hair}" stroke="#451A03" stroke-width="2" />`;
  } else if (char === 'pierre') {
    // Cheveux et barbe frisés bouclés gris
    hairBack = `<path d="M 172 165 C 150 120, 350 120, 328 165 Z" fill="${config.hair}" />`;
    beardHTML = `<path d="M 175 190 C 175 285, 325 285, 325 190 C 295 280, 205 280, 175 190 Z" fill="${config.hair}" stroke="#CBD5E1" stroke-width="2.5" />`;
  } else if (char === 'moise') {
    // Longue barbe de prophète majestueuse et cheveux ondulés drapés
    hairBack = `<path d="M 172 170 C 140 80, 360 80, 328 170 Z" fill="${config.hair}" />`;
    beardHTML = `<path d="M 170 190 C 170 310, 330 310, 330 190 C 300 315, 200 315, 170 190 Z" fill="${config.hair}" stroke="#E2E8F0" stroke-width="2" />`;
  } else if (char === 'abraham') {
    // Turban nomade drapé et barbe blanche
    hairBack = `
      <!-- Turban blanc enroulé -->
      <path d="M 165 150 C 165 60, 335 60, 335 150 Z" fill="#FFFFFF" stroke="#1E293B" stroke-width="5.5" />
      <path d="M 180 125 C 210 100, 290 100, 320 125 L 325 142 C 295 130, 205 130, 175 142 Z" fill="${config.secondary}" stroke="#1E293B" stroke-width="4.5" />
    `;
    beardHTML = `<path d="M 178 185 C 178 285, 322 285, 322 185 C 290 280, 210 280, 178 185 Z" fill="${config.hair}" stroke="#E2E8F0" stroke-width="2" />`;
  } else if (char === 'david') {
    // Cheveux roux bouclés courts de David avec couronne royale
    hairBack = `<path d="M 172 170 C 140 80, 360 80, 328 170 Z" fill="${config.hair}" />`;
    hairFront = `<path d="M 195 125 L 210 90 L 235 110 L 250 85 L 265 110 L 290 90 L 305 125 Z" fill="${config.accent}" stroke="#1E293B" stroke-width="4" />`;
  }

  // 3. Dessin des yeux et bouches selon l'expression (Yeux mieux dimensionnés avec sourcils pour éviter l'effet lunettes)
  let faceHTML = '';
  if (expr === 'neutral') {
    faceHTML = `
      <!-- Sourcils expressifs pour structurer le visage -->
      <path d="M${headX - 38} ${headY - 22} Q${headX - 24} ${headY - 32} L${headX - 10} ${headY - 24}" stroke="#1E293B" stroke-width="5" stroke-linecap="round" fill="none" />
      <path d="M${headX + 10} ${headY - 24} Q${headX + 24} ${headY - 32} L${headX + 38} ${headY - 22}" stroke="#1E293B" stroke-width="5" stroke-linecap="round" fill="none" />

      <!-- Yeux cartoon bien proportionnés -->
      <circle cx="${headX - 24}" cy="${headY}" r="14" fill="#1E293B" />
      <circle cx="${headX - 28}" cy="${headY - 4}" r="5" fill="#FFFFFF" />
      <circle cx="${headX - 20}" cy="${headY + 4}" r="2" fill="#FFFFFF" />

      <circle cx="${headX + 24}" cy="${headY}" r="14" fill="#1E293B" />
      <circle cx="${headX + 20}" cy="${headY - 4}" r="5" fill="#FFFFFF" />
      <circle cx="${headX + 28}" cy="${headY + 4}" r="2" fill="#FFFFFF" />

      <!-- Blush rose kawaii -->
      <ellipse cx="${headX - 42}" cy="${headY + 24}" rx="14" ry="7" fill="#FDA4AF" opacity="0.65" />
      <ellipse cx="${headX + 42}" cy="${headY + 24}" rx="14" ry="7" fill="#FDA4AF" opacity="0.65" />

      <!-- Bouche en léger sourire curieux -->
      <path d="M${headX - 12} ${headY + 30} Q${headX} ${headY + 42} L${headX + 12} ${headY + 30}" stroke="#1E293B" stroke-width="6.5" stroke-linecap="round" fill="none" />
    `;
  } else if (expr === 'happy') {
    faceHTML = `
      <!-- Sourcils levés de joie -->
      <path d="M${headX - 38} ${headY - 25} Q${headX - 24} ${headY - 35} L${headX - 10} ${headY - 27}" stroke="#1E293B" stroke-width="5" stroke-linecap="round" fill="none" />
      <path d="M${headX + 10} ${headY - 27} Q${headX + 24} ${headY - 35} L${headX + 38} ${headY - 25}" stroke="#1E293B" stroke-width="5" stroke-linecap="round" fill="none" />

      <!-- Yeux joyeux arqués -->
      <path d="M${headX - 35} ${headY + 4} Q${headX - 22} ${headY - 14} L${headX - 9} ${headY + 4}" stroke="#1E293B" stroke-width="8" stroke-linecap="round" fill="none" />
      <path d="M${headX + 9} ${headY + 4} Q${headX + 22} ${headY - 14} L${headX + 35} ${headY + 4}" stroke="#1E293B" stroke-width="8" stroke-linecap="round" fill="none" />

      <!-- Blush rose -->
      <ellipse cx="${headX - 42}" cy="${headY + 24}" rx="16" ry="9" fill="#FDA4AF" opacity="0.75" />
      <ellipse cx="${headX + 42}" cy="${headY + 24}" rx="16" ry="9" fill="#FDA4AF" opacity="0.75" />

      <!-- Bouche ouverte avec langue rose -->
      <path d="M${headX - 14} ${headY + 26} Q${headX} ${headY + 54} L${headX + 14} ${headY + 26} Z" fill="#EF4444" stroke="#1E293B" stroke-width="5.5" stroke-linejoin="round" />
      <path d="M${headX - 7} ${headY + 42} Q${headX} ${headY + 34} L${headX + 7} ${headY + 42} Q${headX} ${headY + 50} L${headX - 7} ${headY + 42}" fill="#F472B6" />
    `;
  } else if (expr === 'sweating') {
    faceHTML = `
      <!-- Sourcils froncés d'effort -->
      <path d="M${headX - 35} ${headY - 18} L${headX - 12} ${headY - 24}" stroke="#1E293B" stroke-width="5.5" stroke-linecap="round" />
      <path d="M${headX + 12} ${headY - 24} L${headX + 35} ${headY - 18}" stroke="#1E293B" stroke-width="5.5" stroke-linecap="round" />

      <!-- Yeux plissés -->
      <path d="M${headX - 34} ${headY + 4} L${headX - 12} ${headY + 4}" stroke="#1E293B" stroke-width="8" stroke-linecap="round" />
      <path d="M${headX + 12} ${headY + 4} L${headX + 34} ${headY + 4}" stroke="#1E293B" stroke-width="8" stroke-linecap="round" />

      <ellipse cx="${headX - 42}" cy="${headY + 24}" rx="12" ry="7" fill="#FDA4AF" opacity="0.5" />
      <ellipse cx="${headX + 42}" cy="${headY + 24}" rx="12" ry="7" fill="#FDA4AF" opacity="0.5" />

      <ellipse cx="${headX}" cy="${headY + 24}" rx="12" ry="7" fill="#1E293B" />
      <!-- Goutte de sueur bleue -->
      <path d="M${headX + 48} ${headY - 22} C${headX + 58} ${headY + 4}, ${headX + 36} ${headY + 4}, ${headX + 38} ${headY - 8} Z" fill="#3B82F6" stroke="#1E293B" stroke-width="4" stroke-linejoin="round" />
    `;
  } else { // crying
    faceHTML = `
      <!-- Sourcils obliques de tristesse -->
      <path d="M${headX - 36} ${headY - 24} L${headX - 12} ${headY - 16}" stroke="#1E293B" stroke-width="5.5" stroke-linecap="round" />
      <path d="M${headX + 12} ${headY - 16} L${headX + 36} ${headY - 24}" stroke="#1E293B" stroke-width="5.5" stroke-linecap="round" />

      <!-- Yeux fermés tristes vers le bas -->
      <path d="M${headX - 34} ${headY + 8} Q${headX - 22} ${headY + 20} L${headX - 10} ${headY + 8}" stroke="#1E293B" stroke-width="7.5" stroke-linecap="round" fill="none" />
      <path d="M${headX + 10} ${headY + 8} Q${headX + 22} ${headY + 20} L${headX + 34} ${headY + 8}" stroke="#1E293B" stroke-width="7.5" stroke-linecap="round" fill="none" />

      <!-- Bouche triste tremblante -->
      <path d="M${headX - 15} ${headY + 36} Q${headX} ${headY + 24} L${headX + 15} ${headY + 36}" stroke="#1E293B" stroke-width="6.5" stroke-linecap="round" fill="none" />
      <!-- Larmes d'eau coulantes -->
      <path d="M${headX - 24} ${headY + 12} v35 c0 5, 8 5, 8 0 v-35z" fill="#60A5FA" />
      <path d="M${headX + 16} ${headY + 12} v35 c0 5, 8 5, 8 0 v-35z" fill="#60A5FA" />
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
