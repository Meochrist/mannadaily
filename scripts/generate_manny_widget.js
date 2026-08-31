const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = process.cwd();
const MANNY_DIR = path.join(ROOT, 'public', 'assets', 'characters', 'manny');
const OUT_DIR = path.join(ROOT, 'android', 'app', 'src', 'main', 'res', 'drawable');

// Ensure output directory exists
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Map mood → which pose SVG to use (Manny is "unified" = pose contains full character with expression baked in)
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

console.log(`🎨 Generating Manny mascot PNGs for widget`);
console.log(`   Moods: ${moods.length}`);
console.log(`   Unique poses: ${uniquePoses.join(', ')}`);

async function convertSvgToPng(svgName, size) {
  const svgPath = path.join(MANNY_DIR, `${svgName}.svg`);
  if (!fs.existsSync(svgPath)) {
    console.error(`   Missing: ${svgName}.svg`);
    return null;
  }
  const svgBuffer = fs.readFileSync(svgPath);
  return sharp(svgBuffer)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function main() {
  const size = 192; // Large enough for widget icon
  
  // Step 1: Convert each unique pose to PNG
  const poseCache = {};
  
  for (const pose of uniquePoses) {
    const pngBuffer = await convertSvgToPng(pose, size);
    if (pngBuffer) {
      poseCache[pose] = pngBuffer;
      console.log(`   ${pose} (${size}x${size})`);
    }
  }

  // Step 2: For each mood, write the corresponding pose PNG as manny_{mood}.png
  let copied = 0;
  for (const mood of moods) {
    const pose = MOOD_MAP[mood];
    const pngBuffer = poseCache[pose];
    if (!pngBuffer) continue;
    
    const outPath = path.join(OUT_DIR, `manny_${mood}.png`);
    fs.writeFileSync(outPath, pngBuffer);
    copied++;
  }

  console.log(`\n Generated ${copied} mood PNGs in android/app/src/main/res/drawable/`);
  console.log(`   Moods: ${moods.join(', ')}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
