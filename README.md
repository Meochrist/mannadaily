# MannaDaily 🌾

MannaDaily est une application web moderne et interactive de croissance spirituelle ludique, conçue pour accompagner les croyants au quotidien. Inspirée du modèle d'apprentissage actif (type Duolingo), l'application propose de la méditation biblique guidée par l'IA, de la mémorisation active de versets, et des proclamations de foi quotidiennes avec une mascotte animée interactive, "Manny".

---

## 🛠️ Stack Technique

L'application est bâtie sur les technologies les plus modernes et fiables de l'écosystème web :

- **Frontend & Routing** : Next.js 14 / Next.js 16 (App Router) avec TypeScript.
- **Styling** : Tailwind CSS pour une interface responsive et un design premium sombre et chaleureux.
- **Base de Données & ORM** : Prisma ORM v7 connecté à une base de données Neon PostgreSQL.
- **Authentification** : NextAuth.js v5 (beta) prenant en charge la connexion par e-mail/mot de passe (Credentials) et Google OAuth.
- **Moteur d'IA (Triple Fallback)** : Intégration de Gemini 2.5 Flash, Groq Llama 3.3, et GPT-4o Azure, garantissant une résilience maximale et gratuite.
- **Mascotte & Animations** : SVG pur React animé de manière fluide avec Framer Motion.
- **E-mails & Cron** : Rappels programmés par Vercel Cron.

---

## 🚀 Guide de Démarrage & Configuration Locale

Suivez ces étapes simples pour faire fonctionner le projet localement sur votre machine :

### 1. Cloner le dépôt
```bash
git clone <URL_DU_REPO>
cd mannadaily
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer les variables d'environnement
Créez un fichier `.env.local` (et un `.env` s'il n'existe pas) à la racine du projet et configurez les variables requises (voir liste ci-dessous).

### 4. Générer le client Prisma
Générez les types TypeScript pour la base de données :
```bash
npx prisma generate
```

### 5. Lancer le serveur de développement
Démarrez l'application localement :
```bash
npm run dev
```
Ouvrez ensuite [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 🔑 Variables d'Environnement Requises

Voici la liste des variables d'environnement nécessaires au fonctionnement de l'application (à configurer dans votre `.env.local`) :

```env
# Connexion Base de Données
DATABASE_URL=
DIRECT_URL=

# Authentification NextAuth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Moteur d'IA (API Keys)
GEMINI_API_KEY=
GROQ_API_KEY=
GITHUB_TOKEN=

# Services Externes
RESEND_API_KEY=
CRON_SECRET=
```
