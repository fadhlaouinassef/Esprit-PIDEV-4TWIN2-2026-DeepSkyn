# Guide complet: entrainer, tester et utiliser le modele de tendance

Ce document explique tout le cycle de vie du modele:
- preparation des donnees
- entrainement local
- test local
- integration dans l'application
- maintenance et re-entrainement

## 1) Objectif du modele

Le modele sert a generer un rapport de tendance de la peau pour l'utilisateur connecte.

Important:
- l'entrainement se fait hors requete (offline)
- l'API utilise ensuite un artefact deja entraine
- le rapport reste specifique a l'utilisateur car les donnees lues en base sont filtrees par session

## 2) Fichiers impliques

- Entrainement local: scripts/ml/train-trend-model.ts
- Test local: scripts/ml/test-trend-model.ts
- Utilitaires ML: scripts/ml/trend-ml-utils.ts
- Artefact genere: src/modele/artifacts/trend-model.json
- Rapport de training: src/modele/artifacts/trend-training-report.json
- Historique metriques: src/modele/artifacts/trend-metrics-history.json
- Loader artefact: src/modele/trendModelLoader.ts
- Logique modele: src/modele/analysisTrendModel.ts
- Route API tendance: src/app/api/user/analyses/trend/route.ts

## 3) Prerequis

1. Avoir les dependances installees
2. Avoir la base de donnees configuree (DATABASE_URL)
3. Avoir des donnees dans SkinScoreAnalysis (trigger = final)

Commande d'installation:

```bash
npm install
```

## 4) Format des donnees utilisees

Le script d'entrainement lit la table SkinScoreAnalysis et construit des points de tendance:
- score
- hydration
- oilProduction (derive de clarity)
- sensitivity (derive de calmness)
- date

Condition minimale:
- au moins un utilisateur avec 3 analyses ou plus

Recommandation pratique:
- 50+ transitions pour un premier resultat exploitable
- 200+ transitions pour des metriques plus stables

Le pipeline applique maintenant:
- split temporel strict train/val/test
- validation croisee temporelle (rolling-origin)
- nettoyage formel avec clipping IQR + bornes metier
- suivi des metriques sur plusieurs runs

## 5) Entrainement du modele (offline)

Lancer:

```bash
npm run ml:train-trend
```

Option: nombre de runs d'entrainement

```bash
ML_RUNS=5 npm run ml:train-trend
```

Sous PowerShell Windows:

```powershell
$env:ML_RUNS="5"; npm run ml:train-trend
```

Resultat attendu:
- creation ou mise a jour de src/modele/artifacts/trend-model.json
- creation ou mise a jour de src/modele/artifacts/trend-training-report.json
- ajout d'une entree dans src/modele/artifacts/trend-metrics-history.json

Si aucune donnee suffisante:
- le script signale qu'il n'y a pas assez de donnees

## 6) Test du modele (offline)

Lancer:

```bash
npm run ml:test-trend
```

Metriques affichees:
- Strict validation (split temporel)
- Strict test (split temporel)
- Temporal CV (validation croisee temporelle)

Interpretation rapide:
- MAE plus bas = meilleure precision moyenne
- RMSE plus bas = moins de grosses erreurs
- Direction accuracy = capacite a predire hausse/baisse/stable

Attention:
- si Samples est tres bas (ex: 2), la metrique n'est pas robuste

## 7) Utilisation dans l'application

Au runtime:
1. la route API lit l'utilisateur connecte
2. elle recupere ses analyses en base
3. elle charge l'artefact pre-entraine
4. elle fait une inference (sans fit)
5. elle renvoie un rapport personnalise

Comportement de fallback:
- si l'artefact est absent, le systeme peut revenir sur la logique de secours definie dans le code

## 8) Re-entrainement

Quand re-entrainer:
- nouvelles donnees significatives en base
- changement de logique feature engineering
- degradation des metriques

Procedure:

```bash
npm run ml:train-trend
npm run ml:test-trend
```

Puis relancer l'app pour recharger l'artefact:

```bash
npm run dev
```

## 9) Diagnostic et problemes frequents

### Cas 1: Aucun fichier artefact
Cause possible:
- entrainement non lance
- erreur DB

Action:
1. verifier DATABASE_URL
2. lancer npm run ml:train-trend

### Cas 2: Test avec peu d'echantillons
Cause possible:
- peu d'utilisateurs avec historique exploitable

Action:
1. ajouter des analyses finales
2. relancer train + test

### Cas 3: Resultats instables
Cause possible:
- volume faible
- donnees bruitees

Action:
1. augmenter la taille des donnees
2. verifier la qualite de score/hydration/clarity/calmness

## 10) Bonnes pratiques

1. Versionner chaque artefact avec date et metriques
2. Garder un historique MAE/RMSE/Direction accuracy
3. Re-entrainer regulierement (ex: hebdomadaire)
4. Ne pas entrainer dans les requetes API de production
5. Surveiller surtout la metrique Strict validation pour choisir le meilleur run

## 11) Resume ultra court

1. Entrainer:

```bash
npm run ml:train-trend
```

2. Tester:

```bash
npm run ml:test-trend
```

3. Utiliser dans l'app:
- l'API charge l'artefact et fait seulement de l'inference
- le rapport est specifique a l'utilisateur connecte
