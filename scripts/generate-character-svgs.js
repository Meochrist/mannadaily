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

// --- TEMPLATES DES POSES (Multipliés par 5 pour ViewBox 500x500) ---
function getPoseSVG(char, pose) {
  const config = DESIGN_CONFIGS[char];
  
  if (char === 'manny') {
    // Manny est une Bible animée (Livre ouvert)
    if (pose === 'idle') {
      return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <!-- Couverture -->
        <rect x="115" y="140" width="270" height="220" rx="30" fill="${config.primary}" />
        <!-- Pages blanches -->
        <path d="M130 150 h110 v190 h-110 z M260 150 h110 v190 h-110 z" fill="${config.skin}" />
        <!-- Tranche / Reliure -->
        <rect x="240" y="145" width="20" height="210" rx="5" fill="#F1F5F9" />
        <!-- Bras -->
        <rect x="80" y="225" width="40" height="30" rx="15" fill="${config.hair}" />
        <rect x="380" y="225" width="40" height="30" rx="15" fill="${config.hair}" />
        <!-- Jambes -->
        <rect x="190" y="360" width="30" height="60" rx="15" fill="${config.hair}" />
        <rect x="280" y="360" width="30" height="60" rx="15" fill="${config.hair}" />
      </svg>`;
    } else if (pose === 'jumping') {
      return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <!-- Couverture penchée -->
        <rect x="115" y="110" width="270" height="220" rx="30" fill="${config.primary}" transform="rotate(-5 250 220)" />
        <!-- Pages blanches -->
        <path d="M130 120 h110 v190 h-110 z M260 120 h110 v190 h-110 z" fill="${config.skin}" transform="rotate(-5 250 220)" />
        <!-- Tranche -->
        <rect x="240" y="115" width="20" height="210" rx="5" fill="#F1F5F9" transform="rotate(-5 250 220)" />
        <!-- Bras levés -->
        <path d="M60 150 Q80 200 110 210" stroke="${config.hair}" stroke-width="25" stroke-linecap="round" fill="none" />
        <path d="M440 150 Q420 200 390 210" stroke="${config.hair}" stroke-width="25" stroke-linecap="round" fill="none" />
        <!-- Jambes en l'air -->
        <rect x="180" y="330" width="30" height="70" rx="15" fill="${config.hair}" transform="rotate(-20 180 330)" />
        <rect x="290" y="330" width="30" height="70" rx="15" fill="${config.hair}" transform="rotate(20 290 330)" />
      </svg>`;
    } else if (pose === 'sad') {
      return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <!-- Couverture à moitié refermée -->
        <rect x="130" y="160" width="240" height="220" rx="30" fill="${config.primary}" />
        <!-- Pages blanches refermées -->
        <path d="M145 170 h95 v190 h-95 z M260 170 h95 v190 h-95 z" fill="${config.skin}" />
        <rect x="240" y="165" width="20" height="210" rx="5" fill="#E2E8F0" />
        <!-- Bras ballants tristes -->
        <path d="M100 260 Q115 310 125 340" stroke="${config.hair}" stroke-width="25" stroke-linecap="round" fill="none" />
        <path d="M400 260 Q385 310 375 340" stroke="${config.hair}" stroke-width="25" stroke-linecap="round" fill="none" />
        <!-- Jambes fléchies -->
        <path d="M190 380 v30 h-15" stroke="${config.hair}" stroke-width="25" stroke-linecap="round" fill="none" />
        <path d="M310 380 v30 h15" stroke="${config.hair}" stroke-width="25" stroke-linecap="round" fill="none" />
      </svg>`;
    } else { // running
      return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <!-- Couverture inclinée course -->
        <rect x="115" y="130" width="270" height="220" rx="30" fill="${config.primary}" transform="skewX(-10) rotate(-2 250 240)" />
        <!-- Pages blanches -->
        <path d="M130 140 h110 v190 h-110 z M260 140 h110 v190 h-110 z" fill="${config.skin}" transform="skewX(-10) rotate(-2 250 240)" />
        <!-- Tranche -->
        <rect x="240" y="135" width="20" height="210" rx="5" fill="#F1F5F9" transform="skewX(-10) rotate(-2 250 240)" />
        <!-- Bras de course -->
        <path d="M70 210 Q100 240 80 280" stroke="${config.hair}" stroke-width="25" stroke-linecap="round" fill="none" />
        <path d="M430 210 Q400 240 420 280" stroke="${config.hair}" stroke-width="25" stroke-linecap="round" fill="none" />
        <!-- Jambes de course actives -->
        <path d="M175 350 Q150 400 200 420" stroke="${config.hair}" stroke-width="25" stroke-linecap="round" fill="none" />
        <path d="M275 350 Q325 375 300 420" stroke="${config.hair}" stroke-width="25" stroke-linecap="round" fill="none" />
      </svg>`;
    }
  }

  // Autres personnages humains
  let bodyPath = '';
  let limbsPath = '';
  let detailsPath = '';

  if (pose === 'idle') {
    limbsPath = `
      <!-- Jambes droites -->
      <rect x="200" y="350" width="35" height="75" rx="17.5" fill="${config.skin}" />
      <rect x="265" y="350" width="35" height="75" rx="17.5" fill="${config.skin}" />
      <!-- Pieds/Chaussures -->
      <rect x="185" y="410" width="50" height="20" rx="10" fill="${config.secondary}" />
      <rect x="265" y="410" width="50" height="20" rx="10" fill="${config.secondary}" />
      <!-- Bras -->
      <rect x="125" y="220" width="35" height="110" rx="17.5" fill="${config.skin}" />
      <rect x="340" y="220" width="35" height="110" rx="17.5" fill="${config.skin}" />
    `;
    bodyPath = `
      <!-- Tunique / Torse -->
      <rect x="155" y="210" width="190" height="150" rx="40" fill="${config.primary}" />
    `;
  } else if (pose === 'jumping') {
    limbsPath = `
      <!-- Jambes fléchies en l'air -->
      <rect x="180" y="325" width="35" height="75" rx="17.5" fill="${config.skin}" transform="rotate(-30 180 325)" />
      <rect x="285" y="325" width="35" height="75" rx="17.5" fill="${config.skin}" transform="rotate(30 285 325)" />
      <!-- Pieds -->
      <rect x="140" y="365" width="50" height="20" rx="10" fill="${config.secondary}" transform="rotate(-30 140 365)" />
      <rect x="310" y="365" width="50" height="20" rx="10" fill="${config.secondary}" transform="rotate(30 310 365)" />
      <!-- Bras levés de joie -->
      <rect x="110" y="140" width="35" height="110" rx="17.5" fill="${config.skin}" transform="rotate(45 110 140)" />
      <rect x="355" y="140" width="35" height="110" rx="17.5" fill="${config.skin}" transform="rotate(-45 355 140)" />
    `;
    bodyPath = `
      <!-- Torse -->
      <rect x="155" y="190" width="190" height="150" rx="40" fill="${config.primary}" />
    `;
  } else if (pose === 'sad') {
    limbsPath = `
      <!-- Jambes -->
      <rect x="205" y="360" width="30" height="70" rx="15" fill="${config.skin}" />
      <rect x="265" y="360" width="30" height="70" rx="15" fill="${config.skin}" />
      <!-- Bras ballants tristes -->
      <rect x="130" y="240" width="30" height="110" rx="15" fill="${config.skin}" transform="rotate(5 130 240)" />
      <rect x="340" y="240" width="30" height="110" rx="15" fill="${config.skin}" transform="rotate(-5 340 240)" />
    `;
    bodyPath = `
      <!-- Torse affaissé -->
      <rect x="160" y="220" width="180" height="150" rx="40" fill="${config.primary}" />
    `;
  } else { // running
    limbsPath = `
      <!-- Jambes en course -->
      <rect x="170" y="340" width="35" height="80" rx="17.5" fill="${config.skin}" transform="rotate(-40 170 340)" />
      <rect x="260" y="340" width="35" height="80" rx="17.5" fill="${config.skin}" transform="rotate(30 260 340)" />
      <!-- Bras course -->
      <rect x="110" y="230" width="35" height="100" rx="17.5" fill="${config.skin}" transform="rotate(45 110 230)" />
      <rect x="340" y="210" width="35" height="100" rx="17.5" fill="${config.skin}" transform="rotate(-30 340 210)" />
    `;
    bodyPath = `
      <!-- Torse incliné -->
      <rect x="155" y="200" width="190" height="150" rx="40" fill="${config.primary}" transform="skewX(-8)" />
    `;
  }

  // Éléments spécifiques du perso
  if (char === 'samson') {
    detailsPath = `<circle cx="185" cy="250" r="15" fill="#B45309" />
                   <circle cx="315" cy="250" r="15" fill="#B45309" />`;
  } else if (char === 'esther') {
    bodyPath = `
      <path d="M155 210 h190 L370 370 H130 Z" fill="${config.primary}" />
      <rect x="180" y="200" width="140" height="25" fill="${config.secondary}" rx="10" />
    `;
  } else if (char === 'gedeon') {
    detailsPath = `<circle cx="250" cy="275" r="40" fill="${config.secondary}" opacity="0.3" />`;
  } else if (char === 'noe') {
    detailsPath = `<line x1="110" y1="190" x2="110" y2="420" stroke="#78350F" stroke-width="20" stroke-linecap="round" />`;
  } else if (char === 'paul') {
    detailsPath = `<rect x="290" y="260" width="70" height="100" rx="10" fill="#FEF08A" stroke="#CA8A04" stroke-width="10" transform="rotate(15 290 260)" />`;
  } else if (char === 'pierre') {
    detailsPath = `<path d="M 160 210 Q 250 320 340 210" fill="none" stroke="${config.secondary}" stroke-width="12" stroke-dasharray="10 10" />`;
  } else if (char === 'moise') {
    detailsPath = `
      <rect x="210" y="260" width="80" height="100" rx="15" fill="#9CA3AF" />
      <line x1="250" y1="260" x2="250" y2="360" stroke="#4B5563" stroke-width="10" />
    `;
  } else if (char === 'abraham') {
    detailsPath = `<line x1="120" y1="180" x2="120" y2="420" stroke="#854D0E" stroke-width="17.5" stroke-linecap="round" />`;
  } else if (char === 'david') {
    detailsPath = `<path d="M 110 275 Q 80 330 110 375" fill="none" stroke="#78350F" stroke-width="10" />`;
  }

  return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
    ${limbsPath}
    ${bodyPath}
    ${detailsPath}
  </svg>`;
}

// --- TEMPLATES DES EXPRESSIONS (Multipliés par 5) ---
function getExpressionSVG(char, expr) {
  const config = DESIGN_CONFIGS[char];
  
  let headX = 250;
  let headY = 140;
  
  if (char === 'esther') headY = 130;
  if (char === 'gedeon') headY = 160;
  if (char === 'noe') headY = 135;

  let headBase = '';
  let hairBase = '';
  let beardBase = '';

  if (char === 'manny') {
    let faceElements = '';
    if (expr === 'neutral') {
      faceElements = `
        <circle cx="200" cy="240" r="12.5" fill="#1E293B" />
        <circle cx="196" cy="236" r="4" fill="#FFFFFF" />
        <circle cx="300" cy="240" r="12.5" fill="#1E293B" />
        <circle cx="296" cy="236" r="4" fill="#FFFFFF" />
        <ellipse cx="180" cy="255" rx="11" ry="6" fill="#FDA4AF" opacity="0.6" />
        <ellipse cx="320" cy="255" rx="11" ry="6" fill="#FDA4AF" opacity="0.6" />
        <path d="M235 275 Q250 290 265 275" stroke="#1E293B" stroke-width="12.5" stroke-linecap="round" fill="none" />
      `;
    } else if (expr === 'happy') {
      faceElements = `
        <path d="M185 245 Q200 225 215 245" stroke="#1E293B" stroke-width="12.5" stroke-linecap="round" fill="none" />
        <path d="M285 245 Q300 225 315 245" stroke="#1E293B" stroke-width="12.5" stroke-linecap="round" fill="none" />
        <ellipse cx="180" cy="260" rx="11" ry="6" fill="#FDA4AF" opacity="0.6" />
        <ellipse cx="320" cy="260" rx="11" ry="6" fill="#FDA4AF" opacity="0.6" />
        <path d="M225 265 Q250 310 275 265" fill="#EF4444" />
      `;
    } else if (expr === 'sweating') {
      faceElements = `
        <circle cx="200" cy="245" r="12.5" fill="#1E293B" />
        <circle cx="196" cy="241" r="4" fill="#FFFFFF" />
        <circle cx="300" cy="245" r="12.5" fill="#1E293B" />
        <circle cx="296" cy="241" r="4" fill="#FFFFFF" />
        <ellipse cx="180" cy="260" rx="10" ry="5.5" fill="#FDA4AF" opacity="0.5" />
        <ellipse cx="320" cy="260" rx="10" ry="5.5" fill="#FDA4AF" opacity="0.5" />
        <path d="M230 280 h40" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
        <path d="M340 200 Q345 240 325 240" fill="#3B82F6" opacity="0.8" />
      `;
    } else { // crying
      faceElements = `
        <path d="M185 255 Q200 275 215 255" stroke="#1E293B" stroke-width="10" stroke-linecap="round" fill="none" />
        <path d="M285 255 Q300 275 315 255" stroke="#1E293B" stroke-width="10" stroke-linecap="round" fill="none" />
        <path d="M230 290 Q250 275 270 290" stroke="#1E293B" stroke-width="10" stroke-linecap="round" fill="none" />
        <path d="M195 260 v60" stroke="#3B82F6" stroke-width="12.5" stroke-linecap="round" />
        <path d="M305 260 v60" stroke="#3B82F6" stroke-width="12.5" stroke-linecap="round" />
      `;
    }
    return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">${faceElements}</svg>`;
  }

  // --- PERSONNAGES HUMAINS ---
  headBase = `<circle cx="${headX}" cy="${headY}" r="75" fill="${config.skin}" />`;

  if (char === 'samson') {
    hairBase = `
      <path d="M 160 ${headY} C 150 25 350 25 340 ${headY} C 360 225 370 300 350 325 C 325 300 310 225 310 200 L 190 200 C 190 225 175 300 150 325 C 130 300 140 225 160 ${headY} Z" fill="${config.hair}" />
      <rect x="170" y="${headY - 70}" width="160" height="20" fill="${config.secondary}" rx="5" />
    `;
  } else if (char === 'esther') {
    hairBase = `
      <path d="M 150 ${headY} C 125 50 375 50 350 ${headY} C 375 275 360 350 330 360 C 310 300 310 210 310 190 L 190 190 C 190 210 190 300 170 360 C 140 350 125 275 150 ${headY} Z" fill="${config.hair}" />
      <path d="M 210 ${headY - 70} L 225 ${headY - 100} L 250 ${headY - 80} L 275 ${headY - 100} L 290 ${headY - 70} Z" fill="#FBBF24" />
    `;
  } else if (char === 'gedeon') {
    hairBase = `
      <path d="M 170 ${headY - 5} C 175 75 325 75 330 ${headY - 5} Z" fill="${config.hair}" />
      <path d="M 150 ${headY - 15} C 150 ${headY - 110} 350 ${headY - 110} 350 ${headY - 15} L 360 ${headY - 10} C 310 ${headY - 25} 190 ${headY - 25} 140 ${headY - 10} Z" fill="${config.secondary}" />
      <rect x="235" y="${headY - 110}" width="30" height="30" fill="#F59E0B" rx="5" />
    `;
  } else if (char === 'noe') {
    hairBase = `<path d="M 165 ${headY + 15} C 160 50 340 50 335 ${headY + 15} Z" fill="#CBD5E1" />`;
    beardBase = `<path d="M 175 ${headY + 25} C 175 275 325 275 325 ${headY + 25} Z" fill="${config.hair}" />`;
  } else if (char === 'paul') {
    hairBase = `<path d="M 165 ${headY + 15} C 160 60 340 60 335 ${headY + 15} Z" fill="${config.hair}" />`;
    beardBase = `<path d="M 180 ${headY + 30} C 190 225 310 225 320 ${headY + 30} Z" fill="${config.hair}" />`;
  } else if (char === 'pierre') {
    hairBase = `<path d="M 160 ${headY - 25} Q 250 ${headY - 100} 340 ${headY - 25} Z" fill="#1D4ED8" />`;
    beardBase = `<path d="M 175 ${headY + 25} C 185 230 315 230 325 ${headY + 25} Z" fill="${config.hair}" />`;
  } else if (char === 'moise') {
    hairBase = `<path d="M 155 ${headY + 20} C 100 60 400 60 345 ${headY + 20} Z" fill="${config.hair}" />`;
    beardBase = `<path d="M 165 ${headY + 20} C 165 290 335 290 335 ${headY + 20} Z" fill="${config.hair}" />`;
  } else if (char === 'abraham') {
    hairBase = `
      <path d="M 155 ${headY - 10} C 155 ${headY - 90} 345 ${headY - 90} 345 ${headY - 10} C 360 150 360 225 340 270 L 160 270 C 140 225 140 150 155 ${headY - 10} Z" fill="#E2E8F0" />
      <rect x="180" y="${headY - 60}" width="140" height="15" fill="#475569" rx="5" />
    `;
    beardBase = `<path d="M 170 ${headY + 25} C 170 270 330 270 330 ${headY + 25} Z" fill="${config.hair}" />`;
  } else if (char === 'david') {
    hairBase = `
      <path d="M 160 ${headY + 10} C 125 75 375 75 340 ${headY + 10} Z" fill="${config.hair}" />
      <path d="M 220 ${headY - 60} L 230 ${headY - 85} L 250 ${headY - 70} L 270 ${headY - 85} L 280 ${headY - 60} Z" fill="#FBBF24" />
    `;
  }

  let faceElements = '';
  if (expr === 'neutral') {
    faceElements = `
      <!-- Sourcils -->
      <path d="M${headX - 35} ${headY - 20} Q${headX - 25} ${headY - 25} L${headX - 15} ${headY - 20}" stroke="#1E293B" stroke-width="6" stroke-linecap="round" fill="none" />
      <path d="M${headX + 15} ${headY - 20} Q${headX + 25} ${headY - 25} L${headX + 35} ${headY - 20}" stroke="#1E293B" stroke-width="6" stroke-linecap="round" fill="none" />
      <!-- Yeux + Reflets -->
      <circle cx="${headX - 25}" cy="${headY}" r="10" fill="#1E293B" />
      <circle cx="${headX - 28}" cy="${headY - 3}" r="3" fill="#FFFFFF" />
      <circle cx="${headX + 25}" cy="${headY}" r="10" fill="#1E293B" />
      <circle cx="${headX + 22}" cy="${headY - 3}" r="3" fill="#FFFFFF" />
      <!-- Blush -->
      <ellipse cx="${headX - 45}" cy="${headY + 15}" rx="10" ry="6" fill="#FDA4AF" opacity="0.6" />
      <ellipse cx="${headX + 45}" cy="${headY + 15}" rx="10" ry="6" fill="#FDA4AF" opacity="0.6" />
      <!-- Bouche -->
      <path d="M${headX - 10} ${headY + 25} Q${headX} ${headY + 35} L${headX + 10} ${headY + 25}" stroke="#1E293B" stroke-width="10" stroke-linecap="round" fill="none" />
    `;
  } else if (expr === 'happy') {
    faceElements = `
      <!-- Sourcils levés -->
      <path d="M${headX - 35} ${headY - 30} Q${headX - 25} ${headY - 35} L${headX - 15} ${headY - 25}" stroke="#1E293B" stroke-width="6" stroke-linecap="round" fill="none" />
      <path d="M${headX + 15} ${headY - 25} Q${headX + 25} ${headY - 35} L${headX + 35} ${headY - 30}" stroke="#1E293B" stroke-width="6" stroke-linecap="round" fill="none" />
      <!-- Yeux plissés -->
      <path d="M${headX - 35} ${headY} Q${headX - 25} ${headY - 15} L${headX - 15} ${headY}" stroke="#1E293B" stroke-width="10" stroke-linecap="round" fill="none" />
      <path d="M${headX + 15} ${headY} Q${headX + 25} ${headY - 15} L${headX + 35} ${headY}" stroke="#1E293B" stroke-width="10" stroke-linecap="round" fill="none" />
      <!-- Blush -->
      <ellipse cx="${headX - 45}" cy="${headY + 15}" rx="12.5" ry="7.5" fill="#FDA4AF" opacity="0.7" />
      <ellipse cx="${headX + 45}" cy="${headY + 15}" rx="12.5" ry="7.5" fill="#FDA4AF" opacity="0.7" />
      <!-- Bouche riante -->
      <path d="M${headX - 15} ${headY + 20} Q${headX} ${headY + 45} L${headX + 15} ${headY + 20}" fill="#EF4444" />
    `;
  } else if (expr === 'sweating') {
    faceElements = `
      <!-- Sourcils inquiets -->
      <path d="M${headX - 35} ${headY - 20} Q${headX - 25} ${headY - 15} L${headX - 15} ${headY - 25}" stroke="#1E293B" stroke-width="6" stroke-linecap="round" fill="none" />
      <path d="M${headX + 15} ${headY - 25} Q${headX + 25} ${headY - 15} L${headX + 35} ${headY - 20}" stroke="#1E293B" stroke-width="6" stroke-linecap="round" fill="none" />
      <!-- Yeux -->
      <circle cx="${headX - 25}" cy="${headY}" r="10" fill="#1E293B" />
      <circle cx="${headX - 28}" cy="${headY - 3}" r="3" fill="#FFFFFF" />
      <circle cx="${headX + 25}" cy="${headY}" r="10" fill="#1E293B" />
      <circle cx="${headX + 22}" cy="${headY - 3}" r="3" fill="#FFFFFF" />
      <!-- Blush -->
      <ellipse cx="${headX - 45}" cy="${headY + 15}" rx="9" ry="5" fill="#FDA4AF" opacity="0.5" />
      <ellipse cx="${headX + 45}" cy="${headY + 15}" rx="9" ry="5" fill="#FDA4AF" opacity="0.5" />
      <!-- Bouche inquiète + Sueur -->
      <path d="M${headX - 15} ${headY + 25} h30" stroke="#1E293B" stroke-width="9" stroke-linecap="round" />
      <path d="M${headX + 55} ${headY - 35} Q${headX + 65} ${headY} L${headX + 45} ${headY}" fill="#3B82F6" opacity="0.8" />
    `;
  } else { // crying
    faceElements = `
      <!-- Sourcils tristes -->
      <path d="M${headX - 35} ${headY - 15} Q${headX - 25} ${headY - 10} L${headX - 15} ${headY - 20}" stroke="#1E293B" stroke-width="6" stroke-linecap="round" fill="none" />
      <path d="M${headX + 15} ${headY - 20} Q${headX + 25} ${headY - 10} L${headX + 35} ${headY - 15}" stroke="#1E293B" stroke-width="6" stroke-linecap="round" fill="none" />
      <!-- Yeux tristes -->
      <path d="M${headX - 35} ${headY + 5} Q${headX - 25} ${headY + 20} L${headX - 15} ${headY + 5}" stroke="#1E293B" stroke-width="10" stroke-linecap="round" fill="none" />
      <path d="M${headX + 15} ${headY + 5} Q${headX + 25} ${headY + 20} L${headX + 35} ${headY + 5}" stroke="#1E293B" stroke-width="10" stroke-linecap="round" fill="none" />
      <!-- Bouche -->
      <path d="M${headX - 15} ${headY + 35} Q${headX} ${headY + 25} L${headX + 15} ${headY + 35}" stroke="#1E293B" stroke-width="10" stroke-linecap="round" fill="none" />
      <!-- Larmes -->
      <path d="M${headX - 25} ${headY + 15} v45" stroke="#3B82F6" stroke-width="10" stroke-linecap="round" />
      <path d="M${headX + 25} ${headY + 15} v45" stroke="#3B82F6" stroke-width="10" stroke-linecap="round" />
    `;
  }

  return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
    ${hairBase}
    ${headBase}
    ${beardBase}
    ${faceElements}
  </svg>`;
}

// --- TEMPLATES DES COSTUMES (Multipliés par 5) ---
function getOutfitSVG(char, outfit) {
  let headX = 250;
  let headY = 140;
  
  if (char === 'esther') headY = 130;
  if (char === 'gedeon') headY = 160;
  if (char === 'noe') headY = 135;

  if (outfit === 'default') {
    return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"></svg>`;
  }

  if (outfit === 'winter') {
    // Bonnet et écharpe rouge
    return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
      <!-- Bonnet -->
      <path d="M 165 ${headY - 30} C 165 ${headY - 125} 335 ${headY - 125} 335 ${headY - 30} Z" fill="#EF4444" />
      <rect x="155" y="${headY - 40}" width="190" height="25" fill="#FFFFFF" rx="10" />
      <circle cx="250" cy="${headY - 115}" r="20" fill="#FFFFFF" />
      <!-- Écharpe -->
      <rect x="160" y="${headY + 60}" width="180" height="30" fill="#EF4444" rx="10" />
      <path d="M 300 ${headY + 75} v 70" stroke="#EF4444" stroke-width="30" stroke-linecap="round" />
    </svg>`;
  }

  if (outfit === 'beach') {
    // Lunettes cool
    return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
      <!-- Lunettes de soleil -->
      <rect x="${headX - 55}" y="${headY - 15}" width="50" height="35" rx="15" fill="#FBBF24" />
      <rect x="${headX + 5}" y="${headY - 15}" width="50" height="35" rx="15" fill="#FBBF24" />
      <line x1="${headX - 5}" y1="${headY}" x2="${headX + 5}" y2="${headY}" stroke="#FBBF24" stroke-width="12.5" />
      <rect x="${headX - 45}" y="${headY - 5}" width="30" height="20" rx="7.5" fill="#1E293B" />
      <rect x="${headX + 15}" y="${headY - 5}" width="30" height="20" rx="7.5" fill="#1E293B" />
    </svg>`;
  }

  if (outfit === 'halloween') {
    // Chapeau de sorcière
    return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="250" cy="${headY - 45}" rx="120" ry="20" fill="#1E293B" />
      <path d="M 170 ${headY - 45} L 250 ${headY - 150} L 330 ${headY - 45} Z" fill="#1E293B" />
      <rect x="210" y="${headY - 60}" width="80" height="15" fill="#7C3AED" />
    </svg>`;
  }

  return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"></svg>`;
}

// --- GÉNÉRATION ---
console.log("Génération de tous les SVGs modulaires sous ViewBox 500x500...");
let filesCreated = 0;

for (const char of CHARACTERS) {
  const charDir = path.join(outputBase, char);
  if (!fs.existsSync(charDir)) {
    fs.mkdirSync(charDir, { recursive: true });
  }

  for (const pose of POSES) {
    const filePath = path.join(charDir, `pose_${pose}.svg`);
    fs.writeFileSync(filePath, getPoseSVG(char, pose).trim(), 'utf8');
    filesCreated++;
  }

  for (const expr of EXPRESSIONS) {
    const filePath = path.join(charDir, `expression_${expr}.svg`);
    fs.writeFileSync(filePath, getExpressionSVG(char, expr).trim(), 'utf8');
    filesCreated++;
  }

  for (const outfit of OUTFITS) {
    const filePath = path.join(charDir, `outfit_${outfit}.svg`);
    fs.writeFileSync(filePath, getOutfitSVG(char, outfit).trim(), 'utf8');
    filesCreated++;
  }
}

console.log(`Terminé ! ${filesCreated} fichiers SVG de ViewBox 500x500 ont été générés avec succès.`);
