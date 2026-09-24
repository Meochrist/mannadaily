const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = process.cwd();
const MANNY_DIR = path.join(ROOT, 'public', 'assets', 'characters', 'manny');
const OUT_DIR = path.join(ROOT, 'android', 'app', 'src', 'main', 'res', 'drawable');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const MOOD_MAP = {
  happy: 'pose_idle',
  excited: 'pose_jumping',
  celebrating: 'pose_jumping',
  encouraging: 'pose_running',
  thinking: 'pose_idle',
  praying: 'pose_idle',
  worried: 'pose_sad',
  sad: 'pose_sad',
  neutral: 'pose_idle',
  sleeping: 'pose_idle',
  crying: 'pose_sad',
  scared: 'pose_sad',
  panicked: 'pose_sad',
  angry: 'pose_sad',
  disappointed: 'pose_sad',
};

const moods = [...new Set(Object.keys(MOOD_MAP))];
const uniquePoses = [...new Set(Object.values(MOOD_MAP))];

console.log(' Génération Manny avec padding 50%');

async function convertSvgToPng(svgName, size, scale) {
  const svgPath = path.join(MANNY_DIR, `${svgName}.svg`);
  if (!fs.existsSync(svgPath)) return null;
  const svgBuffer = fs.readFileSync(svgPath);
  const innerSize = Math.round(size * scale);
  return sharp(svgBuffer)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: Math.round((size - innerSize) / 2),
      bottom: Math.round((size - innerSize) / 2),
      left: Math.round((size - innerSize) / 2),
      right: Math.round((size - innerSize) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();
}

async function main() {
  const size = 192;
  const scale = 0.50;
  const poseCache = {};

  for (const pose of uniquePoses) {
    const pngBuffer = await convertSvgToPng(pose, size, scale);
    if (pngBuffer) {
      poseCache[pose] = pngBuffer;
      console.log(`   ${pose}`);
    }
  }

  let copied = 0;
  for (const mood of moods) {
    const pose = MOOD_MAP[mood];
    const pngBuffer = poseCache[pose];
    if (!pngBuffer) continue;
    
    // Nouveau nom avec version pour forcer le rafraîchissement
    const outPath = path.join(OUT_DIR, `mascotte_${mood}.png`);
    fs.writeFileSync(outPath, pngBuffer);
    copied++;
  }

  console.log(`\n ${copied} PNGs générés (mascotte_*.png)`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
