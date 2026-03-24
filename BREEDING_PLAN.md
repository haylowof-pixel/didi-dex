# Plan d'implémentation - Système de Breeding ARK ASA

## Architecture générale

Le système de breeding sera une **nouvelle fenêtre** (`breeding-window.html`) intégrée au même pattern que maps-window / timer-overlay / settings-window. Les données sont persistées en JSON dans `userData/breeding-data.json`.

---

## Fichiers à créer / modifier

### 1. `shell/breeding-window.html` (NOUVEAU - ~2500 lignes)
Fenêtre principale tout-en-un avec sidebar à onglets (même pattern que maps-window).

### 2. `electron/main.js` (MODIFIER)
- Ajouter `breedingWindow` variable + helpers (isBreedingAlive, safeDestroyBreeding, createBreedingWindow)
- Ajouter keybind `Alt+B` → toggle breeding
- Ajouter IPC handlers pour save/load breeding data depuis `breeding-data.json`
- Ajouter breeding dans `safeDestroy` du main window close
- Ajouter IPC pour export CSV/JSON lignées

### 3. `electron/preload.js` (MODIFIER)
- Ajouter API breeding: `openBreeding()`, `closeBreeding()`, `isBreedingOpen()`, `breedingClose()`
- Ajouter API data: `saveBreedingData(data)`, `loadBreedingData()`, `exportBreedingCSV()`, `exportBreedingJSON()`
- Ajouter API pin: `breedingTogglePin()`, `onBreedingPinChanged(cb)`

### 4. `shell/index.html` (MODIFIER)
- Ajouter bouton 🧬 Breeding dans la barre de menu (après Timers, avant Maps)

---

## Structure de breeding-window.html

### Layout
```
┌─ Title bar (drag, pin, close) ──────────────────────────────┐
│ 🧬 BREEDING MANAGER                          📌  ✕         │
├─────────────┬───────────────────────────────────────────────┤
│  SIDEBAR    │  MAIN PANEL                                   │
│             │                                               │
│ [Cheptel]   │  (contenu dynamique selon onglet sidebar)     │
│ [Breeding]  │                                               │
│ [Gènes]     │                                               │
│ [Simu]      │                                               │
│ [Config]    │                                               │
│             │                                               │
│ ─────────── │                                               │
│ Espèce:     │                                               │
│ [dropdown]  │                                               │
│             │                                               │
│ Serveur:    │                                               │
│ [Officiel ▾]│                                               │
│             │                                               │
└─────────────┴───────────────────────────────────────────────┘
```

### Onglet 1 — CHEPTEL (gestion dinos)
```
┌─ Filtres: [Tous ▾] [♂/♀ ▾] [Tri: Niveau ▾] ─── [+ Ajouter Dino]──┐
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ ♂ Rex "Alpha"  Niv 278  │ Muta: 3/7   │ Gènes: Mutable3,Rob2 │ │
│ │ HP:50  Stam:42  Ox:21  Food:40  W:48  Mel:62  Spd:0  Tor:55   │ │
│ │ [Éditer] [Dupliquer] [Supprimer]                                │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ ♀ Rex "Bravo"  Niv 274  │ Muta: 0/0   │ Gènes: Robust3       │ │
│ │ HP:50  Stam:40  Ox:21  Food:40  W:48  Mel:60  Spd:0  Tor:55   │ │
│ │ [Éditer] [Dupliquer] [Supprimer]                                │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│ ... (10 femelles + 1 mâle par groupe)                               │
│                                                                      │
│ ── Groupes ──                                                        │
│ 📁 Rex HP Boss (11 dinos) ── 📁 Rex Melee (6 dinos)                │
└──────────────────────────────────────────────────────────────────────┘
```

