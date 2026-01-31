# Loader et Curseur Personnalisé

## Composants ajoutés

### 1. PageLoader (Skeleton Loader)
Un loader professionnel avec effet de skeleton qui s'affiche entre les transitions de pages.

**Caractéristiques:**
- ✨ Animation fluide avec effet de shimmer
- 📱 Design responsive
- 🎨 S'adapte automatiquement au thème (clair/sombre)
- ⚡ Utilise Framer Motion pour des animations performantes

**Variantes:**
- `PageLoader`: Skeleton complet avec header, hero et grille de contenu
- `SimplePageLoader`: Spinner simple et élégant

### 2. NavigationProvider
Provider qui gère automatiquement l'affichage du loader lors des changements de page.

**Fonctionnement:**
- Détecte les changements de route avec `usePathname`
- Affiche le loader pendant 800ms (ajustable)
- Intégré automatiquement dans le layout principal

### 3. LoadingLink
Composant Link amélioré pour déclencher le loader.

### 4. Curseur Personnalisé
Design de curseur professionnel avec variations selon le contexte.

**Types de curseurs:**
- 🎯 Curseur par défaut: cercle avec point central
- 👆 Curseur hover (liens/boutons): cercle agrandi
- 📝 Curseur texte: ligne verticale
- 🌓 Adaptation automatique au mode sombre

## Utilisation

### Le loader est déjà actif !
Le `NavigationProvider` est intégré dans `layout.tsx`, donc le loader s'affiche automatiquement lors des navigations.

### Pour utiliser LoadingLink (optionnel)
```tsx
import { LoadingLink } from '@/app/components';

// Au lieu de:
<Link href="/about">À propos</Link>

// Utilisez:
<LoadingLink href="/about">À propos</LoadingLink>
```

### Personnalisation du délai du loader
Dans `NavigationProvider.tsx`, ligne 18:
```tsx
const timer = setTimeout(() => {
  setIsLoading(false);
}, 800); // Modifiez cette valeur (en millisecondes)
```

### Changer le type de loader
Dans `NavigationProvider.tsx`, ligne 26:
```tsx
// Remplacez PageLoader par SimplePageLoader pour un loader simple
{isLoading && <PageLoader />}
// ou
{isLoading && <SimplePageLoader />}
```

### Désactiver le curseur personnalisé
Dans `layout.tsx`, supprimez la classe `custom-cursor`:
```tsx
<body className={`${figtree.variable} ${inter.variable} ${geistMono.variable} font-sans antialiased`}>
```

## Personnalisation des couleurs

Les loaders utilisent automatiquement les couleurs du thème définies dans `globals.css`:
- `--muted`: Couleur de base du skeleton
- `--muted-foreground`: Couleur de l'effet shimmer
- `--primary`: Couleur de l'indicateur de chargement
- `--card`: Couleur de fond des cartes

## Structure des fichiers

```
src/app/
├── components/
│   ├── PageLoader.tsx         # Composants de loader
│   ├── NavigationProvider.tsx # Provider de navigation
│   ├── LoadingLink.tsx        # Link avec loader
│   └── index.ts               # Exports
├── globals.css                # Styles du curseur personnalisé
└── layout.tsx                 # Intégration du provider
```

## Performance

- Les loaders utilisent `framer-motion` qui optimise automatiquement les animations
- Le curseur personnalisé utilise des SVG data URLs (pas de requêtes HTTP)
- Le NavigationProvider n'effectue aucune re-render inutile

## Compatibilité

- ✅ Next.js 14+
- ✅ React 18+
- ✅ Mode sombre/clair
- ✅ Responsive (mobile, tablette, desktop)
