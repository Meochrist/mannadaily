import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Le français utilise naturellement des apostrophes et guillemets dans le JSX
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
    },
  },
  // Les scripts prisma manipulent des données JSON externes
  {
    files: ["prisma/**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  // Scripts utilitaires (génération, tests)
  {
    files: ["scripts/**/*.js"],
    rules: { "@typescript-eslint/no-unused-vars": "off" },
  },
  // Règles non critiques pour une PWA avec images dynamiques
  {
    rules: { "@next/next/no-img-element": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "android/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
