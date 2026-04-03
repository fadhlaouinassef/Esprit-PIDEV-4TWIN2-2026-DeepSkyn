# Configuration Stripe pour DeepSkyn

Guide rapide pour configurer le paiement Stripe en mode test.

## 🚀 Étapes de Configuration

### 1. Créer un compte Stripe (gratuit)

1. Aller sur [https://stripe.com](https://stripe.com)
2. S'inscrire gratuitement
3. Activer le **mode Test** (toggle en haut à droite du dashboard)

### 2. Obtenir les clés API

1. Aller sur [Dashboard > Developers > API keys](https://dashboard.stripe.com/test/apikeys)
2. Copier la **Secret key** (commence par `sk_test_...`)
3. Créer un fichier `.env` à la racine du projet (copier `.env.example`)
4. Ajouter :
   ```env
   STRIPE_SECRET_KEY=sk_test_votre_cle_ici
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 3. Configurer le Webhook (pour tester en local)

#### Option A : Stripe CLI (recommandé pour dev local)

1. Installer [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Se connecter :
   ```bash
   stripe login
   ```
3. Forward les webhooks vers localhost :
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copier le **webhook signing secret** (commence par `whsec_...`)
5. Ajouter dans `.env` :
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_votre_secret_ici
   ```

#### Option B : Sans Stripe CLI (basique)

Pour tester sans webhook (pas recommandé mais fonctionne) :
- Laisser `STRIPE_WEBHOOK_SECRET` vide
- Le paiement fonctionnera mais sans confirmation côté serveur

### 4. Tester le Paiement

1. Lancer le projet :
   ```bash
   npm run dev
   ```

2. Aller sur la page billing : `http://localhost:3000/user/billing`

3. Changer le statut de l'abonnement en `expiring` ou `expired` (via le switcher en bas à droite)

4. Choisir un plan et cliquer sur le bouton de paiement

5. Sur la page Stripe Checkout, utiliser une **carte de test** :
   - **Succès** : `4242 4242 4242 4242`
   - **Échec** : `4000 0000 0000 0002`
   - Date : n'importe quelle date future (ex: `12/34`)
   - CVC : n'importe (ex: `123`)
   - ZIP : n'importe

6. Après paiement réussi → redirection vers `/user/billing/success`

## 📝 Cartes de Test Stripe

| Type | Numéro | Résultat |
|------|--------|----------|
| Visa | `4242 4242 4242 4242` | ✅ Succès |
| Visa (décliné) | `4000 0000 0000 0002` | ❌ Décliné |
| Mastercard | `5555 5555 5555 4444` | ✅ Succès |
| 3D Secure | `4000 0027 6000 3184` | 🔐 Authentification |

[Liste complète des cartes de test](https://stripe.com/docs/testing#cards)

## 🔧 Structure des Fichiers

```
src/
├── lib/
│   └── stripe.ts                    # Client Stripe + configuration des plans
├── app/
│   ├── api/
│   │   └── stripe/
│   │       ├── checkout/
│   │       │   └── route.ts         # Créer session de paiement
│   │       └── webhook/
│   │           └── route.ts         # Recevoir événements Stripe
│   └── user/
│       └── billing/
│           ├── page.tsx             # Page principale
│           ├── success/
│           │   └── page.tsx         # Page succès
│           └── cancel/
│               └── page.tsx         # Page annulation
```

## 🎯 Plans Disponibles

- **Basic Monthly** : $9.99/mois
- **Pro Monthly** : $19.99/mois
- **Pro Yearly** : $199.00/an (économie de $40)

## ⚙️ Modifier les Prix

Pour changer les prix, éditer [src/lib/stripe.ts](src/lib/stripe.ts) :

```typescript
export const PLANS = {
  basic_monthly: { 
    amountCents: 999,  // $9.99
    // ...
  },
  // ...
};
```

**Important** : les montants sont en **centimes** (1999 = $19.99)

## 🔒 Sécurité

- ✅ Les clés `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` ne doivent **JAMAIS** être exposées côté client
- ✅ Elles sont utilisées uniquement dans les API routes (serveur)
- ✅ La validation du paiement se fait via webhook (source de vérité)
- ✅ Ne jamais faire confiance à la redirection `success` seule

## 📚 Ressources

- [Documentation Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Testing Stripe](https://stripe.com/docs/testing)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

## 🚀 Passer en Production

1. Dans le dashboard Stripe, passer en **mode Live**
2. Copier les nouvelles clés (commencent par `sk_live_...`)
3. Mettre à jour `.env` avec les clés de production
4. Configurer le webhook endpoint en production dans Stripe Dashboard
5. Tester avec de vraies cartes (frais Stripe s'appliquent)

## 💡 Notes Importantes

- **Mode Test** : Gratuit, aucun argent réel n'est débité
- **Mode Production** : Stripe prélève ~2.9% + $0.30 par transaction réussie
- Le webhook est **essentiel** en production pour valider les paiements côté serveur
- Pour un projet académique, rester en mode Test est suffisant

## ❓ Support

En cas de problème :
1. Vérifier que les variables d'environnement sont bien configurées
2. Vérifier que Stripe CLI est en cours d'exécution (si utilisé)
3. Consulter les logs du serveur Next.js
4. Consulter les logs Stripe Dashboard > Developers > Logs

## pour lancer stripe::
stripe listen --forward-to localhost:3000/api/stripe/webhook