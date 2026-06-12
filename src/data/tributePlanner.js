export const TRIBUTE_DIFFICULTIES = ['Gamma', 'Beta', 'Alpha'];

const Q = (gamma, beta = gamma, alpha = beta) => ({ Gamma: gamma, Beta: beta, Alpha: alpha });

export const TRIBE_MEMBERS = [];

const artifact = (id, name, gamma = 1, beta = gamma, alpha = beta) => ({
  id: `artifact-${id}`,
  name: `Artifact of the ${name}`,
  qty: Q(gamma, beta, alpha),
  owner: '',
});

const trophy = (id, name, gamma, beta = gamma, alpha = beta) => ({
  id,
  name,
  qty: Q(gamma, beta, alpha),
  owner: '',
});

const prep = (id, name, gamma, beta = gamma, alpha = beta) => ({
  id,
  name,
  qty: Q(gamma, beta, alpha),
  owner: '',
});

const category = (id, title, items) => ({ id, title, items });

const baselinePrep = (variant = 'arena') => {
  const common = [
    prep('medical-brews', 'Medical Brews', 40, 60, 80),
    prep('canteens', 'Canteens / soups', 4, 8, 12),
    prep('cryopods', 'Backup cryopods', 4, 8, 12),
    prep('repair-kit', 'Armor and saddles checked', 1, 1, 1),
  ];
  if (variant === 'cave') {
    return [
      prep('thermal-kit', 'Heat / cold gear staged', 4, 8, 10),
      prep('ammo', 'Ammo and element checked', 1, 1, 1),
      prep('route', 'Route and whistle groups ready', 1, 1, 1),
      ...common,
    ];
  }
  if (variant === 'underwater') {
    return [
      prep('water-mounts', 'Water mounts saddled', 8, 12, 16),
      prep('scuba', 'SCUBA sets repaired', 4, 8, 10),
      prep('brews', 'Medical Brews', 60, 80, 100),
      prep('ammo', 'Ammo checked', 800, 1400, 2200),
    ];
  }
  return common;
};

const run = ({
  id,
  map,
  boss,
  role,
  element = Q(0, 0, 0),
  timebox = 'Arena timer',
  focus,
  army,
  artifacts = [],
  trophies = [],
  prepItems,
}) => ({
  id,
  map,
  boss,
  role,
  element,
  timebox,
  focus,
  army,
  categories: [
    category('artifacts', artifacts.length ? 'Artifacts' : 'Access', artifacts.length ? artifacts : [
      prep('access', 'Access terminal / mission unlock', 1, 1, 1),
    ]),
    category('trophies', 'Trophies', trophies.length ? trophies : [
      prep('tribute-check', 'Map-specific tribute requirements checked', 1, 1, 1),
    ]),
    category('prep', 'Raid Prep', prepItems || baselinePrep()),
  ],
});

