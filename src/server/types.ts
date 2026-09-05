// Type utilitaire pour les retours better-sqlite3
// Dans src/server/db.ts, les requêtes retournent des objets non typés
// Utiliser `row as DbRow` pour éviter les erreurs TS

export type DbRow = Record<string, any>;
