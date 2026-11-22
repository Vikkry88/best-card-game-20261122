// Sigil Clash tuning: field size, duel numbers, suit identities and the neon palette.
// The table is a fixed 1280x720 logical area; the renderer scales it to the window.

export const FIELD = { width: 1280, height: 720 };

export const STEP = 1 / 60;

export const DUEL = {
  maxHp: 24,
  handSize: 5,
  maxSelect: 3,
  baseEnergy: 3,
  maxEnergy: 6,
  aiThinkSeconds: 0.85,
  aiPlaySeconds: 0.9,
  winBonus: 250,
  roundBonus: 15,
};

export const CARD = { width: 118, height: 164, radius: 12, gap: 14 };

export const SUITS = [
  { id: 'ember', name: 'Ember', shape: 'flame', color: '#ff5a4e', dark: '#8f231c', role: 'Attack' },
  { id: 'tide', name: 'Tide', shape: 'drop', color: '#3fa9f5', dark: '#1c5d8f', role: 'Drain' },
  { id: 'thorn', name: 'Thorn', shape: 'leaf', color: '#51d88a', dark: '#1e7a45', role: 'Shield' },
  { id: 'void', name: 'Void', shape: 'star', color: '#b78bff', dark: '#5b3a99', role: 'Pierce' },
];

export const RANKS = [
  { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 },
  { label: '5', value: 5 }, { label: '6', value: 6 }, { label: '7', value: 7 },
  { label: '8', value: 8 }, { label: '9', value: 9 }, { label: '10', value: 10 },
  { label: 'J', value: 11, face: 'Jack' }, { label: 'Q', value: 12, face: 'Queen' },
  { label: 'K', value: 13, face: 'King' }, { label: 'A', value: 14, face: 'Ace' },
];

export const PALETTE = {
  backdrop: '#0b0f1e',
  feltOuter: '#123527',
  feltInner: '#1d5c3f',
  feltLine: '#d9b45b',
  panel: '#141a30',
  panelEdge: '#d9b45b',
  text: '#f4f6ff',
  muted: '#a7b0c9',
  gold: '#f2c94c',
  hpGood: '#51d88a',
  hpLow: '#ff5a4e',
  shield: '#7fd4ff',
  energy: '#ffd94d',
  cardFace: '#f7f3e8',
  cardBack: '#232a4d',
  cardBackEdge: '#d9b45b',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const BEST_KEY = 'sigil-clash.best';
export const PLAYER_NAME = 'YOU';
export const AI_NAME = 'VEX';
export const AI_TITLE = 'Vex, the Sigil Dealer';