export const TRIBUTE_RUNS = [
  run({
    id: 'island-broodmother',
    map: 'The Island',
    boss: 'Broodmother Lysrix',
    role: 'Island artifact boss',
    element: Q(20, 56, 148),
    timebox: '15 min arena',
    focus: 'Megatherium or Rex line, Yutyrannus courage uptime, antidote/brew safety.',
    army: [
      { name: 'Megatherium / Rex', count: '18 - 20', stat: '25k+ HP / high melee' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage roar' },
      { name: 'Daedon', count: '0 - 1', stat: 'Optional heal' },
    ],
    artifacts: [artifact('clever', 'Clever'), artifact('hunter', 'Hunter'), artifact('massive', 'Massive')],
    trophies: [
      trophy('argentavis-talon', 'Argentavis Talon', 0, 5, 10),
      trophy('sauropod-vertebra', 'Sauropod Vertebra', 0, 5, 10),
      trophy('sarco-skin', 'Sarcosuchus Skin', 0, 5, 10),
      trophy('titanoboa-venom', 'Titanoboa Venom', 0, 5, 10),
    ],
  }),
  run({
    id: 'island-megapithecus',
    map: 'The Island',
    boss: 'Megapithecus',
    role: 'Island element farm',
    element: Q(40, 110, 220),
    timebox: '20 min arena',
    focus: 'Rex or Therizino line, cliff-safe whistle discipline.',
    army: [
      { name: 'Rex / Therizino', count: '18 - 20', stat: '25k+ HP' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage uptime' },
      { name: 'Daedon', count: '0 - 1', stat: 'Optional heal' },
    ],
    artifacts: [artifact('brute', 'Brute'), artifact('devourer', 'Devourer'), artifact('pack', 'Pack')],
    trophies: [
      trophy('megalodon-tooth', 'Megalodon Tooth', 0, 5, 10),
      trophy('spino-sail', 'Spinosaurus Sail', 0, 5, 10),
      trophy('therizino-claws', 'Therizino Claws', 0, 5, 10),
      trophy('megalania-toxin', 'Megalania Toxin', 0, 5, 10),
    ],
  }),
  run({
    id: 'island-dragon',
    map: 'The Island',
    boss: 'Dragon',
    role: 'High-risk tek unlock',
    element: Q(80, 220, 440),
    timebox: '25 min arena',
    focus: 'Therizino cakes, fire damage mitigation, clean rider calls.',
    army: [
      { name: 'Therizino', count: '18 - 20', stat: '21k HP / cakes' },
      { name: 'Yutyrannus', count: 1, stat: 'Keep distance' },
      { name: 'Daedon', count: '0 - 1', stat: 'Optional' },
    ],
    artifacts: [artifact('cunning', 'Cunning'), artifact('immune', 'Immune'), artifact('skylord', 'Skylord'), artifact('strong', 'Strong')],
    trophies: [
      trophy('allosaurus-brain', 'Allosaurus Brain', 0, 5, 10),
      trophy('basilosaurus-blubber', 'Basilosaurus Blubber', 0, 5, 10),
      trophy('giganotosaurus-heart', 'Giganotosaurus Heart', 0, 1, 2),
      trophy('tusoteuthis-tentacle', 'Tusoteuthis Tentacle', 0, 5, 10),
      trophy('yutyrannus-lungs', 'Yutyrannus Lungs', 0, 5, 10),
    ],
    prepItems: [
      prep('sweet-cakes', 'Sweet Vegetable Cakes', 160, 240, 320),
      prep('shotguns', 'Shotguns repaired', 2, 4, 6),
      ...baselinePrep(),
    ],
  }),
  run({
    id: 'island-overseer',
    map: 'The Island',
    boss: 'Overseer',
    role: 'Ascension / Tek Cave',
    element: Q(0, 0, 0),
    timebox: 'Tek Cave timer',
    focus: 'Tek cave route, cryo timing, cold/heat swaps and group pacing.',
    army: [
      { name: 'Rex / Therizino', count: 20, stat: 'Cave-safe train' },
      { name: 'Yutyrannus', count: 1, stat: 'Boss phase' },
      { name: 'Otter', count: 1, stat: 'Temperature buffer' },
    ],
    artifacts: [
      trophy('broodmother-trophy', 'Broodmother Trophy', 1, 1, 1),
      trophy('megapithecus-trophy', 'Megapithecus Trophy', 1, 1, 1),
      trophy('dragon-trophy', 'Dragon Trophy', 1, 1, 1),
    ],
    trophies: [
      trophy('alpha-raptor-claw', 'Alpha Raptor Claw', 1, 1, 1),
      trophy('alpha-carno-arm', 'Alpha Carnotaurus Arm', 1, 1, 1),
      trophy('alpha-rex-tooth', 'Alpha Rex Tooth', 1, 1, 1),
      trophy('alpha-megalodon-fin', 'Alpha Megalodon Fin', 0, 1, 1),
      trophy('alpha-mosasaur-tooth', 'Alpha Mosasaur Tooth', 0, 1, 1),
    ],
    prepItems: baselinePrep('cave'),
  }),
  run({
    id: 'scorched-manticore',
    map: 'Scorched Earth',
    boss: 'Manticore',
    role: 'Scorched ascension boss',
    element: Q(38, 135, 285),
    timebox: '20 min arena',
    focus: 'Watch torpor clouds, keep flyers grounded, bring stimulant safety.',
    army: [
      { name: 'Rex / Wyvern-safe line', count: '18 - 20', stat: '25k+ HP' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage uptime' },
      { name: 'Daedon', count: '0 - 1', stat: 'Optional' },
    ],
    artifacts: [artifact('gatekeeper', 'Gatekeeper'), artifact('crag', 'Crag'), artifact('destroyer', 'Destroyer')],
    trophies: [
      trophy('fire-talon', 'Fire Talon', 2, 10, 20),
      trophy('lightning-talon', 'Lightning Talon', 2, 10, 20),
      trophy('poison-talon', 'Poison Talon', 2, 10, 20),
    ],
    prepItems: [
      prep('stimulant', 'Stimulant / stimulant soups', 80, 120, 180),
      ...baselinePrep(),
    ],
  }),
  run({
    id: 'aberration-rockwell',
    map: 'Aberration',
    boss: 'Rockwell',
    role: 'Aberration ascension',
    element: Q(0, 0, 0),
    timebox: '30 min arena',
    focus: 'Shotgun ammo, cactus broth, tentacle rotation and reaper control.',
    army: [
      { name: 'Rock Drake', count: '4 - 10', stat: 'Mobility' },
      { name: 'Shotgun riders', count: '4 - 10', stat: 'High dura shotguns' },
      { name: 'Light pets', count: '1 each', stat: 'Charged' },
    ],
    artifacts: [artifact('depths', 'Depths'), artifact('shadows', 'Shadows'), artifact('stalker', 'Stalker')],
    trophies: [
      trophy('basilisk-scale', 'Basilisk Scale', 4, 8, 12),
      trophy('reaper-pheromone', 'Reaper Pheromone Gland', 4, 8, 12),
      trophy('rock-drake-feather', 'Rock Drake Feather', 4, 8, 12),
      trophy('alpha-basilisk-fang', 'Alpha Basilisk Fang', 0, 1, 1),
    ],
    prepItems: [
      prep('shotgun-ammo', 'Shotgun shells', 1200, 2400, 3600),
      prep('cactus-broth', 'Cactus Broth', 10, 20, 30),
      ...baselinePrep('cave'),
    ],
  }),
  run({
    id: 'center-arena',
    map: 'The Center',
    boss: 'Broodmother & Megapithecus',
    role: 'Dual arena',
    element: Q(85, 254, 520),
    timebox: '20 min arena',
    focus: 'Two-boss pacing, spider adds first, avoid Megapithecus cliff knockbacks.',
    army: [
      { name: 'Rex / Therizino', count: '18 - 20', stat: '30k+ HP' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage uptime' },
      { name: 'Daedon', count: 1, stat: 'Optional heal' },
    ],
    artifacts: [artifact('brute', 'Brute'), artifact('clever', 'Clever'), artifact('devourer', 'Devourer'), artifact('hunter', 'Hunter'), artifact('massive', 'Massive'), artifact('pack', 'Pack')],
    trophies: [
      trophy('broodmother-trophy', 'Broodmother Trophy', 1, 1, 1),
      trophy('megapithecus-trophy', 'Megapithecus Trophy', 1, 1, 1),
    ],
  }),
  run({
    id: 'ragnarok-arena',
    map: 'Ragnarok',
    boss: 'Dragon & Manticore',
    role: 'Ragnarok dual arena',
    element: Q(65, 200, 410),
    timebox: '20 min arena',
    focus: 'Dragon first, then Manticore. Bring cakes and torpor safety.',
    army: [
      { name: 'Therizino', count: '18 - 20', stat: '21k HP / cakes' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage uptime' },
      { name: 'Daedon', count: '0 - 1', stat: 'Optional' },
    ],
    artifacts: [artifact('brute', 'Brute'), artifact('cunning', 'Cunning'), artifact('devious', 'Devious'), artifact('devourer', 'Devourer'), artifact('hunter', 'Hunter'), artifact('immune', 'Immune'), artifact('massive', 'Massive'), artifact('pack', 'Pack'), artifact('skylord', 'Skylord'), artifact('strong', 'Strong')],
    trophies: [
      trophy('fire-talon', 'Fire Talon', 2, 10, 20),
      trophy('lightning-talon', 'Lightning Talon', 2, 10, 20),
      trophy('poison-talon', 'Poison Talon', 2, 10, 20),
      trophy('dragon-trophy', 'Dragon Trophy', 1, 1, 1),
    ],
    prepItems: [
      prep('sweet-cakes', 'Sweet Vegetable Cakes', 180, 260, 360),
      prep('stimulant', 'Stimulant', 80, 120, 180),
      ...baselinePrep(),
    ],
  }),
  run({
    id: 'valguero-arena',
    map: 'Valguero',
    boss: 'Dragon, Manticore & Megapithecus',
    role: 'Triple arena',
    element: Q(85, 255, 520),
    timebox: '20 min arena',
    focus: 'Dragon priority, avoid Manticore landing stalls, keep group tight.',
    army: [
      { name: 'Therizino', count: '18 - 20', stat: '21k HP / cakes' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage uptime' },
      { name: 'Daedon', count: '0 - 1', stat: 'Optional' },
    ],
    artifacts: [artifact('brute', 'Brute'), artifact('crag', 'Crag'), artifact('cunning', 'Cunning'), artifact('devourer', 'Devourer'), artifact('gatekeeper', 'Gatekeeper'), artifact('immune', 'Immune'), artifact('pack', 'Pack'), artifact('skylord', 'Skylord'), artifact('strong', 'Strong')],
    trophies: [
      trophy('dragon-trophy', 'Dragon Trophy', 1, 1, 1),
      trophy('megapithecus-trophy', 'Megapithecus Trophy', 1, 1, 1),
      trophy('manticore-trophy', 'Manticore Trophy', 1, 1, 1),
    ],
    prepItems: [
      prep('sweet-cakes', 'Sweet Vegetable Cakes', 180, 260, 360),
      prep('stimulant', 'Stimulant', 80, 120, 180),
      ...baselinePrep(),
    ],
  }),
  run({
    id: 'extinction-desert-titan',
    map: 'Extinction',
    boss: 'Desert Titan',
    role: 'Titan trophy',
    element: Q(100, 100, 100),
    timebox: 'Open world',
    focus: 'Aerial control, flock avoidance, corrupted spawn cleanup.',
    army: [
      { name: 'Quetzal / Mek / Managarmr', count: 'Team choice', stat: 'Mobility' },
      { name: 'Velonasaur', count: '2 - 6', stat: 'DPS support' },
    ],
    artifacts: [artifact('chaos', 'Chaos')],
    trophies: [trophy('desert-titan-trophy', 'Desert Titan Trophy', 1, 1, 1)],
  }),
  run({
    id: 'extinction-forest-titan',
    map: 'Extinction',
    boss: 'Forest Titan',
    role: 'Titan trophy',
    element: Q(100, 100, 100),
    timebox: 'Open world',
    focus: 'Root control, shoulder cannon / Mek damage, corruption nodes.',
    army: [
      { name: 'Mek', count: '1 - 4', stat: 'Main DPS' },
      { name: 'Giga / Carcha', count: 'Optional', stat: 'Ground DPS' },
    ],
    artifacts: [artifact('growth', 'Growth')],
    trophies: [trophy('forest-titan-trophy', 'Forest Titan Trophy', 1, 1, 1)],
  }),
  run({
    id: 'extinction-ice-titan',
    map: 'Extinction',
    boss: 'Ice Titan',
    role: 'Titan trophy',
    element: Q(100, 100, 100),
    timebox: 'Open world',
    focus: 'Corruption node targeting, mobility and cold gear.',
    army: [
      { name: 'Mek / Managarmr', count: '1 - 6', stat: 'Mobility DPS' },
      { name: 'Giga / Carcha', count: 'Optional', stat: 'Ground burst' },
    ],
    artifacts: [artifact('void', 'Void')],
    trophies: [trophy('ice-titan-trophy', 'Ice Titan Trophy', 1, 1, 1)],
  }),
  run({
    id: 'extinction-king-titan',
    map: 'Extinction',
    boss: 'King Titan',
    role: 'Final Extinction boss',
    element: Q(0, 0, 0),
    timebox: 'Open world',
    focus: 'Titan staging, Mek shield timing and corrupted wave cleanup.',
    army: [
      { name: 'Mek', count: '4+', stat: 'Shield / rifle' },
      { name: 'Tamed Titans', count: '1 - 3', stat: 'Main objective' },
      { name: 'Giga / Carcha', count: 'Support', stat: 'Add clear' },
    ],
    artifacts: [
      trophy('desert-titan-trophy', 'Desert Titan Trophy', 1, 1, 1),
      trophy('forest-titan-trophy', 'Forest Titan Trophy', 1, 1, 1),
      trophy('ice-titan-trophy', 'Ice Titan Trophy', 1, 1, 1),
    ],
    trophies: [
      trophy('corrupt-heart', 'Corrupt Heart', 100, 200, 300),
      trophy('alpha-king-access', 'Alpha access check', 0, 0, 1),
    ],
    prepItems: [
      prep('mek-repairs', 'Mek repairs / modules staged', 2, 4, 6),
      prep('element', 'Element reserve', 300, 600, 1000),
      ...baselinePrep('cave'),
    ],
  }),
  run({
    id: 'genesis-moeder',
    map: 'Genesis',
    boss: 'Moeder, Master of the Ocean',
    role: 'Genesis ocean boss',
    element: Q(100, 185, 300),
    timebox: 'Underwater arena',
    focus: 'Water mount line, eel control, oxygen and saddle durability.',
    army: [
      { name: 'Mosasaur / Tuso', count: '10 - 20', stat: 'High saddle' },
      { name: 'Basilosaurus', count: '2 - 6', stat: 'Shock immunity' },
    ],
    artifacts: [],
    trophies: [
      trophy('mission-access', 'Genesis mission access', 1, 1, 1),
      trophy('water-tribute', 'Ocean tribute items checked', 1, 1, 1),
    ],
    prepItems: baselinePrep('underwater'),
  }),
  run({
    id: 'genesis-master-controller',
    map: 'Genesis',
    boss: 'Corrupted Master Controller',
    role: 'Genesis final boss',
    element: Q(150, 300, 600),
    timebox: 'Final test',
    focus: 'Mission count, code keys, avatar phase and mounted DPS windows.',
    army: [
      { name: 'Rex / Therizino', count: '18 - 20', stat: 'Boss line' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage uptime' },
      { name: 'Shotgun riders', count: '4+', stat: 'Avatar phase' },
    ],
    trophies: [
      trophy('gamma-missions', 'Gamma missions complete', 58, 58, 58),
      trophy('beta-missions', 'Beta missions complete', 0, 116, 116),
      trophy('alpha-missions', 'Alpha missions complete', 0, 0, 168),
    ],
    prepItems: [
      prep('code-keys', 'Code keys gathered', 80, 120, 160),
      prep('shotgun-shells', 'Shotgun shells', 1200, 2400, 3600),
      ...baselinePrep(),
    ],
  }),
  run({
    id: 'genesis2-rockwell-prime',
    map: 'Genesis 2',
    boss: 'Rockwell Prime',
    role: 'Genesis 2 final boss',
    element: Q(0, 0, 0),
    timebox: 'Final mission',
    focus: 'Mission access, exo-mek phase, tentacle control and DPS timing.',
    army: [
      { name: 'Shadowmane / Rex', count: '18 - 20', stat: 'Boss DPS' },
      { name: 'Exo-Mek', count: 'Team access', stat: 'Mission mechanic' },
      { name: 'Shotgun riders', count: '4+', stat: 'Phase support' },
    ],
    trophies: [
      trophy('gen2-missions', 'Genesis 2 mission access', 1, 1, 1),
      trophy('mutagen', 'Mutagen reserve', 10, 20, 30),
    ],
    prepItems: baselinePrep('cave'),
  }),
  run({
    id: 'crystal-wyvern-queen',
    map: 'Crystal Isles',
    boss: 'Crystal Wyvern Queen',
    role: 'Crystal Isles boss',
    element: Q(55, 150, 300),
    timebox: 'Arena timer',
    focus: 'Crystal wyvern control, flyers allowed by server rules, ranged backup.',
    army: [
      { name: 'Rex / Therizino', count: '18 - 20', stat: 'Boss line' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage' },
      { name: 'Crystal Wyvern', count: 'Optional', stat: 'Mobility' },
    ],
    artifacts: [artifact('brute', 'Brute'), artifact('clever', 'Clever'), artifact('crag', 'Crag'), artifact('cunning', 'Cunning'), artifact('devious', 'Devious'), artifact('depths', 'Depths'), artifact('destroyer', 'Destroyer'), artifact('devourer', 'Devourer'), artifact('gatekeeper', 'Gatekeeper'), artifact('hunter', 'Hunter'), artifact('immune', 'Immune'), artifact('massive', 'Massive'), artifact('pack', 'Pack'), artifact('shadows', 'Shadows'), artifact('skylord', 'Skylord'), artifact('strong', 'Strong')],
    trophies: [
      trophy('crystal-talon', 'Crystal Talon', 5, 10, 15),
      trophy('primal-crystal', 'Primal Crystal', 10, 20, 30),
    ],
  }),
  run({
    id: 'lost-island-dinopithecus-king',
    map: 'Lost Island',
    boss: 'Dinopithecus King',
    role: 'Lost Island boss',
    element: Q(60, 165, 330),
    timebox: 'Arena timer',
    focus: 'Grenade phases, monkey adds, ranged backup and bleed control.',
    army: [
      { name: 'Rex / Therizino', count: '18 - 20', stat: 'Boss line' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage' },
      { name: 'Shotgun riders', count: '2+', stat: 'Phase backup' },
    ],
    artifacts: [artifact('brute', 'Brute'), artifact('clever', 'Clever'), artifact('cunning', 'Cunning'), artifact('devourer', 'Devourer'), artifact('hunter', 'Hunter'), artifact('immune', 'Immune'), artifact('massive', 'Massive'), artifact('pack', 'Pack'), artifact('skylord', 'Skylord'), artifact('strong', 'Strong')],
    trophies: [
      trophy('dinopithecus-costume-check', 'Apex drop requirements checked', 1, 1, 1),
      trophy('amargasaurus-spike', 'Amargasaurus Spike', 0, 5, 10),
    ],
  }),
  run({
    id: 'fjordur-beyla',
    map: 'Fjordur',
    boss: 'Beyla',
    role: 'Mini-boss relic',
    element: Q(30, 30, 30),
    timebox: 'Cave mini-boss',
    focus: 'Megatherium line, poison safety and cave clear.',
    army: [
      { name: 'Megatherium', count: '8 - 12', stat: 'Bug buff DPS' },
      { name: 'Yutyrannus', count: 1, stat: 'Optional' },
    ],
    trophies: [trophy('beyla-relic', 'Beyla Relic', 1, 1, 1)],
    prepItems: baselinePrep('cave'),
  }),
  run({
    id: 'fjordur-hati-skoll',
    map: 'Fjordur',
    boss: 'Hati & Sköll',
    role: 'Mini-boss relic',
    element: Q(30, 30, 30),
    timebox: 'World mini-boss',
    focus: 'Split wolves, avoid getting boxed, bring cold resistance.',
    army: [
      { name: 'Rex / Shadowmane', count: '10 - 18', stat: 'Burst DPS' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage' },
    ],
    trophies: [
      trophy('hati-relic', 'Hati Relic', 1, 1, 1),
      trophy('skoll-relic', 'Sköll Relic', 1, 1, 1),
    ],
    prepItems: baselinePrep('cave'),
  }),
  run({
    id: 'fjordur-steinbjorn',
    map: 'Fjordur',
    boss: 'Steinbjörn',
    role: 'Mini-boss relic',
    element: Q(30, 30, 30),
    timebox: 'World mini-boss',
    focus: 'High armor target, use strong saddles and sustained DPS.',
    army: [
      { name: 'Giga / Carcha', count: '4 - 10', stat: 'High DPS' },
      { name: 'Rex', count: '10+', stat: 'Backup' },
    ],
    trophies: [trophy('steinbjorn-relic', 'Steinbjörn Relic', 1, 1, 1)],
    prepItems: baselinePrep('cave'),
  }),
  run({
    id: 'fjordur-broodmother',
    map: 'Fjordur',
    boss: 'Broodmother Lysrix',
    role: 'Fjordur island boss',
    element: Q(20, 56, 148),
    timebox: 'Arena timer',
    focus: 'Same Broodmother plan, include Fjordur artifact/relic routing.',
    army: [
      { name: 'Megatherium / Rex', count: '18 - 20', stat: '25k+ HP' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage' },
    ],
    artifacts: [artifact('clever', 'Clever'), artifact('hunter', 'Hunter'), artifact('massive', 'Massive')],
    trophies: [trophy('beyla-relic', 'Beyla Relic', 1, 1, 1)],
  }),
  run({
    id: 'fjordur-megapithecus',
    map: 'Fjordur',
    boss: 'Megapithecus',
    role: 'Fjordur island boss',
    element: Q(40, 110, 220),
    timebox: 'Arena timer',
    focus: 'Same Megapithecus plan, include Fjordur artifact/relic routing.',
    army: [
      { name: 'Rex / Therizino', count: '18 - 20', stat: '25k+ HP' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage' },
    ],
    artifacts: [artifact('brute', 'Brute'), artifact('devourer', 'Devourer'), artifact('pack', 'Pack')],
    trophies: [trophy('steinbjorn-relic', 'Steinbjörn Relic', 1, 1, 1)],
  }),
  run({
    id: 'fjordur-dragon',
    map: 'Fjordur',
    boss: 'Dragon',
    role: 'Fjordur island boss',
    element: Q(80, 220, 440),
    timebox: 'Arena timer',
    focus: 'Therizino cakes, fire damage mitigation and Fjordur relic routing.',
    army: [
      { name: 'Therizino', count: '18 - 20', stat: '21k HP / cakes' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage' },
    ],
    artifacts: [artifact('cunning', 'Cunning'), artifact('immune', 'Immune'), artifact('skylord', 'Skylord'), artifact('strong', 'Strong')],
    trophies: [trophy('hati-skoll-relics', 'Hati and Sköll Relics', 1, 1, 1)],
    prepItems: [
      prep('sweet-cakes', 'Sweet Vegetable Cakes', 160, 240, 320),
      ...baselinePrep(),
    ],
  }),
  run({
    id: 'fjordur-fenrisulfr',
    map: 'Fjordur',
    boss: 'Fenrisúlfr',
    role: 'Fjordur final boss',
    element: Q(150, 330, 520),
    timebox: 'Arena timer',
    focus: 'Cold burst phases, wolf control, high saddle line and relic chain complete.',
    army: [
      { name: 'Rex / Therizino', count: '18 - 20', stat: '30k+ HP' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage' },
      { name: 'Daedon', count: '0 - 1', stat: 'Optional' },
    ],
    artifacts: [
      trophy('broodmother-trophy', 'Broodmother Trophy', 1, 1, 1),
      trophy('megapithecus-trophy', 'Megapithecus Trophy', 1, 1, 1),
      trophy('dragon-trophy', 'Dragon Trophy', 1, 1, 1),
    ],
    trophies: [
      trophy('beyla-relic', 'Beyla Relic', 1, 1, 1),
      trophy('hati-relic', 'Hati Relic', 1, 1, 1),
      trophy('skoll-relic', 'Sköll Relic', 1, 1, 1),
      trophy('steinbjorn-relic', 'Steinbjörn Relic', 1, 1, 1),
    ],
    prepItems: baselinePrep('cave'),
  }),
  run({
    id: 'astraeos-natrix',
    map: 'Astraeos',
    boss: 'Natrix',
    role: 'Astraeos boss',
    element: Q(60, 160, 320),
    timebox: 'Arena timer',
    focus: 'Premium map boss template. Confirm live server requirements before farming.',
    army: [
      { name: 'Rex / Therizino', count: '18 - 20', stat: 'Boss line' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage' },
    ],
    trophies: [trophy('astraeos-access', 'Astraeos tribute access checked', 1, 1, 1)],
  }),
  run({
    id: 'astraeos-minotaur',
    map: 'Astraeos',
    boss: 'Minotaur',
    role: 'Astraeos boss',
    element: Q(60, 160, 320),
    timebox: 'Arena timer',
    focus: 'Premium map boss template. Confirm live server requirements before farming.',
    army: [
      { name: 'Rex / Therizino', count: '18 - 20', stat: 'Boss line' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage' },
    ],
    trophies: [trophy('astraeos-access', 'Astraeos tribute access checked', 1, 1, 1)],
  }),
  run({
    id: 'astraeos-final',
    map: 'Astraeos',
    boss: 'Grendel / Lost King / Lost Queen',
    role: 'Astraeos final bosses',
    element: Q(80, 220, 440),
    timebox: 'Arena timer',
    focus: 'Group Astraeos final boss planning until exact per-boss tribute tables are pinned.',
    army: [
      { name: 'Rex / Therizino', count: '18 - 20', stat: 'Boss line' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage' },
      { name: 'Shotgun riders', count: '2+', stat: 'Backup' },
    ],
    trophies: [
      trophy('astraeos-relics', 'Astraeos relic chain checked', 1, 1, 1),
      trophy('hydra-access', 'Hydra / final access checked', 1, 1, 1),
    ],
  }),
];

export function getTributeStateKey(runId) {
  return `overseer-tribute-v2-${runId}`;
}

export function flattenRunItems(run) {
  return run.categories.flatMap(category => (
    category.items.map(item => ({ ...item, categoryId: category.id, categoryTitle: category.title }))
  ));
}
