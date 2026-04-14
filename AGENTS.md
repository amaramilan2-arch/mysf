# AGENTS.md

Guide pour toute personne (humaine ou IA) qui contribue à ce projet. Lis-le avant de toucher au code.

## Contexte

**Kripy** est une app web mobile-first de suivi nutritionnel et pondéral, avec :
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

## Design System — Kinetic Lab

Le DS de Kripy s'inspire des outils dev haut de gamme (Linear, Raycast). **Deep Tech, pas lifestyle.** L'interface doit ressembler à un terminal d'ingénierie pour le corps humain, pas à une appli fitness générique.

### North Star

- **Intentional Asymmetry** : layouts éditoriaux, alignement à gauche, pas de centrage systématique.
- **Tonal Depth** : la profondeur se crée par shifts de surface, jamais par shadows noires.
- **High-Precision Data** : les chiffres sont des composants, pas du texte. Toujours en JetBrains Mono, avec `font-variant-numeric:tabular-nums`.

### Tonal Architecture (dark-first)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#121317` | Level 0 — base obsidienne |
| `--s0` | `#0E0F12` | rangées paires dans les listes |
| `--s1` | `#1A1B20` | Level 1 — sections / groupement |
| `--s2` | `#1F1F24` | Level 2 — cartes standard |
| `--s3` | `#2A2B31` | Level 3 — inputs, chips, surfaces actives |
| `--s4` | `#343439` | Level 4 — états focus / hover / sélection |

**Règle no-line** : pour séparer deux blocs, shift le token de surface (ex: `--s2` imbriqué dans `--s1`). Les bordures 1px classiques sont interdites. En dernier recours, utiliser `--outline-variant` (20% d'opacité) comme ghost border.

**Règle des rangées paires** : dans une liste (`.hm-item`, `.mi`, `.hi`, `.whi`, `.vol-item`, `.recipe-item`), les éléments `:nth-child(even)` utilisent `--s0` pour alterner sans divider.

### Primary & LED accents

- **Primary** : `--acc #6AEFAF` (emerald). Toujours sous forme de gradient `--grad-primary` (135° vers `--acc2 #4AD295`) pour les CTAs principaux. **Jamais de flat fill.**
- **Cyan** `#4DD0E1`, **Pink** `#FF6B9D`, **Purple** `#9F9BFF`, **Orange** `#FFB347`, **Yellow** `#FFD93D`, **Red** `#FF6B6B`.
- Les dots / indicateurs doivent avoir `box-shadow:0 0 8px currentColor` pour l'effet LED sur serveur rack.
- **Halos** (`--accG`, `--grnG`, etc.) = 10% d'opacité du token pour les alertes/fills souples.

### Typographie

- **Inter** pour UI, labels, body. `letter-spacing:-0.02em` sur les headlines pour un rendu éditorial.
- **JetBrains Mono** (ou Space Grotesk en fallback) pour **tous les chiffres, timestamps, métriques, labels uppercase**. Règle stricte : un chiffre = mono.
- Les labels type `stitle`, `al`, `wl`, `sl`, `ml` doivent être en JetBrains Mono, `text-transform:uppercase`, `letter-spacing:.16em` à `.22em`.
- **Anti-halatuation** : jamais `#FFFFFF`. Utiliser `--t1 #F5F7FA` — le pur blanc "brille" trop sur fond sombre.

### Élévation

- **Tonal layering** : pour lever une carte, shift son token (ex: `--s2` → `--s3`), ne jamais ajouter une shadow noire.
- Les modals / éléments flottants utilisent un **glow ambiant** : `box-shadow:var(--glow)` = `0 0 32px 0 rgba(88,222,160,.06)`.
- **Glassmorphism** sur la nav et les overlays : `background:rgba(31,31,36,.80); backdrop-filter:blur(12px) saturate(160%);`.

### Composants clés

- **Boutons primaires** (`.btn-p`) : gradient fill + `var(--glow-soft)`. `text-transform:uppercase`, `letter-spacing:.05em`.
- **Boutons ghost** (`.btn-o`) : fill tonal `--s3`, pas de bordure.
- **Inputs** (`.inp`) : fill `--s3`, pas de border. État actif = `box-shadow:inset 0 -1px 0 0 var(--acc)` (underline 1px, jamais de box complet).
- **Chips** (`.chip`) : `--s4` fond + texte en LED accent.
- **Tabs actifs** (`.mt button.active`, `.sport-type-btn.sel`, `.ph-btn.sel`) : `--s4` + `box-shadow:inset 0 -2px 0 0 var(--acc)` (underline glow, pas de fill colored).
- **Modals** : slide-up depuis le bas, `border-radius:24px 24px 0 0`, drag handle 40x4px en `--s4`.
- **Phase indicator** (`.ph-pill`) : LED dot + label Phase X en JetBrains Mono uppercase.

### Layout

- **Safe-area gutter** : `--gutter:24px`. Utilisé pour tous les paddings extérieurs (`.hdr`, `.tc`, `.auth`, `.ob`).
- **Max-width mobile** : 430px. Nav flottante à 402px max.
- **Data-first hierarchy** : la métrique principale (kcal, poids, pace) = 3x la taille de son label. Voir `.cal-ctr .cv` (3rem) vs `.cal-ctr .cl` (.52rem).

### Do

- Garder 90% de l'écran dans la plage `--bg` → `--s2`. Les accents LED "pop" comme des voyants.
- `font-variant-numeric:tabular-nums` sur toutes les classes mono.
- Underline actif via `box-shadow:inset` plutôt que `border-bottom`.

### Don't

- Pas de `#FFFFFF` pur.
- Pas de `border:1px solid` en séparateur — utiliser 12px de whitespace ou un shift de token.
- Pas de shadow noire (`rgba(0,0,0,.x)`) pour l'élévation — utiliser `--glow` ou un shift tonal.
- Pas de fill coloré sur les tabs actifs — underline glow.
- Pas de mix de chiffres dans une font sans-serif.

### Quand tu ajoutes un composant

1. Pars d'un background de section `--s1` ou `--s2`.
2. Les chiffres en `mono`, les labels en JetBrains Mono uppercase `.52rem` à `.66rem`.
3. Pour un séparateur, utilise du whitespace (8px / 12px / 14px) avant d'envisager une ghost border.
4. Pour lever un élément, monte son token d'un niveau — pas de shadow.
5. Teste que la métrique principale est ≥ 3x le label.

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
