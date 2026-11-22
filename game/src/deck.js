// Cards and combos: what a card costs, what it does, and how selected cards combine.
// A card is { id, suit, rank, label, value, cost, power, face } — plain data, no drawing.
import { RANKS, SUITS } from './config.js';
import { shuffleInPlace } from './random.js';

let nextCardId = 1;

export function cardCost(value) {
  if (value <= 5) return 1;
  if (value <= 9) return 2;
  if (value <= 11) return 3;
  return 4;
}

export function cardPower(suitId, value) {
  if (suitId === 'void') return Math.max(1, value - 3);
  return value - 1;
}

export function makeCard(suitIndex, rankIndex) {
  const suit = SUITS[suitIndex];
  const rank = RANKS[rankIndex];
  const card = {
    id: nextCardId,
    suit: suitIndex,
    suitId: suit.id,
    rank: rankIndex,
    label: rank.label,
    value: rank.value,
    face: rank.face || '',
    cost: cardCost(rank.value),
    power: cardPower(suit.id, rank.value),
  };
  nextCardId += 1;
  return card;
}

export function buildDeck(random) {
  const deck = [];
  for (let s = 0; s < SUITS.length; s += 1) {
    for (let r = 0; r < RANKS.length; r += 1) deck.push(makeCard(s, r));
  }
  return shuffleInPlace(deck, random);
}

export function findCard(suitId, label) {
  const s = SUITS.findIndex((suit) => suit.id === suitId);
  const r = RANKS.findIndex((rank) => rank.label === label);
  return makeCard(s, r);
}

export function selectionCost(cards) {
  return cards.reduce((sum, card) => sum + card.cost, 0);
}

/** Combo name and bonus damage for a set of cards played together. */
export function comboFor(cards) {
  if (cards.length < 2) return { name: '', bonus: 0, shield: 0 };
  const values = cards.map((card) => card.value).sort((a, b) => a - b);
  const sameSuit = cards.every((card) => card.suit === cards[0].suit);
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  const pairCount = [...counts.values()].filter((count) => count >= 2).length;
  const triple = [...counts.values()].some((count) => count >= 3);
  const straight = cards.length >= 3 && values.every((value, i) => i === 0 || value === values[i - 1] + 1);
  if (triple) return { name: 'TRIPLE SIGIL +7', bonus: 7, shield: 2 };
  if (straight && sameSuit) return { name: 'ROYAL RUN +9', bonus: 9, shield: 2 };
  if (straight) return { name: 'RUN +6', bonus: 6, shield: 0 };
  if (sameSuit && cards.length >= 3) return { name: 'FLUSH SIGIL +5', bonus: 5, shield: 2 };
  if (pairCount >= 1) return { name: 'PAIR +4', bonus: 4, shield: 0 };
  if (sameSuit) return { name: 'MATCHED SUIT +2', bonus: 2, shield: 0 };
  return { name: '', bonus: 0, shield: 0 };
}

/** Total effect of playing `cards`: damage, piercing damage, shield and healing. */
export function playEffect(cards) {
  let damage = 0;
  let pierce = 0;
  let shield = 0;
  let heal = 0;
  for (const card of cards) {
    if (card.suitId === 'ember') damage += card.power;
    else if (card.suitId === 'tide') { damage += card.power; heal += Math.floor(card.power / 3); }
    else if (card.suitId === 'thorn') shield += card.power;
    else if (card.suitId === 'void') pierce += card.power;
  }
  const combo = comboFor(cards);
  damage += combo.bonus;
  shield += combo.shield;
  return { damage, pierce, shield, heal, comboName: combo.name, comboBonus: combo.bonus };
}

export function suitName(suitIndex) {
  return SUITS[suitIndex].name;
}
