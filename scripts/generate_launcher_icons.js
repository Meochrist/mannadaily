const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = process.cwd();
const MANNY_DIR = path.join(ROOT, 'public', 'assets', 'characters', 'manny');
const MIPMAP_DIR = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

// Tailles Android pour icône launcher (px)
const SIZES = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

// Tailles foreground (plus grand, avec padding)
const FG_SIZES = {
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};

async function main() {
  const svgPath = path.join(MANNY_DIR, 'pose_idle.svg');
  if (!fs.existsSync(svgPath)) {
    console.error('Missing:', svgPath);
    process.exit(1);
  }
  const svgBuffer = fs.readFileSync(svgPath);

  console.log(' Génération icônes launcher Manny (50% du canvas)...');

  for (const [density, size] of Object.entries(SIZES)) {
    const dir = path.join(MIPMAP_DIR, `mipmap-${density}`);
    if (!fs.existsSync(dir)) continue;

    // ic_launcher.png = mascotte sur fond transparent (adaptive icon background)
    const launcherPng = await sharp(svgBuffer)
      .resize(Math.round(size * 0.5), Math.round(size * 0.5), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: Math.round(size * 0.25),
        bottom: Math.round(size * 0.25),
        left: Math.round(size * 0.25),
        right: Math.round(size * 0.25),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), launcherPng);

    // ic_launcher_foreground.png = mascotte plus grande (pour adaptive icon)
    const fgSize = FG_SIZES[density];
    const fgPng = await sharp(svgBuffer)
      .resize(Math.round(fgSize * 0.5), Math.round(fgSize * 0.5), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: Math.round(fgSize * 0.25),
        bottom: Math.round(fgSize * 0.25),
        left: Math.round(fgSize * 0.25),
        right: Math.round(fgSize * 0.25),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), fgPng);

    // ic_launcher_round.png = mascotte ronde (même que launcher)
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), launcherPng);

    console.log(`   ${density}: launcher=${size}px, foreground=${fgSize}px`);
  }

  console.log('\n ICônes launcher Manny générées (50% du canvas)');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
