# Guide de Machine Learning - DeepSkyn Trend Model

Ce document explique comment entraîner, tester et interpréter les résultats du modèle de prédiction des tendances de peau.

## 1. Commandes d'utilisation

### Entraînement du modèle
Pour lancer l'entraînement complet avec recherche des meilleurs paramètres :
```powershell
npm run ml:train-trend
```
*Cette commande génère automatiquement le modèle et le rapport dans `src/modele/artifacts/`.*

### Test du modèle
Pour valider les performances sur un jeu de données spécifique :
```powershell
npm run ml:test-trend
```

---

## 2. Interprétation des Métriques (Rapport JSON)

Lorsque vous ouvrez `trend-training-report.json`, voici comment lire les scores :

### MAE (Mean Absolute Error)
*   **Quoi** : L'erreur moyenne en points (sur une échelle de 0 à 100).
*   **Lecture** : Si MAE = 5, le modèle se trompe en moyenne de 5 points sur le score de peau.
*   **Cible** : Visez une valeur **inférieure à 15** pour une précision acceptable.

### RMSE (Root Mean Square Error)
*   **Quoi** : Moyenne qui pénalise fortement les grandes erreurs.
*   **Lecture** : Si le RMSE est beaucoup plus haut que le MAE, cela signifie que le modèle fait parfois des erreurs très graves.
*   **Cible** : Doit être le plus proche possible du MAE.

### Direction Accuracy (%)
*   **Quoi** : Capacité du modèle à prédire si la peau s'améliore ou se dégrade.
*   **Lecture** : 50% = hasard, 70% = Bon, 85%+ = Excellent.
*   **Importance** : C'est la métrique la plus importante pour les conseils utilisateurs ("Votre peau semble s'améliorer").

### Segmented Metrics
*   **Quoi** : Score calculé par type de peau (Dry, Oily, etc.) et tranche d'âge.
*   **Utilité** : Identifiez si le modèle est moins bon pour un profil spécifique. Si le MAE est trop haut pour les "Peaux Sèches", vous devrez peut-être ajouter plus d'exemples de ce type dans le CSV.

---

## 3. Structure des Artefacts

*   **`trend-model.json`** : Le "cerveau" du modèle (poids et architecture) utilisé par l'application en temps réel.
*   **`trend-training-report.json`** : Rapport complet de la dernière session d'entraînement (pertes, courbes d'apprentissage, segmentation).
*   **`trend-metrics-history.json`** : Historique de tous vos entraînements pour suivre l'évolution globale des performances.

---

## 4. Conseils pour améliorer le modèle

1.  **Data Quality** : Assurez-vous que votre fichier `Skin_Type.csv` contient des données variées (tous les types de peaux, tous les âges).
2.  **Early Stopping** : Le modèle s'arrête automatiquement quand il arrête de progresser. Si vous voyez que le nombre d'époques est très bas (ex: 10), le modèle a peut-être du mal à trouver un pattern.
3.  **Hyperparamètres** : Le script teste déjà plusieurs configurations. Si les scores restent mauvais, essayez de modifier la grille de recherche dans `scripts/ml/train-trend-model.ts`.
