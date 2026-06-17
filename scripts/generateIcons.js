const { execSync } = require('child_process');
const path = require('path');

try {
  console.log("Appel du script Python pour générer les icônes PWA...");
  const pythonScript = path.join(__dirname, 'generate_icons.py');
  execSync(`python "${pythonScript}"`, { stdio: 'inherit' });
} catch (err) {
  console.error("Erreur lors de la génération des icônes via Python :", err.message);
  process.exit(1);
}
