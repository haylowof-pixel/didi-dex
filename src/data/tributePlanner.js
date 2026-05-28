export const TRIBUTE_DIFFICULTIES = ['Gamma', 'Beta', 'Alpha'];

const Q = (gamma, beta, alpha) => ({ Gamma: gamma, Beta: beta, Alpha: alpha });

export const TRIBE_MEMBERS = [
  { id: 'kr', name: 'Kratos', initials: 'KR', role: 'Lead' },
  { id: 'so', name: 'Sombra', initials: 'SO', role: 'Artifacts' },
  { id: 'mi', name: 'Mika', initials: 'MI', role: 'Trophies' },
  { id: 'da', name: 'Dax', initials: 'DA', role: 'Prep' },
  { id: 'ta', name: 'Talia', initials: 'TA', role: 'Ammo' },
  { id: 've', name: 'Vex', initials: 'VE', role: 'Backup' },
  { id: 'lu', name: 'Luna', initials: 'LU', role: 'Unassigned' },
  { id: 'ar', name: 'Aria', initials: 'AR', role: 'Unassigned' },
];

export const TRIBUTE_RUNS = [
  {
    id: 'island-broodmother',
    map: 'The Island',
    boss: 'Broodmother Lysrix',
    role: 'Artifact boss opener',
    element: Q(20, 56, 148),
    timebox: '15 min arena',
    focus: 'Megatherium line, Yuty courage roar, Daedon food budget.',
    army: [
      { name: 'Rex', count: '18 - 20', stat: '30k+ HP' },
      { name: 'Therizinosaur', count: '4 - 6', stat: '20k+ HP' },
      { name: 'Yutyrannus', count: '2 - 4', stat: '18k+ HP' },
      { name: 'Daedon', count: '2 - 3', stat: '15k+ HP' },
    ],
    categories: [
      {
        id: 'artifacts',
        title: 'Artifacts',
        items: [
          { id: 'devourer', name: 'Artifact of the Devourer', qty: Q(1, 1, 1), owner: 'kr' },
          { id: 'hunter', name: 'Artifact of the Hunter', qty: Q(1, 1, 1), owner: 'so' },
          { id: 'massive', name: 'Artifact of the Massive', qty: Q(1, 1, 1), owner: 'mi' },
          { id: 'pack', name: 'Artifact of the Pack', qty: Q(1, 1, 1), owner: 'da' },
          { id: 'clever', name: 'Artifact of the Clever', qty: Q(1, 1, 1), owner: 'ta' },
          { id: 'skylord', name: 'Artifact of the Skylord', qty: Q(1, 1, 1), owner: 've' },
          { id: 'immune', name: 'Artifact of the Immune', qty: Q(1, 1, 1), owner: '' },
          { id: 'strong', name: 'Artifact of the Strong', qty: Q(1, 1, 1), owner: '' },
          { id: 'gatekeeper', name: 'Artifact of the Gatekeeper', qty: Q(1, 1, 1), owner: '' },
          { id: 'brute', name: 'Artifact of the Brute', qty: Q(1, 1, 1), owner: '' },
        ],
      },
      {
        id: 'trophies',
        title: 'Trophies',
        items: [
          { id: 'broodmother-trophy', name: 'Broodmother Trophy', qty: Q(1, 1, 1), owner: 'kr' },
          { id: 'megapithecus-trophy', name: 'Megapithecus Trophy', qty: Q(1, 1, 1), owner: 'so' },
          { id: 'dragon-trophy', name: 'Dragon Trophy', qty: Q(1, 1, 1), owner: 'mi' },
          { id: 'overseer-trophy', name: 'Overseer Trophy', qty: Q(1, 1, 1), owner: 'da' },
          { id: 'dododex-trophy', name: 'DodoRex Trophy', qty: Q(1, 1, 1), owner: 'ta' },
          { id: 'remnant-king', name: 'Remnant of the King', qty: Q(1, 1, 1), owner: 've' },
          { id: 'tooth-dragon', name: 'Tooth of the Dragon', qty: Q(1, 1, 1), owner: '' },
          { id: 'megalodon-tooth', name: 'Megalodon Tooth', qty: Q(1, 1, 1), owner: '' },
        ],
      },
      {
        id: 'prep',
        title: 'Raid Prep',
        items: [
          { id: 'medical-brews', name: 'Medical Brews', qty: Q(50, 50, 50), owner: 'kr' },
          { id: 'medical-brews-plus', name: 'Medical Brews+', qty: Q(20, 20, 20), owner: 'so' },
          { id: 'canteens', name: 'Canteens', qty: Q(40, 40, 40), owner: 'mi' },
          { id: 'cakes', name: 'Sweet Vegetable Cake', qty: Q(20, 20, 20), owner: 'da' },
          { id: 'ammo', name: 'Ammo (Advanced)', qty: Q(2000, 2000, 2000), owner: 'ta' },
          { id: 'rockets', name: 'Rockets', qty: Q(100, 100, 100), owner: 've' },
          { id: 'cryopods', name: 'Cryopods', qty: Q(30, 30, 30), owner: '' },
          { id: 'plant-z', name: 'Plant Species Z Fruit', qty: Q(20, 20, 20), owner: '' },
          { id: 'bola', name: 'Bola', qty: Q(25, 25, 25), owner: '' },
          { id: 'spyglass', name: 'Spyglass', qty: Q(10, 10, 10), owner: '' },
          { id: 'parachutes', name: 'Parachutes', qty: Q(20, 20, 20), owner: '' },
          { id: 'c4', name: 'C4 Charges', qty: Q(20, 20, 20), owner: '' },
        ],
      },
    ],
  },
  {
    id: 'island-megapithecus',
    map: 'The Island',
    boss: 'Megapithecus',
    role: 'Element farm',
    element: Q(40, 110, 220),
    timebox: '20 min arena',
    focus: 'Rex or Therizino line, cliff-safe whistle discipline.',
    army: [
      { name: 'Rex', count: 18, stat: '25k HP / 700% melee' },
      { name: 'Yutyrannus', count: 1, stat: 'Courage uptime' },
      { name: 'Daedon', count: 1, stat: 'Optional heal' },
    ],
    categories: [
      {
        id: 'artifacts',
        title: 'Artifacts',
        items: [
          { id: 'brute', name: 'Artifact of the Brute', qty: Q(1, 1, 1), owner: 'farm' },
          { id: 'devourer', name: 'Artifact of the Devourer', qty: Q(1, 1, 1), owner: 'farm' },
          { id: 'pack', name: 'Artifact of the Pack', qty: Q(1, 1, 1), owner: 'farm' },
        ],
      },
      {
        id: 'trophies',
        title: 'Trophies',
        items: [
          { id: 'meg-tooth', name: 'Megalodon Tooth', qty: Q(0, 5, 10), owner: 'farm' },
          { id: 'spino-sail', name: 'Spinosaurus Sail', qty: Q(0, 5, 10), owner: 'farm' },
          { id: 'theri-claws', name: 'Therizino Claws', qty: Q(0, 5, 10), owner: 'farm' },
          { id: 'toxin', name: 'Megalania Toxin', qty: Q(0, 5, 10), owner: 'farm' },
        ],
      },
      {
        id: 'prep',
        title: 'Raid Prep',
        items: [
          { id: 'riders', name: 'Riders assigned', qty: Q(4, 6, 8), owner: 'lead' },
          { id: 'cold', name: 'Cold gear checked', qty: Q(4, 6, 8), owner: 'medic' },
          { id: 'whistle', name: 'Army whistle group ready', qty: Q(1, 1, 1), owner: 'lead' },
          { id: 'cryo', name: 'Backup cryos staged', qty: Q(2, 4, 6), owner: 'breed' },
        ],
      },
    ],
  },
  {
    id: 'island-dragon',
    map: 'The Island',
    boss: 'Dragon',
    role: 'High-risk tek unlock',
    element: Q(80, 220, 440),
    timebox: '25 min arena',
    focus: 'Therizino cakes, fire damage mitigation, clean rider calls.',
    army: [
      { name: 'Therizino', count: 18, stat: '21k HP / 750% melee' },
      { name: 'Yutyrannus', count: 1, stat: 'Keep distance' },
      { name: 'Daedon', count: 1, stat: 'Optional' },
    ],
    categories: [
      {
        id: 'artifacts',
        title: 'Artifacts',
        items: [
          { id: 'cunning', name: 'Artifact of the Cunning', qty: Q(1, 1, 1), owner: 'farm' },
          { id: 'immune', name: 'Artifact of the Immune', qty: Q(1, 1, 1), owner: 'farm' },
          { id: 'skylord', name: 'Artifact of the Skylord', qty: Q(1, 1, 1), owner: 'farm' },
          { id: 'strong', name: 'Artifact of the Strong', qty: Q(1, 1, 1), owner: 'farm' },
        ],
      },
      {
        id: 'trophies',
        title: 'Trophies',
        items: [
          { id: 'allo-brain', name: 'Allosaurus Brain', qty: Q(0, 5, 10), owner: 'farm' },
          { id: 'blubber', name: 'Basilosaurus Blubber', qty: Q(0, 5, 10), owner: 'farm' },
          { id: 'giga-heart', name: 'Giganotosaurus Heart', qty: Q(0, 1, 2), owner: 'farm' },
          { id: 'tuso-tentacle', name: 'Tusoteuthis Tentacle', qty: Q(0, 5, 10), owner: 'farm' },
          { id: 'yuty-lungs', name: 'Yutyrannus Lungs', qty: Q(0, 5, 10), owner: 'farm' },
        ],
      },
      {
        id: 'prep',
        title: 'Raid Prep',
        items: [
          { id: 'cakes', name: 'Sweet veggie cakes crafted', qty: Q(180, 260, 360), owner: 'medic' },
          { id: 'shotguns', name: 'Shotguns repaired', qty: Q(2, 4, 6), owner: 'lead' },
          { id: 'landing', name: 'Dragon landing call assigned', qty: Q(1, 1, 1), owner: 'lead' },
          { id: 'armor', name: 'Spare armor staged', qty: Q(4, 8, 12), owner: 'medic' },
        ],
      },
    ],
  },
  {
    id: 'overseer',
    map: 'The Island',
    boss: 'Overseer',
    role: 'Ascension run',
    element: Q(0, 0, 0),
    timebox: 'Tek cave timer',
    focus: 'Tek cave route, cryo timing, cold/heat swaps and group pacing.',
    army: [
      { name: 'Rex / Theri', count: 20, stat: 'Cave-safe train' },
      { name: 'Yutyrannus', count: 1, stat: 'Boss phase' },
      { name: 'Otter', count: 1, stat: 'Temperature buffer' },
    ],
    categories: [
      {
        id: 'artifacts',
        title: 'Boss Trophies',
        items: [
          { id: 'brood-trophy', name: 'Broodmother Trophy', qty: Q(1, 1, 1), owner: 'lead' },
          { id: 'mega-trophy', name: 'Megapithecus Trophy', qty: Q(1, 1, 1), owner: 'lead' },
          { id: 'dragon-trophy', name: 'Dragon Trophy', qty: Q(1, 1, 1), owner: 'lead' },
        ],
      },
      {
        id: 'trophies',
        title: 'Alpha Tributes',
        items: [
          { id: 'alpha-raptor', name: 'Alpha Raptor Claw', qty: Q(1, 1, 1), owner: 'farm' },
          { id: 'alpha-carno', name: 'Alpha Carnotaurus Arm', qty: Q(1, 1, 1), owner: 'farm' },
          { id: 'alpha-rex', name: 'Alpha Rex Tooth', qty: Q(1, 1, 1), owner: 'farm' },
          { id: 'alpha-meg', name: 'Alpha Megalodon Fin', qty: Q(0, 1, 1), owner: 'farm' },
          { id: 'alpha-mosa', name: 'Alpha Mosasaur Tooth', qty: Q(0, 1, 1), owner: 'farm' },
        ],
      },
      {
        id: 'prep',
        title: 'Cave Prep',
        items: [
          { id: 'timer', name: 'Tek cave timer synced', qty: Q(1, 1, 1), owner: 'lead' },
          { id: 'thermal', name: 'Thermal gear staged', qty: Q(4, 8, 10), owner: 'medic' },
          { id: 'ammo', name: 'Element and ammo checked', qty: Q(1, 1, 1), owner: 'lead' },
          { id: 'fallback', name: 'Fallback dino plan agreed', qty: Q(1, 1, 1), owner: 'breed' },
        ],
      },
    ],
  },
];

export function getTributeStateKey(runId) {
  return `overseer-tribute-v2-${runId}`;
}

export function flattenRunItems(run) {
  return run.categories.flatMap(category => (
    category.items.map(item => ({ ...item, categoryId: category.id, categoryTitle: category.title }))
  ));
}
