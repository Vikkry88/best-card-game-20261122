[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Vikkry88/best-card-game-20261122/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Vikkry88/best-card-game-20261122/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# Sigil Clash — Neon Card Duel

An original browser card duel for make.fun `best-card-game-20261122-1826`. You face **Vex, the Sigil Dealer** across a neon felt table. First duelist to 0 HP loses.

## Features

- Complete duel loop: title screen, turn-based table play, rounds, victory and defeat screens with stats and instant rematch
- Four original suits told apart by shape and colour: **Ember** (red flame, attack), **Tide** (blue drop, drain/heal), **Thorn** (green leaf, shield), **Void** (purple star, pierces shields)
- Readable cards: large rank, suit sigil, energy-cost gem, role + power strip; styled face cards (Jack, Queen, King, Ace)
- Deep decisions: energy budget each round, pick up to 3 cards per strike, combos (Pair, Flush Sigil, Run, Triple Sigil, Royal Run) for bonus damage
- Readable AI opponent: Vex's hand is face-up, an intent line telegraphs the next move, and the strategy (shield when hurt, pierce through shields, finish weak players) can be learned and countered
- Visible HUD: both HP bars, shields, energy pips, round, score and best score, duel log, combo banner, selected-card preview
- Polish: cards slide in from the deck, selected cards lift and glow, hit bursts, floating hit text, screen shake, victory confetti
- Keyboard and mouse: click cards/buttons, or keys 1–5 to select, arrows/A/D to move focus, Enter/Space to strike, E to end turn, P pause, R restart
- Fully offline static files under `game/` (no network, no build step, no external assets); `node serve.ts` plays it locally

## Run

```sh
node serve.ts        # then open http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # build the hand-in dossier
```