**Formulaire Ajouter/Éditer Dino (modal):**
```
┌─ Ajouter un Dino ─────────────────────────────────────────┐
│ Nom:     [__________]   Espèce: [Rex ▾]   Sexe: [♂ ▾]   │
│                                                            │
│ ── Stats sauvages (points) ──                              │
│ Vie/HP:   [__]  Stam:  [__]  Ox:    [__]  Food: [__]     │
│ Weight:   [__]  Melee: [__]  Speed: [__]  Torpor:[__]     │
│                                                            │
│ ── Mutations ──                                            │
│ Côté paternel: [__]/20    Côté maternel: [__]/20          │
│                                                            │
│ ── Gènes (max 5) ──                                       │
│ [Mutable Niv3 ▾] [Robust Niv2 ▾] [+ Ajouter gène]       │
│                                                            │
│ ── Groupe ──                                               │
│ [Rex HP Boss ▾] ou [+ Nouveau groupe]                     │
│                                                            │
│           [Annuler]  [💾 Sauvegarder]                      │
└────────────────────────────────────────────────────────────┘
```

### Onglet 2 — BREED NOW (simulateur couple)
```
┌─ Sélection couple ─────────────────────────────────────────┐
│ ♂ Mâle: [Alpha (Rex HP:50 Mel:62) ▾]                      │
│ ♀ Femelle: [Bravo (Rex HP:50 Mel:60) ▾]                   │
│                                                             │
│ [🎲 Simuler 1 bébé]  [📊 Monte-Carlo x1000]               │
├─────────────────────────────────────────────────────────────┤
│ ── Prédiction bébé ──                                      │
│                                                             │
│ Stat     ♂ Dad   ♀ Mom   Bébé    % best   Muta?           │
│ HP       50      50      50      100%     —                │
│ Stam     42      40      42      55%      —                │
│ Melee    62      60      62      55%      14% → +2pts      │
│ Weight   48      48      48      100%     —                │
│ ...                                                         │
│                                                             │
│ Mutations chance: 13.7% (Mutable3 +2%)                     │
│ Compteur muta bébé: pat 3/20 + mat 0/20 = 3/20            │
│                                                             │
│ ── Temps (serveur: Officiel x1) ──                         │
│ Mating cooldown:  18h-48h                                  │
│ Incubation:       4h 59m                                   │
│ Maturation:       3j 20h 30m                               │
│ Total cycle:      ~4j 20h                                  │
│                                                             │
│ ── Monte-Carlo (1000 simus) ──                             │
│ % bébé parfait (all best stats):    30.2%                  │
│ % au moins 1 mutation:              13.7%                  │
│ % mutation sur HP:                   1.96%                 │
│ % mutation sur Melee:                1.96%                 │
│ Niveau moyen bébé:                  276.4                  │
└─────────────────────────────────────────────────────────────┘
```

### Onglet 3 — GÈNES MANAGER
```
┌─ Inventaire Gènes ────────────────────────────────────────┐
│ [+ Ajouter gène à l'inventaire]                           │
│                                                            │
│ Gène              Niv   Sur dino        Catégorie         │
│ ─────────────────────────────────────────────────────────  │
│ Mutable           3     ♂ Alpha         Mutable           │
│ Robust            3     ♂ Alpha         Robust            │
│ Robust            2     ♀ Bravo         Robust            │
│ Vampiric          —     Inventaire      Unique            │
│ Protective        —     Inventaire      Unique            │
│ Numb              —     Inventaire      Unique            │
│                                                            │
│ ── Règles rappel ──                                        │
│ • Max 5 gènes par dino                                    │
│ • Max 3 par catégorie (sauf Unique: x1 ou x2)            │
│ • Priorité: gènes sur mâle (breed tout le cheptel)       │
│ • Mutable3 = +2% chance muta stat                         │
│ • Robust3 = +3% chance meilleure stat (55% → 58%)        │
│                                                            │
│ [Auto-assign optimal] ← répartit gènes sur mâle prio     │
└────────────────────────────────────────────────────────────┘
```

