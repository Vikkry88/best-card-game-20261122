// Boot and the one loop: fixed-step duel timers, input every frame, renderer last.
// Screens: title, play, paused, win and loss. ?shot=title|play|win|loss&seed=N
// stages a deterministic scene for screenshots and sets window.__shotReady.
import { BEST_KEY, FIELD, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_AI_HIT, EVENT_LOSS, EVENT_PLAYER_HIT, EVENT_WIN } from './world.js';
import { ACTION_CONFIRM, ACTION_END_TURN, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { buttonRects, createRenderer, playerCardRects, SCREEN_LOSS, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { createFx } from './fx.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const random = createRandom(seed);
const world = createWorld(random);
const renderer = createRenderer(canvas);
const fx = createFx(random);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world, fx);
  world.state.bannerTimer = scene.keepBanner ? world.state.bannerTimer : 0;
  for (let i = 0; i < 60; i += 1) renderer.draw(world.state, scene.screen, scene.best, scene.focus, fx);
  window.__shotReady = true;
  requestAnimationFrame(() => renderer.draw(world.state, scene.screen, scene.best, scene.focus, fx));
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let focus = 0;
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    fx.clear();
    focus = 0;
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Duel started. Your turn.');
  }

  function endGame(won) {
    screen = won ? SCREEN_WIN : SCREEN_LOSS;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    if (won) fx.confetti(FIELD.width);
    announce(won ? `Victory. Score ${world.state.score}.` : `Defeat. Score ${world.state.score}.`);
  }

  function react(events) {
    if (events & EVENT_AI_HIT) {
      fx.burst(640, 170, '#ff5a4e', 26, 260);
      fx.floater(640, 140, 'HIT!', '#ff8a7a');
    }
    if (events & EVENT_PLAYER_HIT) {
      fx.burst(640, 560, '#3fa9f5', 26, 260);
      fx.floater(640, 530, 'HIT!', '#7fd4ff');
    }
    if (events & EVENT_WIN) endGame(true);
    else if (events & EVENT_LOSS) endGame(false);
  }

  function handlePointer(point) {
    if (screen === SCREEN_TITLE || screen === SCREEN_WIN || screen === SCREEN_LOSS) {
      startGame();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    for (const button of buttonRects()) {
      if (point.x >= button.x && point.x <= button.x + button.w && point.y >= button.y && point.y <= button.y + button.h) {
        if (button.id === 'strike') react(world.playSelected());
        else world.endPlayerTurn();
        return;
      }
    }
    const rects = playerCardRects(world.state);
    for (let i = 0; i < rects.length; i += 1) {
      const rect = rects[i];
      if (point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h) {
        focus = i;
        world.toggleSelect(rect.card.id);
        return;
      }
    }
  }

  function handleInput() {
    const actions = input.takeActions();
    const digit = input.takeDigit();
    const move = input.takeFocusMove();
    for (const pointer of input.takePointers()) handlePointer(renderer.toLogical(pointer.x, pointer.y));
    if (actions & ACTION_RESTART && screen !== SCREEN_TITLE) startGame();
    else if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_WIN || screen === SCREEN_LOSS)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    } else if (screen === SCREEN_PLAY) {
      if (move !== 0 && world.state.playerHand.length > 0) {
        focus = (focus + move + world.state.playerHand.length) % world.state.playerHand.length;
      }
      if (digit >= 0 && world.state.playerHand[digit]) {
        focus = digit;
        world.toggleSelect(world.state.playerHand[digit].id);
      } else if (actions & ACTION_CONFIRM) {
        if (world.state.selected.size > 0) react(world.playSelected());
        else if (world.state.playerHand[focus]) world.toggleSelect(world.state.playerHand[focus].id);
      }
      if (actions & ACTION_END_TURN) world.endPlayerTurn();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleInput();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        react(world.step(STEP));
        fx.step(STEP);
        accumulator -= STEP;
        if (screen !== SCREEN_PLAY) break;
      }
    } else {
      fx.step(STEP);
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, focus, fx);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Sigil Clash. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
