// Vex, the AI duelist: a readable strategy the player can learn and counter.
// Vex shields when hurt, finishes a weak player with piercing Void cards,
// and otherwise plays the strongest affordable combo. No hidden randomness.
import { comboFor, playEffect, selectionCost } from './deck.js';

function subsetsUpTo(hand, maxSize) {
  const results = [];
  const picked = [];
  function walk(start) {
    if (picked.length > 0) results.push([...picked]);
    if (picked.length >= maxSize) return;
    for (let i = start; i < hand.length; i += 1) {
      picked.push(hand[i]);
      walk(i + 1);
      picked.pop();
    }
  }
  walk(0);
  return results;
}

function scorePlay(cards, aiHp, playerHp, playerShield) {
  const effect = playEffect(cards);
  let score = effect.damage * 2 + effect.pierce * 3 + effect.shield + effect.heal * 2;
  if (playerShield > 0) score += effect.pierce * 2;
  if (aiHp <= 8) score += effect.shield * 2 + effect.heal * 2;
  if (effect.damage + effect.pierce >= playerHp + playerShield) score += 100;
  if (comboFor(cards).bonus > 0) score += 4;
  return score;
}

/** Pick up to 3 cards from Vex's hand within `energy`; returns the card objects. */
export function chooseAiPlays(hand, energy, aiHp, playerHp, playerShield) {
  let best = [];
  let bestScore = -1;
  for (const subset of subsetsUpTo(hand, 3)) {
    if (selectionCost(subset) > energy) continue;
    const score = scorePlay(subset, aiHp, playerHp, playerShield);
    if (score > bestScore) {
      bestScore = score;
      best = subset;
    }
  }
  return best;
}

export function aiIntentText(hand, energy, aiHp, playerHp, playerShield) {
  const plays = chooseAiPlays(hand, energy, aiHp, playerHp, playerShield);
  if (plays.length === 0) return 'Vex holds back';
  const effect = playEffect(plays);
  if (effect.shield >= 6 && effect.damage + effect.pierce === 0) return 'Vex will shield';
  if (effect.pierce > 0 && playerShield > 0) return 'Vex eyes your shield — Void pierces it';
  if (effect.damage + effect.pierce >= 10) return 'Vex is winding up a heavy strike';
  return 'Vex will strike';
}
