const fs = require('fs');
const path = require('path');

const outputDir = path.join('D:', 'Antigravity', 'mannadaily', 'public', 'assets', 'characters', 'manny');

// S'assurer que le dossier existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Couleurs de Manny
const colors = {
  cover: '#4F46E5',        // Indigo principal
  coverDark: '#3730A3',    // Indigo foncé (dos et ombres nettes)
  pages: '#FFFFFF',        // Blanc pages
  pagesShadow: '#E2E8F0',  // Gris d'ombre des pages
  pagesLine: '#CBD5E1',    // Gris d'épaisseur de pages
  limbs: '#64748B',        // Bras et jambes (ardoise)
  feet: '#FBBF24',         // Bottes jaunes
  shadow: '#E2E8F0',       // Ombre au sol idle
  shadowJump: '#CBD5E1',   // Ombre au sol saut
  faceText: '#1E293B',     // Yeux et bouche
  blush: '#FDA4AF',        // Blush rose
  tongue: '#F472B6',       // Langue rose
  mouthBg: '#EF4444',      // Fond de bouche rouge
};

// ----------------------------------------------------
// 1. GENERER LES POSES (SQUELETTES CORPORELS)
// ----------------------------------------------------

// POSE : IDLE
const poseIdle = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <!-- Ombre au sol nette (Flat Design) -->
  <ellipse cx="250" cy="450" rx="90" ry="12" fill="${colors.shadow}" />

  <!-- Membres Inférieurs (Jambes et Bottes) -->
  <g id="legs">
    <!-- Jambe gauche -->
    <path d="M200 360 v50" fill="none" stroke="${colors.limbs}" stroke-width="16" stroke-linecap="round" />
    <!-- Botte gauche -->
    <path d="M180 410 h35 c8 0, 8 16, 0 16 h-35 c-8 0, -8 -16, 0 -16z" fill="${colors.feet}" />
    <!-- Semelle gauche (ombre nette sous la botte) -->
    <path d="M180 426 h35 v2 h-35z" fill="#D97706" />

    <!-- Jambe droite -->
    <path d="M300 360 v50" fill="none" stroke="${colors.limbs}" stroke-width="16" stroke-linecap="round" />
    <!-- Botte droite -->
    <path d="M285 410 h35 c8 0, 8 16, 0 16 h-35 c-8 0, -8 -16, 0 -16z" fill="${colors.feet}" />
    <!-- Semelle droite -->
    <path d="M285 426 h35 v2 h-35z" fill="#D97706" />
  </g>

  <!-- Membres Supérieurs (Bras) -->
  <g id="arms">
    <!-- Bras gauche (amical, légèrement écarté) -->
    <path d="M140 240 C110 240, 95 260, 105 285" fill="none" stroke="${colors.limbs}" stroke-width="16" stroke-linecap="round" />
    <!-- Bras droit (ballant tranquille) -->
    <path d="M360 240 C390 240, 405 260, 395 285" fill="none" stroke="${colors.limbs}" stroke-width="16" stroke-linecap="round" />
  </g>

  <!-- Corps principal (Bible fermée) -->
  <g id="book-body">
    <!-- Ombre de la couverture sur les pages (tranche gauche) -->
    <rect x="135" y="115" width="230" height="250" rx="35" fill="${colors.coverDark}" />
    
    <!-- Couverture principale -->
    <rect x="140" y="110" width="220" height="240" rx="32" fill="${colors.cover}" />
    
    <!-- Reliure / Dos du livre (à gauche pour donner l'orientation de lecture) -->
    <path d="M140 110 v240 c0 17.67 14.33 32 32 32 h18 v-304 h-18 c-17.67 0 -32 14.33 -32 32z" fill="${colors.coverDark}" />

    <!-- Tranche de pages (droite) -->
    <path d="M360 135 h12 v190 h-12z" fill="${colors.pages}" />
    <path d="M372 145 h4 v170 h-4z" fill="${colors.pagesShadow}" /> <!-- Effet d'épaisseur de pages -->
    <path d="M376 160 h3 v140 h-3z" fill="${colors.pagesLine}" />

    <!-- Tranche de pages (bas - courbes asymétriques organiques) -->
    <path d="M185 350 c40 8, 120 8, 175 0 v10 c-55 8, -135 8, -175 0z" fill="${colors.pages}" />
    <path d="M195 360 c30 5, 100 5, 150 0 v6 c-50 5, -120 5, -195 0z" fill="${colors.pagesShadow}" />
  </g>
</svg>`;

// POSE : JUMPING (SUCCESS)
const poseJumping = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <!-- Ombre au sol rétrécie et plus claire (effet de hauteur) -->
  <ellipse cx="250" cy="460" rx="50" ry="7" fill="${colors.shadowJump}" opacity="0.6" />

  <!-- Membres Inférieurs (Jambes pliées de joie) -->
  <g id="legs">
    <!-- Jambe gauche pliée -->
    <path d="M195 345 L175 385" fill="none" stroke="${colors.limbs}" stroke-width="16" stroke-linecap="round" />
    <!-- Botte gauche orientée -->
    <path d="M150 380 h35 c8 0, 8 16, 0 16 h-35 c-8 0, -8 -16, 0 -16z" fill="${colors.feet}" transform="rotate(-15 150 380)" />

    <!-- Jambe droite pliée -->
    <path d="M305 345 L325 385" fill="none" stroke="${colors.limbs}" stroke-width="16" stroke-linecap="round" />
    <!-- Botte droite orientée -->
    <path d="M315 380 h35 c8 0, 8 16, 0 16 h-35 c-8 0, -8 -16, 0 -16z" fill="${colors.feet}" transform="rotate(15 315 380)" />
  </g>

  <!-- Membres Supérieurs (Bras levés de joie) -->
  <g id="arms">
    <!-- Bras gauche levé -->
    <path d="M140 220 Q100 150, 90 125" fill="none" stroke="${colors.limbs}" stroke-width="16" stroke-linecap="round" />
    <!-- Bras droit levé -->
    <path d="M360 220 Q400 150, 410 125" fill="none" stroke="${colors.limbs}" stroke-width="16" stroke-linecap="round" />
  </g>

  <!-- Corps principal (Légère inclinaison vers le haut) -->
  <g id="book-body" transform="translate(0, -30) rotate(2 250 230)">
    <rect x="135" y="115" width="230" height="250" rx="35" fill="${colors.coverDark}" />
    <rect x="140" y="110" width="220" height="240" rx="32" fill="${colors.cover}" />
    <path d="M140 110 v240 c0 17.67 14.33 32 32 32 h18 v-304 h-18 c-17.67 0 -32 14.33 -32 32z" fill="${colors.coverDark}" />
    <path d="M360 135 h12 v190 h-12z" fill="${colors.pages}" />
    <path d="M372 145 h4 v170 h-4z" fill="${colors.pagesShadow}" />
    <path d="M185 350 c40 8, 120 8, 175 0 v10 c-55 8, -135 8, -175 0z" fill="${colors.pages}" />
  </g>
</svg>`;

// POSE : SAD
const poseSad = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="250" cy="450" rx="80" ry="10" fill="${colors.shadow}" />
  <g id="legs">
    <path d="M205 365 v35 h-10" fill="none" stroke="${colors.limbs}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M175 395 h35 c8 0, 8 16, 0 16 h-35 c-8 0, -8 -16, 0 -16z" fill="${colors.feet}" />
    <path d="M295 365 v35 h10" fill="none" stroke="${colors.limbs}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M290 395 h35 c8 0, 8 16, 0 16 h-35 c-8 0, -8 -16, 0 -16z" fill="${colors.feet}" />
  </g>
  <g id="arms">
    <path d="M140 250 Q115 300, 120 330" fill="none" stroke="${colors.limbs}" stroke-width="16" stroke-linecap="round" />
    <path d="M360 250 Q385 300, 380 330" fill="none" stroke="${colors.limbs}" stroke-width="16" stroke-linecap="round" />
  </g>
  <!-- Livre affaissé (plus bas, légèrement courbé vers le bas) -->
  <g id="book-body" transform="translate(0, 15) scale(0.98, 0.96) translate(5, 5)">
    <rect x="135" y="115" width="230" height="250" rx="35" fill="${colors.coverDark}" />
    <rect x="140" y="110" width="220" height="240" rx="32" fill="${colors.cover}" />
    <path d="M140 110 v240 c0 17.67 14.33 32 32 32 h18 v-304 h-18 c-17.67 0 -32 14.33 -32 32z" fill="${colors.coverDark}" />
    <path d="M360 145 h12 v170 h-12z" fill="${colors.pagesShadow}" />
    <path d="M185 350 c40 8, 120 8, 175 0 v10 c-55 8, -135 8, -175 0z" fill="${colors.pages}" />
  </g>
</svg>`;

// POSE : RUNNING
const poseRunning = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <!-- Ombre inclinée étirée -->
  <ellipse cx="230" cy="450" rx="80" ry="10" fill="${colors.shadow}" transform="skewX(-15 230 450)" />
  <g id="legs">
    <!-- Jambe course arrière -->
    <path d="M190 350 Q150 400, 180 420" fill="none" stroke="${colors.limbs}" stroke-width="16" stroke-linecap="round" />
    <path d="M160 415 h35 c8 0, 8 16, 0 16 h-35 c-8 0, -8 -16, 0 -16z" fill="${colors.feet}" transform="rotate(-10 160 415)" />
    <!-- Jambe course avant -->
    <path d="M290 350 Q330 380, 310 425" fill="none" stroke="${colors.limbs}" stroke-width="16" stroke-linecap="round" />
    <path d="M295 420 h35 c8 0, 8 16, 0 16 h-35 c-8 0, -8 -16, 0 -16z" fill="${colors.feet}" transform="rotate(15 295 420)" />
  </g>
  <g id="arms">
    <path d="M130 240 Q95 270, 115 300" fill="none" stroke="${colors.limbs}" stroke-width="16" stroke-linecap="round" />
    <path d="M360 230 Q395 210, 370 175" fill="none" stroke="${colors.limbs}" stroke-width="16" stroke-linecap="round" />
  </g>
  <!-- Livre incliné course -->
  <g id="book-body" transform="translate(-10, 5) skewX(-8) rotate(-2 250 230)">
    <rect x="135" y="115" width="230" height="250" rx="35" fill="${colors.coverDark}" />
    <rect x="140" y="110" width="220" height="240" rx="32" fill="${colors.cover}" />
    <path d="M140 110 v240 c0 17.67 14.33 32 32 32 h18 v-304 h-18 c-17.67 0 -32 14.33 -32 32z" fill="${colors.coverDark}" />
    <path d="M360 135 h12 v190 h-12z" fill="${colors.pages}" />
    <path d="M372 145 h4 v170 h-4z" fill="${colors.pagesShadow}" />
    <path d="M185 350 c40 8, 120 8, 175 0 v10 c-55 8, -135 8, -175 0z" fill="${colors.pages}" />
  </g>
</svg>`;

// ----------------------------------------------------
// 2. GENERER LES EXPRESSIONS (YEUX GÉANTS 60% VISAGE)
// ----------------------------------------------------

// EXPRESSION : NEUTRAL (IDLE)
const exprNeutral = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <g id="eyes">
    <!-- Grands yeux expressifs (Duolingo style) -->
    <!-- Oeil gauche -->
    <circle cx="205" cy="215" r="24" fill="${colors.faceText}" />
    <circle cx="197" cy="207" r="7" fill="#FFFFFF" /> <!-- Grand éclat blanc -->
    <circle cx="212" cy="222" r="3" fill="#FFFFFF" /> <!-- Petit éclat secondaire -->

    <!-- Oeil droit -->
    <circle cx="295" cy="215" r="24" fill="${colors.faceText}" />
    <circle cx="287" cy="207" r="7" fill="#FFFFFF" />
    <circle cx="302" cy="222" r="3" fill="#FFFFFF" />
  </g>

  <!-- Joues roses blush très mignonnes -->
  <g id="blush">
    <ellipse cx="170" cy="250" rx="18" ry="10" fill="${colors.blush}" opacity="0.65" />
    <ellipse cx="330" cy="250" rx="18" ry="10" fill="${colors.blush}" opacity="0.65" />
  </g>

  <!-- Bouche souriante calme (arc noir épais) -->
  <path d="M235 255 Q250 270 265 255" stroke="${colors.faceText}" stroke-width="8" stroke-linecap="round" fill="none" />
</svg>`;

// EXPRESSION : HAPPY (SUCCESS / JUMPING)
const exprHappy = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <g id="eyes">
    <!-- Yeux pliés de bonheur intense (arcs épais orientés vers le haut) -->
    <path d="M185 220 Q205 195 225 220" stroke="${colors.faceText}" stroke-width="9" stroke-linecap="round" fill="none" />
    <path d="M275 220 Q295 195 315 220" stroke="${colors.faceText}" stroke-width="9" stroke-linecap="round" fill="none" />
  </g>

  <g id="blush">
    <ellipse cx="170" cy="250" rx="20" ry="12" fill="${colors.blush}" opacity="0.75" />
    <ellipse cx="330" cy="250" rx="20" ry="12" fill="${colors.blush}" opacity="0.75" />
  </g>

  <!-- Bouche ouverte riante avec langue rose (Flat Design 2.0) -->
  <g id="mouth">
    <!-- Fond de la bouche -->
    <path d="M230 245 Q250 285 270 245 Z" fill="${colors.mouthBg}" stroke="${colors.faceText}" stroke-width="7" stroke-linejoin="round" />
    <!-- Langue rose imbriquée de façon nette -->
    <path d="M240 265 Q250 252 260 265 Q250 278 240 265" fill="${colors.tongue}" />
  </g>
</svg>`;

// EXPRESSION : SWEATING (WEATHER HOT)
const exprSweating = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <g id="eyes">
    <!-- Yeux plissés de fatigue/effort -->
    <path d="M190 220 h30" stroke="${colors.faceText}" stroke-width="9" stroke-linecap="round" />
    <path d="M280 220 h30" stroke="${colors.faceText}" stroke-width="9" stroke-linecap="round" />
  </g>

  <g id="blush">
    <ellipse cx="170" cy="250" rx="16" ry="9" fill="${colors.blush}" opacity="0.5" />
    <ellipse cx="330" cy="250" rx="16" ry="9" fill="${colors.blush}" opacity="0.5" />
  </g>

  <!-- Bouche ouverte fatiguée (ellipse noire avec relief) -->
  <ellipse cx="250" cy="255" rx="14" ry="8" fill="${colors.faceText}" />

  <!-- Goutte de sueur 3D en aplat bleu (Flat) -->
  <path d="M330 170 Q340 200 325 210 Q310 210 320 190 Z" fill="#3B82F6" stroke="${colors.faceText}" stroke-width="4" stroke-linejoin="round" />
</svg>`;

// EXPRESSION : CRYING (CRITICAL STREAK)
const exprCrying = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <g id="eyes">
    <!-- Yeux tristes serrés -->
    <path d="M185 225 Q205 240 225 225" stroke="${colors.faceText}" stroke-width="8" stroke-linecap="round" fill="none" />
    <path d="M275 225 Q295 240 315 225" stroke="${colors.faceText}" stroke-width="8" stroke-linecap="round" fill="none" />
  </g>

  <!-- Bouche tremblante triste -->
  <path d="M232 265 Q250 252 268 265" stroke="${colors.faceText}" stroke-width="8" stroke-linecap="round" fill="none" />

  <!-- Larmes qui coulent (grandes gouttes bleues plates) -->
  <path d="M195 235 v45 c0 8, 12 8, 12 0 v-45z" fill="#60A5FA" />
  <path d="M293 235 v45 c0 8, 12 8, 12 0 v-45z" fill="#60A5FA" />
</svg>`;

// ----------------------------------------------------
// 3. GENERER LES TENUES (OUTFITS) ALIGNÉES
// ----------------------------------------------------

// OUTFIT : DEFAULT (Vide)
const outfitDefault = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"></svg>`;

// OUTFIT : WINTER
const outfitWinter = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <!-- Bonnet d'hiver rouge reposant sur le haut du livre -->
  <g id="winter-hat">
    <!-- Base du bonnet -->
    <rect x="150" y="80" width="200" height="40" rx="15" fill="#EF4444" stroke="#1E293B" stroke-width="6" />
    <!-- Corps du bonnet -->
    <path d="M170 80 C170 30, 330 30, 330 80 Z" fill="#DC2626" stroke="#1E293B" stroke-width="6" stroke-linejoin="round" />
    <!-- Pompon blanc tricoté -->
    <circle cx="250" cy="25" r="18" fill="#FFFFFF" stroke="#1E293B" stroke-width="6" />
  </g>

  <!-- Écharpe douillette enroulée autour du bas du livre -->
  <g id="winter-scarf">
    <!-- Noeud d'écharpe principal -->
    <rect x="165" y="335" width="170" height="30" rx="12" fill="#EF4444" stroke="#1E293B" stroke-width="6" />
    <!-- Pan d'écharpe pendant -->
    <path d="M300 355 v55 c0 8, -25 8, -25 0 v-55z" fill="#DC2626" stroke="#1E293B" stroke-width="6" stroke-linejoin="round" />
  </g>
</svg>`;

// OUTFIT : BEACH
const outfitBeach = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <!-- Lunettes de soleil noires épaisses (Flat) sur les yeux -->
  <g id="sunglasses" transform="translate(0, 10)">
    <!-- Verre gauche -->
    <rect x="175" y="195" width="60" height="42" rx="12" fill="#1E293B" />
    <path d="M185 205 l10 -5 v25 l-10 -5 z" fill="#FFFFFF" opacity="0.3" /> <!-- Reflet oblique blanc -->

    <!-- Verre droit -->
    <rect x="265" y="195" width="60" height="42" rx="12" fill="#1E293B" />
    <path d="M275 205 l10 -5 v25 l-10 -5 z" fill="#FFFFFF" opacity="0.3" />

    <!-- Pont et monture dorée -->
    <path d="M230 205 h40" stroke="#FBBF24" stroke-width="8" stroke-linecap="round" />
    <path d="M165 210 h15" stroke="#FBBF24" stroke-width="8" stroke-linecap="round" />
    <path d="M320 210 h15" stroke="#FBBF24" stroke-width="8" stroke-linecap="round" />
  </g>

  <!-- Collier de fleurs tropicales multicolores -->
  <g id="hawaiian-flowers">
    <circle cx="180" cy="345" r="12" fill="#F43F5E" stroke="#1E293B" stroke-width="3" />
    <circle cx="210" cy="355" r="12" fill="#3B82F6" stroke="#1E293B" stroke-width="3" />
    <circle cx="250" cy="360" r="12" fill="#10B981" stroke="#1E293B" stroke-width="3" />
    <circle cx="290" cy="355" r="12" fill="#FBBF24" stroke="#1E293B" stroke-width="3" />
    <circle cx="320" cy="345" r="12" fill="#8B5CF6" stroke="#1E293B" stroke-width="3" />
  </g>
</svg>`;

// OUTFIT : HALLOWEEN
const outfitHalloween = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <!-- Chapeau de sorcière noir pointu reposant sur le haut du livre -->
  <g id="witch-hat">
    <!-- Bords larges du chapeau -->
    <ellipse cx="250" cy="95" rx="130" ry="16" fill="#1E293B" stroke="#1E293B" stroke-width="6" />
    <!-- Cône pointu courbé -->
    <path d="M170 90 Q220 15, 270 10 Q280 40, 330 90 Z" fill="#0F172A" stroke="#1E293B" stroke-width="6" stroke-linejoin="round" />
    <!-- Ruban orange autour du chapeau -->
    <path d="M175 90 c30 -5, 120 -5, 150 0 v5 c-30 -5, -120 -5, -150 0z" fill="#F97316" />
    <!-- Boucle en or carrée -->
    <rect x="238" y="80" width="24" height="18" fill="#FBBF24" stroke="#1E293B" stroke-width="3" rx="3" />
  </g>
</svg>`;

// Écriture des fichiers sur le disque
const files = {
  'pose_idle.svg': poseIdle,
  'pose_jumping.svg': poseJumping,
  'pose_sad.svg': poseSad,
  'pose_running.svg': poseRunning,
  'expression_neutral.svg': exprNeutral,
  'expression_happy.svg': exprHappy,
  'expression_sweating.svg': exprSweating,
  'expression_crying.svg': exprCrying,
  'outfit_default.svg': outfitDefault,
  'outfit_winter.svg': outfitWinter,
  'outfit_beach.svg': outfitBeach,
  'outfit_halloween.svg': outfitHalloween
};

Object.entries(files).forEach(([filename, content]) => {
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[Prototype] SVG généré avec succès : ${filename}`);
});
