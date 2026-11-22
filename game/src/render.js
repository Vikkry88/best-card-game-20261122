// Drawing only: felt table, readable cards, HUD and panels. Card visuals glide
// toward their layout slots each frame, so dealt and played cards slide with weight.
import { AI_NAME, CARD, DUEL, FIELD, FONT, PALETTE, PLAYER_NAME, SUITS } from './config.js';
import { comboFor, playEffect, selectionCost } from './deck.js';
import { aiIntentText } from './ai.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

const AI_HAND_Y = 104;
const PLAYER_HAND_Y = 508;
const CENTER_Y = 300;
const DECK_POS = { x: 96, y: 300 };
const DISCARD_POS = { x: 1086, y: 300 };

export function handX(count, index) {
  const total = count * CARD.width + (count - 1) * CARD.gap;
  return (FIELD.width - total) / 2 + index * (CARD.width + CARD.gap);
}

export function playerCardRects(state) {
  return state.playerHand.map((card, index) => ({
    card,
    x: handX(state.playerHand.length, index),
    y: PLAYER_HAND_Y - (state.selected.has(card.id) ? 26 : 0),
    w: CARD.width,
    h: CARD.height,
  }));
}

export function buttonRects() {
  return [
    { id: 'strike', label: 'STRIKE', x: 1032, y: 452, w: 196, h: 54 },
    { id: 'end', label: 'END TURN', x: 1032, y: 516, w: 196, h: 54 },
  ];
}

function roundRect(context, x, y, w, h, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + w - radius, y);
  context.arcTo(x + w, y, x + w, y + radius, radius);
  context.lineTo(x + w, y + h - radius);
  context.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  context.lineTo(x + radius, y + h);
  context.arcTo(x, y + h, x, y + h - radius, radius);
  context.lineTo(x, y + radius);
  context.arcTo(x, y, x + radius, y, radius);
  context.closePath();
}