### Onglet 4 — MASS BREED (simulation N générations)
```
┌─ Simulation masse ─────────────────────────────────────────┐
│ Objectif: atteindre [20] mutations sur [HP ▾]              │
│ Cheptel: [Rex HP Boss ▾]  (10♀ + 1♂)                      │
│ Mâle actuel muta: [3]/20                                   │
│                                                             │
│ [▶ Lancer simulation]                                      │
│                                                             │
│ ── Résultats ──                                            │
│ Générations estimées:     ~57                               │
│ Temps réel estimé:        ~12 jours (officiel x1)          │
│ Nombre de bébés total:    ~570                              │
│                                                             │
│ ── Progression mutations ──                                │
│ Gen 0:   3/20 HP   ████░░░░░░░░░░░░░░░░  15%              │
│ Gen 10:  5/20 HP   █████████░░░░░░░░░░░  25%              │
│ Gen 20:  8/20 HP   ████████████░░░░░░░░  40%              │
│ ...                                                         │
│ Gen 57: 20/20 HP   ████████████████████  100% ✓           │
│                                                             │
│ ⚠ Après 20/20: reconstituer 10♀ parfaites (0/20 muta)    │
│ puis continuer avec mâle muté comme stud                   │
└─────────────────────────────────────────────────────────────┘
```

