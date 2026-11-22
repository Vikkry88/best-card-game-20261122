// Screenshot scenes behind ?shot=title|play|win|loss. Each stages a real duel
// state through the world's own data (fixed hands, HP, round and selection),
// so the frame is exactly what the game renders mid-duel for that seed.
import { findCard } from './deck.js';
import { SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

function fixedHands(world) {
  world.state.playerHand = [
    findCard('ember', '9'),
    findCard('tide', '9'),
    findCard('ember', 'Q'),
    findCard('thorn', 'K'),
    findCard('void', 'A'),
  ];
  world.state.aiHand = [
    findCard('void', 'Q'),
    findCard('ember', '10'),
    findCard('tide', 'J'),
    findCard('thorn', 'K'),
    findCard('ember', '7'),
  ];
}

export function stageShot(name, world, fx) {
  world.reset();
  const state = world.state;
  if (name === 'play') {
    fixedHands(world);
    state.round = 4;
    state.playerHp = 18;
    state.aiHp = 15;
    state.playerShield = 4;
    state.aiShield = 3;
    state.energy = 5;
    state.aiEnergy = 5;
    state.score = 340;
    state.damageDealt = 19;
    state.cardsPlayed = 7;
    state.selected = new Set([state.playerHand[0].id, state.playerHand[1].id]);
    state.banner = 'PAIR +4';
    state.bannerTimer = 99;
    state.log = [
      'You played 8 8 — 18 dmg.',
      'Vex played J — 8 dmg.',
      'Round 4. Your move!',
    ];
    if (fx) fx.burst(640, 330, '#f2c94c', 14, 150);
    return { screen: SCREEN_PLAY, best: 520, focus: 1, keepBanner: true };
  }
  if (name === 'win') {
    fixedHands(world);
    state.round = 6;
    state.playerHp = 9;
    state.aiHp = 0;
    state.playerShield = 2;
    state.aiShield = 0;
    state.energy = 2;
    state.score = 640;
    state.damageDealt = 31;
    state.cardsPlayed = 13;
    state.winner = 'player';
    state.phase = 'over';
    state.lastPlay = [findCard('void', 'A'), findCard('ember', 'K')];
    state.lastPlayBy = 'player';
    if (fx) {
      fx.confetti(1280);
      for (let i = 0; i < 40; i += 1) fx.step(1 / 60);
    }
    return { screen: SCREEN_WIN, best: 640, focus: 0, keepBanner: false };
  }
  if (name === 'loss') {
    fixedHands(world);
    state.round = 5;
    state.playerHp = 0;
    state.aiHp = 11;
    state.playerShield = 0;
    state.aiShield = 5;
    state.energy = 0;
    state.score = 210;
    state.damageDealt = 17;
    state.cardsPlayed = 10;
    state.winner = 'ai';
    state.phase = 'over';
    state.lastPlay = [findCard('ember', 'Q'), findCard('void', 'K')];
    state.lastPlayBy = 'ai';
    return { screen: SCREEN_LOSS, best: 520, focus: 0, keepBanner: false };
  }
  fixedHands(world);
  state.banner = '';
  state.bannerTimer = 0;
  return { screen: SCREEN_TITLE, best: 520, focus: 0, keepBanner: false };
}
