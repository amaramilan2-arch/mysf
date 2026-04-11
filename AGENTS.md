# AGENTS.md

Guide pour toute personne (humaine ou IA) qui contribue à ce projet. Lis-le avant de toucher au code.

## Contexte

**mysf** est une app web mobile-first de suivi nutritionnel et pondéral, avec :
- analyse de tendance pondérale adaptative (palier = kcal + phase)
- analyse de repas par photo (Groq / Llama 4 Scout) et dictée vocale
- scan de code-barres (OpenFoodFacts)
- synchronisation cloud optionnelle (Firebase Auth + Firestore)

Déployé sur **GitHub Pages** — site statique, aucun build step, aucun bundler.

## Stack & contraintes

- **HTML/CSS/JS vanilla**, aucune dépendance NPM, aucun transpileur.
- Librairies externes chargées par CDN (`Chart.js`, `ZXing`, `Firebase compat`).
- **Classic scripts** (`<script src>` ordonnés), **pas de modules ES**. Les `let`/`const` top-level sont partagés entre fichiers via le scope global du classic script.
- Cible : **mobile** en priorité (iOS Safari + Chrome Android). Tester en responsive étroit.
- Français partout (UI, commentaires, commits).

## Structure

```
index.html              — shell HTML, ordre des <script> critique
css/
  base.css              — reset, :root vars, thèmes, typo
  layout.css            — auth, onboarding, header, tabs, nav
  pages.css             — home, meals, favs, recipes, sport, alerts, charts
  components.css        — settings, modals, phase selector
js/
  data/foods.js         — base FOODS
  data/constants.js     — MEALS, PH_NAMES, PHC, MACRO_PRESETS…
  state/storage.js      — $, ld, sv, getters, dayTotals, curDate
  state/sync.js         — Firebase init, cloudSave/Load, autoSync
  state/palier.js       — identité palier (kcal+phase+startDate)
  state/auth.js         — flux auth + onboarding
  analysis/trend.js     — linReg, trend72, recommendAction, weightStats
  ui/theme.js           — getTheme/setTheme + IIFE de thème initial
  ui/nav.js             — tabs
  ui/home.js            — renderHome, renderAlert, renderAnalysis
  ui/charts.js          — graphes poids/palier/phase + modals poids
  ui/meals.js           — onglet repas, recherche, édition
  ui/ai.js              — analyse photo + dictée vocale
  ui/scanner.js         — code-barres
  ui/recipes.js         — recettes + repas sauvegardés
  ui/sport.js           — entraînements
  ui/settings.js        — réglages, phase selector
  wire.js               — TOUS les addEventListener (une seule fonction wire())
  main.js               — chaîne d'init au DOMContentLoaded
```

**L'ordre de chargement dans `index.html` est critique** — ne le change pas sans raison. Règle : data → state → analysis → ui → wire → main.

## Conventions de code

- **Style compact** : le projet privilégie des lignes denses (semi-colons, ternaires, one-liners). Suis le style existant du fichier que tu édites, ne « formate » pas gratuitement.
- **Pas de commentaires évidents**. Un commentaire court uniquement si le *pourquoi* n'est pas lisible dans le code.
- **Globals partagés** : les fonctions/variables top-level sont accessibles partout. Évite de réinitialiser ou d'ombrer une variable existante.
- **DOM helpers** : `$(id)` pour `getElementById`. `ld(key, default)` et `sv(key, val)` pour localStorage.
- **Préfixes de clés localStorage** : `nt_*` (nutrition/poids), `sp_*` (sport), `u_*` (user).
- **IDs HTML** : courts, en camelCase (`hMeals`, `skBar`, `cRing`).
- **Français** dans les labels, messages, commentaires ET commits.

## Workflow git

- Branche principale : `master`. Push direct autorisé pour les petits changements.
- **Un commit = un sujet**. Pas de commits fourre-tout.
- Messages de commit : français, impératif, préfixe type optionnel (`feat:`, `fix:`, `refactor:`, `docs:`).
- **Tag des versions stables** (`v1.0.0`, `v1.1.0`…) avec `git tag -a` annoté.
- Avant de push un gros changement : teste en **fenêtre de navigation privée** pour éviter le cache.
- Jamais de `--force` sur `master`. Jamais de `--no-verify`.

## Tests & vérifications

Pas de suite de tests automatisés. Avant de commit :

1. `node --check <fichier.js>` sur chaque JS modifié (parse check).
2. Servir en local : `python3 -m http.server 8765` puis ouvrir `http://localhost:8765/` en navigation privée.
3. Cliquer les 6 onglets, vérifier qu'aucune erreur console n'apparaît.
4. Tester le flux que tu as modifié de bout en bout.
5. Pour l'UI : regarder en responsive étroit (DevTools → mobile).

## Sécurité & données

- **Clés API** (Groq, Firebase) sont en clair dans le JS côté client — c'est assumé pour un projet perso déployé en statique. Ne pas pusher de clés d'un compte tiers sans l'accord du propriétaire.
- Ne jamais committer de fichier `.env`, credentials, dump de données utilisateur.
- **Aucune donnée utilisateur ne doit partir vers un service tiers sans consentement explicite** (Firebase est opt-in, AI est opt-in).
- Attention XSS : toute valeur qui vient de `localStorage`, Firestore, ou d'une API externe doit être échappée si injectée via `innerHTML`. Préférer `textContent` quand possible.

## Principes produit

- **Simple avant complet**. Mieux vaut une feature qui marche sur 90% des cas que trois features bancales.
- **Mobile d'abord** : si ça ne tient pas sur un écran 375px sans scroll horizontal, c'est cassé.
- **Offline-first** : tout doit fonctionner sans réseau (sauf AI, scan, cloud sync qui sont opt-in).
- **Pas de régression silencieuse** : si tu touches à la logique palier/trend/phase, relis `analysis/trend.js` et `state/palier.js` en entier avant.

## Ce qu'il ne faut PAS faire

- Ajouter un build step (webpack, vite, esbuild…).
- Introduire des ES modules (`import`/`export`) dans les fichiers existants.
- Ajouter des dépendances npm.
- Rewriter un fichier entier « parce que le style ne me plaît pas ».
- Committer des fichiers générés, logs, `.DS_Store`, `node_modules`.
- Force-push sur `master`.
- Supprimer du code sans comprendre à quoi il servait (grep avant).

## En cas de doute

Ouvre une issue ou demande avant de merger. Le projet est petit, la communication coûte moins cher qu'un rollback.