### Onglet 5 — CONFIG SERVEUR
```
┌─ Configuration serveur ────────────────────────────────────┐
│ Preset: [Officiel ▾] [PvE x2 ▾] [Custom]                  │
│                                                             │
│ MatingIntervalMultiplier:     [1.0___]                     │
│ EggHatchSpeedMultiplier:      [1.0___]                     │
│ BabyMatureSpeedMultiplier:    [1.0___]                     │
│ BabyCuddleIntervalMultiplier: [1.0___]                     │
│ BabyImprintAmountMultiplier:  [1.0___]                     │
│                                                             │
│ Level cap officiel:           [450___]                      │
│                                                             │
│ [💾 Sauvegarder config]                                    │
│                                                             │
│ ── Export ──                                                │
│ [📥 Export JSON]  [📥 Export CSV]                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Modèle de données (breeding-data.json)

```javascript
{
  "version": "1.0",
  "serverConfig": {
    "name": "Officiel",
    "matingInterval": 1.0,
    "eggHatchSpeed": 1.0,
    "babyMatureSpeed": 1.0,
    "babyCuddleInterval": 1.0,
    "babyImprintAmount": 1.0,
    "levelCap": 450
  },
  "species": {
    // Base breeding data par espèce (hardcodé dans le HTML)
  },
  "dinos": [
    {
      "id": "uuid-1",
      "name": "Alpha",
      "species": "Rex",
      "sex": "male",
      "stats": {
        "hp": 50, "stam": 42, "ox": 21, "food": 40,
        "weight": 48, "melee": 62, "speed": 0, "torpor": 55
      },
      "mutationsPat": 3,
      "mutationsMat": 0,
      "genes": [
        { "type": "Mutable", "level": 3 },
        { "type": "Robust", "level": 2 }
      ],
      "group": "Rex HP Boss",
      "parents": { "father": null, "mother": null },
      "generation": 0,
      "createdAt": "2026-03-06T12:00:00Z"
    }
  ],
  "groups": [
    { "id": "g1", "name": "Rex HP Boss", "species": "Rex", "targetStat": "hp" }
  ],
  "geneInventory": [
    { "id": "gi1", "type": "Vampiric", "level": null, "source": "Tamed Rex Lv150" }
  ]
}
```

---

## Algorithmes core (dans breeding-window.html, section `<script>`)

### A. Constantes espèces (SPECIES_DATA)
```javascript
var SPECIES_DATA = {
  'Rex': {
    matingCooldownMin: 18*3600, matingCooldownMax: 48*3600,
    incubation: 17940, maturation: 332820,
    imprintInterval: 28800, statsPerLevel: {
      hp: 220, stam: 10, ox: 150, food: 100,
      weight: 20, melee: 0.014, speed: 0, torpor: 88
    }
  },
  'Raptor': { ... },
  // ... 28 espèces supportées
};
```

### B. Héritage stats (simulateInheritance)
```javascript
// Pour chaque stat: 55% meilleure parentale, 45% pire
// Si parents ont même valeur → 100% cette valeur
// Gène Robust augmente le % (Niv3 +3%, Niv2 +2.25%, Niv1 +1.5%)
function simulateInheritance(father, mother) {
  var baby = {};
  var STATS = ['hp','stam','ox','food','weight','melee','speed','torpor'];

  // Calcul bonus Robust (sur les gènes des deux parents)
  var robustBonus = getRobustBonus(father) + getRobustBonus(mother);
  var bestChance = Math.min(0.55 + robustBonus, 0.95); // cap 95%

  STATS.forEach(function(stat) {
    var fVal = father.stats[stat];
    var mVal = mother.stats[stat];
    if (fVal === mVal) {
      baby[stat] = fVal;
    } else {
      var best = Math.max(fVal, mVal);
      var worst = Math.min(fVal, mVal);
      baby[stat] = Math.random() < bestChance ? best : worst;
    }
  });
  return baby;
}
```

### C. Mutations (simulateMutation)
```javascript
// Chance base ~7.31% par parent (effectif ~14% combiné si <20/20 les deux)
// Mutable augmente: Niv3 +2%, Niv2 +1.5%, Niv1 +1%
// Mutation = +2 points sur 1 stat random + 1 couleur random
// Cap 254 points par stat
function simulateMutation(baby, father, mother) {
  var result = { mutated: false, stat: null, color: null, newPoints: 0 };

  var baseMutaChance = 0.0731; // ~7.31% par parent
  var mutableBonus = getMutableBonus(father) + getMutableBonus(mother);

  // Côté paternel
  var patCanMutate = father.mutationsPat + father.mutationsMat < 20;
  var matCanMutate = mother.mutationsPat + mother.mutationsMat < 20;

  var totalChance = 0;
  if (patCanMutate) totalChance += baseMutaChance + mutableBonus;
  if (matCanMutate) totalChance += baseMutaChance + mutableBonus;

  if (Math.random() < totalChance) {
    // Mutation se produit!
    var MUTABLE_STATS = ['hp','stam','ox','food','weight','melee','speed'];
    var stat = MUTABLE_STATS[Math.floor(Math.random() * MUTABLE_STATS.length)];

    if (baby[stat] + 2 <= 254) {
      baby[stat] += 2;
      result.mutated = true;
      result.stat = stat;
      result.newPoints = baby[stat];
      result.color = Math.floor(Math.random() * 56); // couleur random 0-55
    }
  }
  return result;
}
```

### D. Compteur mutations bébé
```javascript
function calcBabyMutations(father, mother, didMutate) {
  // Bébé hérite: pat total père + mat total mère
  var pat = father.mutationsPat + father.mutationsMat;
  var mat = mother.mutationsPat + mother.mutationsMat;

  // Si mutation effective, +1 du côté qui a muté
  if (didMutate) {
    // Mutation vient du côté paternel ou maternel (random)
    if (Math.random() < 0.5) pat += 1;
    else mat += 1;
  }
  return { pat: pat, mat: mat };
}
```

### E. Gènes
```javascript
var GENE_TYPES = {
  'Mutable': { maxLevel: 3, category: 'mutable', maxPerDino: 3,
    effect: function(lv) { return { mutaBonus: [0.01, 0.015, 0.02][lv-1] }; }
  },
  'Robust': { maxLevel: 3, category: 'robust', maxPerDino: 3,
    effect: function(lv) { return { inheritBonus: [0.015, 0.0225, 0.03][lv-1] }; }
  },
  'Frail': { maxLevel: 3, category: 'frail', maxPerDino: 3,
    effect: function(lv) { return { inheritMalus: true }; } // force pire stat
  },
  'Vampiric': { maxLevel: null, category: 'unique', maxPerDino: 1 },
  'Numb': { maxLevel: null, category: 'unique', maxPerDino: 1 },
  'Protective': { maxLevel: null, category: 'unique', maxPerDino: 2 },
  'Ironclad': { maxLevel: null, category: 'unique', maxPerDino: 2 },
};
// Max 5 gènes total par dino
```

### F. Monte-Carlo (1000 simulations)
```javascript
function monteCarloBreed(father, mother, iterations) {
  var results = {
    perfectBaby: 0, anyMutation: 0,
    mutationByStat: {}, avgLevel: 0,
    statDistribution: {}
  };

  for (var i = 0; i < iterations; i++) {
    var baby = simulateInheritance(father, mother);
    var muta = simulateMutation(baby, father, mother);

    // Vérifier si bébé parfait (toutes best stats)
    var isPerfect = true;
    STATS.forEach(function(s) {
      var best = Math.max(father.stats[s], mother.stats[s]);
      if (baby[s] !== best) isPerfect = false;
    });

    if (isPerfect) results.perfectBaby++;
    if (muta.mutated) {
      results.anyMutation++;
      results.mutationByStat[muta.stat] = (results.mutationByStat[muta.stat]||0) + 1;
    }

    // Niveau estimé
    var totalPts = 0;
    STATS.forEach(function(s) { totalPts += baby[s]; });
    results.avgLevel += totalPts;
  }

  results.avgLevel /= iterations;
  results.perfectBaby = (results.perfectBaby / iterations * 100).toFixed(1);
  results.anyMutation = (results.anyMutation / iterations * 100).toFixed(1);

  return results;
}
```

### G. Calcul temps breeding
```javascript
function calcBreedingTimes(species, serverConfig) {
  var data = SPECIES_DATA[species];
  if (!data) return null;

  var matingMin = data.matingCooldownMin / serverConfig.matingInterval;
  var matingMax = data.matingCooldownMax / serverConfig.matingInterval;
  var incub = data.incubation / serverConfig.eggHatchSpeed;
  var mature = data.maturation / serverConfig.babyMatureSpeed;
  var imprint = data.imprintInterval / serverConfig.babyCuddleInterval;
  var totalImprints = Math.ceil(mature / imprint);

  return {
    matingCooldown: { min: matingMin, max: matingMax },
    incubation: incub,
    maturation: mature,
    imprintInterval: imprint,
    totalImprints: totalImprints,
    totalCycle: incub + mature
  };
}
```

### H. Mass breed simulation
```javascript
function simulateMassBreed(group, targetStat, targetMutations, serverConfig) {
  // group = { males: [dino], females: [dino] }
  var currentMale = JSON.parse(JSON.stringify(group.males[0]));
  var females = group.females.map(function(f) { return JSON.parse(JSON.stringify(f)); });
  var gen = 0;
  var totalBabies = 0;
  var history = [];

  while (currentMale.stats[targetStat] <
         group.males[0].stats[targetStat] + targetMutations * 2) {

    gen++;
    var bestBaby = null;

    // Chaque femelle produit 1 bébé par génération
    females.forEach(function(female) {
      var baby = simulateInheritance(currentMale, female);
      var muta = simulateMutation(baby, currentMale, female);
      totalBabies++;

      if (muta.mutated && muta.stat === targetStat) {
        if (!bestBaby || baby[targetStat] > bestBaby.stats[targetStat]) {
          var babyMuta = calcBabyMutations(currentMale, female, true);
          bestBaby = {
            stats: baby,
            mutationsPat: babyMuta.pat,
            mutationsMat: babyMuta.mat,
            genes: currentMale.genes // hérite gènes du père
          };
        }
      }
    });

    if (bestBaby) {
      currentMale = bestBaby;
      // Reconstituer femelles si mâle > 20/20 muta
      if (currentMale.mutationsPat + currentMale.mutationsMat > 20) {
        // Alerter: il faut reconstituer les femelles à 0/20
      }
    }

    history.push({
      gen: gen,
      mutaStat: currentMale.stats[targetStat],
      totalMuta: currentMale.mutationsPat + currentMale.mutationsMat
    });

    if (gen > 500) break; // sécurité
  }

  var timePerGen = calcBreedingTimes(group.males[0].species, serverConfig);

  return {
    generations: gen,
    totalBabies: totalBabies,
    estimatedTime: gen * timePerGen.totalCycle,
    history: history
  };
}
```

---

## Plan d'implémentation par étapes

### Étape 1: Infrastructure (main.js + preload.js + index.html)
- `main.js`: breedingWindow variable, createBreedingWindow(), IPC handlers save/load/export
- `preload.js`: API breeding complète
- `index.html`: bouton 🧬 Breeding dans appbar
- Persistence JSON dans userData

### Étape 2: breeding-window.html - Structure de base
- Layout sidebar + panel principal
- Title bar (drag, pin, close)
- CSS complet (même thème dark que le reste de l'app)
- Système d'onglets (5 tabs)
- Sélecteur espèce global

### Étape 3: Onglet Cheptel
- Liste dinos avec cards (affichage stats, muta, gènes)
- CRUD dinos (formulaire modal add/edit)
- Gestion groupes (créer, renommer, supprimer)
- Filtres (sexe, espèce, groupe)
- Tri (niveau, nom, mutations)

### Étape 4: Onglet Breed Now
- Sélection couple (dropdown ♂/♀)
- Algorithmes core: simulateInheritance, simulateMutation, calcBabyMutations
- Affichage tableau prédiction (stats, %, muta chance)
- Monte-Carlo 1000 simus avec statistiques
- Calcul temps breeding (espèce-specific + multiplicateurs serveur)

### Étape 5: Onglet Gènes Manager
- Inventaire gènes (ajout/retrait)
- Assignation gènes sur dinos (validation max 5, max par catégorie)
- Calcul impact % muta/inherit
- Auto-assign optimal (priorité mâle)

### Étape 6: Onglet Mass Breed
- Config simulation (objectif muta cible, cheptel source)
- Simulation N générations avec progression
- Visualisation barre de progression par génération
- Alertes reconstitution cheptel femelles
- Temps estimé total

### Étape 7: Onglet Config Serveur + Export
- Presets serveur (Officiel, PvE x2, x5, Custom)
- Multiplicateurs éditables
- Level cap
- Export JSON/CSV lignées
- Import données

### Étape 8: Intégration Dododex
- Récupérer stats base depuis le scraper existant
- Auto-fill stats quand un dino est détecté dans Dododex
- Synchro breeding data ↔ timer data

---

## Données espèces hardcodées (SPECIES_DATA - 28 espèces)

Contient pour chaque espèce:
- matingCooldownMin/Max (secondes)
- incubation (secondes)
- maturation (secondes)
- imprintInterval (secondes)
- statsPerLevel (HP, Stam, Ox, Food, Weight, Melee, Speed, Torpor)
- eggOrLive ('egg' ou 'live')

Espèces: Rex, Raptor, Spino, Carno, Allosaurus, Giganotosaurus, Baryonyx, Yutyrannus, Thylacoleo, Dire Wolf, Dire Bear, Sabertooth, Triceratops, Stegosaurus, Brontosaurus, Ankylosaurus, Therizinosaur, Doedicurus, Mammoth, Woolly Rhino, Argentavis, Pteranodon, Quetzal, Tapejara, Megalodon, Mosasaurus, Basilosaurus, Dodo

---

## Résumé: 3 fichiers à modifier, 1 à créer

| Fichier | Action | Taille estimée |
|---------|--------|---------------|
| `shell/breeding-window.html` | CRÉER | ~2500 lignes |
| `electron/main.js` | MODIFIER | +60 lignes |
| `electron/preload.js` | MODIFIER | +15 lignes |
| `shell/index.html` | MODIFIER | +5 lignes |
