// Duel rules and state: hands, energy, shields, turns, damage and the win check.
// No drawing and no browser here; step() advances timers and returns event flags.
import { DUEL } from './config.js';
import { buildDeck, playEffect, selectionCost } from './deck.js';
import { chooseAiPlays } from './ai.js';

export const EVENT_PLAYER_HIT = 1;
export const EVENT_AI_HIT = 2;
export const EVENT_WIN = 4;
export const EVENT_LOSS = 8;
export const EVENT_TURN = 16;

export const PHASE_PLAYER = 'player';
export const PHASE_AI_WAIT = 'ai-wait';
export const PHASE_AI_PLAY = 'ai-play';
export const PHASE_OVER = 'over';

export function createWorld(random) {
  const state = {
    playerHp: DUEL.maxHp,
    aiHp: DUEL.maxHp,
    playerShield: 0,
    aiShield: 0,
    playerHand: [],
    aiHand: [],
    deck: [],
    discard: [],
    selected: new Set(),
    energy: DUEL.baseEnergy,
    aiEnergy: DUEL.baseEnergy,
    round: 1,
    phase: PHASE_PLAYER,
    timer: 0,
    score: 0,
    damageDealt: 0,
    damageTaken: 0,
    cardsPlayed: 0,
    lastPlay: [],
    lastPlayBy: '',
    banner: '',
    bannerTimer: 0,
    log: [],
    winner: '',
    shake: 0,
    aiPlays: [],
  };

  function log(message) {
    state.log.push(message);
    if (state.log.length > 4) state.log.shift();
  }

  function drawUpTo(hand, count) {
    while (hand.length < count) {
      if (state.deck.length === 0) {
        state.deck = state.discard.splice(0, state.discard.length);
        for (let i = state.deck.length - 1; i > 0; i -= 1) {
          const j = Math.floor(random() * (i + 1));
          const tmp = state.deck[i];
          state.deck[i] = state.deck[j];
          state.deck[j] = tmp;
        }
        if (state.deck.length === 0) return;
      }
      hand.push(state.deck.pop());
    }
  }

  function energyForRound(round) {
    return Math.min(DUEL.maxEnergy, DUEL.baseEnergy + Math.floor((round - 1) / 2));
  }

  function reset() {
    state.playerHp = DUEL.maxHp;
    state.aiHp = DUEL.maxHp;
    state.playerShield = 0;
    state.aiShield = 0;
    state.playerHand = [];
    state.aiHand = [];
    state.discard = [];
    state.deck = buildDeck(random);
    state.selected = new Set();
    state.round = 1;
    state.energy = energyForRound(1);
    state.aiEnergy = energyForRound(1);
    state.phase = PHASE_PLAYER;
    state.timer = 0;
    state.score = 0;
    state.damageDealt = 0;
    state.damageTaken = 0;
    state.cardsPlayed = 0;
    state.lastPlay = [];
    state.lastPlayBy = '';
    state.banner = 'ROUND 1 — YOUR TURN';
    state.bannerTimer = 1.6;
    state.log = ['Duel started. First to 0 HP loses.'];
    state.winner = '';
    state.shake = 0;
    state.aiPlays = [];
    drawUpTo(state.playerHand, DUEL.handSize);
    drawUpTo(state.aiHand, DUEL.handSize);
  }

  function selectedCards() {
    return state.playerHand.filter((card) => state.selected.has(card.id));
  }

  function toggleSelect(cardId) {
    if (state.phase !== PHASE_PLAYER) return false;
    if (state.selected.has(cardId)) {
      state.selected.delete(cardId);
      return true;
    }
    if (state.selected.size >= DUEL.maxSelect) return false;
    const card = state.playerHand.find((entry) => entry.id === cardId);
    if (!card) return false;
    const trial = [...selectedCards(), card];
    if (selectionCost(trial) > state.energy) return false;
    state.selected.add(cardId);
    return true;
  }

  function applyEffect(effect, byPlayer) {
    let events = 0;
    if (byPlayer) {
      state.playerShield += effect.shield;
      state.playerHp = Math.min(DUEL.maxHp, state.playerHp + effect.heal);
      const blocked = Math.min(state.aiShield, effect.damage);
      state.aiShield -= blocked;
      const hpDamage = (effect.damage - blocked) + effect.pierce;
      state.aiHp = Math.max(0, state.aiHp - hpDamage);
      state.damageDealt += hpDamage;
      state.score += hpDamage * 10 + (effect.comboBonus > 0 ? 25 : 0);
      if (hpDamage > 0) { events |= EVENT_AI_HIT; state.shake = Math.max(state.shake, 0.35); }
    } else {
      state.aiShield += effect.shield;
      state.aiHp = Math.min(DUEL.maxHp, state.aiHp + effect.heal);
      const blocked = Math.min(state.playerShield, effect.damage);
      state.playerShield -= blocked;
      const hpDamage = (effect.damage - blocked) + effect.pierce;
      state.playerHp = Math.max(0, state.playerHp - hpDamage);
      state.damageTaken += hpDamage;
      if (hpDamage > 0) { events |= EVENT_PLAYER_HIT; state.shake = Math.max(state.shake, 0.35); }
    }
    if (state.aiHp <= 0) {
      state.winner = 'player';
      state.phase = PHASE_OVER;
      state.score += DUEL.winBonus + state.playerHp * 5;
      events |= EVENT_WIN;
    } else if (state.playerHp <= 0) {
      state.winner = 'ai';
      state.phase = PHASE_OVER;
      events |= EVENT_LOSS;
    }
    return events;
  }

  function playSelected() {
    if (state.phase !== PHASE_PLAYER) return 0;
    const cards = selectedCards();
    if (cards.length === 0) return 0;
    const cost = selectionCost(cards);
    if (cost > state.energy) return 0;
    state.energy -= cost;
    const effect = playEffect(cards);
    state.playerHand = state.playerHand.filter((card) => !state.selected.has(card.id));
    state.discard.push(...cards);
    state.selected = new Set();
    state.cardsPlayed += cards.length;
    state.lastPlay = cards;
    state.lastPlayBy = 'player';
    if (effect.comboName) {
      state.banner = effect.comboName;
      state.bannerTimer = 1.4;
    }
    log(`You played ${cards.map((card) => card.label).join(' ')} — ${effect.damage + effect.pierce} dmg${effect.shield ? `, +${effect.shield} shield` : ''}.`);
    return applyEffect(effect, true);
  }

  function endPlayerTurn() {
    if (state.phase !== PHASE_PLAYER) return 0;
    state.selected = new Set();
    state.phase = PHASE_AI_WAIT;
    state.timer = DUEL.aiThinkSeconds;
    state.banner = 'VEX IS THINKING…';
    state.bannerTimer = 1.2;
    return EVENT_TURN;
  }

  function runAiPlay() {
    state.aiPlays = chooseAiPlays(state.aiHand, state.aiEnergy, state.aiHp, state.playerHp, state.playerShield);
    if (state.aiPlays.length === 0) {
      log('Vex holds back and draws.');
      finishRound();
      return EVENT_TURN;
    }
    const cost = selectionCost(state.aiPlays);
    state.aiEnergy -= cost;
    const effect = playEffect(state.aiPlays);
    const playedIds = new Set(state.aiPlays.map((card) => card.id));
    state.aiHand = state.aiHand.filter((card) => !playedIds.has(card.id));
    state.discard.push(...state.aiPlays);
    state.lastPlay = state.aiPlays;
    state.lastPlayBy = 'ai';
    if (effect.comboName) {
      state.banner = `VEX: ${effect.comboName}`;
      state.bannerTimer = 1.4;
    }
    log(`Vex played ${state.aiPlays.map((card) => card.label).join(' ')} — ${effect.damage + effect.pierce} dmg${effect.shield ? `, +${effect.shield} shield` : ''}.`);
    const events = applyEffect(effect, false);
    if (state.phase === PHASE_OVER) return events;
    state.phase = PHASE_AI_PLAY;
    state.timer = DUEL.aiPlaySeconds;
    return events | EVENT_TURN;
  }

  function finishRound() {
    state.round += 1;
    state.score += DUEL.roundBonus;
    state.energy = energyForRound(state.round);
    state.aiEnergy = energyForRound(state.round);
    drawUpTo(state.playerHand, DUEL.handSize);
    drawUpTo(state.aiHand, DUEL.handSize);
    state.phase = PHASE_PLAYER;
    state.banner = `ROUND ${state.round} — YOUR TURN`;
    state.bannerTimer = 1.6;
    state.lastPlay = [];
    state.lastPlayBy = '';
  }

  function step(dt) {
    let events = 0;
    if (state.bannerTimer > 0) state.bannerTimer = Math.max(0, state.bannerTimer - dt);
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
    if (state.phase === PHASE_AI_WAIT) {
      state.timer -= dt;
      if (state.timer <= 0) events |= runAiPlay();
    } else if (state.phase === PHASE_AI_PLAY) {
      state.timer -= dt;
      if (state.timer <= 0 && state.phase !== PHASE_OVER) {
        finishRound();
        events |= EVENT_TURN;
      }
    }
    return events;
  }

  reset();
  return { state, reset, step, toggleSelect, selectedCards, playSelected, endPlayerTurn, drawUpTo, log };
}
