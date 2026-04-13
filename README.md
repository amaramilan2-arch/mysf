# MYSF — My Systeme Fluide

Application web **mobile-first** de suivi nutritionnel, pondéral et sportif, pensée pour les personnes qui gèrent leur poids sur la durée et qui enchaînent plusieurs phases (sèche, prise de masse, reverse diet, reset…). 100 % statique, aucune installation, aucune dépendance à builder.

> « Un seul outil pour manger, peser, bouger et comprendre où tu en es — sans se noyer dans les tableurs. »

---

## Sommaire

- [C'est quoi MYSF ?](#cest-quoi-mysf-)
- [Quel problème ça résout ?](#quel-problème-ça-résout-)
- [Fonctionnalités](#fonctionnalités)
- [Architecture technique](#architecture-technique)
- [Installation & lancement en local](#installation--lancement-en-local)
- [Déploiement](#déploiement)
- [Données & vie privée](#données--vie-privée)
- [Contribuer](#contribuer)
- [Licence](#licence)

---

## C'est quoi MYSF ?

MYSF est une **webapp autonome** (HTML + CSS + JS vanilla, zéro bundler) qui tient dans une seule page `index.html` et fonctionne aussi bien depuis un navigateur mobile que comme application installée (PWA standalone). Elle se décompose en 6 onglets :

1. **Accueil** — tableau de bord du jour (calories restantes, macros, eau, pas, alertes tendance)
2. **Repas** — ajout d'aliments par recherche, photo IA, dictée vocale ou code-barres
3. **Favoris / Recettes** — aliments épinglés et repas composés réutilisables
4. **Sport** — entraînements muscu (par split + groupes musculaires) et cardio / sports / combat
5. **Graphes** — évolution poids, palier calorique, historique des phases
6. **Réglages** — profil, phase en cours, presets macros, synchro cloud, thèmes

L'application se veut **offline-first** : tout ce qui est essentiel (suivi poids, repas, sport, graphes) fonctionne sans réseau. Les fonctionnalités « intelligentes » (IA photo, scan code-barres, synchro cloud) sont **opt-in**.

---

## Quel problème ça résout ?

Les applis de tracking classiques (MyFitnessPal & co) ont quatre limites récurrentes :

1. **Elles traitent chaque journée isolément**, sans vraiment comprendre la dynamique sur 1–3 mois.
2. **Elles ne savent pas ce qu'est une « phase »** (sèche, reverse, prise de masse…) et encore moins la transition entre deux phases.
3. **Elles enferment les données** dans leur cloud, avec pub et abonnement premium.
4. **Elles sont lourdes** : écrans chargés, temps de chargement, formulaires à rallonge sur mobile.

MYSF répond à ça par quatre partis pris :

### 1. Notion de **palier** (kcal + phase + date de démarrage)

Un palier combine un **objectif calorique**, une **phase** (multiplicateur) et une **date de début**. Tant que tu restes sur ce palier, la progression est analysée par rapport à ce point de départ. Dès que tu changes d'objectif kcal ou de phase, un nouveau palier démarre — l'historique est horodaté et les anciens paliers restent visibles dans les graphes.

Phases disponibles :

| Code | Nom | Multiplicateur | Usage typique |
|------|-----|----------------|---------------|
| A | Pre-prep | ×1.00 | Maintenance / préparation |
| B | Deficit | ×0.85 | Sèche / perte de poids |
| F | Remonte | ×0.92 | Fin de sèche contrôlée |
| C | Reverse | ×0.90 | Reverse diet |
| D | PDM | ×1.075 | Prise de masse |
| E | Reset | ×0.88 | Reset métabolique court |

### 2. **Analyse de tendance adaptative** (régression linéaire 72 j)

Plutôt que de te montrer ton poids brut (qui fluctue de ±1 kg par jour selon l'eau, le sel, le cycle, etc.), MYSF calcule une **tendance** via régression linéaire sur une fenêtre glissante, et la compare à l'évolution *attendue* pour ta phase. Le module `analysis/trend.js` produit :

- la pente pondérale réelle (kg/semaine)
- l'écart avec l'objectif théorique de la phase
- une **recommandation d'action** (ex. « maintien calorique », « baisser de 100 kcal », « changer de phase »)
- des alertes anti-yoyo si la variance explose

### 3. **Saisie ultra-rapide sur mobile**

- **Recherche d'aliment** : base FOODS embarquée + recherche incrémentale
- **Photo IA** : envoie une photo d'assiette à Groq (Llama 4 Scout) qui extrait les aliments et estime les portions (opt-in, clé API configurable)
- **Dictée vocale** : reconnaissance vocale native du navigateur pour décrire le repas
- **Code-barres** : scanner ZXing branché sur OpenFoodFacts
- **URL scheme steps** : ouvrir l'app avec `?steps=12345` pour synchroniser les pas depuis Raccourcis iOS / Tasker

### 4. **Données chez toi, pas chez nous**

- Tout est stocké dans **localStorage** par défaut.
- La synchronisation cloud est **optionnelle** via Firebase Auth + Firestore, et tu peux rester en mode invité.
- Rien n'est envoyé à un tiers sans action explicite de ta part.

---

## Fonctionnalités

### Nutrition
- Suivi calories + macros (protéines, glucides, lipides, fibres)
- 4 types de repas : Petit-déj, Déjeuner, Dîner, Collation
- Base d'aliments embarquée + ajout manuel
- Favoris et recettes (repas composés réutilisables)
- Presets macros (Équilibre, High Prot, Keto, Low Fat, Zone)
- Scan de code-barres (OpenFoodFacts)
- Analyse d'un repas par photo (Groq / Llama 4 Scout)
- Dictée vocale

### Poids, hydratation, pas
- Saisie quotidienne du poids avec historique
- Compteur d'eau rapide (+/- au verre)
- Synchro des pas via paramètre URL (pour Shortcuts iOS / Tasker)

### Analyse
- Graphique poids avec courbe de tendance
- Graphique palier calorique dans le temps
- Historique des phases (stries colorées)
- Statistiques de poids (moyenne glissante, variance, pente hebdo)
- Alertes automatiques sur la home (« Tu dérives de l'objectif », « Palier stabilisé », etc.)
- Recommandations d'action basées sur la tendance 72 jours

### Sport
- Muscu par **split** (Upper / Lower / Push / Pull / Legs / Full Body)
- Sélection du groupe musculaire travaillé
- Cardio, sports collectifs, sports de combat
- Historique des séances

### Personnalisation
- Thème clair / sombre
- Profil utilisateur (taille, poids, objectif)
- Phase configurable avec sélecteur dédié
- Avatar Google si connecté

### Multi-appareils
- Auth Google (Firebase)
- Sync Firestore automatique si connecté
- Fonctionne sans compte (mode invité, localStorage uniquement)

---

## Architecture technique

**Stack** : HTML5 + CSS3 + JavaScript vanilla. **Aucun build step**, **aucun `node_modules`**, **aucun transpileur**. Les libs externes (Chart.js, ZXing, Firebase compat) sont chargées par CDN.

**Classic scripts** : pas de modules ES. Les variables top-level sont partagées entre fichiers via le scope global — l'ordre de chargement dans `index.html` est donc critique (`data → state → analysis → ui → wire → main`).

```
index.html              shell HTML, ordre des <script> critique
css/
  base.css              reset, variables CSS, thèmes, typographie
  layout.css            auth, onboarding, header, tabs, navigation
  pages.css             home, meals, favs, recipes, sport, alertes, charts
  components.css        settings, modals, sélecteur de phase
js/
  data/
    foods.js            base d'aliments embarquée
    constants.js        MEALS, PH_NAMES, PHC, MACRO_PRESETS, SPLITS…
  state/
    storage.js          helpers $ / ld / sv, getters, dayTotals, curDate
    sync.js             init Firebase, cloudSave/Load, autoSync
    palier.js           identité de palier (kcal + phase + startDate)
    auth.js             flux auth + onboarding
  analysis/
    trend.js            linReg, trend72, recommendAction, weightStats
  ui/
    theme.js            getTheme/setTheme + IIFE de thème initial
    nav.js              onglets
    home.js             renderHome, renderAlert, renderAnalysis
    charts.js           graphes poids / palier / phase + modals
    meals.js            onglet repas, recherche, édition
    ai.js               analyse photo + dictée vocale
    scanner.js          scan code-barres
    recipes.js          recettes + repas sauvegardés
    sport.js            entraînements
    settings.js         réglages, sélecteur de phase
    toast.js            notifications
    tween.js            animations numériques
  wire.js               TOUS les addEventListener (fonction wire())
  main.js               chaîne d'init au DOMContentLoaded
```

### Conventions
- **Style compact** (lignes denses, ternaires, one-liners) — suis le style du fichier que tu édites.
- **Français** partout : UI, commentaires, commits.
- **Clés localStorage** préfixées : `nt_*` (nutrition/poids), `sp_*` (sport), `u_*` (user).
- **IDs HTML** courts, camelCase (`hMeals`, `skBar`, `cRing`).
- **DOM helpers** : `$(id)` pour `getElementById`, `ld(key, def)` / `sv(key, val)` pour localStorage.

Pour plus de détails sur les règles de contribution, voir [`AGENTS.md`](./AGENTS.md).

---

## Installation & lancement en local

Aucune installation de dépendances n'est nécessaire. Il suffit de servir le dossier en HTTP (ouvrir `index.html` directement en `file://` peut casser certaines APIs comme `fetch` ou la caméra).

### Avec Python

```bash
git clone https://github.com/amaramilan2-arch/mysf.git
cd mysf
python3 -m http.server 8765
```

Puis ouvrir [http://localhost:8765/](http://localhost:8765/) — de préférence en **navigation privée** pour éviter le cache pendant le développement.

### Avec n'importe quel autre serveur statique

```bash
npx serve .
# ou
php -S localhost:8765
```

### Vérifier un fichier JS modifié

Pas de suite de tests automatisés. Avant de commit, au minimum :

```bash
node --check js/ui/home.js
```

Puis cliquer les 6 onglets en navigation privée et vérifier la console.

---

## Déploiement

Le projet est conçu pour **GitHub Pages** — site statique sans pipeline de build. Un `push` sur `master` met à jour le site déployé.

Pour déployer ta propre instance :

1. Fork le dépôt.
2. Repository settings → Pages → Source : `master` branch, dossier `/ (root)`.
3. (Optionnel) Configurer tes propres clés Firebase et Groq dans les fichiers concernés.
4. Ouvrir l'URL GitHub Pages générée — ajouter à l'écran d'accueil sur iOS / Android pour l'utiliser en PWA standalone.

---

## Données & vie privée

- **Stockage par défaut : local**. Toutes les données (poids, repas, sport, paliers) sont conservées dans `localStorage` du navigateur. Aucune télémétrie, aucun tracker.
- **Synchro cloud : opt-in**. Si tu te connectes avec Google, les données sont sauvegardées dans Firestore sous ton UID.
- **IA photo : opt-in**. Aucune image n'est envoyée tant que tu n'as pas explicitement utilisé le bouton « analyser par photo ».
- **Scan code-barres : opt-in**. Le flux caméra est demandé uniquement à l'ouverture du scanner.
- **Clés API côté client** : les clés Groq et Firebase sont en clair dans le JS — c'est assumé pour un projet perso déployé en statique. Si tu forks, remplace-les par les tiennes et configure les bonnes restrictions (domaine, quota).

---

## Contribuer

Le projet est petit et assumé comme tel. Avant de toucher au code, **lis [`AGENTS.md`](./AGENTS.md)** qui décrit les règles du jeu :

- Un commit = un sujet.
- Messages en français, impératif.
- Pas d'ajout de build step, pas de modules ES, pas de dépendances npm.
- Mobile-first : si ça ne tient pas sur un écran 375 px, c'est cassé.
- Jamais de régression silencieuse sur `analysis/trend.js` et `state/palier.js`.

En cas de doute, ouvre une issue avant de merger.

---

## Licence

Ce projet est distribué sous licence **MIT**. Voir le fichier [`LICENSE`](./LICENSE) pour le texte complet.

En pratique : tu peux utiliser, copier, modifier, fusionner, publier, distribuer, sous-licencier et vendre des copies du logiciel, à la seule condition de conserver la notice de copyright et d'inclure la licence dans les copies substantielles.
