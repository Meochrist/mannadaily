/**
 * Pousse le dernier commit local vers GitHub via l'API REST.
 * Contournement : le credential helper git ne fonctionne pas dans ce shell
 * (git-askpass.exe ne peut pas s'afficher sans GUI).
 *
 * Utilise GITHUB_TOKEN depuis .env.local.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const p = path.resolve(process.cwd(), file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf-8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      const k = t.substring(0, i).trim();
      let v = t.substring(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  }
}
loadEnv();

const OWNER = "Meochrist";
const REPO = "mannadaily";
const BRANCH = "main";

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("GITHUB_TOKEN absent de .env.local");
    process.exit(1);
  }

  const api = async (endpoint: string, init?: RequestInit) => {
    const res = await fetch(`https://api.github.com${endpoint}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    const body = await res.text();
    if (!res.ok) {
      throw new Error(`${endpoint} -> HTTP ${res.status}: ${body.substring(0, 300)}`);
    }
    return body ? JSON.parse(body) : null;
  };

  // Vérifier l'accès
  const me = await api("/user");
  console.log(`Authentifié comme : ${me.login}`);

  // Fichiers modifiés dans le dernier commit
  const changedRaw = execSync("git diff --name-status origin/main..HEAD", { encoding: "utf-8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const changed: string[] = [];
  const deleted: string[] = [];
  for (const line of changedRaw) {
    const [status, ...pathParts] = line.split("\t");
    const filePath = pathParts.join("\t");
    if (status === "D") {
      deleted.push(filePath);
    } else {
      changed.push(filePath);
    }
  }

  console.log(`${changed.length} fichier(s) modifié(s), ${deleted.length} supprimé(s) :`);
  changed.forEach((f) => console.log("  M", f));
  deleted.forEach((f) => console.log("  D", f));

  const commitMessage = execSync("git log -1 --pretty=%s", { encoding: "utf-8" }).trim();
  console.log(`\nMessage : ${commitMessage}\n`);

  // Référence actuelle de la branche distante
  const ref = await api(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
  const baseCommitSha = ref.object.sha;
  const baseCommit = await api(`/repos/${OWNER}/${REPO}/git/commits/${baseCommitSha}`);
  const baseTreeSha = baseCommit.tree.sha;

  // Créer un blob par fichier modifié
  const treeEntries: { path: string; mode: string; type: string; sha: string | null }[] = [];
  for (const file of changed) {
    const content = fs.readFileSync(path.resolve(process.cwd(), file), "utf-8");
    const blob = await api(`/repos/${OWNER}/${REPO}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content, encoding: "utf-8" }),
    });
    treeEntries.push({ path: file, mode: "100644", type: "blob", sha: blob.sha });
    console.log(`  blob créé : ${file}`);
  }
  // Fichiers supprimés : sha null pour les retirer de l'arbre
  for (const file of deleted) {
    treeEntries.push({ path: file, mode: "100644", type: "blob", sha: null });
    console.log(`  suppression : ${file}`);
  }

  // Nouvel arbre + commit
  const tree = await api(`/repos/${OWNER}/${REPO}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
  });

  const commit = await api(`/repos/${OWNER}/${REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: commitMessage,
      tree: tree.sha,
      parents: [baseCommitSha],
    }),
  });

  await api(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  console.log(`\n✅ Poussé avec succès : ${commit.sha.substring(0, 7)}`);
  console.log(`   https://github.com/${OWNER}/${REPO}/commit/${commit.sha}`);
}

main().catch((e) => {
  console.error("ÉCHEC :", e instanceof Error ? e.message : e);
  process.exit(1);
});
