# Configuration Google OAuth pour DeepSkyn

## 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google+ pour votre projet

## 2. Configurer OAuth 2.0

1. Dans la console Google Cloud, allez dans **APIs & Services** > **Credentials**
2. Cliquez sur **Create Credentials** > **OAuth client ID**
3. Sélectionnez **Web application**
4. Configurez les URLs autorisées :

### URLs autorisées pour JavaScript origins:
```
http://localhost:3000
```

### URLs autorisées pour redirect URIs:
```
http://localhost:3000/api/auth/callback/google
```

## 3. Récupérer les identifiants

Après la création, vous obtiendrez :
- **Client ID** : Copiez dans `GOOGLE_CLIENT_ID`
- **Client Secret** : Copiez dans `GOOGLE_CLIENT_SECRET`

## 4. Configurer le fichier .env

Créez un fichier `.env.local` à la racine du projet :

```env
# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="génération-avec-openssl-rand-base64-32"

# Google OAuth
GOOGLE_CLIENT_ID="votre-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="votre-client-secret"

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/deepskyn"
```

## 5. Générer NEXTAUTH_SECRET

Exécutez cette commande pour générer un secret sécurisé :

```bash
openssl rand -base64 32
```

Ou en PowerShell :
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## 6. Redémarrer le serveur

Après avoir configuré les variables d'environnement :

```bash
npm run dev
```

## Troubleshooting

### Erreur 405 Method Not Allowed
✅ **Résolu** - Le handler GET a été ajouté à `/api/auth/signin/route.ts`

### Erreur "redirect_uri_mismatch"
- Vérifiez que l'URL de callback dans Google Cloud Console correspond exactement à :
  `http://localhost:3000/api/auth/callback/google`

### Erreur "OAuthCallback"
- Vérifiez que `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont correctement configurés
- Assurez-vous que les APIs Google+ sont activées
- Vérifiez que `NEXTAUTH_SECRET` est défini

## Production

Pour la production, ajoutez les URLs de production :

**JavaScript origins:**
```
https://votre-domaine.com
```

**Redirect URIs:**
```
https://votre-domaine.com/api/auth/callback/google
```

Et mettez à jour `NEXTAUTH_URL` dans votre fichier `.env` :
```
NEXTAUTH_URL="https://votre-domaine.com"
```