function drawSuitShape(context, shape, cx, cy, size, color) {
  context.fillStyle = color;
  context.beginPath();
  if (shape === 'flame') {
    context.moveTo(cx, cy - size);
    context.bezierCurveTo(cx + size * 0.9, cy - size * 0.1, cx + size * 0.7, cy + size * 0.6, cx, cy + size * 0.95);
    context.bezierCurveTo(cx - size * 0.7, cy + size * 0.6, cx - size * 0.9, cy - size * 0.1, cx, cy - size);
  } else if (shape === 'drop') {
    context.moveTo(cx, cy - size);
    context.bezierCurveTo(cx + size * 0.85, cy + size * 0.25, cx + size * 0.6, cy + size * 0.95, cx, cy + size * 0.95);
    context.bezierCurveTo(cx - size * 0.6, cy + size * 0.95, cx - size * 0.85, cy + size * 0.25, cx, cy - size);
  } else if (shape === 'leaf') {
    context.moveTo(cx, cy - size);
    context.bezierCurveTo(cx + size, cy - size * 0.4, cx + size * 0.8, cy + size * 0.8, cx, cy + size);
    context.bezierCurveTo(cx - size * 0.8, cy + size * 0.8, cx - size, cy - size * 0.4, cx, cy - size);
  } else {
    for (let i = 0; i < 10; i += 1) {
      const radius = i % 2 === 0 ? size : size * 0.45;
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (i === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.closePath();
  }
  context.fill();
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const visuals = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    view.scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    view.x = (canvas.width - FIELD.width * view.scale) / 2;
    view.y = (canvas.height - FIELD.height * view.scale) / 2;
  }

  function toLogical(clientX, clientY) {
    const ratio = window.devicePixelRatio || 1;
    return {
      x: (clientX * ratio - view.x) / view.scale,
      y: (clientY * ratio - view.y) / view.scale,
    };
  }

  function text(value, x, y, size, color, align, bold) {
    context.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
    context.fillStyle = color;
    context.textAlign = align || 'left';
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function visualFor(card, targetX, targetY) {
    let visual = visuals.get(card.id);
    if (!visual) {
      visual = { x: DECK_POS.x, y: DECK_POS.y, scale: 0.6 };
      visuals.set(card.id, visual);
    }
    visual.x += (targetX - visual.x) * 0.22;
    visual.y += (targetY - visual.y) * 0.22;
    visual.scale += (1 - visual.scale) * 0.2;
    return visual;
  }

  function drawCard(card, x, y, options) {
    const opts = options || {};
    const scale = opts.scale || 1;
    const w = CARD.width * scale;
    const h = CARD.height * scale;
    const suit = SUITS[card.suit];
    context.save();
    context.shadowColor = 'rgba(0,0,0,0.45)';
    context.shadowBlur = opts.selected ? 22 : 10;
    context.shadowOffsetY = 5;
    roundRect(context, x, y, w, h, CARD.radius * scale);
    context.fillStyle = PALETTE.cardFace;
    context.fill();
    context.shadowBlur = 0;
    context.lineWidth = opts.selected ? 5 : 3;
    context.strokeStyle = opts.selected ? PALETTE.gold : suit.dark;
    context.stroke();
    context.fillStyle = suit.color;
    context.fillRect(x, y + h - 26 * scale, w, 26 * scale);
    text(card.label, x + 10 * scale, y + 36 * scale, 32 * scale, suit.dark, 'left', true);
    drawSuitShape(context, suit.shape, x + 24 * scale, y + 56 * scale, 11 * scale, suit.color);
    context.beginPath();
    context.arc(x + w - 20 * scale, y + 20 * scale, 15 * scale, 0, Math.PI * 2);
    context.fillStyle = PALETTE.energy;
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = '#8a6d1a';
    context.stroke();
    text(String(card.cost), x + w - 20 * scale, y + 27 * scale, 19 * scale, '#4a3a05', 'center', true);
    drawSuitShape(context, suit.shape, x + w / 2, y + h * 0.46, (card.face ? 28 : 26) * scale, suit.color);
    if (card.face) text(card.face.toUpperCase(), x + w / 2, y + h * 0.46 + 46 * scale, 15 * scale, suit.dark, 'center', true);
    text(`${suit.role} ${card.power}`, x + w / 2, y + h - 7 * scale, 16 * scale, '#ffffff', 'center', true);
    if (opts.dim) {
      roundRect(context, x, y, w, h, CARD.radius * scale);
      context.fillStyle = 'rgba(10,12,24,0.45)';
      context.fill();
    }
    context.restore();
  }

  function drawCardBack(x, y, count) {
    for (let i = Math.min(count, 4) - 1; i >= 0; i -= 1) {
      roundRect(context, x + i * 3, y - i * 3, CARD.width * 0.82, CARD.height * 0.82, 10);
      context.fillStyle = PALETTE.cardBack;
      context.fill();
      context.lineWidth = 3;
      context.strokeStyle = PALETTE.cardBackEdge;
      context.stroke();
    }
    text('SIGIL', x + CARD.width * 0.41, y + CARD.height * 0.36, 20, PALETTE.gold, 'center', true);
    text('CLASH', x + CARD.width * 0.41, y + CARD.height * 0.36 + 24, 20, PALETTE.gold, 'center', true);
    text(String(count), x + CARD.width * 0.41, y + CARD.height * 0.36 + 52, 22, PALETTE.text, 'center', true);
  }

  function drawHpBar(x, y, w, hp, shield, label, color) {
    text(`${label}  ${hp}/${DUEL.maxHp}`, x, y - 8, 24, PALETTE.text, 'left', true);
    roundRect(context, x, y, w, 22, 6);
    context.fillStyle = '#0d1226';
    context.fill();
    const fillW = Math.max(0, (hp / DUEL.maxHp) * w);
    if (fillW > 0) {
      roundRect(context, x, y, fillW, 22, 6);
      context.fillStyle = hp <= 6 ? PALETTE.hpLow : color;
      context.fill();
    }
    context.lineWidth = 2;
    context.strokeStyle = PALETTE.panelEdge;
    roundRect(context, x, y, w, 22, 6);
    context.stroke();
    if (shield > 0) text(`SHIELD ${shield}`, x + w, y - 8, 19, PALETTE.shield, 'right', true);
  }

  function drawTable(state) {
    const gradient = context.createRadialGradient(640, 360, 80, 640, 360, 720);
    gradient.addColorStop(0, PALETTE.feltInner);
    gradient.addColorStop(1, PALETTE.feltOuter);
    context.fillStyle = gradient;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.beginPath();
    context.ellipse(640, 360, 560, 270, 0, 0, Math.PI * 2);
    context.lineWidth = 6;
    context.strokeStyle = PALETTE.feltLine;
    context.stroke();
    context.beginPath();
    context.ellipse(640, 360, 520, 240, 0, 0, Math.PI * 2);
    context.lineWidth = 2;
    context.strokeStyle = 'rgba(217,180,91,0.5)';
    context.stroke();
    text('SIGIL CLASH', 640, 352, 34, 'rgba(244,246,255,0.16)', 'center', true);
    drawCardBack(DECK_POS.x, DECK_POS.y - 60, state.deck.length);
    text('DECK', DECK_POS.x + 48, DECK_POS.y + 96, 16, PALETTE.muted, 'center', true);
    const topDiscard = state.discard[state.discard.length - 1];
    if (topDiscard) drawCard(topDiscard, DISCARD_POS.x, DISCARD_POS.y - 60, { scale: 0.82, dim: true });
    else {
      roundRect(context, DISCARD_POS.x, DISCARD_POS.y - 60, CARD.width * 0.82, CARD.height * 0.82, 10);
      context.lineWidth = 2;
      context.strokeStyle = 'rgba(244,246,255,0.35)';
      context.stroke();
    }
    text('DISCARD', DISCARD_POS.x + 48, DISCARD_POS.y + 96, 16, PALETTE.muted, 'center', true);
  }

  function drawHands(state, focusIndex) {
    text(`${AI_NAME} — Vex, the Sigil Dealer`, 640, AI_HAND_Y - 12, 19, PALETTE.muted, 'center', true);
    state.aiHand.forEach((card, index) => {
      const tx = handX(state.aiHand.length, index);
      const visual = visualFor(card, tx, AI_HAND_Y);
      const played = state.lastPlayBy === 'ai' && state.lastPlay.some((entry) => entry.id === card.id);
      drawCard(card, visual.x, visual.y, { scale: visual.scale * 0.92, dim: state.phase !== 'player' && !played });
    });
    const intent = state.phase === 'player'
      ? aiIntentText(state.aiHand, state.aiEnergy, state.aiHp, state.playerHp, state.playerShield)
      : 'Vex is playing…';
    if (!(state.bannerTimer > 0 && state.banner)) {
      text(intent, 640, AI_HAND_Y + CARD.height * 0.92 + 30, 19, PALETTE.gold, 'center', true);
    }
    if (state.lastPlay.length > 0) {
      state.lastPlay.forEach((card, index) => {
        const tx = handX(state.lastPlay.length, index);
        drawCard(card, tx, CENTER_Y + 4, { scale: 0.9 });
      });
    }
    state.playerHand.forEach((card, index) => {
      const selected = state.selected.has(card.id);
      const tx = handX(state.playerHand.length, index);
      const ty = PLAYER_HAND_Y - (selected ? 26 : 0) - (index === focusIndex ? 8 : 0);
      const visual = visualFor(card, tx, ty);
      drawCard(card, visual.x, visual.y, { scale: visual.scale, selected });
      if (index === focusIndex) {
        roundRect(context, visual.x - 5, visual.y - 5, CARD.width + 10, CARD.height + 10, 14);
        context.lineWidth = 3;
        context.strokeStyle = '#ffffff';
        context.stroke();
      }
      text(String(index + 1), visual.x + CARD.width / 2, visual.y + CARD.height + 24, 18, PALETTE.muted, 'center', true);
    });
  }

  function drawHud(state, best) {
    roundRect(context, 16, 12, FIELD.width - 32, 58, 10);
    context.fillStyle = 'rgba(13,18,38,0.85)';
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = PALETTE.panelEdge;
    context.stroke();
    drawHpBar(32, 40, 300, state.aiHp, state.aiShield, AI_NAME, '#ff8a7a');
    text(`ROUND ${state.round}`, 640, 50, 28, PALETTE.text, 'center', true);
    text(`SCORE ${state.score}`, 1010, 50, 26, PALETTE.gold, 'right', true);
    text(`BEST ${best}`, 1240, 50, 20, PALETTE.muted, 'right', true);
    roundRect(context, 16, 438, 288, 266, 12);
    context.fillStyle = 'rgba(13,18,38,0.88)';
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = PALETTE.panelEdge;
    context.stroke();
    drawHpBar(32, 478, 252, state.playerHp, state.playerShield, PLAYER_NAME, PALETTE.hpGood);
    text('ENERGY', 32, 536, 17, PALETTE.muted, 'left', true);
    for (let i = 0; i < DUEL.maxEnergy; i += 1) {
      context.beginPath();
      context.arc(128 + i * 28, 528, 10, 0, Math.PI * 2);
      context.fillStyle = i < state.energy ? PALETTE.energy : '#2a3357';
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = '#8a6d1a';
      context.stroke();
    }
    text('DUEL LOG', 32, 566, 15, PALETTE.muted, 'left', true);
    state.log.forEach((line, index) => {
      text(line, 32, 592 + index * 23, 15, PALETTE.text, 'left', false);
    });
    const picked = state.playerHand.filter((card) => state.selected.has(card.id));
    if (picked.length > 0) {
      const effect = playEffect(picked);
      const combo = comboFor(picked);
      const label = `Selected ${picked.length} · Cost ${selectionCost(picked)} · DMG ${effect.damage + effect.pierce}${effect.shield ? ` · Shield ${effect.shield}` : ''}${combo.name ? ` · ${combo.name}` : ''}`;
      roundRect(context, 380, 446, 520, 40, 10);
      context.fillStyle = 'rgba(13,18,38,0.92)';
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = PALETTE.gold;
      context.stroke();
      text(label, 640, 473, 20, PALETTE.gold, 'center', true);
    } else if (state.phase === 'player') {
      roundRect(context, 380, 446, 520, 40, 10);
      context.fillStyle = 'rgba(13,18,38,0.85)';
      context.fill();
      text('Click cards or press 1–5, then STRIKE (Enter). E ends turn.', 640, 472, 17, PALETTE.text, 'center', true);
    }
    if (state.bannerTimer > 0 && state.banner) {
      roundRect(context, 390, 258, 500, 44, 12);
      context.fillStyle = 'rgba(13,18,38,0.92)';
      context.fill();
      context.lineWidth = 3;
      context.strokeStyle = PALETTE.gold;
      context.stroke();
      text(state.banner, 640, 288, 26, PALETTE.gold, 'center', true);
    }
  }

  function drawButtons(state) {
    const picked = state.playerHand.filter((card) => state.selected.has(card.id));
    for (const button of buttonRects()) {
      const enabled = state.phase === 'player' && (button.id === 'end' || picked.length > 0);
      roundRect(context, button.x, button.y, button.w, button.h, 12);
      context.fillStyle = enabled ? (button.id === 'strike' ? '#c93b30' : '#2456a6') : '#2a3357';
      context.fill();
      context.lineWidth = 3;
      context.strokeStyle = PALETTE.gold;
      context.stroke();
      text(button.label, button.x + button.w / 2, button.y + 36, 24, '#ffffff', 'center', true);
    }
  }

  function drawPanel(title, lines, prompt, accent) {
    const w = 760;
    const h = 130 + lines.length * 34 + 70;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;
    context.fillStyle = 'rgba(5,8,18,0.62)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    roundRect(context, x, y, w, h, 18);
    context.fillStyle = PALETTE.panel;
    context.fill();
    context.lineWidth = 4;
    context.strokeStyle = accent || PALETTE.panelEdge;
    context.stroke();
    text(title, FIELD.width / 2, y + 72, 54, accent || PALETTE.text, 'center', true);
    lines.forEach((line, index) => {
      text(line, FIELD.width / 2, y + 122 + index * 34, 22, PALETTE.muted, 'center', false);
    });
    text(prompt, FIELD.width / 2, y + h - 36, 25, PALETTE.gold, 'center', true);
  }

  function draw(state, screen, best, focusIndex, fx) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const shakeX = state.shake > 0 ? (Math.random() - 0.5) * 14 * state.shake : 0;
    const shakeY = state.shake > 0 ? (Math.random() - 0.5) * 10 * state.shake : 0;
    context.setTransform(view.scale, 0, 0, view.scale, view.x + shakeX * view.scale, view.y + shakeY * view.scale);
    drawTable(state);
    drawHands(state, focusIndex);
    if (screen === SCREEN_TITLE) {
      drawPanel('SIGIL CLASH', [
        'Neon Card Duel — You vs Vex, the Sigil Dealer',
        'Ember attacks · Tide drains · Thorn shields · Void pierces',
        'Pick up to 3 cards (click or 1–5), STRIKE with Enter, E ends turn',
        'Pairs, flushes and runs add combo damage. First to 0 HP loses.',
        `Best score: ${best}`,
      ], 'Press Space or click to start the duel', PALETTE.gold);
    } else {
      drawHud(state, best);
      drawButtons(state);
      if (screen === SCREEN_PAUSED) {
        drawPanel('PAUSED', ['The duel waits for you.'], 'Press P to resume', PALETTE.text);
      } else if (screen === SCREEN_WIN) {
        drawPanel('VICTORY!', [
          `Vex falls in round ${state.round}. The table is yours.`,
          `Score ${state.score} · Damage dealt ${state.damageDealt} · Cards played ${state.cardsPlayed}`,
          `HP remaining ${state.playerHp}/${DUEL.maxHp} · Best ${best}`,
        ], 'Press Space or click to duel again', PALETTE.hpGood);
      } else if (screen === SCREEN_LOSS) {
        drawPanel('DEFEAT', [
          `Vex wins in round ${state.round}. Shuffle up and take revenge.`,
          `Score ${state.score} · Damage dealt ${state.damageDealt} · Cards played ${state.cardsPlayed}`,
          `Vex HP remaining ${state.aiHp}/${DUEL.maxHp} · Best ${best}`,
        ], 'Press Space or click to duel again', PALETTE.hpLow);
      }
    }
    if (fx) fx.draw(context);
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, toLogical };
}
