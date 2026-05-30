const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=== ENVOI DES VARIABLES D'ENVIRONNEMENT SUR VERCEL (MÉTHODE INDIVIDUELLE) ===");

  const envLocalPath = path.join(__dirname, ".env.local");
  if (!fs.existsSync(envLocalPath)) {
    console.error("Fichier .env.local introuvable !");
    process.exit(1);
  }

  const envLocalContent = fs.readFileSync(envLocalPath, "utf8");
  const lines = envLocalContent.split("\n");

  const envVars = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;

    const key = trimmed.substring(0, eqIdx).trim();
    let val = trimmed.substring(eqIdx + 1).trim();

    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    } else if (val.startsWith("'") && val.endsWith("'")) {
      val = val.substring(1, val.length - 1);
    }

    envVars[key] = val;
  }

  const keys = Object.keys(envVars);
  console.log(`Trouvé ${keys.length} variables à configurer.`);

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  const targets = ["production", "preview", "development"];

  for (const key of keys) {
    const val = envVars[key];
    console.log(`\n--- Configuration de ${key} ---`);

    // 1. Tenter de supprimer l'ancienne variable sur Vercel
    try {
      execSync(`npx.cmd vercel env rm ${key} -y`, { stdio: "ignore" });
      console.log(`Ancienne variable ${key} supprimée.`);
    } catch (e) {
      // Ignorer
    }

    // 2. Ajouter la variable pour chaque environnement de manière individuelle
    for (const env of targets) {
      try {
        console.log(`Ajout de ${key} pour l'environnement : ${env}...`);
        execSync(`npx.cmd vercel env add ${key} ${env} --yes`, {
          input: val,
          stdio: ["pipe", "ignore", "inherit"] // pipe stdin pour injecter val, ignore log succès standard, hérite des erreurs
        });
      } catch (err) {
        console.error(`Erreur lors de la configuration de ${key} pour ${env}:`, err.message);
      }
    }
    console.log(`Variable ${key} configurée avec succès sur tous les environnements.`);
  }

  console.log("\n=======================================================");
  console.log("Toutes les variables d'environnement ont été configurées sur Vercel !");
  console.log("=======================================================");
}

main();
