# Configuration Google OAuth pour MannaDaily

## Étapes sur Google Cloud Console

1. Va sur https://console.cloud.google.com
2. Crée un projet "MannaDaily" (ou utilise un existant)
3. Active l'API : APIs & Services → Enable APIs
   → Cherche "Google+ API" ou "People API" → Enable
4. Crée les identifiants :
   APIs & Services → Credentials → Create Credentials
   → OAuth 2.0 Client IDs
   → Application type : Web application
   → Name : MannaDaily
5. Authorized redirect URIs - ajoute EXACTEMENT :
   http://localhost:3000/api/auth/callback/google
   https://mannadaily.vercel.app/api/auth/callback/google
6. Copie Client ID et Client Secret
7. Dans Vercel → Settings → Environment Variables :
   GOOGLE_CLIENT_ID = [ton Client ID]
   GOOGLE_CLIENT_SECRET = [ton Client Secret]
8. Redéploie sur Vercel

## Test
- Va sur mannadaily.vercel.app/login
- Clique "Continuer avec Google"
- Sélectionne ton compte Google
- Tu dois arriver sur /dashboard

## Problèmes fréquents
- "redirect_uri_mismatch" → vérifie les URIs exactes
- "disabled" dans .env.local → remplace par les vraies clés
